import { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { UserProfile, Transaction, Report } from "@/types";
import { 
  collection, 
  query, 
  doc, 
  updateDoc,
  where,
  deleteDoc
} from "firebase/firestore";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  Users, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Database,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Ban,
  Unlock,
  Leaf,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { addDoc, serverTimestamp } from "firebase/firestore";

export default function Admin() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!['admin', 'superadmin'].includes(profile?.role)) return;

    const usersPath = "users";
    const unsubscribeUsers = onSnapshot(collection(db, usersPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, usersPath);
    });

    const reportsPath = "reports";
    const unsubscribeReports = onSnapshot(collection(db, reportsPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, reportsPath);
    });

    const transPath = "transactions";
    const unsubscribeTrans = onSnapshot(collection(db, transPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, transPath);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
      unsubscribeTrans();
    };
  }, [profile]);

  const handleVerifyVat = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isVatVerified: true
      });
      toast.success("VAT verified for user");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleVetCompany = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isVetted: true
      });
      toast.success("Company vetted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isSuspended: true,
        suspensionReason: "Violated platform terms"
      });
      toast.success("User suspended successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isSuspended: false,
        suspensionReason: null
      });
      toast.success("User unsuspended successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.uid) {
      toast.error("You cannot delete your own account from the admin panel.");
      return;
    }
    
    if (!window.confirm("Are you absolutely sure you want to delete this user? This action cannot be undone.")) return;
    
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: 'resolved'
      });
      toast.success("Report marked as resolved");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: 'dismissed'
      });
      toast.success("Report dismissed");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleRepairProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: 'superadmin',
        isVetted: true,
        isVatVerified: true
      });
      toast.success("Profile repaired! You should now see the admin tabs.");
    } catch (e) {
      toast.error("Failed to repair profile. Check console for details.");
      console.error(e);
    }
  };

  const seedMockData = async () => {
    setIsSeeding(true);
    try {
      // Mock Listings
      const mockListings = [
        {
          title: "Industrial Air Compressor 500L",
          description: "Heavy duty industrial air compressor, barely used. 10 bar pressure, 3-phase motor.",
          price: 1200,
          quantity: 2,
          category: "Machinery",
          brand: "Atlas Copco",
          model: "GA37",
          year: 2019,
          condition: "used-excellent",
          location: "Manchester, UK",
          images: ["https://picsum.photos/seed/compressor/800/600"],
          co2Savings: 450,
          status: "available",
          listingType: "fixed",
          sellerId: profile.uid,
          sellerName: profile.companyName,
          createdAt: serverTimestamp()
        },
        {
          title: "Steel Storage Racking System",
          description: "Modular heavy-duty pallet racking. Total 50 bays available. Excellent condition.",
          price: 85,
          quantity: 50,
          category: "Storage",
          brand: "Dexion",
          model: "P90",
          year: 2021,
          condition: "used-good",
          location: "Leeds, UK",
          images: ["https://picsum.photos/seed/racking/800/600"],
          co2Savings: 1200,
          status: "available",
          listingType: "fixed",
          sellerId: profile.uid,
          sellerName: profile.companyName,
          createdAt: serverTimestamp()
        },
        {
          title: "CNC Lathe - Precision Series",
          description: "High precision CNC lathe for industrial metalworking. Auction starting at reserve.",
          price: 5000,
          quantity: 1,
          category: "Machinery",
          brand: "Haas",
          model: "ST-10",
          year: 2018,
          condition: "used-excellent",
          location: "Sheffield, UK",
          images: ["https://picsum.photos/seed/cnc/800/600"],
          co2Savings: 3500,
          status: "available",
          listingType: "auction",
          reservePrice: 4500,
          currentBid: 5000,
          bidCount: 0,
          auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sellerId: profile.uid,
          sellerName: profile.companyName,
          createdAt: serverTimestamp()
        }
      ];

      for (const listing of mockListings) {
        await addDoc(collection(db, "listings"), listing);
      }

      // Mock Hauling Partners
      const mockPartners = [
        {
          name: "HeavyLift Logistics",
          location: "Newcastle, UK",
          rating: 4.9,
          specializations: ["Heavy Machinery", "Abnormal Loads"],
          fleetSize: 25,
          status: "active",
          createdAt: serverTimestamp()
        },
        {
          name: "Precision Hauling Co.",
          location: "Birmingham, UK",
          rating: 4.7,
          specializations: ["Sensitive Equipment", "Express Delivery"],
          fleetSize: 12,
          status: "active",
          createdAt: serverTimestamp()
        },
        {
          name: "Global Industrial Freight",
          location: "London, UK",
          rating: 4.8,
          specializations: ["International Shipping", "Customs Clearance"],
          fleetSize: 150,
          status: "active",
          createdAt: serverTimestamp()
        }
      ];

      for (const partner of mockPartners) {
        await addDoc(collection(db, "hauling_partners"), partner);
      }

      toast.success("Marketplace and Hauling data seeded successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Failed to seed mock data");
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!['admin', 'superadmin'].includes(profile?.role)) {
    // Fallback for bootstrap admin whose profile might be broken
    const bootstrapEmails = ["admin@hix.co.uk", "superadmin@hix.co.uk"];
    const isBootstrapEmail = bootstrapEmails.includes(profile?.email) || bootstrapEmails.includes(user?.email);

    if (isBootstrapEmail) {
      return (
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Profile Repair Needed</h2>
          <p className="text-muted-foreground mb-8">
            Your account is authorized as a bootstrap admin, but your profile document needs to be updated to the Super Admin role.
          </p>
          <Button 
            size="lg" 
            onClick={handleRepairProfile}
          >
            Repair My Admin Profile
          </Button>
        </div>
      );
    }

    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, vetting, and platform analytics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Vetting</CardTitle>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => !u.isVetted).length}</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£12,450</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="glass p-1 rounded-full">
          <TabsTrigger value="users" className="rounded-full">User Management</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-full">
            Reports
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground border-none h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-full">Revenue Tracking</TabsTrigger>
          <TabsTrigger value="esg" className="rounded-full">ESG Data</TabsTrigger>
          <TabsTrigger value="system" className="rounded-full">System</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Registered Companies</CardTitle>
              <CardDescription>Review and verify company details and VAT registration.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>VAT Status</TableHead>
                    <TableHead>Vetting</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell>
                        <div className="font-medium">{u.companyName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        {u.isVatVerified ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.isVetted ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Vetted</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.isSuspended ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!u.isVatVerified && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleVerifyVat(u.uid)}>
                            Verify VAT
                          </Button>
                        )}
                        {!u.isVetted && (
                          <Button size="sm" className="h-8" onClick={() => handleVetCompany(u.uid)}>
                            Vet Company
                          </Button>
                        )}
                        {u.isSuspended ? (
                          <Button size="sm" variant="outline" className="h-8 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleUnsuspendUser(u.uid)}>
                            <Unlock className="h-4 w-4 mr-1" />
                            Unsuspend
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleSuspendUser(u.uid)}>
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.uid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="glass">
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>Review disputes and terms violations reported by users.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>CO2 Saved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No reports found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.reporterName}</div>
                          <div className="text-xs text-muted-foreground">ID: {r.reporterId.slice(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.reportedUserName}</div>
                          <div className="text-xs text-muted-foreground">ID: {r.reportedUserId.slice(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.reason}</div>
                          <div className="text-xs text-muted-foreground max-w-xs truncate">{r.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-emerald-500 font-medium">
                            <Leaf className="h-3 w-3" />
                            {(r as any).co2Saved || 0} kg
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'pending' ? 'outline' : 'secondary'} className={
                            r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''
                          }>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {r.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="h-8" onClick={() => handleResolveReport(r.id)}>
                                Resolve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => handleDismissReport(r.id)}>
                                Dismiss
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esg">
          <Card className="glass">
            <CardHeader>
              <CardTitle>ESG Impact Tracking</CardTitle>
              <CardDescription>Automated ESG data and certificate management.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Total CO2 Saved
                  </h4>
                  <p className="text-3xl font-bold">{transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0).toLocaleString()} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">Equivalent to {Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 21.7)} trees planted.</p>
                </div>
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Certificates Issued
                  </h4>
                  <p className="text-3xl font-bold">{transactions.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Automated PDF generation active.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>Populate database with mock data for testing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Seed Marketplace
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will add sample industrial listings, auctions, and hauling partners to the platform.
                  </p>
                  <Button 
                    onClick={seedMockData} 
                    disabled={isSeeding}
                    className="w-full md:w-auto"
                  >
                    {isSeeding ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      "Seed Mock Data"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
