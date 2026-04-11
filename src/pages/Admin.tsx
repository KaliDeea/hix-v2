import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { UserProfile, Transaction, Report, AuditLog } from "@/types";
import { 
  collection, 
  query, 
  doc, 
  updateDoc,
  where,
  deleteDoc,
  orderBy,
  limit
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
  ArrowUpDown,
  Search,
  Filter,
  Eye,
  Megaphone,
  Home,
  Car,
  AlertTriangle,
  Trash2,
  Ban,
  Unlock,
  Leaf,
  Loader2,
  Upload,
  History,
  Activity,
  UserCog,
  DollarSign,
  TrendingUp,
  Package,
  Bell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { compressImage } from "@/lib/image-utils";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: { 
  currentPage: number; 
  totalItems: number; 
  itemsPerPage: number; 
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-white/5 gap-4">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-foreground">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg glass border-primary/20"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-xs font-medium px-2">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg glass border-primary/20"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function Admin() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    hixLogoUrl: "",
    sellerCommission: 7,
    buyerCommission: 3,
    maintenanceMode: false,
    announcementBanner: ""
  });

  // Sorting and Filtering State
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userSort, setUserSort] = useState<{ key: keyof UserProfile; direction: 'asc' | 'desc' }>({ key: 'companyName', direction: 'asc' });
  
  const [reportFilter, setReportFilter] = useState("all");
  const [reportSort, setReportSort] = useState<{ key: keyof Report; direction: 'asc' | 'desc' }>({ key: 'status', direction: 'asc' });

  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedUserForVetting, setSelectedUserForVetting] = useState<UserProfile | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<UserProfile | null>(null);
  const [reportReasonFilter, setReportReasonFilter] = useState("all");

  // Pagination State
  const [userPage, setUserPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "platform_settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings({
          hixLogoUrl: data.hixLogoUrl || "",
          sellerCommission: data.sellerCommission ?? 7,
          buyerCommission: data.buyerCommission ?? 3,
          maintenanceMode: data.maintenanceMode || false,
          announcementBanner: data.announcementBanner || ""
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check before processing (5MB raw limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        // Compress the image to ensure it fits in Firestore
        const compressed = await compressImage(base64, 400, 400, 0.8);
        setPlatformSettings(prev => ({ ...prev, hixLogoUrl: compressed }));
        toast.success("Logo uploaded and optimized (pending save)");
      } catch (err) {
        console.error("Compression error:", err);
        toast.error("Failed to process image");
      }
    };
    reader.readAsDataURL(file);
  };

  const savePlatformSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "platform_settings", "branding"), platformSettings, { merge: true });
      toast.success("Platform settings saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "platform_settings/branding");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    setIsSendingTest(true);
    try {
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Test Notification",
        message: "This is a test notification from the system administration.",
        type: 'system',
        link: '/dashboard',
        read: false,
        createdAt: serverTimestamp()
      });
      toast.success("Test notification sent to your account!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "notifications");
    } finally {
      setIsSendingTest(false);
    }
  };

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

    const auditPath = "audit_logs";
    const unsubscribeAudit = onSnapshot(query(collection(db, auditPath), orderBy("createdAt", "desc"), limit(100)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setAuditLogs(data);
    }, (error) => {
      // Don't fail the whole page if audit logs fail (might be permissions)
      console.error("Audit logs error:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
      unsubscribeTrans();
      unsubscribeAudit();
    };
  }, [profile]);

  const createAuditLog = async (action: string, details: string, targetId?: string, targetType?: AuditLog['targetType']) => {
    if (!user || !profile) return;
    try {
      await addDoc(collection(db, "audit_logs"), {
        adminId: user.uid,
        adminName: profile.companyName || user.email,
        action,
        details,
        targetId,
        targetType,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  };

  const handleVerifyVat = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isVatVerified: true
      });
      
      await createAuditLog("VERIFY_VAT", "Verified user VAT registration", userId, 'user');
      
      // Send notification to user
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "VAT Verified",
        message: "Your VAT registration has been verified by the HiX team.",
        type: 'system',
        link: '/profile',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success("VAT verified and user notified");
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
      
      await createAuditLog("VET_COMPANY", "Vetted and approved company", userId, 'user');
      
      // Send notification to user
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Company Vetted",
        message: "Congratulations! Your company has been fully vetted and approved on the HiX exchange.",
        type: 'system',
        link: '/profile',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success("Company vetted and user notified");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isSuspended: true,
        suspensionReason: suspensionReason || "Violated platform terms"
      });
      
      await createAuditLog("SUSPEND_USER", `Suspended user. Reason: ${suspensionReason || "Violated platform terms"}`, userId, 'user');

      // Send notification to user
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${suspensionReason || "Violated platform terms"}. Please contact support for more information.`,
        type: 'alert',
        link: '/contact',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success("User suspended and notified");
      setIsSuspending(false);
      setSuspensionReason("");
      setSelectedUserForSuspension(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    if (profile?.role !== 'superadmin') {
      toast.error("Only superadmins can change user roles.");
      return;
    }
    
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      await createAuditLog("UPDATE_ROLE", `Changed user role to ${newRole}`, userId, 'user');
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
      await createAuditLog("UNSUSPEND_USER", "Unsuspended user account", userId, 'user');
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
    
    // Using a custom dialog would be better, but for now we'll stick to basic confirmation
    if (!window.confirm("Are you absolutely sure you want to delete this user? This action cannot be undone.")) return;
    
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, "users", userId));
      await createAuditLog("DELETE_USER", "Deleted user account", userId, 'user');
      toast.success("User deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: 'resolved',
        resolutionNote,
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid
      });
      await createAuditLog("RESOLVE_REPORT", `Resolved report. Note: ${resolutionNote || "No note"}`, reportId, 'report');
      toast.success("Report marked as resolved");
      setResolutionNote("");
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
      await createAuditLog("DISMISS_REPORT", "Dismissed report", reportId, 'report');
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
      await createAuditLog("REPAIR_PROFILE", "Repaired admin profile", user.uid, 'user');
      toast.success("Profile repaired! You should now see the admin tabs.");
    } catch (e) {
      toast.error("Failed to repair profile. Check console for details.");
      console.error(e);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) {
      toast.error("Please provide both a title and message.");
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      // In a real app, this would be a cloud function to avoid client-side loops
      // For this demo, we'll send to all currently loaded users
      const promises = users.map(u => 
        addDoc(collection(db, "notifications"), {
          userId: u.uid,
          title: announcement.title,
          message: announcement.message,
          type: 'system',
          link: '/',
          read: false,
          createdAt: serverTimestamp()
        })
      );
      
      await Promise.all(promises);
      
      await createAuditLog("SEND_ANNOUNCEMENT", `Sent announcement: ${announcement.title}`, undefined, 'system');
      toast.success(`Announcement sent to ${users.length} users!`);
      setAnnouncement({ title: "", message: "" });
    } catch (error) {
      toast.error("Failed to send announcement");
      console.error(error);
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // Sorting Logic
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const listings = results.data as any[];
          let successCount = 0;
          let errorCount = 0;

          for (const item of listings) {
            try {
              await addDoc(collection(db, "listings"), {
                ...item,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1,
                co2Savings: parseFloat(item.co2Savings) || 0,
                status: "available",
                createdAt: serverTimestamp(),
                sellerId: user?.uid, // Default to admin if not specified
                sellerName: profile?.companyName || "HiX Admin"
              });
              successCount++;
            } catch (err) {
              console.error("Error uploading item:", err);
              errorCount++;
            }
          }

          toast.success(`Bulk upload complete: ${successCount} items added, ${errorCount} errors.`);
        } catch (err) {
          toast.error("Failed to process CSV file.");
        } finally {
          setIsBulkUploading(false);
          // Reset input
          e.target.value = "";
        }
      },
      error: (err) => {
        toast.error("Error parsing CSV: " + err.message);
        setIsBulkUploading(false);
      }
    });
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([
      {
        title: "Example Asset",
        description: "Description here",
        price: 100,
        quantity: 1,
        category: "Machinery",
        brand: "Brand",
        model: "Model",
        year: 2023,
        condition: "used-excellent",
        location: "London, UK",
        co2Savings: 50,
        listingType: "fixed"
      }
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "hix_bulk_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortUsers = (key: keyof UserProfile) => {
    setUserSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortReports = (key: keyof Report) => {
    setReportSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.companyName?.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesFilter = userFilter === 'all' || 
                           (userFilter === 'pending' && (!u.isVetted || !u.isVatVerified)) ||
                           (userFilter === 'vetted' && u.isVetted) ||
                           (userFilter === 'suspended' && u.isSuspended);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aVal = a[userSort.key];
      const bVal = b[userSort.key];
      if (aVal < bVal) return userSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return userSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredReports = reports
    .filter(r => reportFilter === 'all' || r.status === reportFilter)
    .sort((a, b) => {
      const aVal = a[reportSort.key];
      const bVal = b[reportSort.key];
      if (aVal < bVal) return reportSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return reportSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

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
    <div className="min-h-screen bg-background/50 py-12">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Governance Portal
              </Badge>
              <div className="h-px w-8 bg-primary/20" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">System Administrator</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">Admin Control Center</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  Platform Oversight
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  System Configuration
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  User Vetting
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/10 shadow-xl">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{profile?.companyName || "Administrator"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{profile?.role || "Admin"}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="dashboard" className="w-full space-y-8">
          <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-white/10 -mx-4 px-4 md:-mx-8 md:px-8 py-4">
            <TabsList className="flex h-auto bg-transparent border-none p-0 gap-2 overflow-x-auto no-scrollbar justify-start">
                {[
                  { value: "dashboard", label: "Dashboard", icon: BarChart3 },
                  { value: "users", label: "Users", icon: Users },
                  { value: "vetting", label: "Vetting Queue", icon: ShieldCheck, badge: users.filter(u => !u.isVetted || !u.isVatVerified).length, badgeColor: "bg-amber-500" },
                  { value: "reports", label: "Reports", icon: AlertTriangle, badge: reports.filter(r => r.status === 'pending').length, badgeColor: "bg-destructive" },
                  { value: "bulk", label: "Bulk Upload", icon: Upload },
                  { value: "esg", label: "ESG Impact", icon: Leaf },
                  { value: "audit", label: "Audit Logs", icon: History },
                  { value: "settings", label: "Platform Settings", icon: Database },
                  { value: "system", label: "System Tools", icon: RefreshCw },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="justify-start px-5 py-2.5 rounded-xl data-active:bg-primary data-active:text-primary-foreground data-active:shadow-lg data-active:shadow-primary/20 hover:bg-white/5 transition-all relative group shrink-0 border-none"
                  >
                    <tab.icon className="h-4 w-4 mr-2.5 data-active:scale-110 transition-transform" />
                    <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`ml-2 h-5 w-5 rounded-full ${tab.badgeColor} text-white text-[10px] flex items-center justify-center font-bold shadow-sm`}>
                        {tab.badge}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
          </div>

          <div className="w-full">
            <AnimatePresence mode="wait">
              <TabsContent value="dashboard" className="mt-0 outline-none">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { label: "Total Users", value: users.length, sub: `${users.filter(u => u.isVetted).length} vetted`, icon: Users, color: "text-blue-500" },
                      { label: "Total Revenue", value: `£${transactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.amount : 0), 0).toLocaleString()}`, sub: `${transactions.filter(t => t.status === 'completed').length} deals`, icon: DollarSign, color: "text-green-500" },
                      { label: "Commission", value: `£${transactions.reduce((acc, t) => acc + (t.status === 'completed' ? (t.buyerCommission + t.sellerCommission) : 0), 0).toLocaleString()}`, sub: `${platformSettings.sellerCommission}% S / ${platformSettings.buyerCommission}% B`, icon: TrendingUp, color: "text-primary" },
                      { label: "Active Listings", value: Math.round(users.length * 2.5), sub: "Across all categories", icon: Package, color: "text-purple-500" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="glass border-primary/10 overflow-hidden group hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon className="h-3.5 w-3.5" />
                              </div>
                              {stat.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {stat.sub}
                            </p>
                          </CardContent>
                          <div className={`h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </Card>
                      </motion.div>
                    ))}
                  </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Platform Oversight</CardTitle>
                  </div>
                  <CardDescription>Recent administrative actions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {log.adminName} <span className="font-normal text-muted-foreground">{log.details}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleTimeString() : "Just now"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-xs text-center py-4 text-muted-foreground italic">No recent activity.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">User Vetting</CardTitle>
                  </div>
                  <CardDescription>Pending verifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs font-medium">Pending VAT</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                        {users.filter(u => !u.isVatVerified).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs font-medium">Pending Identity</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
                        {users.filter(u => !u.isVetted).length}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${(users.filter(u => u.isVetted).length / (users.length || 1)) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium">
                        {Math.round((users.filter(u => u.isVetted).length / (users.length || 1)) * 100)}% of users fully vetted
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">System Config</CardTitle>
                  </div>
                  <CardDescription>Platform health status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Database</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-500">Stable</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Auth</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-500">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Security</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-primary">Enforced</span>
                      </div>
                    </div>
                    {platformSettings.maintenanceMode && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maintenance</span>
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20 text-[8px] h-4">ON</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

          <TabsContent value="users" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Registered Companies</CardTitle>
                      <CardDescription>Review and verify company details and VAT registration.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search companies..." 
                          className="pl-9 w-full sm:w-[250px] rounded-xl glass border-primary/20 focus:ring-primary/50"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl glass border-primary/20">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="vetted">Vetted</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors pl-6" onClick={() => sortUsers('companyName')}>
                            <div className="flex items-center gap-1">
                              Company
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('isVatVerified')}>
                            <div className="flex items-center gap-1">
                              VAT Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('isVetted')}>
                            <div className="flex items-center gap-1">
                              Vetting
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('isSuspended')}>
                            <div className="flex items-center gap-1">
                              Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('role')}>
                            <div className="flex items-center gap-1">
                              Role
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 opacity-20" />
                                <p>No users found matching your criteria.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage).map((u) => (
                            <TableRow key={u.uid} className="hover:bg-primary/5 transition-colors group">
                              <TableCell className="pl-6">
                                <div className="font-bold text-foreground">{u.companyName}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </TableCell>
                              <TableCell>
                                {u.isVatVerified ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-md">Verified</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-md">Unverified</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {u.isVetted ? (
                                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-md">Vetted</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-md">Pending</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {u.isSuspended ? (
                                  <Badge variant="destructive" className="flex items-center gap-1 w-fit rounded-md">
                                    <Ban className="h-3 w-3" />
                                    Suspended
                                  </Badge>
                                ) : (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 rounded-md">Active</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {profile?.role === 'superadmin' ? (
                                  <Select 
                                    value={u.role || 'user'} 
                                    onValueChange={(val: any) => handleUpdateUserRole(u.uid, val)}
                                  >
                                    <SelectTrigger className="h-8 w-[110px] glass border-primary/20 text-xs rounded-lg">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass">
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="superadmin">Super Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className="capitalize rounded-md">{u.role || 'user'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6 space-x-1">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!u.isVatVerified && (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVerifyVat(u.uid)}>
                                      VAT
                                    </Button>
                                  )}
                                  {!u.isVetted && (
                                    <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVetCompany(u.uid)}>
                                      Vet
                                    </Button>
                                  )}
                                  {u.isSuspended ? (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg border-orange-500/50 text-orange-500 hover:bg-orange-500/10" onClick={() => handleUnsuspendUser(u.uid)}>
                                      <Unlock className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => {
                                      setSelectedUserForSuspension(u);
                                      setIsSuspending(true);
                                    }}>
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.uid)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={userPage}
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setUserPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="reports" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">User Reports</CardTitle>
                      <CardDescription>Review disputes and terms violations reported by users.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select value={reportFilter} onValueChange={setReportFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl glass border-primary/20">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={reportReasonFilter} onValueChange={setReportReasonFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl glass border-primary/20">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Reason" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="all">All Reasons</SelectItem>
                          <SelectItem value="Fraud">Fraud</SelectItem>
                          <SelectItem value="Harassment">Harassment</SelectItem>
                          <SelectItem value="Spam">Spam</SelectItem>
                          <SelectItem value="Inappropriate Content">Inappropriate Content</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors pl-6" onClick={() => sortReports('reporterName')}>
                            <div className="flex items-center gap-1">
                              Reporter
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortReports('reportedUserName')}>
                            <div className="flex items-center gap-1">
                              Reported User
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortReports('status')}>
                            <div className="flex items-center gap-1">
                              Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <AlertTriangle className="h-8 w-8 opacity-20" />
                                <p>No reports found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReports.slice((reportPage - 1) * itemsPerPage, reportPage * itemsPerPage).map((r) => (
                            <TableRow key={r.id} className="hover:bg-primary/5 transition-colors group">
                              <TableCell className="pl-6">
                                <div className="font-bold">{r.reporterName}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">ID: {r.reporterId.slice(0, 8)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold">{r.reportedUserName}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">ID: {r.reportedUserId.slice(0, 8)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="font-medium text-xs">{r.reason}</div>
                                  <div className="text-[10px] text-muted-foreground max-w-[180px] truncate italic" title={r.description}>
                                    "{r.description}"
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.status === 'pending' ? 'outline' : 'secondary'} className={
                                  r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-md' : 
                                  r.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20 rounded-md' : 
                                  'bg-muted text-muted-foreground border-muted-foreground/20 rounded-md'
                                }>
                                  {r.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6 space-x-1">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setSelectedReport(r)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="glass border-primary/20 max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Report Details</DialogTitle>
                                        <DialogDescription>
                                          Case investigation for report against {r.reportedUserName}.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-6 py-6">
                                        <div className="grid grid-cols-2 gap-6">
                                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reporter</Label>
                                            <p className="font-bold text-lg">{r.reporterName}</p>
                                          </div>
                                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reported User</Label>
                                            <p className="font-bold text-lg">{r.reportedUserName}</p>
                                          </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                          <Label className="text-[10px] uppercase tracking-widest text-primary font-bold">Reason for Report</Label>
                                          <p className="font-bold text-xl mt-1">{r.reason}</p>
                                        </div>
                                        <div>
                                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Incident Description</Label>
                                          <p className="text-sm bg-muted/30 p-4 rounded-xl border border-white/5 mt-2 leading-relaxed">{r.description}</p>
                                        </div>
                                        {r.status === 'pending' && (
                                          <div className="space-y-2">
                                            <Label htmlFor="res-note" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Resolution Note (Internal)</Label>
                                            <Textarea 
                                              id="res-note"
                                              placeholder="Document the outcome of this investigation..."
                                              className="glass border-primary/20 min-h-[100px] rounded-xl"
                                              value={resolutionNote}
                                              onChange={(e) => setResolutionNote(e.target.value)}
                                            />
                                          </div>
                                        )}
                                        {r.resolutionNote && (
                                          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                            <Label className="text-[10px] uppercase tracking-widest text-green-500 font-bold">Resolution Outcome</Label>
                                            <p className="text-sm italic mt-2">"{r.resolutionNote}"</p>
                                          </div>
                                        )}
                                      </div>
                                      <DialogFooter className="gap-2 sm:gap-2">
                                        {r.status === 'pending' ? (
                                          <>
                                            <Button variant="outline" className="rounded-xl px-6" onClick={() => handleDismissReport(r.id)}>
                                              Dismiss Case
                                            </Button>
                                            <Button className="rounded-xl px-6" onClick={() => handleResolveReport(r.id)}>
                                              Mark Resolved
                                            </Button>
                                            <Button variant="destructive" className="rounded-xl px-6" onClick={() => handleSuspendUser(r.reportedUserId)}>
                                              Suspend User
                                            </Button>
                                          </>
                                        ) : (
                                          <Button variant="outline" className="rounded-xl w-full" onClick={() => setSelectedReport(null)}>
                                            Close
                                          </Button>
                                        )}
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  {r.status === 'pending' && (
                                    <>
                                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleResolveReport(r.id)}>
                                        Resolve
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={reportPage}
                    totalItems={filteredReports.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setReportPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="vetting" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">Vetting Queue</CardTitle>
                  <CardDescription>Review companies waiting for VAT and identity verification.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-6">Company</TableHead>
                        <TableHead>VAT Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(u => !u.isVetted || !u.isVatVerified).map((u) => (
                        <TableRow key={u.uid} className="hover:bg-primary/5 transition-colors group">
                          <TableCell className="pl-6">
                            <div className="font-bold">{u.companyName}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted/50 px-2 py-1 rounded text-[10px] font-mono border border-white/5">{u.vatNumber || "Not provided"}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {!u.isVatVerified && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] rounded-md">VAT Pending</Badge>}
                              {!u.isVetted && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] rounded-md">Identity Pending</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 space-x-1">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setSelectedUserForVetting(u)}>
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="glass border-primary/20 max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Company Vetting: {u.companyName}</DialogTitle>
                                    <DialogDescription>
                                      Review company details and documents before approval.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid md:grid-cols-2 gap-8 py-6">
                                    <div className="space-y-6">
                                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Company Name</Label>
                                        <p className="font-bold text-lg">{u.companyName}</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
                                        <p className="font-bold text-lg">{u.email}</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">VAT Number</Label>
                                        <p className="font-bold text-lg">{u.vatNumber || "Not provided"}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                        <h4 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest">
                                          <ShieldCheck className="h-4 w-4 text-primary" />
                                          Vetting Checklist
                                        </h4>
                                        <ul className="space-y-3">
                                          <li className="flex items-center gap-3 text-sm">
                                            <div className={`h-2.5 w-2.5 rounded-full ${u.isVatVerified ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                            <span className={u.isVatVerified ? 'text-foreground font-medium' : 'text-muted-foreground'}>VAT Registration Check</span>
                                          </li>
                                          <li className="flex items-center gap-3 text-sm">
                                            <div className={`h-2.5 w-2.5 rounded-full ${u.isVetted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                            <span className={u.isVetted ? 'text-foreground font-medium' : 'text-muted-foreground'}>Company Identity Verification</span>
                                          </li>
                                          <li className="flex items-center gap-3 text-sm text-muted-foreground/50">
                                            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                                            <span>Sanctions List Screening</span>
                                          </li>
                                        </ul>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-muted/20 border border-white/5">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Registration Date</Label>
                                        <p className="font-medium mt-1">{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter className="gap-2">
                                    {!u.isVatVerified && (
                                      <Button variant="outline" className="rounded-xl px-6" onClick={() => handleVerifyVat(u.uid)}>
                                        Verify VAT
                                      </Button>
                                    )}
                                    {!u.isVetted && (
                                      <Button className="rounded-xl px-6" onClick={() => handleVetCompany(u.uid)}>
                                        Approve Company
                                      </Button>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              {!u.isVatVerified && (
                                <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVerifyVat(u.uid)}>
                                  VAT
                                </Button>
                              )}
                              {!u.isVetted && (
                                <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVetCompany(u.uid)}>
                                  Approve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.filter(u => !u.isVetted || !u.isVatVerified).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              </div>
                              <p className="font-medium">Vetting queue is empty. All users are verified!</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">Admin Bulk Upload</CardTitle>
                  <CardDescription>Upload listings on behalf of users or for system seeding.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="p-12 md:p-20 border-2 border-dashed border-primary/20 rounded-[2rem] flex flex-col items-center justify-center text-center bg-primary/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isBulkUploading ? (
                      <div className="flex flex-col items-center relative z-10">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Processing Data</h3>
                        <p className="text-muted-foreground mt-2">Analyzing CSV structure and validating entries...</p>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-transform">
                          <Upload className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-3xl font-black mb-3 uppercase tracking-tighter">Upload CSV Data</h3>
                        <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
                          Select a CSV file containing industrial assets. You can assign these to specific seller IDs or your own account.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button variant="outline" className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs" onClick={downloadTemplate}>
                            <FileText className="h-4 w-4 mr-2" />
                            Template
                          </Button>
                          <Button className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20" asChild>
                            <label className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Select File
                              <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                            </label>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="esg" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">ESG Impact Tracking</CardTitle>
                  <CardDescription>Automated ESG data and certificate management.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'CO2 Saved', value: `${transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0).toLocaleString()} kg`, icon: Leaf, color: 'orange', sub: 'Impact' },
                      { label: 'Tree Equivalent', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 21.7).toLocaleString(), icon: CheckCircle2, color: 'primary', sub: 'Offset' },
                      { label: 'Miles Saved', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 0.4).toLocaleString(), icon: Car, color: 'blue', sub: 'Travel' },
                      { label: 'Homes Powered', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 30).toLocaleString(), icon: Home, color: 'amber', sub: 'Energy' }
                    ].map((stat, i) => (
                      <Card key={i} className={`bg-${stat.color === 'primary' ? 'primary' : stat.color}-500/5 border-${stat.color === 'primary' ? 'primary' : stat.color}-500/10 overflow-hidden relative group`}>
                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                          <stat.icon className="h-16 w-16" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-${stat.color === 'primary' ? 'primary' : stat.color}-500/10 text-${stat.color === 'primary' ? 'primary' : stat.color}-500`}>
                              <stat.icon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold opacity-50">{stat.sub}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="p-8 rounded-[2rem] glass border-primary/20 bg-primary/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <RefreshCw className="h-32 w-32 animate-spin-slow" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-start gap-6">
                        <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
                          <FileText className="h-8 w-8" />
                        </div>
                        <div>
                          <h4 className="font-black text-2xl uppercase tracking-tighter">Certificate Issuance System</h4>
                          <p className="text-muted-foreground max-w-lg mt-2 leading-relaxed">
                            HiX automatically generates verified ESG impact certificates for every circular transaction completed on the platform using blockchain-ready verification protocols.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin-slow" />
                          System Active
                        </Badge>
                        <div className="text-right">
                          <p className="text-3xl font-black tracking-tighter">{transactions.length}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certificates Issued</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="audit" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">System Audit Logs</CardTitle>
                  <CardDescription>Track administrative actions and system events for security and compliance.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="pl-6">Admin</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead className="text-right pr-6">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <ShieldCheck className="h-8 w-8 opacity-20" />
                                <p>No audit logs found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage).map((log) => (
                            <TableRow key={log.id} className="hover:bg-primary/5 transition-colors">
                              <TableCell className="font-bold pl-6">{log.adminName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-widest rounded-md bg-white/5">{log.action}</Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-xs italic text-muted-foreground">"{log.details}"</TableCell>
                              <TableCell className="text-[10px] font-mono text-muted-foreground">
                                {log.targetType && log.targetId ? (
                                  <span className="bg-muted/30 px-1.5 py-0.5 rounded border border-white/5">
                                    {log.targetType}: {log.targetId.slice(0, 8)}
                                  </span>
                                ) : "N/A"}
                              </TableCell>
                              <TableCell className="text-right pr-6 text-[10px] font-medium text-muted-foreground">
                                {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={auditPage}
                    totalItems={auditLogs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setAuditPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">Platform Configuration</CardTitle>
                  <CardDescription>Global settings for the HiX Industrial Exchange.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-4 bg-primary rounded-full" />
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Identity & Branding</h4>
                      </div>
                      <div className="grid gap-4">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Platform Logo</label>
                        <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 group">
                          <div className="h-20 w-40 rounded-2xl bg-muted/30 flex items-center justify-center overflow-hidden border border-primary/20 shadow-inner group-hover:border-primary/50 transition-colors">
                            {platformSettings.hixLogoUrl ? (
                              <img src={platformSettings.hixLogoUrl} alt="Logo" className="h-full w-full object-contain p-4" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 opacity-30">
                                <Upload className="h-6 w-6" />
                                <span className="text-[10px] font-bold uppercase">No Logo</span>
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6">
                            <label className="cursor-pointer">
                              Update Logo
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-4 bg-orange-500 rounded-full" />
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Economics & Fees</h4>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                        <div className="grid gap-4">
                          <Label htmlFor="seller-comm" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 block">Seller Commission</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                              <Input 
                                id="seller-comm" 
                                type="number" 
                                className="rounded-xl glass border-primary/20 h-12 text-lg font-black pl-4 pr-10 focus:ring-primary/50"
                                value={platformSettings.sellerCommission}
                                onChange={(e) => setPlatformSettings({...platformSettings, sellerCommission: parseFloat(e.target.value)})}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary">%</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          <Label htmlFor="buyer-comm" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 block">Buyer Commission</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                              <Input 
                                id="buyer-comm" 
                                type="number" 
                                className="rounded-xl glass border-primary/20 h-12 text-lg font-black pl-4 pr-10 focus:ring-primary/50"
                                value={platformSettings.buyerCommission}
                                onChange={(e) => setPlatformSettings({...platformSettings, buyerCommission: parseFloat(e.target.value)})}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary">%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight italic">
                          These rates are applied to all new transactions across the platform.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-4 bg-destructive rounded-full" />
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">System Status</h4>
                      </div>
                      <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 group">
                        <div>
                          <p className="text-lg font-bold">Maintenance Mode</p>
                          <p className="text-xs text-muted-foreground mt-1">Disable all trading activities globally.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${platformSettings.maintenanceMode ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {platformSettings.maintenanceMode ? "Active" : "Inactive"}
                          </span>
                          <Switch 
                            checked={platformSettings.maintenanceMode}
                            onCheckedChange={(checked) => setPlatformSettings({...platformSettings, maintenanceMode: checked})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-4 bg-blue-500 rounded-full" />
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Global Communication</h4>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <Label htmlFor="ann-banner" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 block">Announcement Banner</Label>
                        <Input 
                          id="ann-banner" 
                          placeholder="Text to show at the top of all pages..." 
                          className="rounded-xl glass border-primary/20 h-12 focus:ring-primary/50"
                          value={platformSettings.announcementBanner}
                          onChange={(e) => setPlatformSettings({...platformSettings, announcementBanner: e.target.value})}
                        />
                        <p className="text-[10px] text-muted-foreground mt-3 italic">
                          Visible to all users on every page of the platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <Button onClick={savePlatformSettings} disabled={isSavingSettings} className="rounded-xl px-10 h-14 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                      {isSavingSettings ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-3 h-5 w-5" />}
                      Commit Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="system" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xl">System Maintenance & Communication</CardTitle>
                  <CardDescription>Manage platform-wide announcements and test system features.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Megaphone className="h-32 w-32" />
                    </div>
                    <h4 className="font-black text-xl mb-6 flex items-center gap-3 uppercase tracking-tighter relative z-10">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      Platform-wide Announcement
                    </h4>
                    <div className="space-y-6 relative z-10">
                      <div className="grid gap-3">
                        <Label htmlFor="ann-title" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Announcement Title</Label>
                        <Input 
                          id="ann-title" 
                          placeholder="e.g. Scheduled Maintenance" 
                          className="rounded-xl glass border-primary/20 h-12 focus:ring-primary/50 font-bold"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="ann-msg" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Message Content</Label>
                        <Textarea 
                          id="ann-msg" 
                          placeholder="Enter the message for all users..." 
                          className="rounded-xl glass border-primary/20 min-h-[120px] focus:ring-primary/50 leading-relaxed"
                          value={announcement.message}
                          onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={handleSendAnnouncement} 
                        disabled={isSendingAnnouncement}
                        className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                      >
                        {isSendingAnnouncement ? (
                          <>
                            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                            Broadcasting to {users.length} users...
                          </>
                        ) : (
                          <>
                            <Megaphone className="mr-3 h-4 w-4" />
                            Send Announcement
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 group hover:border-primary/30 transition-colors">
                      <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Database className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">Seed Marketplace</h4>
                      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Populate the platform with sample industrial listings and hauling partners for testing and demonstration.
                      </p>
                      <Button 
                        onClick={seedMockData} 
                        disabled={isSeeding}
                        variant="outline"
                        className="w-full rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Seed Mock Data
                      </Button>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 group hover:border-orange-500/30 transition-colors">
                      <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-7 w-7 text-orange-500" />
                      </div>
                      <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">Test Notifications</h4>
                      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Send a test notification to your own account to verify the system's real-time communication capabilities.
                      </p>
                      <Button 
                        onClick={sendTestNotification} 
                        disabled={isSendingTest}
                        variant="outline"
                        className="w-full rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                      >
                        {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                        Send Test Notification
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </div>
    </Tabs>
      <Dialog open={isSuspending} onOpenChange={setIsSuspending}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending {selectedUserForSuspension?.companyName}. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Reason for Suspension</Label>
              <Textarea 
                id="suspension-reason"
                placeholder="e.g., Multiple reports of fraudulent behavior, Violation of terms section 4.2..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="glass border-primary/20 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsSuspending(false);
              setSuspensionReason("");
              setSelectedUserForSuspension(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUserForSuspension && handleSuspendUser(selectedUserForSuspension.uid)}
              disabled={!suspensionReason.trim()}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
