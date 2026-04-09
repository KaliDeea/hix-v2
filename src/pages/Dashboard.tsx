import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, query, where, handleFirestoreError, OperationType, deleteDoc, doc, updateDoc } from "@/lib/firebase";
import { Listing, Transaction, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, 
  Plus, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Leaf,
  Download,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Trash2,
  Pencil
} from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { generateTradeCertificate } from "@/lib/pdf";
import { toast } from "sonner";
import { addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Papa from "papaparse";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      const recordTransaction = async () => {
        const listingId = searchParams.get("listing_id");
        const co2Saved = parseFloat(searchParams.get("co2") || "0");
        const sellerId = searchParams.get("seller");
        const amount = parseFloat(searchParams.get("amount") || "0");

        if (user && listingId) {
          const path = "transactions";
          try {
            await addDoc(collection(db, path), {
              listingId,
              buyerId: user.uid,
              sellerId,
              amount,
              quantity: 1,
              buyerCommission: amount * 0.03,
              sellerCommission: 0,
              co2Saved,
              status: "completed",
              createdAt: new Date().toISOString()
            });
            
            // Mark listing as sold
            await updateDoc(doc(db, "listings", listingId), {
              status: "sold"
            });

            toast.success("Payment successful! Your trade has been recorded and CO2 savings added.", {
              duration: 5000,
            });
          } catch (error) {
            console.error("Error recording transaction:", error);
          }
        }
        // Remove the session_id from URL without refreshing
        setSearchParams({}, { replace: true });
      };
      recordTransaction();
    }
  }, [searchParams, setSearchParams, user]);

  useEffect(() => {
    if (!user) return;

    const listingsPath = "listings";
    const listingsQuery = query(collection(db, listingsPath), where("sellerId", "==", user.uid));
    const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
      setMyListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, listingsPath));

    const transPath = "transactions";
    const transQuery = query(collection(db, transPath), where("buyerId", "==", user.uid));
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, transPath));

    return () => {
      unsubListings();
      unsubTrans();
    };
  }, [user]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTransaction) return;

    setIsReporting(true);
    const path = "reports";
    try {
      await addDoc(collection(db, path), {
        reporterId: user.uid,
        reporterName: profile?.companyName || user.email,
        reportedUserId: selectedTransaction.sellerId,
        reportedUserName: "Seller", // In a real app, we'd have the seller's name in the transaction
        transactionId: selectedTransaction.id,
        co2Saved: selectedTransaction.co2Saved,
        reason: reportData.reason,
        description: reportData.description,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Report submitted to administration.");
      setIsReportModalOpen(false);
      setReportData({ reason: "", description: "" });
      setSelectedTransaction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!user || !listingToDelete) return;

    setIsDeleting(listingToDelete);
    const path = `listings/${listingToDelete}`;
    try {
      await deleteDoc(doc(db, "listings", listingToDelete));
      toast.success("Listing deleted successfully.");
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    setIsBulkUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
          try {
            const listingId = crypto.randomUUID();
            await setDoc(doc(db, "listings", listingId), {
              sellerId: user.uid,
              sellerName: profile.companyName,
              title: row.title || "Untitled Asset",
              description: row.description || "",
              price: parseFloat(row.price) || 0,
              quantity: parseInt(row.quantity) || 1,
              category: row.category || "Other",
              condition: (row.condition || "used-good") as any,
              location: row.location || "Unknown",
              weight: row.weight ? parseFloat(row.weight) : null,
              dimensions: row.dimensions || "",
              co2Savings: parseFloat(row.co2Savings) || 0,
              images: row.image ? [row.image] : ["https://picsum.photos/seed/" + listingId + "/800/600"],
              status: "available",
              listingType: "fixed",
              createdAt: new Date().toISOString()
            });
            successCount++;
          } catch (err) {
            console.error("Bulk upload row error:", err);
            errorCount++;
          }
        }

        toast.success(`Bulk upload complete: ${successCount} successful, ${errorCount} failed.`);
        setIsBulkUploading(false);
        e.target.value = ""; // Reset input
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        setIsBulkUploading(false);
      }
    });
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([
      {
        title: "Used Hydraulic Press 50T",
        description: "Industrial grade hydraulic press in good working condition.",
        price: 1500,
        quantity: 1,
        category: "Machinery",
        condition: "used-good",
        location: "Manchester, UK",
        weight: 1200,
        dimensions: "150x100x200",
        co2Savings: 450,
        image: "https://picsum.photos/seed/press/800/600"
      }
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "hix_bulk_upload_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    revenue: profile?.revenue || 0,
    commissions: profile?.commissionsPaid || 0,
    co2Saved: transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0),
    activeListings: myListings.length
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Please log in to view your dashboard.</h2>
        <Button className="mt-4 rounded-full" asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  if (loading) return <div className="container py-20 text-center">Loading dashboard...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your industrial exchange activities.</p>
        </div>
        <div className="flex items-center gap-2">
          {!profile?.isVatVerified && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">
              Unverified VAT
            </Badge>
          )}
          <Button className="rounded-full gap-2" asChild>
            <Link to="/create-listing">
              <Plus className="h-4 w-4" />
              New Listing
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generated from sales</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.commissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">HiX platform fees</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CO2 Saved</CardTitle>
            <Leaf className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.co2Saved} kg</div>
            <p className="text-xs text-muted-foreground">Sustainability impact</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeListings}</div>
            <p className="text-xs text-muted-foreground">Items in marketplace</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass p-1 rounded-full">
          <TabsTrigger value="overview" className="rounded-full px-6">Overview</TabsTrigger>
          <TabsTrigger value="listings" className="rounded-full px-6">My Listings</TabsTrigger>
          <TabsTrigger value="history" className="rounded-full px-6">Trade History</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-full px-6">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest trades and listing updates.</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Trade Completed</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'PPP')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-500">+£{t.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No recent activity found.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Sustainability Impact</CardTitle>
                <CardDescription>Your contribution to the circular economy.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin-slow"></div>
                  <Leaf className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{stats.co2Saved} kg CO2</p>
                  <p className="text-sm text-muted-foreground">Total carbon emissions saved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="listings">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Listings</CardTitle>
                <CardDescription>Manage your industrial assets listed on HiX.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/marketplace">View Marketplace</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>£{listing.price.toLocaleString()}</TableCell>
                      <TableCell>{listing.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={listing.status === 'available' ? 'default' : 'secondary'}>
                          {listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" asChild title="View Listing">
                          <Link to={`/listing/${listing.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Edit Listing">
                          <Link to={`/edit-listing/${listing.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setListingToDelete(listing.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={isDeleting === listing.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myListings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        You haven't listed any assets yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>A record of all your purchases and sales.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>CO2 Saved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>£{t.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-emerald-500 font-medium">{t.co2Saved} kg</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => {
                            toast.info("Generating certificate...");
                          }}
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive gap-2"
                          onClick={() => {
                            setSelectedTransaction(t);
                            setIsReportModalOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No trade history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Bulk Asset Upload</CardTitle>
              <CardDescription>Upload multiple industrial assets at once using a CSV file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center bg-white/5">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Ensure your CSV follows our template structure for successful processing.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" className="rounded-full" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <label>
                    <Button variant="default" className="rounded-full cursor-pointer pointer-events-none" disabled={isBulkUploading}>
                      {isBulkUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Select CSV File
                    </Button>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".csv" 
                      onChange={handleBulkUpload}
                      disabled={isBulkUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-2xl glass border-white/5">
                  <h4 className="font-semibold mb-1">1. Download</h4>
                  <p className="text-xs text-muted-foreground">Get our CSV template with the correct column headers.</p>
                </div>
                <div className="p-4 rounded-2xl glass border-white/5">
                  <h4 className="font-semibold mb-1">2. Fill Data</h4>
                  <p className="text-xs text-muted-foreground">Add your asset details, pricing, and technical specs.</p>
                </div>
                <div className="p-4 rounded-2xl glass border-white/5">
                  <h4 className="font-semibold mb-1">3. Upload</h4>
                  <p className="text-xs text-muted-foreground">Upload the file and we'll process all listings instantly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="glass sm:max-w-[425px]">
          <form onSubmit={handleReport}>
            <DialogHeader>
              <DialogTitle>Report Transaction</DialogTitle>
              <DialogDescription>
                Report a dispute or violation related to this trade.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Report</Label>
                <Input 
                  id="reason" 
                  placeholder="e.g., Item not as described, Logistics issue..." 
                  value={reportData.reason}
                  onChange={(e) => setReportData({...reportData, reason: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-desc">Detailed Description</Label>
                <Textarea 
                  id="report-desc" 
                  placeholder="Provide more details about the violation..." 
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  className="h-32"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" className="w-full rounded-full" disabled={isReporting}>
                {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteListing} 
              className="rounded-full"
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Listing"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
