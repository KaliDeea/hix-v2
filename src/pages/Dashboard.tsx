import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, query, where, handleFirestoreError, OperationType, deleteDoc, doc, updateDoc, increment } from "@/lib/firebase";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Pencil,
  Search
} from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { format, subDays } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import { addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Papa from "papaparse";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      const recordTransaction = async () => {
        const listingId = searchParams.get("listing_id");
        const co2Saved = parseFloat(searchParams.get("co2") || "0");
        const sellerId = searchParams.get("seller");
        const amount = parseFloat(searchParams.get("amount") || "0");
        const buyerRate = parseFloat(searchParams.get("buyer_rate") || "3");
        const sellerRate = parseFloat(searchParams.get("seller_rate") || "7");

        if (user && listingId) {
          const path = "transactions";
          try {
            await addDoc(collection(db, path), {
              listingId,
              buyerId: user.uid,
              sellerId,
              amount,
              quantity: 1,
              buyerCommission: amount * (buyerRate / 100),
              sellerCommission: amount * (sellerRate / 100),
              co2Saved,
              status: "completed",
              createdAt: new Date().toISOString()
            });
            
            // Mark listing as sold
            await updateDoc(doc(db, "listings", listingId), {
              status: "sold"
            });

            // Update user's total CO2 saved (Buyer)
            await updateDoc(doc(db, "users", user.uid), {
              totalCo2Saved: increment(co2Saved)
            });

            // Update seller's total CO2 saved and revenue
            if (sellerId) {
              await updateDoc(doc(db, "users", sellerId), {
                revenue: increment(amount),
                totalCo2Saved: increment(co2Saved)
              });
            }

            // Log transaction to audit_logs
            await addDoc(collection(db, "audit_logs"), {
              adminId: "system",
              adminName: "System",
              action: "TRANSACTION_COMPLETED",
              details: `Successful transaction for listing ${listingId}. Amount: £${amount}. CO2 Saved: ${co2Saved}kg`,
              targetId: listingId,
              targetType: 'listing',
              targetName: `Listing ${listingId}`,
              createdAt: serverTimestamp()
            }).catch(e => console.error("Error logging transaction:", e));

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
    const unsubBuyer = onSnapshot(query(collection(db, transPath), where("buyerId", "==", user.uid)), (snapshot) => {
      const bTrans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(prev => {
        const sTrans = prev.filter(t => t.sellerId === user.uid && t.buyerId !== user.uid);
        const combined = [...bTrans, ...sTrans];
        return combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, transPath));

    const unsubSeller = onSnapshot(query(collection(db, transPath), where("sellerId", "==", user.uid)), (snapshot) => {
      const sTrans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(prev => {
        const bTrans = prev.filter(t => t.buyerId === user.uid);
        const uniqueSTrans = sTrans.filter(st => !bTrans.find(bt => bt.id === st.id));
        const combined = [...bTrans, ...uniqueSTrans];
        return combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, transPath));

    return () => {
      unsubListings();
      unsubBuyer();
      unsubSeller();
    };
  }, [user]);

  const getCategoryColor = (category: string) => {
    return 'border-primary/20 hover:border-primary/50';
  };

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
        listingId: selectedTransaction.listingId,
        co2Saved: selectedTransaction.co2Saved,
        reason: reportData.reason,
        description: reportData.description,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // Log report to audit_logs
      await addDoc(collection(db, "audit_logs"), {
        adminId: "system",
        adminName: "System",
        action: "REPORT_CREATED",
        details: `New report created by ${profile?.companyName || user.email}. Reason: ${reportData.reason}`,
        targetId: selectedTransaction.id,
        targetType: 'report',
        targetName: `Report on Transaction ${selectedTransaction.id}`,
        createdAt: serverTimestamp()
      }).catch(e => console.error("Error logging report:", e));

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
    try {
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
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const DashboardSkeleton = () => (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={`dashboard-skeleton-${i}`} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-full mb-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );

  const filteredMyListings = myListings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(listingSearch.toLowerCase()) || 
                         l.category.toLowerCase().includes(listingSearch.toLowerCase());
    const matchesStatus = listingStatusFilter === "all" || l.status === listingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(historySearch.toLowerCase()) || 
                         t.listingId.toLowerCase().includes(historySearch.toLowerCase());
    const isPurchase = t.buyerId === user?.uid;
    const matchesType = historyTypeFilter === "all" || 
                       (historyTypeFilter === "purchase" && isPurchase) || 
                       (historyTypeFilter === "sale" && !isPurchase);
    return matchesSearch && matchesType;
  });

  const stats = {
    revenue: profile?.revenue || 0,
    commissions: profile?.commissionsPaid || 0,
    co2Saved: transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0),
    activeListings: myListings.length
  };

  const co2ByCategory = transactions.reduce((acc: any, t) => {
    // In a real app, we'd fetch the listing to get the category
    // For now, we'll use some mock distribution or try to find it if listings are loaded
    const listing = myListings.find(l => l.id === t.listingId);
    const category = listing?.category || "Other";
    acc[category] = (acc[category] || 0) + (t.co2Saved || 0);
    return acc;
  }, {});

  const groupedByDate = transactions.reduce((acc: any, t) => {
    const date = format(new Date(t.createdAt), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + (t.co2Saved || 0);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();
  let runningTotal = 0;
  const cumulativeCo2Data = sortedDates.map(date => {
    runningTotal += groupedByDate[date];
    return {
      date: format(new Date(date), 'MMM d'),
      total: runningTotal
    };
  });

  const esgChartData = Object.entries(co2ByCategory).map(([name, value]) => ({
    name,
    value
  })).sort((a: any, b: any) => b.value - a.value);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Please log in to view your dashboard.</h2>
        <Button className="mt-4 rounded-full" asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your industrial exchange activities.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3">
          {!profile?.isVatVerified && (
            <Badge variant="outline" className="w-full sm:w-auto justify-center bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 text-[10px]">
              Unverified VAT Node
            </Badge>
          )}
          <Button className="w-full sm:w-auto rounded-full gap-2 shadow-lg shadow-primary/20 h-11" asChild>
            <Link to="/create-listing">
              <Plus className="h-4 w-4" />
              Post Asset
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Card className="glass border-primary/20 shadow-[0_0_8px_var(--primary)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CO2 Saved</CardTitle>
              <Leaf className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.co2Saved} kg</div>
              <p className="text-xs text-muted-foreground">≈ {Math.round(stats.co2Saved / 20)} trees/yr</p>
            </CardContent>
          </Card>
        </motion.div>
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
        <TabsList className="glass p-1 rounded-xl sm:rounded-full w-full flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
          <TabsTrigger value="overview" className="rounded-lg sm:rounded-full px-4 sm:px-6 whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="listings" className="rounded-lg sm:rounded-full px-4 sm:px-6 whitespace-nowrap">My Listings</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg sm:rounded-full px-4 sm:px-6 whitespace-nowrap">Trade History</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-lg sm:rounded-full px-4 sm:px-6 whitespace-nowrap">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="glass lg:col-span-2 border-primary/20 overflow-hidden shadow-xl shadow-primary/10 pt-0">
              <CardHeader className="border-b border-primary/20 bg-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Cumulative Impact Node</CardTitle>
                    <CardDescription className="font-mono text-[10px] uppercase opacity-90 text-primary/70">Temporal sustainability distribution</CardDescription>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_var(--primary)]" />
                </div>
              </CardHeader>
              <CardContent className="h-[320px] pt-8 bg-primary/[0.02]">
                {cumulativeCo2Data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeCo2Data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.75 0.22 145)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="oklch(0.75 0.22 145)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.75 0.22 145)" strokeOpacity={0.1} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.75 0.22 145)" 
                        opacity={0.5}
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'oklch(0.75 0.22 145)', fontWeight: 'bold' }}
                      />
                      <YAxis 
                        stroke="oklch(0.75 0.22 145)" 
                        opacity={0.5}
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}kg`}
                        tick={{ fill: 'oklch(0.75 0.22 145)', fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid oklch(0.75 0.22 145 / 0.3)', 
                          borderRadius: '12px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          boxShadow: '0 10px 15px -3px oklch(0.75 0.22 145 / 0.1)'
                        }}
                        cursor={{ stroke: 'oklch(0.75 0.22 145)', strokeWidth: 1 }}
                        formatter={(value: number) => [`${value.toLocaleString()} kg CO2`, 'IMPACT']}
                      />
                      <Area 
                        type="stepAfter" 
                        dataKey="total" 
                        stroke="oklch(0.75 0.22 145)" 
                        fillOpacity={1} 
                        fill="url(#colorImpact)" 
                        strokeWidth={2}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 font-mono text-[10px]">
                    <TrendingUp className="h-8 w-8 opacity-10" />
                    <p>NO IMPACT DATA DETECTED IN LOCAL BUFFER</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-primary/20 shadow-xl shadow-primary/10 pt-0">
              <CardHeader className="border-b border-primary/20 bg-primary/10">
                <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Impact Density Map</CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase opacity-90 text-primary/70 italic tracking-wider">Visual Verification Protocol</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10 bg-primary/[0.02]">
                <div className="grid grid-cols-10 gap-1.5 mb-8">
                  {Array.from({ length: Math.min(100, Math.ceil(stats.co2Saved / 10)) }).map((_, i) => (
                    <motion.div 
                      key={`impact-dot-${i}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.01, ease: "easeOut" }}
                      className="h-2.5 w-2.5 rounded-sm bg-primary shadow-[0_0_4px_var(--primary)]"
                    />
                  ))}
                  {stats.co2Saved === 0 && (
                    <div className="col-span-10 text-[8px] font-mono opacity-40 text-primary text-center py-12 flex flex-col items-center gap-2">
                      <div className="h-4 w-4 rounded-full border border-primary/40 border-t-primary animate-spin" />
                      CALIBRATING...
                    </div>
                  )}
                </div>
                <div className="text-center font-mono">
                  <div className="text-3xl font-black text-primary tracking-tighter tabular-nums leading-none mb-2">
                    {stats.co2Saved.toLocaleString()}<span className="text-xs uppercase ml-1">kg</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">
                    Verified Contribution
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass lg:col-span-3">
              <CardHeader>
                <CardTitle>CO2 Savings by Category</CardTitle>
                <CardDescription>Breakdown of environmental impact across different asset classes.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {esgChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={esgChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {esgChartData.map((entry, index) => (
                          <Cell key={`dashboard-esg-cell-${index}`} fill={`oklch(0.75 0.22 145 / ${1 - (index * 0.15)})`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--primary)', borderRadius: '12px' }}
                        itemStyle={{ color: 'var(--primary)' }}
                        formatter={(value: number) => [`${value} kg CO2`, 'Savings']}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Leaf className="h-8 w-8 opacity-20" />
                    <p>No trade data available for ESG breakdown.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-0">
          <Card className="glass">
            <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <CardTitle className="text-xl">My Listings</CardTitle>
                <CardDescription className="text-xs">Manage your industrial assets listed on HiX.</CardDescription>
              </div>
              <div className="flex flex-col gap-6 items-center md:items-end">
                <div className="flex gap-6 justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Available</span>
                    <span className="text-lg font-black">{myListings.filter(l => l.status === 'available').length}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Sold</span>
                    <span className="text-lg font-black">{myListings.filter(l => l.status === 'sold').length}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Draft</span>
                    <span className="text-lg font-black">{myListings.filter(l => l.status === 'draft').length}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search listings..." 
                      className="pl-8 h-9 text-xs rounded-full"
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                    />
                  </div>
                  <Select value={listingStatusFilter} onValueChange={setListingStatusFilter}>
                    <SelectTrigger className="h-9 text-xs rounded-full w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="rounded-full h-9 whitespace-nowrap" asChild>
                    <Link to="/marketplace">View Market</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Asset</TableHead>
                      <TableHead className="whitespace-nowrap">Price</TableHead>
                      <TableHead className="whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyListings.map((listing) => (
                      <TableRow key={`my-listing-${listing.id}`}>
                        <TableCell className="font-medium whitespace-nowrap">{listing.title}</TableCell>
                        <TableCell className="whitespace-nowrap">£{listing.price.toLocaleString()}</TableCell>
                        <TableCell className="whitespace-nowrap">{listing.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={listing.status === 'available' ? 'default' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="glass">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>A record of all your purchases and sales.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search history..." 
                    className="pl-8 h-9 text-xs rounded-full"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
                <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-full w-full sm:w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">ID</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">CO2 Saved</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => (
                      <TableRow key={`transaction-${t.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'MMM d, yyyy') : format(new Date(t.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{t.id}</TableCell>
                        <TableCell className="whitespace-nowrap">£{t.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-primary font-medium whitespace-nowrap">{t.co2Saved} kg</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge 
                            variant={t.status === 'completed' ? 'default' : 'secondary'} 
                            className={`capitalize ${t.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}`}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
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
                            variant="outline" 
                            size="icon" 
                            className="rounded-full h-8 w-8 border-red-500/30 text-red-500 transition-all duration-300 hover:text-red-400 hover:bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsReportModalOpen(true);
                            }}
                            title="Report Transaction"
                          >
                            <AlertTriangle className="h-4 w-4" />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-0">
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
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="rounded-full w-full sm:w-auto" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button 
                    variant="default" 
                    className="rounded-full w-full sm:w-auto" 
                    disabled={isBulkUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isBulkUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Select CSV File
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleBulkUpload}
                    disabled={isBulkUploading}
                  />
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
