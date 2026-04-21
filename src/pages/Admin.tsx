import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, db, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { UserProfile, Transaction, Report, AuditLog, Listing } from "@/types";
import { 
  collection, 
  query, 
  doc, 
  updateDoc,
  where,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot as firestoreOnSnapshot,
  getDoc
} from "firebase/firestore";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  ChevronRight,
  Menu,
  X,
  ShoppingCart
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

import { jsPDF } from "jspdf";

const ESGCertificateModal = ({ 
  isOpen, 
  onClose, 
  user, 
  platformLogo 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: UserProfile | null;
  platformLogo: string | null;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!user) return;
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Helper to load image
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      // Background
      doc.setFillColor(252, 255, 252);
      doc.rect(0, 0, 297, 210, 'F');

      // Decorative Corners
      doc.setDrawColor(34, 197, 94); // Primary color
      doc.setLineWidth(2);
      // Top Left
      doc.line(15, 15, 45, 15);
      doc.line(15, 15, 15, 45);
      // Top Right
      doc.line(252, 15, 282, 15);
      doc.line(282, 15, 282, 45);
      // Bottom Left
      doc.line(15, 165, 15, 195);
      doc.line(15, 195, 45, 195);
      // Bottom Right
      doc.line(282, 165, 282, 195);
      doc.line(282, 195, 252, 195);

      // Main Border
      doc.setDrawColor(34, 197, 94, 0.3);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, 273, 186);

      // Logo
      if (platformLogo) {
        try {
          const img = await loadImage(platformLogo);
          doc.addImage(img, 'PNG', 20, 20, 25, 25);
        } catch (e) {
          console.error("Logo loading failed, skipping from PDF", e);
          // Fallback: Text logo
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(20, 20, 15, 15, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.text('H', 27.5, 30, { align: 'center' });
        }
      }

      // Header Section
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(42);
      doc.text('CERTIFICATE OF IMPACT', 148.5, 55, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('This official document verifies the sustainable contributions of', 148.5, 75, { align: 'center' });

      // Recipient
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text(user.companyName || user.email || 'Valued Partner', 148.5, 95, { align: 'center' });

      // Body
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      const bodyText = `In recognition of their outstanding commitment to circular economy principles and sustainable industrial practices on the HiX Platform. Through strategic resource recovery and circular transactions, they have achieved the following environmental impact:`;
      const splitText = doc.splitTextToSize(bodyText, 220);
      doc.text(splitText, 148.5, 115, { align: 'center' });

      // Impact Stats Grid
      const gridY = 145;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(50, gridY, 197, 30, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('CARBON OFFSET', 85, gridY + 10, { align: 'center' });
      doc.text('CIRCULARITY RATE', 148.5, gridY + 10, { align: 'center' });
      doc.text('RESOURCES SAVED', 212, gridY + 10, { align: 'center' });

      doc.setFontSize(22);
      doc.setTextColor(21, 128, 61);
      const co2Val = user.totalCo2Saved ? `${user.totalCo2Saved.toLocaleString()} kg CO2` : '1,250 kg CO2';
      doc.text(co2Val, 85, gridY + 22, { align: 'center' });
      doc.text('85%', 148.5, gridY + 22, { align: 'center' });
      doc.text('4.2 Tons', 212, gridY + 22, { align: 'center' });

      // Stamp / Seal
      const sealX = 240;
      const sealY = 40;
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1.5);
      doc.circle(sealX, sealY, 20, 'D');
      doc.setLineWidth(0.5);
      doc.circle(sealX, sealY, 18, 'D');
      
      // Inner text for seal
      doc.setFontSize(8);
      doc.setTextColor(34, 197, 94);
      doc.text('VERIFIED', sealX, sealY - 5, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ESG', sealX, sealY + 2, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('IMPACT', sealX, sealY + 8, { align: 'center' });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Issued on: ${date}`, 30, 190);
      doc.text(`Verification ID: HIX-ESG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 267, 190, { align: 'right' });

      // Signature
      doc.setDrawColor(30, 41, 59);
      doc.line(120, 185, 177, 185);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('HiX Sustainability Board', 148.5, 192, { align: 'center' });

      doc.save(`HiX-ESG-Certificate-${user.companyName || 'User'}.pdf`);
      toast.success("Certificate generated successfully!");
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[95vw] w-full lg:max-w-6xl h-[92vh] glass border-white/20 p-0 overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl bg-white/5">
        {/* Header Section */}
        <div className="p-8 pb-10 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Leaf className="h-8 w-8" />
            </div>
            <div>
              <AlertDialogTitle className="text-3xl font-black tracking-tight text-white">ESG Certificate Generator</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-white/60 font-medium">
                HIX ADMIN &bull; Official impact documentation for <strong>{user?.companyName || user?.email}</strong>
              </AlertDialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all">
            <X className="h-7 w-7" />
          </Button>
        </div>

        {/* Certificate Preview (The Core) */}
        <div className="flex-1 bg-black/20 flex flex-col items-center p-8 sm:p-12 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-4xl mx-auto shadow-[0_0_80px_rgba(0,0,0,0.4)] transition-transform hover:scale-[1.01] duration-500">
            <div className="aspect-[1/1.414] sm:aspect-[1.414/1] w-full bg-[#fcfdfc] rounded-xl border-[12px] border-double border-primary/20 p-10 sm:p-16 flex flex-col items-center text-slate-900 relative overflow-hidden">
              
              {/* Subtle Background Layer */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap justify-center items-center gap-10 p-10 select-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className="text-4xl font-black uppercase tracking-tighter rotate-[-25deg]">
                    Sustainable Industrial Circular Impact Verified
                  </span>
                ))}
              </div>

              {/* Vertical Flow Content */}
              <div className="relative z-10 flex flex-col items-center w-full h-full">
                
                {/* 1. HiX Logo */}
                <div className="mb-6">
                  {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="h-16 sm:h-24 w-auto object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-4xl shadow-lg">H</div>
                  )}
                </div>

                {/* 2. ISSUED DATE */}
                <div className="mb-8 flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Issued Date</span>
                  <span className="text-lg sm:text-xl font-bold text-slate-800">15 April 2026</span>
                </div>

                {/* 3. Verified ESG Impact Seal */}
                <div className="mb-10 relative h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
                  <div className="absolute inset-2 border-2 border-primary rounded-full flex flex-col items-center justify-center bg-white shadow-xl">
                    <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Verified</span>
                    <span className="text-xl sm:text-3xl font-black text-primary tracking-tighter leading-none my-1">ESG</span>
                    <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Impact</span>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="flex flex-col items-center text-center flex-1">
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase mb-6">Certificate of Impact</h1>
                  
                  <p className="text-slate-500 font-semibold text-sm sm:text-lg mb-2 uppercase tracking-widest">This document verifies the contributions of</p>
                  <h2 className="text-2xl sm:text-4xl font-black text-primary mb-8 tracking-tight leading-tight">{user?.companyName || user?.email || 'Valued Partner'}</h2>
                  
                  <p className="text-slate-600 max-w-2xl mb-10 leading-relaxed italic text-sm sm:text-lg font-medium">
                    "In recognition of their outstanding commitment to circular economy principles and sustainable industrial practices on the HiX Platform. Through strategic resource recovery and circular transactions, they have achieved significant environmental impact reduction."
                  </p>

                  <div className="grid grid-cols-3 w-full max-w-3xl gap-4 sm:gap-8 bg-primary/5 rounded-2xl p-6 sm:p-10 border border-primary/10 shadow-inner mb-10">
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-primary">
                        {user?.totalCo2Saved ? `${user.totalCo2Saved.toLocaleString()} kg` : '1,250 kg'}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">CO2 Offset</p>
                    </div>
                    <div className="text-center border-x border-primary/10">
                      <p className="text-xl sm:text-3xl font-black text-primary">85%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Circularity Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-primary">4.2 Tons</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Resources Saved</p>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="w-full flex justify-between items-end pt-6 border-t border-slate-200">
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification ID</p>
                    <p className="text-xs sm:text-sm font-mono font-black text-slate-700">HIX-ESG-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-px w-32 bg-slate-300 mb-2 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">HiX Sustainability Board</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-12 mb-8 shrink-0">
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="rounded-2xl px-12 h-16 bg-primary hover:bg-primary/90 shadow-[0_20px_40px_rgba(34,197,94,0.3)] font-black text-xl tracking-tight transition-all hover:scale-105 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-3 h-6 w-6" />
                  Download Certified PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
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
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
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
  const [reportSearch, setReportSearch] = useState("");
  const [reportSort, setReportSort] = useState<{ key: keyof Report; direction: 'asc' | 'desc' }>({ key: 'status', direction: 'asc' });

  const [vettingSearch, setVettingSearch] = useState("");
  const [vettingTypeFilter, setVettingTypeFilter] = useState("all");
  const [vettingStatusFilter, setVettingStatusFilter] = useState("all");

  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedReportTransaction, setSelectedReportTransaction] = useState<Transaction | null>(null);
  const [selectedReportUser, setSelectedReportUser] = useState<UserProfile | null>(null);
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);

  useEffect(() => {
    if (!selectedReport) {
      setSelectedReportTransaction(null);
      setSelectedReportUser(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingReportDetails(true);
      try {
        // Fetch reported user
        const userDoc = await getDoc(doc(db, "users", selectedReport.reportedUserId));
        if (userDoc.exists()) {
          setSelectedReportUser({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
        }

        // Fetch transaction if applicable
        if (selectedReport.transactionId) {
          const transDoc = await getDoc(doc(db, "transactions", selectedReport.transactionId));
          if (transDoc.exists()) {
            setSelectedReportTransaction({ id: transDoc.id, ...transDoc.data() } as Transaction);
          }
        }
      } catch (error) {
        console.error("Error fetching report details:", error);
      } finally {
        setLoadingReportDetails(false);
      }
    };

    fetchDetails();
  }, [selectedReport]);

  const [selectedUserForVetting, setSelectedUserForVetting] = useState<UserProfile | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resolutionNote, setResolutionNote] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<UserProfile | null>(null);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [reportReasonFilter, setReportReasonFilter] = useState("all");
  const [showESGCertModal, setShowESGCertModal] = useState(false);
  const [selectedUserForCert, setSelectedUserForCert] = useState<UserProfile | null>(null);
  const [editedVatNumber, setEditedVatNumber] = useState("");
  const [isUpdatingVat, setIsUpdatingVat] = useState(false);

  useEffect(() => {
    if (selectedUserForVetting) {
      setEditedVatNumber(selectedUserForVetting.vatNumber || "");
    }
  }, [selectedUserForVetting]);

  // Transactions Tab State
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionSort, setTransactionSort] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [transactionPage, setTransactionPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionListing, setSelectedTransactionListing] = useState<Listing | null>(null);
  const [loadingTransactionDetails, setLoadingTransactionDetails] = useState(false);

  // Pagination State
  const [userPage, setUserPage] = useState(1);
  const [vettingPage, setVettingPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when filters change
  useEffect(() => { setUserPage(1); }, [userSearch, userFilter]);
  useEffect(() => { setVettingPage(1); }, [vettingSearch, vettingTypeFilter, vettingStatusFilter]);
  useEffect(() => { setReportPage(1); }, [reportSearch, reportFilter, reportReasonFilter]);
  useEffect(() => { setAuditPage(1); }, [auditSearch, auditActionFilter]);
  useEffect(() => { setTransactionPage(1); }, [transactionSearch]);

  useEffect(() => {
    if (!selectedTransaction) {
      setSelectedTransactionListing(null);
      return;
    }

    const fetchListing = async () => {
      setLoadingTransactionDetails(true);
      try {
        if (selectedTransaction.listingId) {
          const listingDoc = await getDoc(doc(db, "listings", selectedTransaction.listingId));
          if (listingDoc.exists()) {
            setSelectedTransactionListing({ id: listingDoc.id, ...listingDoc.data() } as Listing);
          }
        }
      } catch (error) {
        console.error("Error fetching transaction listing:", error);
      } finally {
        setLoadingTransactionDetails(false);
      }
    };

    fetchListing();
  }, [selectedTransaction]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const search = transactionSearch.toLowerCase();
        return (
          t.id.toLowerCase().includes(search) ||
          t.buyerId.toLowerCase().includes(search) ||
          t.sellerId.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        let aVal = a[transactionSort.key];
        let bVal = b[transactionSort.key];
        
        if (aVal?.seconds !== undefined) aVal = aVal.seconds;
        if (bVal?.seconds !== undefined) bVal = bVal.seconds;
        
        if (aVal === null || aVal === undefined) aVal = 0;
        if (bVal === null || bVal === undefined) bVal = 0;

        if (aVal < bVal) return transactionSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return transactionSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [transactions, transactionSearch, transactionSort]);

  const exportTransactionsToCSV = () => {
    const dataToExport = filteredTransactions.map(t => ({
      ID: t.id,
      Date: t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleString() : 'N/A',
      BuyerID: t.buyerId,
      SellerID: t.sellerId,
      Amount: t.amount,
      Quantity: t.quantity,
      Status: t.status,
      CO2Savings: t.co2Savings
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `hix_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, transPath);
    });

    const listingsPath = "listings";
    const unsubscribeListings = onSnapshot(collection(db, listingsPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Listing[];
      setListings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, listingsPath);
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
      unsubscribeListings();
      unsubscribeAudit();
    };
  }, [profile]);

  const createAuditLog = async (action: string, details: string, targetId?: string, targetType?: AuditLog['targetType'], targetName?: string, targetEmail?: string) => {
    if (!user || !profile) return;
    try {
      await addDoc(collection(db, "audit_logs"), {
        adminId: user.uid,
        adminName: profile.companyName || user.email,
        action,
        details,
        targetId,
        targetType,
        targetName,
        targetEmail,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  };

  const handleVerifyVat = async (userId: string) => {
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isVatVerified: true
      });
      
      await createAuditLog("VERIFY_VAT", "Verified user VAT registration", userId, 'user', targetUser?.companyName, targetUser?.email);
      
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

  const handleVetCompany = async (userId: string, status: 'approved' | 'rejected' | 'under_review' = 'approved') => {
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isVetted: status === 'approved',
        vettingStatus: status
      });
      
      await createAuditLog("VET_COMPANY", `Vetting status updated to ${status}`, userId, 'user', targetUser?.companyName, targetUser?.email);
      
      // Send notification to user
      await addDoc(collection(db, "notifications"), {
        userId,
        title: status === 'approved' ? "Company Vetted" : "Vetting Update",
        message: status === 'approved' 
          ? "Congratulations! Your company has been fully vetted and approved on the HiX exchange."
          : `Your vetting status has been updated to: ${status.replace('_', ' ')}.`,
        type: 'system',
        link: '/profile',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success(`Company vetting status updated to ${status}`);
      setSelectedUserForVetting(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isSuspended: true,
        suspensionReason: suspensionReason || "Violated platform terms"
      });
      
      await createAuditLog("SUSPEND_USER", `Suspended user. Reason: ${suspensionReason || "Violated platform terms"}`, userId, 'user', targetUser?.companyName, targetUser?.email);

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

  const handleUpdateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    if (profile?.role !== 'superadmin') {
      toast.error("Only superadmins can change user roles.");
      return;
    }
    
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      await createAuditLog("UPDATE_ROLE", `Changed user role to ${newRole}`, userId, 'user', targetUser?.companyName, targetUser?.email);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, "users", userId), {
        isSuspended: false,
        suspensionReason: null
      });
      await createAuditLog("UNSUSPEND_USER", "Unsuspended user account", userId, 'user', targetUser?.companyName, targetUser?.email);
      toast.success("User unsuspended successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateUserVat = async (userId: string, newVat: string) => {
    setIsUpdatingVat(true);
    const targetUser = users.find(u => u.uid === userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        vatNumber: newVat
      });
      await createAuditLog("UPDATE_VAT", `Updated VAT Number to ${newVat}`, userId, 'user', targetUser?.companyName, targetUser?.email);
      toast.success("VAT number updated successfully");
      
      // Update selected user info in modal if matches
      if (selectedUserForVetting?.uid === userId) {
        setSelectedUserForVetting(prev => prev ? { ...prev, vatNumber: newVat } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsUpdatingVat(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.uid) {
      toast.error("You cannot delete your own account from the admin panel.");
      return;
    }
    
    const targetUser = users.find(u => u.uid === userId);
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, "users", userId));
      await createAuditLog("DELETE_USER", "Deleted user account", userId, 'user', targetUser?.companyName, targetUser?.email);
      toast.success("User deleted successfully");
      setIsUserDeleteDialogOpen(false);
      setUserToDelete(null);
      setDeleteConfirmationText("");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: 'resolved',
        resolutionNote,
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid
      });
      await createAuditLog("RESOLVE_REPORT", `Resolved report. Note: ${resolutionNote || "No note"}`, reportId, 'report', report?.reportedUserName);
      toast.success("Report marked as resolved");
      setResolutionNote("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: 'dismissed'
      });
      await createAuditLog("DISMISS_REPORT", "Dismissed report", reportId, 'report', report?.reportedUserName);
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

  // RBAC Helpers
  const isSuperAdmin = profile?.role === 'superadmin';
  const isAdmin = ['admin', 'superadmin'].includes(profile?.role);
  const isEditor = ['editor', 'admin', 'superadmin'].includes(profile?.role);
  const isViewer = ['viewer', 'editor', 'admin', 'superadmin'].includes(profile?.role);

  const canManageUsers = isSuperAdmin;
  const canManageRoles = isSuperAdmin;
  const canManageVetting = isEditor;
  const canManageReports = isEditor;
  const canManageSettings = isAdmin;
  const canDelete = isSuperAdmin;
  const canBulkUpload = isEditor;

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
      const searchLower = userSearch.toLowerCase();
      const matchesSearch = 
        u.companyName?.toLowerCase().includes(searchLower) || 
        u.email?.toLowerCase().includes(searchLower) ||
        u.vatNumber?.toLowerCase().includes(searchLower) ||
        u.phoneNumber?.toLowerCase().includes(searchLower) ||
        u.uid?.toLowerCase().includes(searchLower) ||
        u.role?.toLowerCase().includes(searchLower);
      
      const matchesFilter = userFilter === 'all' || 
                           (userFilter === 'pending' && (!u.isVetted || !u.isVatVerified)) ||
                           (userFilter === 'vetted' && u.isVetted) ||
                           (userFilter === 'unverified' && !u.isVatVerified) ||
                           (userFilter === 'suspended' && u.isSuspended) ||
                           (userFilter === 'admins' && ['admin', 'superadmin', 'editor', 'viewer'].includes(u.role || ''));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal = a[userSort.key];
      let bVal = b[userSort.key];
      
      // Handle timestamps
      if (aVal?.seconds !== undefined) aVal = aVal.seconds;
      if (bVal?.seconds !== undefined) bVal = bVal.seconds;
      
      // Handle nulls
      if (aVal === null || aVal === undefined) aVal = 0;
      if (bVal === null || bVal === undefined) bVal = 0;

      if (aVal < bVal) return userSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return userSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredReports = reports
    .filter(r => {
      const matchesStatus = reportFilter === 'all' || r.status === reportFilter;
      const matchesReason = reportReasonFilter === 'all' || r.reason === reportReasonFilter;
      const searchLower = reportSearch.toLowerCase();
      const matchesSearch = 
        r.reporterName?.toLowerCase().includes(searchLower) ||
        r.reportedUserName?.toLowerCase().includes(searchLower) ||
        r.reason?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.id?.toLowerCase().includes(searchLower);
      return matchesStatus && matchesReason && matchesSearch;
    })
    .sort((a, b) => {
      const aVal = a[reportSort.key];
      const bVal = b[reportSort.key];
      if (aVal < bVal) return reportSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return reportSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredVettingUsers = users
    .filter(u => {
      const matchesSearch = 
        u.companyName?.toLowerCase().includes(vettingSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(vettingSearch.toLowerCase()) ||
        u.vatNumber?.toLowerCase().includes(vettingSearch.toLowerCase());
      
      const matchesType = vettingTypeFilter === 'all' ||
                         (vettingTypeFilter === 'vat' && !u.isVatVerified) ||
                         (vettingTypeFilter === 'identity' && u.vettingStatus !== 'approved');
      
      const matchesStatus = vettingStatusFilter === 'all' || u.vettingStatus === vettingStatusFilter;
      
      // If status filter is 'all', we still default to showing only those needing attention
      // unless a specific status is selected
      const needsAttention = u.vettingStatus !== 'approved' || !u.isVatVerified;
      const showAll = vettingStatusFilter !== 'all' || vettingTypeFilter !== 'all';
      
      return matchesSearch && matchesType && matchesStatus && (showAll || needsAttention);
    });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.adminName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.targetEmail?.toLowerCase().includes(auditSearch.toLowerCase());
    
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
    
    return matchesSearch && matchesAction;
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
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{profile?.companyName || "Administrator"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{profile?.role || "Admin"}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-white/10 -mx-4 px-4 py-4 sm:mx-0 sm:px-6 sm:rounded-3xl sm:border sm:mt-4 sm:shadow-lg sm:border-primary/10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0 hidden sm:flex">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Management</h3>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-nowrap">Admin Control</p>
                </div>
              </div>

              <TabsList className="flex h-auto bg-transparent border-none p-0 gap-1 overflow-x-auto justify-start flex-1 w-full custom-scrollbar pb-2">
                {[
                  { value: "dashboard", label: "Dashboard", icon: BarChart3, show: isViewer },
                  { value: "users", label: "Users", icon: Users, show: isViewer },
                  { value: "transactions", label: "Transactions", icon: DollarSign, show: isViewer },
                  { value: "admins", label: "Admins", icon: ShieldCheck, show: isAdmin },
                  { value: "vetting", label: "Vetting Queue", icon: ShieldCheck, badge: users.filter(u => !u.isVetted || !u.isVatVerified).length, badgeColor: "bg-amber-500", show: isEditor },
                  { value: "reports", label: "Reports", icon: AlertTriangle, badge: reports.filter(r => r.status === 'pending').length, badgeColor: "bg-destructive", show: isEditor },
                  { value: "bulk", label: "Bulk Upload", icon: Upload, show: isEditor },
                  { value: "esg", label: "ESG Impact", icon: Leaf, show: isViewer },
                  { value: "audit", label: "Audit Logs", icon: History, show: isViewer },
                  { value: "settings", label: "Platform Settings", icon: Database, show: isAdmin },
                  { value: "system", label: "System Tools", icon: RefreshCw, show: isSuperAdmin },
                ].filter(tab => tab.show).map((tab) => (
                  <TabsTrigger 
                    key={`admin-tab-${tab.value}`}
                    value={tab.value} 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10 hover:bg-white/5 transition-all relative group shrink-0 border-none w-auto"
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    <span className="font-bold text-[10px] tracking-tight hidden xl:inline-block whitespace-nowrap">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`h-4 w-4 rounded-full ${tab.badgeColor} text-white text-[9px] flex items-center justify-center font-bold shadow-sm shrink-0`}>
                        {tab.badge}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="w-full min-w-0">
            {isViewer && (
              <TabsContent value="dashboard" className="mt-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { label: "Total Users", value: users.length, sub: `${users.filter(u => u.isVetted).length} vetted`, icon: Users, color: "text-blue-500" },
                      { label: "Total Revenue", value: `£${transactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.amount : 0), 0).toLocaleString()}`, sub: `${transactions.filter(t => t.status === 'completed').length} deals`, icon: DollarSign, color: "text-green-500" },
                      { label: "Active Listings", value: listings.filter(l => l.status === 'available').length, sub: "Across all categories", icon: Package, color: "text-purple-500" },
                      { label: "Recent Trans", value: transactions.filter(t => {
                        const now = new Date();
                        const created = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                        return (now.getTime() - created.getTime()) < (24 * 60 * 60 * 1000);
                      }).length, sub: "Last 24 hours", icon: History, color: "text-amber-500" },
                    ].map((stat, i) => (
                      <motion.div
                        key={`admin-stat-${stat.label}`}
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
              <Card className="glass border-primary/20 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Real-Time Activity Feed</CardTitle>
                    </div>
                    <CardDescription>Live stream of significant platform events.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest" onClick={() => setActiveTab("audit")}>
                    View All Logs
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.slice(0, 15).map((log) => (
                      <div key={`overview-log-${log.id}`} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                          log.action.includes('REGISTRATION') ? 'bg-blue-500/20 text-blue-500' :
                          log.action.includes('TRANSACTION') ? 'bg-green-500/20 text-green-500' :
                          log.action.includes('REPORT') ? 'bg-destructive/20 text-destructive' :
                          log.action.includes('SUSPEND') ? 'bg-amber-500/20 text-amber-500' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {log.action.includes('REGISTRATION') ? <Users className="h-4 w-4" /> :
                           log.action.includes('TRANSACTION') ? <DollarSign className="h-4 w-4" /> :
                           log.action.includes('REPORT') ? <AlertTriangle className="h-4 w-4" /> :
                           log.action.includes('SUSPEND') ? <Ban className="h-4 w-4" /> :
                           <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs font-black uppercase tracking-tight">
                              {log.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : "Just now"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">{log.adminName}</span>: {log.details}
                          </p>
                          {log.targetName && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-white/5 border-white/10 text-muted-foreground">
                                {log.targetType}: {log.targetName}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                        <History className="h-10 w-10 opacity-10" />
                        <p className="text-sm italic">No recent activity recorded.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </TabsContent>
        )}

        {isViewer && (
          <TabsContent value="users" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="Search by name, email or VAT..." 
                          className="pl-9 pr-9 w-full sm:w-[250px] rounded-xl glass border-primary/20 focus:ring-primary/50"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                        {userSearch && (
                          <button 
                            onClick={() => setUserSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
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
                          <SelectItem value="unverified">Unverified</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="admins">Admins</SelectItem>
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
                          <TableHead className="cursor-pointer hover:text-primary transition-colors text-xs" onClick={() => sortUsers('vatNumber')}>
                            <div className="flex items-center gap-1">
                              VAT Number
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors text-xs" onClick={() => sortUsers('phoneNumber')}>
                            <div className="flex items-center gap-1">
                              Phone
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('isVatVerified')}>
                            <div className="flex items-center gap-1">
                              VAT Verification Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('vettingStatus')}>
                            <div className="flex items-center gap-1">
                              Vetting Status
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
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('lastLogin')}>
                            <div className="flex items-center gap-1">
                              Last Login
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => sortUsers('totalCo2Saved')}>
                            <div className="flex items-center gap-1">
                              CO2 Savings
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right pr-6 w-[200px]">Actions</TableHead>
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
                            <TableRow key={`user-row-${u.uid}`} className="hover:bg-primary/5 transition-colors group">
                              <TableCell className="pl-6">
                                <div className="font-bold text-foreground">{u.companyName}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </TableCell>
                              <TableCell className="text-xs font-mono">
                                {u.vatNumber || <span className="text-muted-foreground italic opacity-50">Not Provided</span>}
                              </TableCell>
                              <TableCell className="text-xs">
                                {u.phoneNumber || <span className="text-muted-foreground italic opacity-50">N/A</span>}
                              </TableCell>
                              <TableCell>
                                {u.isVatVerified ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-md">Verified</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-md">Unverified</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {u.vettingStatus === 'approved' ? (
                                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-md">Approved</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-md capitalize">
                                    {u.vettingStatus?.replace('_', ' ') || 'Pending'}
                                  </Badge>
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
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                      <SelectItem value="editor">Editor</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="superadmin">Super Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className="capitalize rounded-md">{u.role || 'user'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {u.lastLogin ? (
                                  new Date(u.lastLogin.seconds * 1000).toLocaleString()
                                ) : (
                                  "Never"
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                {u.totalCo2Saved?.toLocaleString() || 0} kg
                              </TableCell>
                              <TableCell className="text-right pr-6 space-x-1">                                  <div className="flex items-center justify-end gap-3">
                                  {canManageVetting && !u.isVatVerified && (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVerifyVat(u.uid)}>
                                      VAT
                                    </Button>
                                  )}
                                  {canManageVetting && u.vettingStatus !== 'approved' && (
                                    <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => setSelectedUserForVetting(u)}>
                                      Vet
                                    </Button>
                                  )}
                                  
                                  {canManageUsers && (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Suspended</span>
                                      <Switch 
                                        checked={u.isSuspended} 
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedUserForSuspension(u);
                                            setIsSuspending(true);
                                          } else {
                                            handleUnsuspendUser(u.uid);
                                          }
                                        }}
                                      />
                                    </div>
                                  )}

                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10" 
                                    onClick={() => navigate(`/admin/transactions?uid=${u.uid}&type=buy`)}
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10" 
                                    onClick={() => navigate(`/admin/transactions?uid=${u.uid}&type=sell`)}
                                  >
                                    <DollarSign className="h-3.5 w-3.5" />
                                  </Button>
                                  {canDelete && (
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => {
                                      setUserToDelete(u);
                                      setDeleteConfirmationText("");
                                      setIsUserDeleteDialogOpen(true);
                                    }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
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
                    currentPage={userPage}
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setUserPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isViewer && (
          <TabsContent value="transactions" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Platform Transactions</CardTitle>
                      <CardDescription>Monitor all marketplace activity and financial flows.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="Search ID, Buyer, Seller..." 
                          className="pl-9 pr-9 w-full sm:w-[250px] rounded-xl glass border-primary/20 focus:ring-primary/50"
                          value={transactionSearch}
                          onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" className="rounded-xl glass border-primary/20" onClick={exportTransactionsToCSV}>
                        <Upload className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="pl-6">Transaction ID</TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => setTransactionSort(prev => ({ key: 'createdAt', direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                            <div className="flex items-center gap-1">
                              Date
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead>Buyer ID</TableHead>
                          <TableHead>Seller ID</TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => setTransactionSort(prev => ({ key: 'amount', direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                            <div className="flex items-center gap-1">
                              Amount
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => setTransactionSort(prev => ({ key: 'status', direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                            <div className="flex items-center gap-1">
                              Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <DollarSign className="h-8 w-8 opacity-20" />
                                <p>No transactions found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.slice((transactionPage - 1) * itemsPerPage, transactionPage * itemsPerPage).map((t) => (
                            <TableRow 
                              key={`trans-row-${t.id}`} 
                              className="hover:bg-primary/5 transition-colors cursor-pointer"
                              onClick={() => setSelectedTransaction(t)}
                            >
                              <TableCell className="pl-6 font-mono text-[10px]">{t.id}</TableCell>
                              <TableCell className="text-xs">
                                {t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell className="text-[10px] font-mono">{t.buyerId.substring(0, 8)}...</TableCell>
                              <TableCell className="text-[10px] font-mono">{t.sellerId.substring(0, 8)}...</TableCell>
                              <TableCell className="font-bold">£{t.amount?.toLocaleString()}</TableCell>
                              <TableCell>{t.quantity}</TableCell>
                              <TableCell>
                                <Badge className={`rounded-md ${
                                  t.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-destructive/10 text-destructive border-destructive/20'
                                }`}>
                                  {t.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={transactionPage}
                    totalItems={filteredTransactions.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setTransactionPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="admins" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Platform Administrators</CardTitle>
                      <CardDescription>Manage users with administrative privileges.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/5">
                          <TableHead className="w-[250px] font-bold uppercase text-[10px] tracking-widest">Company / Admin</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Role</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => ['admin', 'superadmin'].includes(u.role || '')).map((admin) => (
                          <TableRow key={admin.uid} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-primary/20">
                                  <AvatarImage src={admin.logoUrl} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {admin.companyName?.charAt(0) || admin.email?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{admin.companyName}</span>
                                  <span className="text-xs text-muted-foreground">{admin.email}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase text-[9px] font-black">
                                {admin.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/20 uppercase text-[9px] font-black">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                                Manage Permissions
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isEditor && (
          <TabsContent value="reports" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                      <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="Search reports..." 
                          className="pl-10 pr-9 rounded-xl glass border-primary/20 focus:ring-primary/50"
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                        />
                        {reportSearch && (
                          <button 
                            onClick={() => setReportSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
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
                            <TableRow key={`report-row-${r.id}`} className="hover:bg-primary/5 transition-colors group">
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
                                    <DialogTrigger asChild nativeButton={true}>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setSelectedReport(r)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="glass border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Report Details</DialogTitle>
                                        <DialogDescription>
                                          Case investigation for report against {r.reportedUserName}.
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      {loadingReportDetails ? (
                                        <div className="py-12 text-center">
                                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                          <p className="text-muted-foreground">Loading investigation details...</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-6 py-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reporter</Label>
                                              <p className="font-bold text-lg">{r.reporterName}</p>
                                              <p className="text-xs text-muted-foreground font-mono mt-1">{r.reporterId}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reported User</Label>
                                              <p className="font-bold text-lg">{r.reportedUserName}</p>
                                              <p className="text-xs text-muted-foreground font-mono mt-1">{r.reportedUserId}</p>
                                            </div>
                                          </div>

                                          {selectedReportUser && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2 block">Reported User Summary</Label>
                                              <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Company</p>
                                                  <p className="text-sm font-medium">{selectedReportUser.companyName}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p>
                                                  <p className="text-sm font-medium">{selectedReportUser.email}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Vat Status</p>
                                                  <Badge variant="outline" className="mt-1">
                                                    {selectedReportUser.isVatVerified ? "Verified" : "Unverified"}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total CO2 Saved</p>
                                                  <p className="text-sm font-medium text-primary">{selectedReportUser.totalCo2Saved?.toLocaleString()} kg</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {selectedReportTransaction && (
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                              <Label className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 block">Related Transaction</Label>
                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Transaction ID</p>
                                                  <p className="text-xs font-mono">{selectedReportTransaction.id}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Amount</p>
                                                  <p className="text-sm font-bold">£{selectedReportTransaction.amount?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                                                  <Badge className="mt-1 capitalize">{selectedReportTransaction.status}</Badge>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                            <Label className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Reason for Report</Label>
                                            <p className="font-bold text-xl mt-1">{r.reason}</p>
                                          </div>

                                          <div>
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Incident Description</Label>
                                            <p className="text-sm bg-muted/30 p-4 rounded-xl border border-white/5 mt-2 leading-relaxed whitespace-pre-wrap">{r.description}</p>
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
                                      )}
                                      <DialogFooter className="gap-2 sm:gap-2">
                                        {r.status === 'pending' ? (
                                          <>
                                            {canManageReports && (
                                              <>
                                                <Button variant="outline" className="rounded-xl px-6" onClick={() => handleDismissReport(r.id)}>
                                                  Dismiss Case
                                                </Button>
                                                <Button className="rounded-xl px-6" onClick={() => handleResolveReport(r.id)}>
                                                  Mark Resolved
                                                </Button>
                                              </>
                                            )}
                                            {canManageUsers && (
                                              <Button variant="destructive" className="rounded-xl px-6" onClick={() => handleSuspendUser(r.reportedUserId)}>
                                                Suspend User
                                              </Button>
                                            )}
                                          </>
                                        ) : (
                                          <Button variant="outline" className="rounded-xl w-full" onClick={() => setSelectedReport(null)}>
                                            Close
                                          </Button>
                                        )}
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  {canManageReports && r.status === 'pending' && (
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
        )}

        {canManageVetting && (
          <TabsContent value="vetting" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Vetting Queue</CardTitle>
                      <CardDescription>Review companies waiting for VAT and identity verification.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="Search companies..." 
                          className="pl-10 pr-9 rounded-xl glass border-primary/20 focus:ring-primary/50"
                          value={vettingSearch}
                          onChange={(e) => setVettingSearch(e.target.value)}
                        />
                        {vettingSearch && (
                          <button 
                            onClick={() => setVettingSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <Select value={vettingTypeFilter} onValueChange={setVettingTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl glass border-primary/20">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter Type" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="all">All Pending</SelectItem>
                          <SelectItem value="vat">VAT Pending</SelectItem>
                          <SelectItem value="identity">Identity Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={vettingStatusFilter} onValueChange={setVettingStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl glass border-primary/20">
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
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
                        <TableHead className="pl-6">Company</TableHead>
                        <TableHead>VAT Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6 w-[240px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVettingUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <ShieldCheck className="h-8 w-8 opacity-20" />
                              <p>No companies in the vetting queue matching your criteria.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVettingUsers
                          .slice((vettingPage - 1) * itemsPerPage, vettingPage * itemsPerPage)
                          .map((u) => (
                        <TableRow key={`vetting-row-${u.uid}`} className="hover:bg-primary/5 transition-colors group">
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
                              {u.vettingStatus !== 'approved' && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] rounded-md capitalize">
                                  {u.vettingStatus?.replace('_', ' ') || 'Identity Pending'}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 space-x-1">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold uppercase tracking-wider" onClick={() => setSelectedUserForVetting(u)}>
                                Details
                              </Button>
                              {!u.isVatVerified && (
                                <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVerifyVat(u.uid)}>
                                  VAT
                                </Button>
                              )}
                              {u.vettingStatus !== 'approved' && (
                                <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold" onClick={() => handleVetCompany(u.uid, 'approved')}>
                                  Approve
                                </Button>
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
                  currentPage={vettingPage}
                  totalItems={filteredVettingUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setVettingPage}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      )}

        {canBulkUpload && (
          <TabsContent value="bulk" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                          <Button className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs shadow-md shadow-primary/10" asChild>
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
        )}

        {isViewer && (
          <TabsContent value="esg" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                      { label: 'CO2 Saved', value: `${transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0).toLocaleString()} kg`, icon: Leaf, color: 'orange', sub: 'Impact', bg: 'bg-orange-500/5', border: 'border-orange-500/10', text: 'text-orange-500' },
                      { label: 'Tree Equivalent', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 21.7).toLocaleString(), icon: CheckCircle2, color: 'primary', sub: 'Offset', bg: 'bg-primary/5', border: 'border-primary/10', text: 'text-primary' },
                      { label: 'Miles Saved', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 0.4).toLocaleString(), icon: Car, color: 'blue', sub: 'Travel', bg: 'bg-blue-500/5', border: 'border-blue-500/10', text: 'text-blue-500' },
                      { label: 'Homes Powered', value: Math.round(transactions.reduce((acc, t) => acc + (t.co2Saved || 0), 0) / 30).toLocaleString(), icon: Home, color: 'amber', sub: 'Energy', bg: 'bg-amber-500/5', border: 'border-amber-500/10', text: 'text-amber-500' }
                    ].map((stat) => (
                      <Card key={`esg-stat-${stat.label}`} className={`${stat.bg} ${stat.border} overflow-hidden relative group`}>
                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                          <stat.icon className="h-16 w-16" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.text}`}>
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
                        <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-md shadow-primary/5">
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

                  <Card className="glass border-primary/10 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">Manual Certificate Issuance</CardTitle>
                          <CardDescription>Generate sample ESG certificates for vetted companies.</CardDescription>
                        </div>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="Search companies..." 
                            className="pl-9 rounded-xl bg-white/5 border-white/10"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-2xl border border-white/5 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/10">
                              <TableHead className="font-bold text-xs uppercase tracking-widest">Company</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-widest">Status</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-widest">Impact Score</TableHead>
                              <TableHead className="text-right font-bold text-xs uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.filter(u => u.isVetted).slice(0, 5).map((user) => (
                              <TableRow key={`esg-user-${user.uid}`} className="hover:bg-white/5 border-white/5 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 rounded-lg border border-primary/20">
                                      <AvatarImage src={user.logoUrl} />
                                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                        {user.companyName?.substring(0, 2).toUpperCase() || "CP"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-bold text-sm">{user.companyName || user.displayName}</p>
                                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                    Vetted
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                                    </div>
                                    <span className="text-xs font-bold">85/100</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-lg h-8 px-4 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary hover:text-white transition-all"
                                    onClick={() => {
                                      setSelectedUserForCert(user);
                                      setShowESGCertModal(true);
                                    }}
                                  >
                                    Generate Sample
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isViewer && (
          <TabsContent value="audit" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">System Audit Logs</CardTitle>
                      <CardDescription>Track administrative actions and system events for security and compliance.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search logs..." 
                          className="pl-9 glass border-primary/20 rounded-xl h-10"
                          value={auditSearch}
                          onChange={(e) => setAuditSearch(e.target.value)}
                        />
                      </div>
                      <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                        <SelectTrigger className="w-[180px] glass border-primary/20 rounded-xl h-10">
                          <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent className="glass border-primary/20">
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="VERIFY_VAT">Verify VAT</SelectItem>
                          <SelectItem value="VET_COMPANY">Vet Company</SelectItem>
                          <SelectItem value="SUSPEND_USER">Suspend User</SelectItem>
                          <SelectItem value="UNSUSPEND_USER">Unsuspend User</SelectItem>
                          <SelectItem value="DELETE_USER">Delete User</SelectItem>
                          <SelectItem value="UPDATE_ROLE">Update Role</SelectItem>
                          <SelectItem value="RESOLVE_REPORT">Resolve Report</SelectItem>
                          <SelectItem value="DISMISS_REPORT">Dismiss Report</SelectItem>
                          <SelectItem value="SEND_ANNOUNCEMENT">Announcement</SelectItem>
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
                          <TableHead className="pl-6">Admin</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead className="text-right pr-6">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAuditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <ShieldCheck className="h-8 w-8 opacity-20" />
                                <p>No audit logs found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAuditLogs.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage).map((log) => (
                            <TableRow key={`audit-row-${log.id}`} className="hover:bg-primary/5 transition-colors">
                              <TableCell className="font-bold pl-6">{log.adminName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-widest rounded-md bg-white/5">{log.action}</Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-xs italic text-muted-foreground">"{log.details}"</TableCell>
                              <TableCell className="text-[10px] font-mono text-muted-foreground">
                                {log.targetType && log.targetId ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="bg-muted/30 px-1.5 py-0.5 rounded border border-white/5 w-fit">
                                      {log.targetType}: {log.targetId.slice(0, 8)}
                                    </span>
                                    {log.targetName && <span className="text-foreground font-medium">{log.targetName}</span>}
                                    {log.targetEmail && <span className="opacity-70">{log.targetEmail}</span>}
                                  </div>
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
                    totalItems={filteredAuditLogs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setAuditPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="settings" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                        <div className="flex items-center gap-8 p-8 rounded-3xl bg-white/5 border border-white/10 group overflow-hidden relative">
                          <div className="flex flex-col items-center gap-6">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Live Preview</label>
                            <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center overflow-visible border border-primary/20 shadow-inner group-hover:border-primary/50 transition-colors">
                              {platformSettings.hixLogoUrl ? (
                                <img src={platformSettings.hixLogoUrl} alt="Logo" className="h-full w-full rounded-full object-cover logo-primary-glow" />
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                  <Upload className="h-6 w-6" />
                                  <span className="text-[10px] font-bold uppercase">No Logo</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Upload a high-resolution circular logo. It will be displayed at the top of every page with a mirror reflection effect.
                            </p>
                            <Button variant="outline" size="sm" asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6 w-full">
                              <label className="cursor-pointer">
                                Update Platform Logo
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                              </label>
                            </Button>
                          </div>
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
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (window.confirm("Are you sure you want to enable Maintenance Mode? This will disable all new transactions and registrations across the platform.")) {
                                  setPlatformSettings({...platformSettings, maintenanceMode: true});
                                }
                              } else {
                                setPlatformSettings({...platformSettings, maintenanceMode: false});
                              }
                            }}
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
                    <Button onClick={savePlatformSettings} disabled={isSavingSettings} className="rounded-xl px-10 h-14 font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/10 hover:scale-105 transition-transform">
                      {isSavingSettings ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-3 h-5 w-5" />}
                      Commit Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="system" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                        className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs shadow-md shadow-primary/10"
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
        )}
      </div>
    </Tabs>

      <Dialog open={!!selectedUserForVetting} onOpenChange={(open) => !open && setSelectedUserForVetting(null)}>
        <DialogContent className="glass border-primary/20 sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
            <DialogHeader className="p-0">
              <DialogTitle className="text-3xl font-black tracking-tight">Company Vetting: {selectedUserForVetting?.companyName}</DialogTitle>
              <DialogDescription className="text-base">
                Review company details and documents before approval.
              </DialogDescription>
            </DialogHeader>

            {selectedUserForVetting && (
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-5">
                  <div className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black block mb-1.5">Company Name</Label>
                    <p className="font-bold text-lg leading-none">{selectedUserForVetting.companyName}</p>
                  </div>
                  <div className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black block mb-1.5">Email Address</Label>
                    <p className="font-bold text-lg leading-none truncate">{selectedUserForVetting.email}</p>
                  </div>
                  <div className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black block mb-1.5">VAT Registration</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        value={editedVatNumber}
                        onChange={(e) => setEditedVatNumber(e.target.value)}
                        className="glass border-white/10 h-10 rounded-xl font-mono"
                        placeholder="Enter VAT number..."
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        disabled={isUpdatingVat || editedVatNumber === selectedUserForVetting.vatNumber}
                        onClick={() => handleUpdateUserVat(selectedUserForVetting.uid, editedVatNumber)}
                        className="rounded-xl h-10 px-4 whitespace-nowrap"
                      >
                        {isUpdatingVat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
                    <h4 className="text-[10px] font-black mb-5 flex items-center gap-2 uppercase tracking-[0.2em] text-primary/60">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      <span className="leading-none">Vetting Checklist</span>
                    </h4>
                    <ul className="space-y-5">
                      <li className="flex items-start gap-4 text-sm">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${selectedUserForVetting.isVatVerified ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]'}`} />
                        <div className="flex flex-col gap-0.5">
                          <span className={selectedUserForVetting.isVatVerified ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}>VAT Verification</span>
                          <span className="text-[10px] text-muted-foreground/60 leading-tight">Cross-referenced with national VAT databases</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-4 text-sm">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${selectedUserForVetting.isVetted ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]'}`} />
                        <div className="flex flex-col gap-0.5">
                          <span className={selectedUserForVetting.isVetted ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}>Identity Vetting</span>
                          <span className="text-[10px] text-muted-foreground/60 leading-tight">Official company documentation review</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-4 text-sm opacity-40">
                        <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0 bg-muted" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-muted-foreground">Sanctions Screening</span>
                          <span className="text-[10px] leading-tight">Global compliance database check</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black block mb-1.5">Registration Date</Label>
                    <p className="font-bold text-lg leading-none">
                      {(() => {
                        const date = selectedUserForVetting.createdAt;
                        if (!date) return "N/A";
                        try {
                          if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                          const d = new Date(date);
                          return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                        } catch {
                          return "N/A";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-white/5 border-t border-white/10 p-6 gap-3 flex-row justify-end items-center mt-auto">
            {selectedUserForVetting && !selectedUserForVetting.isVatVerified && (
              <Button variant="outline" className="rounded-xl px-8 h-11 font-bold" onClick={() => handleVerifyVat(selectedUserForVetting.uid)}>
                Verify VAT
              </Button>
            )}
            {selectedUserForVetting && selectedUserForVetting.vettingStatus !== 'approved' && (
              <>
                <Button variant="outline" className="rounded-xl px-8 h-11 font-bold border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleVetCompany(selectedUserForVetting.uid, 'rejected')}>
                  Reject
                </Button>
                <Button variant="outline" className="rounded-xl px-8 h-11 font-bold" onClick={() => handleVetCompany(selectedUserForVetting.uid, 'under_review')}>
                  Under Review
                </Button>
                <Button className="rounded-xl px-8 h-11 font-bold shadow-md shadow-primary/10" onClick={() => handleVetCompany(selectedUserForVetting.uid, 'approved')}>
                  Approve Company
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                className={`glass border-primary/20 min-h-[100px] ${suspensionReason.length > 0 && suspensionReason.length < 10 ? 'border-destructive/50' : ''}`}
              />
              {suspensionReason.length > 0 && suspensionReason.length < 10 && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-widest">Reason must be at least 10 characters</p>
              )}
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
              disabled={suspensionReason.trim().length < 10}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isUserDeleteDialogOpen} onOpenChange={(open) => {
        setIsUserDeleteDialogOpen(open);
        if (!open) setDeleteConfirmationText("");
      }}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete the account for 
                  <span className="font-bold text-foreground"> {userToDelete?.companyName} </span> 
                  and remove their data from our servers.
                </p>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">
                    Type <span className="text-foreground select-none">{userToDelete?.companyName}</span> to confirm
                  </Label>
                  <Input 
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="glass border-destructive/50 focus:ring-destructive/20 text-sm h-10 rounded-xl"
                    placeholder="Type company name exactly..."
                    autoFocus
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => { setUserToDelete(null); setDeleteConfirmationText(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
              onClick={() => userToDelete && handleDeleteUser(userToDelete.uid)}
              disabled={deleteConfirmationText !== userToDelete?.companyName}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ESGCertificateModal 
        isOpen={showESGCertModal}
        onClose={() => setShowESGCertModal(false)}
        user={selectedUserForCert}
        platformLogo={platformSettings.hixLogoUrl}
      />

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Transaction Details</DialogTitle>
            <DialogDescription className="font-mono text-[10px]">ID: {selectedTransaction?.id}</DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Buyer ID</Label>
                  <p className="font-mono text-xs bg-white/5 p-2 rounded-lg border border-white/10">{selectedTransaction.buyerId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Seller ID</Label>
                  <p className="font-mono text-xs bg-white/5 p-2 rounded-lg border border-white/10">{selectedTransaction.sellerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass p-4 rounded-2xl border-primary/10">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Amount</Label>
                  <p className="text-2xl font-black tracking-tighter text-primary">£{selectedTransaction.amount?.toLocaleString()}</p>
                </div>
                <div className="glass p-4 rounded-2xl border-primary/10">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Quantity</Label>
                  <p className="text-2xl font-black tracking-tighter">{selectedTransaction.quantity}</p>
                </div>
                <div className="glass p-4 rounded-2xl border-primary/10">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">CO2 Saved</Label>
                  <p className="text-2xl font-black tracking-tighter text-green-500">{selectedTransaction.co2Savings?.toLocaleString()} kg</p>
                </div>
              </div>

              <Card className="glass border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Associated Listing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTransactionDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : selectedTransactionListing ? (
                    <div className="flex gap-4">
                      {selectedTransactionListing.images?.[0] && (
                        <img 
                          src={selectedTransactionListing.images[0]} 
                          alt={selectedTransactionListing.title}
                          className="h-20 w-20 rounded-xl object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-lg leading-tight mb-1">{selectedTransactionListing.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{selectedTransactionListing.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px] uppercase font-black">{selectedTransactionListing.category}</Badge>
                          <Badge variant="outline" className="text-[9px] uppercase font-black">{selectedTransactionListing.condition}</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Listing information unavailable (may have been deleted).</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${selectedTransaction.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-sm font-bold uppercase tracking-widest">Status: {selectedTransaction.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Processed on {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" className="rounded-xl w-full" onClick={() => setSelectedTransaction(null)}>
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
