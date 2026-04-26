import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, db, onSnapshot, handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { UserProfile, Transaction, Report, AuditLog, Listing, WhitepaperRequest, Chat } from "@/types";
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
  getDoc,
  addDoc, serverTimestamp, setDoc
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
  Headphones,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingCart,
  Zap,
  Recycle,
  CircleDot
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import AdminSupportChat from "@/components/AdminSupportChat";
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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from "recharts";

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
          // Circular frame
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(1);
          doc.circle(32.5, 32.5, 12.5, 'D');
          doc.addImage(img, 'PNG', 22.5, 22.5, 20, 20);
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
      doc.text('This document verifies the sustainable contributions of', 148.5, 75, { align: 'center' });

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
                HIX ADMIN &bull; Platform impact documentation for <strong>{user?.companyName || user?.email}</strong>
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

const ESGBreakdownModal = ({ 
  isOpen, 
  onClose, 
  listing 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  listing: Listing | null;
}) => {
  if (!listing) return null;

  // Calculation Logic
  const co2Points = Math.min(listing.co2Savings * 2, 20); // Max 20
  const reusePoints = (listing.materialReuse || 85) * 0.4; // Max 40
  const logisticsPoints = (listing.logisticsOptimization || 78) * 0.4; // Max 40
  const totalScore = Math.min(Math.round(co2Points + reusePoints + logisticsPoints), 100);

  const breakdownData = [
    { name: 'CO2 Savings', value: listing.co2Savings, max: 10, unit: 'kg/unit', points: co2Points, weight: '20%', icon: Leaf, desc: 'Direct carbon sequestration or emissions avoided through asset lifecycle extension.' },
    { name: 'Material Reuse', value: listing.materialReuse || 85, max: 100, unit: '%', points: reusePoints, weight: '40%', icon: RefreshCw, desc: 'Percentage of industrial materials recovered and returned to production cycles.' },
    { name: 'Logistics Opt.', value: listing.logisticsOptimization || 78, max: 100, unit: '%', points: logisticsPoints, weight: '40%', icon: Car, desc: 'Optimization of transport routes and load factors to minimize supply chain impact.' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] glass border-white/20 p-0 overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl bg-slate-950/40">
        <div className="p-8 pb-10 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tight text-white uppercase italic">ESG Impact Breakdown</DialogTitle>
              <DialogDescription className="text-base text-white/50 font-medium">
                Proprietary ESG Calculation Engine &bull; Asset Verification
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all">
            <X className="h-7 w-7" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Asset Info */}
          <div className="flex items-end justify-between border-b border-white/5 pb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Analyzing Asset</p>
              <h3 className="text-2xl font-black text-white leading-tight">{listing.title}</h3>
              <p className="text-sm text-white/40 mt-1 font-medium">{listing.category} &bull; ID: {listing.id.slice(0, 12)}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-primary tracking-tighter tabular-nums leading-none mb-2">{totalScore}<span className="text-xl">.0</span></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total ESG Grade</p>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="space-y-4">
            {breakdownData.map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all duration-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-white/70 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight uppercase tabular-nums">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.weight} Weighting</span>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Verified HiX-AI</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white tabular-nums">{item.value}{item.unit}</div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Raw Input Value</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.points / (idx === 0 ? 20 : 40)) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.2 }}
                      className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-white/40">Point Contribution</span>
                    <span className="text-primary">{item.points.toFixed(1)} / {idx === 0 ? '20' : '40'}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-medium pt-2 italic">
                    "{item.desc}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Logic Summary */}
          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="h-24 w-24" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Calculation Policy</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              ESG scores on HiX are calculated using a weighted vector analysis. CO2 savings are mapped to a logarithmic scale, while Circularity (Material Reuse) and Logistics Efficiency are linearly weighted based on verified industrial standards. All data is subject to post-transaction auditing through our ledger system.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 shrink-0 flex justify-end">
          <Button onClick={onClose} className="rounded-2xl px-10 h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.2em] text-xs transition-transform active:scale-95 shadow-xl">
            Close Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [whitepaperRequests, setWhitepaperRequests] = useState<WhitepaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportChats, setSupportChats] = useState<Chat[]>([]);
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
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  const generatePlatformDocs = async (recipient: { name: string; email: string; company: string }) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Logo
      if (platformSettings.hixLogoUrl) {
        try {
          doc.addImage(platformSettings.hixLogoUrl, 'PNG', 170, 15, 25, 25);
        } catch (e) {
          console.error("Could not add logo to PDF:", e);
        }
      }

      // Title Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('HiX PLATFORM', 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text('Platform Documentation & Institutional Overview', 20, 38);

      // Recipient Info
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.line(20, 45, 190, 45);
      
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PREPARED FOR:', 20, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${recipient.name}`, 55, 55);
      
      doc.setFont('helvetica', 'bold');
      doc.text('ORGANIZATION:', 20, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`${recipient.company}`, 55, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('DATE:', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`${new Date().toLocaleDateString()}`, 55, 65);

      // Section 1: Executive Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Executive Summary', 20, 80);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const summary = `HiX is an enterprise-grade industrial resource management platform designed to facilitate the circular economy within the industrial sector. Our platform connects industrial entities to optimize the reuse of raw materials, machinery, and industrial components, significantly reducing waste and carbon footprints through digital transformation and strategic asset matching.`;
      doc.text(doc.splitTextToSize(summary, 170), 20, 88);

      // Section 2: Core Capabilities
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Core Capabilities', 20, 110);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const capabilities = [
        "Real-time Asset Tracking: Comprehensive inventory management for surplus industrial materials.",
        "Verified Vetting: Multi-stage institutional verification for all platform participants.",
        "ESG Impact Analytics: Proprietary algorithms to quantify CO2 savings and circularity rates.",
        "Direct B2B Logic: Secure transaction flow with commission structures for sustainable growth."
      ];
      
      let yPos = 118;
      capabilities.forEach(cap => {
        doc.text("•", 22, yPos);
        doc.text(cap, 28, yPos);
        yPos += 7;
      });

      // Section 3: Technical Compliance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Technical Compliance', 20, 155);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const technical = `The HiX platform infrastructure utilizes a zero-trust architecture. All document transfers, transactional data, and user profile information are protected by industry-standard encryption. Our vetting process ensures all VAT and corporate registration numbers are verified through official channels before platform access is granted, maintaining the integrity of our B2B marketplace.`;
      doc.text(doc.splitTextToSize(technical, 170), 20, 163);

      // Contact
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Contact Information:', 20, 200);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Institutional Relations: institutions@hix-platform.com', 20, 208);
      doc.text('Technical Support: support@hix-platform.com', 20, 215);

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 275, 190, 275);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('HiX Platform | Sustainable Industrial Solutions | Confidential Institutional Document', 105, 282, { align: 'center' });
      doc.text(`Page 1 of 1`, 190, 282, { align: 'right' });

      doc.save(`HiX_Platform_Documentation_${recipient.company.replace(/\s+/g, '_')}.pdf`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const listingStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    listings.forEach(l => {
      const cat = l.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [listings]);

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const dailyActivity = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "MMM dd");
      
      const dayUsers = users.filter(u => {
        const created = u.createdAt?.toDate ? u.createdAt.toDate() : (u.createdAt ? new Date(u.createdAt) : new Date(0));
        return format(created, "MMM dd") === dateStr;
      }).length;
      
      const dayDeals = transactions.filter(t => {
        const created = t.createdAt?.toDate ? t.createdAt.toDate() : (t.createdAt ? new Date(t.createdAt) : new Date(0));
        return format(created, "MMM dd") === dateStr;
      }).length;

      data.push({ name: dateStr, Users: dayUsers, Deals: dayDeals });
    }
    return data;
  }, [users, transactions]);
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
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
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
  const [selectedListingForEsg, setSelectedListingForEsg] = useState<Listing | null>(null);
  const [showEsgBreakdownModal, setShowEsgBreakdownModal] = useState(false);
  const [editedVatNumber, setEditedVatNumber] = useState("");
  const [isUpdatingVat, setIsUpdatingVat] = useState(false);
  const [selectedSupportChat, setSelectedSupportChat] = useState<Chat | null>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState("");
  const [supportFilter, setSupportFilter] = useState<"all" | "ai" | "agent">("all");
  const [supportStatusFilter, setSupportStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [supportDateFilter, setSupportDateFilter] = useState<"all" | "today" | "week">("all");

  const filteredSupportChats = useMemo(() => {
    return supportChats.filter(chat => {
      const userId = Object.keys(chat.participantNames || {}).find(id => id !== 'HIX_SUPPORT');
      const userName = (chat.participantNames?.[userId || ""] || "").toLowerCase();
      const lastMsg = (chat.lastMessage || "").toLowerCase();
      const matchesSearch = userName.includes(supportSearchQuery.toLowerCase()) || lastMsg.includes(supportSearchQuery.toLowerCase());
      
      const matchesFilter = supportFilter === 'all' || 
                            (supportFilter === 'ai' && chat.supportMode === 'ai') ||
                            (supportFilter === 'agent' && chat.supportMode === 'agent');

      const matchesStatus = supportStatusFilter === 'all' ||
                            (supportStatusFilter === 'open' && chat.status !== 'closed') ||
                            (supportStatusFilter === 'closed' && chat.status === 'closed');
      
      let matchesDate = true;
      if (supportDateFilter !== 'all') {
        const chatDate = chat.updatedAt?.toDate ? chat.updatedAt.toDate() : new Date();
        const now = new Date();
        if (supportDateFilter === 'today') {
           matchesDate = chatDate.toDateString() === now.toDateString();
        } else if (supportDateFilter === 'week') {
           const sevenDaysAgo = new Date();
           sevenDaysAgo.setDate(now.getDate() - 7);
           matchesDate = chatDate >= sevenDaysAgo;
        }
      }
      
      return matchesSearch && matchesFilter && matchesStatus && matchesDate;
    });
  }, [supportChats, supportSearchQuery, supportFilter, supportStatusFilter, supportDateFilter]);

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
  const [errorPage, setErrorPage] = useState(1);
  const [whitepaperPage, setWhitepaperPage] = useState(1);
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

    const errorPath = "error_logs";
    const unsubscribeErrorLogs = onSnapshot(query(collection(db, errorPath), orderBy("timestamp", "desc"), limit(100)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setErrorLogs(data);
    }, (error) => {
      console.error("Error logs error:", error);
    });

    const whitepaperPath = "whitepaper_requests";
    const unsubscribeWhitepaper = onSnapshot(query(collection(db, whitepaperPath), orderBy("createdAt", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WhitepaperRequest[];
      setWhitepaperRequests(data);
    }, (error) => {
      console.error("Whitepaper requests error:", error);
    });

    const supportChatsQuery = query(collection(db, "chats"), where("isSupport", "==", true), orderBy("updatedAt", "desc"));
    const unsubscribeSupport = onSnapshot(supportChatsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[];
      setSupportChats(data);
    }, (error) => {
      console.error("Support chats error:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
      unsubscribeTrans();
      unsubscribeListings();
      unsubscribeAudit();
      unsubscribeErrorLogs();
      unsubscribeWhitepaper();
      unsubscribeSupport();
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

  const handleUploadVettingDoc = async (userId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const storageRef = ref(storage, `vetting_docs/${userId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      const newDoc = {
        name: file.name,
        url: url,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date()
      };

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as UserProfile;
      const currentDocs = userData.verificationDocs || [];
      
      const updatedDocs = [...currentDocs, newDoc];

      await updateDoc(userRef, { 
        verificationDocs: updatedDocs,
        updatedAt: serverTimestamp()
      });

      await createAuditLog("UPLOAD_VETTING_DOC", `Uploaded verification document: ${file.name}`, userId, 'user', userData.companyName, userData.email);

      toast.success("Document uploaded successfully");
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, verificationDocs: updatedDocs } : u));
      if (selectedUserForVetting?.uid === userId) {
        setSelectedUserForVetting(prev => prev ? { ...prev, verificationDocs: updatedDocs } : null);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleRemoveVettingDoc = async (userId: string, docUrl: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as UserProfile;
      const currentDocs = userData.verificationDocs || [];
      
      const removedDoc = currentDocs.find(d => d.url === docUrl);
      const updatedDocs = currentDocs.filter(d => d.url !== docUrl);

      await updateDoc(userRef, { 
        verificationDocs: updatedDocs,
        updatedAt: serverTimestamp()
      });

      await createAuditLog("REMOVE_VETTING_DOC", `Removed verification document: ${removedDoc?.name || 'Unknown'}`, userId, 'user', userData.companyName, userData.email);

      toast.success("Document removed");
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, verificationDocs: updatedDocs } : u));
      if (selectedUserForVetting?.uid === userId) {
        setSelectedUserForVetting(prev => prev ? { ...prev, verificationDocs: updatedDocs } : null);
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document");
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
          materialReuse: 82,
          logisticsOptimization: 75,
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
          materialReuse: 95,
          logisticsOptimization: 88,
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
          materialReuse: 78,
          logisticsOptimization: 82,
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row gap-8 relative">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-4">
              {[
                {
                  title: "Oversight",
                  items: [
                    { value: "dashboard", label: "Overview", icon: BarChart3, show: isViewer },
                    { value: "vetting", label: "Vetting Queue", icon: ShieldCheck, badge: users.filter(u => !u.isVetted || !u.isVatVerified).length, badgeColor: "bg-amber-500", show: isEditor },
                  ]
                },
                {
                  title: "Operations",
                  items: [
                    { value: "users", label: "User Directory", icon: Users, show: isViewer },
                    { value: "transactions", label: "Transactions", icon: DollarSign, show: isViewer },
                    { value: "requests", label: "Information Requests", icon: FileText, badge: whitepaperRequests.filter(r => r.status === 'pending').length, badgeColor: "bg-blue-500", show: isEditor },
                    { value: "bulk", label: "Data Integration", icon: Upload, show: isEditor },
                  ]
                },
                {
                  title: "Communication",
                  items: [
                    { value: "support", label: "Live Support", icon: Headphones, badge: supportChats.filter(c => c.supportMode === 'agent').length, badgeColor: "bg-red-500", show: isEditor },
                    { value: "reports", label: "User Reports", icon: AlertTriangle, badge: reports.filter(r => r.status === 'pending').length, badgeColor: "bg-destructive", show: isEditor },
                  ]
                },
                {
                  title: "Infrastructure",
                  items: [
                    { value: "esg", label: "ESG Analysis", icon: Leaf, show: isViewer },
                    { value: "audit", label: "Audit Trails", icon: History, show: isViewer },
                    { value: "errors", label: "System Health", icon: Activity, show: isSuperAdmin, badge: errorLogs.length, badgeColor: "bg-destructive" },
                  ]
                },
                {
                  title: "Security & Config",
                  items: [
                    { value: "admins", label: "Access Control", icon: UserCog, show: isAdmin },
                    { value: "settings", label: "Global Settings", icon: Database, show: isAdmin },
                    { value: "system", label: "Maintenance", icon: RefreshCw, show: isSuperAdmin },
                  ]
                }
              ].map((category, idx) => {
                const visibleItems = category.items.filter(i => i.show);
                if (visibleItems.length === 0) return null;
                
                return (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-4">
                      {category.title}
                    </h4>
                    <div className="space-y-1">
                      {visibleItems.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setActiveTab(item.value)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group relative
                            ${activeTab === item.value 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                              : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-4 w-4 ${activeTab === item.value ? "text-white" : "group-hover:text-primary transition-colors"}`} />
                            <span className="text-xs font-bold tracking-tight">
                              {item.label}
                            </span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full ${activeTab === item.value ? "bg-white text-primary" : item.badgeColor + " text-white"} text-[9px] font-black min-w-[18px] flex items-center justify-center`}>
                              {item.badge}
                            </span>
                          )}
                          {activeTab === item.value && (
                            <motion.div 
                              layoutId="activeTabIndicator"
                              className="absolute -left-1 w-1 h-6 bg-white rounded-full lg:hidden"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-8 px-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="w-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white h-12 gap-3 font-bold uppercase tracking-widest text-[10px]"
                >
                  <Home className="h-4 w-4" />
                  Exit To Platform
                </Button>
              </div>
            </aside>

            {/* Mobile Navigation - Compact Horizontal Scroll */}
            <div className="lg:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-white/10 -mx-4 px-4 py-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Admin Control</h3>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[
                  { value: "dashboard", icon: BarChart3, show: isViewer },
                  { value: "users", icon: Users, show: isViewer },
                  { value: "transactions", icon: DollarSign, show: isViewer },
                  { value: "vetting", icon: ShieldCheck, badge: users.filter(u => !u.isVetted || !u.isVatVerified).length, show: isEditor },
                  { value: "support", icon: Headphones, badge: supportChats.filter(c => c.supportMode === 'agent').length, show: isEditor },
                  { value: "reports", icon: AlertTriangle, badge: reports.filter(r => r.status === 'pending').length, show: isEditor },
                  { value: "requests", icon: FileText, show: isEditor },
                  { value: "bulk", icon: Upload, show: isEditor },
                  { value: "esg", icon: Leaf, show: isViewer },
                  { value: "audit", icon: History, show: isViewer },
                  { value: "errors", icon: Activity, show: isSuperAdmin },
                ].filter(i => i.show).map((item) => (
                  <button
                    key={`mob-${item.value}`}
                    onClick={() => setActiveTab(item.value)}
                    className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-all relative
                      ${activeTab === item.value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-white/5 text-muted-foreground"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Growth & Performance
                  </CardTitle>
                  <CardDescription>User and transaction activity over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={dailyActivity}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="Users" stroke="#22c55e" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Deals" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDeals)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription>Asset listing distribution across industrial sectors.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={listingStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {listingStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">{listings.length}</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Assets</span>
                  </div>
                </CardContent>
              </Card>
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
                                {u.lastLogin && u.lastLogin.seconds ? (
                                  new Date(u.lastLogin.seconds * 1000).toLocaleString()
                                ) : (
                                  "Never"
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                {u.totalCo2Saved?.toLocaleString() || 0} kg
                              </TableCell>
                              <TableCell className="text-right pr-6 space-x-1">                                  <div className="flex items-center justify-end gap-3 px-2">
                                  {canManageVetting && !u.isVatVerified && (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold group px-3" onClick={() => handleVerifyVat(u.uid)}>
                                      <FileText className="h-3.5 w-3.5 transition-all group-hover:mr-2 shrink-0" />
                                      <span className="max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">VAT</span>
                                    </Button>
                                  )}
                                  {canManageVetting && u.vettingStatus !== 'approved' && (
                                    <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold group px-3 shadow-sm shadow-primary/10" onClick={() => setSelectedUserForVetting(u)}>
                                      <ShieldCheck className="h-3.5 w-3.5 transition-all group-hover:mr-2 shrink-0" />
                                      <span className="max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">Vet</span>
                                    </Button>
                                  )}
                                  
                                  {canManageUsers && (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 group transition-all hover:border-amber-500/30">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 group-hover:mr-1 transition-all duration-300 overflow-hidden whitespace-nowrap">Suspend</span>
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
                                    className="h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10 group px-3" 
                                    onClick={() => navigate(`/admin/transactions?uid=${u.uid}&type=buy`)}
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">BUY</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10 group px-3" 
                                    onClick={() => navigate(`/admin/transactions?uid=${u.uid}&type=sell`)}
                                  >
                                    <DollarSign className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">SELL</span>
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
                              <TableCell className="font-bold">£{t.amount?.toLocaleString() || '0'}</TableCell>
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

        {isEditor && (
          <TabsContent value="requests" className="mt-0 outline-none">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Whitepaper Requests</CardTitle>
                      <CardDescription>Review and track institutions requesting platform documentation.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="pl-6">Contact Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Interest Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {whitepaperRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 opacity-20" />
                                <p>No whitepaper requests found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          whitepaperRequests.slice((whitepaperPage - 1) * itemsPerPage, whitepaperPage * itemsPerPage).map((req) => (
                            <TableRow key={req.id} className="hover:bg-primary/5 transition-colors">
                              <TableCell className="pl-6 font-bold">{req.name}</TableCell>
                              <TableCell className="text-xs">{req.email}</TableCell>
                              <TableCell className="text-xs">{req.company} <span className="text-muted-foreground opacity-60">({req.jobTitle || 'N/A'})</span></TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{req.interestReason || '-'}</TableCell>
                              <TableCell>
                                <Badge className={`rounded-md ${req.status === 'sent' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {req.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[10px] text-muted-foreground">
                                {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                {req.status === 'pending' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="h-8 rounded-lg text-[10px] uppercase font-bold border-primary/30 text-primary hover:bg-primary/5"
                                      onClick={async () => {
                                        const success = await generatePlatformDocs({
                                          name: req.name,
                                          email: req.email,
                                          company: req.company
                                        });
                                        if (success) {
                                          try {
                                            await updateDoc(doc(db, "whitepaper_requests", req.id), { status: 'sent' });
                                            toast.success("Documentation generated and status updated!");
                                          } catch (err) {
                                            handleFirestoreError(err, OperationType.UPDATE, `whitepaper_requests/${req.id}`);
                                          }
                                        } else {
                                          toast.error("Failed to generate documentation");
                                        }
                                      }}
                                    >
                                      <Upload className="h-3 w-3 mr-1" />
                                      Send Documentation
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="h-8 rounded-lg text-[10px] uppercase font-bold"
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "whitepaper_requests", req.id), { status: 'sent' });
                                          toast.success("Marked as document sent!");
                                        } catch (err) {
                                          handleFirestoreError(err, OperationType.UPDATE, `whitepaper_requests/${req.id}`);
                                        }
                                      }}
                                    >
                                      Mark as Sent
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={whitepaperPage}
                    totalItems={whitepaperRequests.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setWhitepaperPage}
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
                              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary group px-3">
                                <ShieldCheck className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">Manage Permissions</span>
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
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg group" onClick={() => setSelectedReport(r)}>
                                        <Eye className="h-4 w-4 transition-all group-hover:scale-110" />
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
                                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold group px-3" onClick={() => handleResolveReport(r.id)}>
                                        <CheckCircle2 className="h-3.5 w-3.5 transition-all group-hover:mr-2 text-green-500" />
                                        <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">Resolve</span>
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

        {isEditor && (
          <TabsContent value="support" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {selectedSupportChat ? (
                <div className="max-w-4xl mx-auto">
                  <AdminSupportChat chat={selectedSupportChat} onBack={() => setSelectedSupportChat(null)} />
                </div>
              ) : (
                <Card className="glass border-primary/20">
                  <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Headphones className="h-5 w-5 text-primary" />
                          Live Support Queue
                        </CardTitle>
                        <CardDescription>Monitor AI interactions and step in when human agents are requested.</CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Search user or message..."
                            className="pl-9 h-9 w-64 rounded-xl glass border-white/10 text-xs font-mono"
                            value={supportSearchQuery}
                            onChange={(e) => setSupportSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportFilter('all')}
                          >
                            All
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportFilter === 'ai' ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted-foreground'}`}
                            onClick={() => setSupportFilter('ai')}
                          >
                            AI
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportFilter === 'agent' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground'}`}
                            onClick={() => setSupportFilter('agent')}
                          >
                            Agent
                          </Button>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportStatusFilter === 'open' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportStatusFilter('open')}
                          >
                            Open
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportStatusFilter === 'closed' ? 'bg-zinc-500/20 text-zinc-500' : 'text-muted-foreground'}`}
                            onClick={() => setSupportStatusFilter('closed')}
                          >
                            Closed
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportStatusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportStatusFilter('all')}
                          >
                            All
                          </Button>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportDateFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportDateFilter('all')}
                          >
                            All Time
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportDateFilter === 'today' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportDateFilter('today')}
                          >
                            Today
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest ${supportDateFilter === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setSupportDateFilter('week')}
                          >
                            7 Days
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="text-[10px] uppercase font-bold tracking-widest pl-8">Last Activity</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-widest">User / Company</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-widest">Last Message</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-widest">Mode</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right pr-8">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSupportChats.length > 0 ? (
                            filteredSupportChats.map((chat) => {
                              const userId = Object.keys(chat.participantNames || {}).find(id => id !== 'HIX_SUPPORT');
                              const userName = chat.participantNames?.[userId || ""] || "Unknown User";
                              const isAgentNeeded = chat.supportMode === 'agent';

                              return (
                                <TableRow 
                                  key={chat.id} 
                                  className={`group transition-all hover:bg-white/5 cursor-pointer ${isAgentNeeded ? "bg-red-500/5" : ""}`}
                                  onClick={() => setSelectedSupportChat(chat)}
                                >
                                  <TableCell className="pl-8 text-[10px] font-mono opacity-60">
                                    {chat.updatedAt?.toDate ? format(chat.updatedAt.toDate(), "dd/MM HH:mm") : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarFallback className="text-[10px] font-bold">
                                          {userName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{userName}</p>
                                        <p className="text-[9px] font-mono text-muted-foreground opacity-60 truncate">{userId}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-xs text-muted-foreground truncate max-w-xs italic leading-tight">
                                      "{chat.lastMessage || "No messages yet"}"
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${
                                      isAgentNeeded ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                                    }`}>
                                      {chat.supportMode === 'ai' ? "AI Assistant" : "Agent Requested"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                    <Button variant="ghost" size="sm" className="rounded-lg font-black text-[10px] uppercase tracking-widest h-8 px-4 transition-all opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary">
                                      Join Chat
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-sm">
                                No active support chats found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3 pr-1">Type</span>
                        <Select value={vettingTypeFilter} onValueChange={setVettingTypeFilter}>
                          <SelectTrigger className="w-full sm:w-[150px] border-none shadow-none focus:ring-0 h-9 bg-transparent">
                            <SelectValue placeholder="All Pending" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="all">All Pending</SelectItem>
                            <SelectItem value="vat">VAT Pending</SelectItem>
                            <SelectItem value="identity">Identity Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3 pr-1">Status</span>
                        <Select value={vettingStatusFilter} onValueChange={setVettingStatusFilter}>
                          <SelectTrigger className="w-full sm:w-[150px] border-none shadow-none focus:ring-0 h-9 bg-transparent">
                            <SelectValue placeholder="All Statuses" />
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

                      <div className="relative w-full sm:w-48 group">
                         <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                         <Input 
                           placeholder="Search..." 
                           className="pl-9 h-11 rounded-2xl glass border-primary/20 text-xs"
                           value={vettingSearch}
                           onChange={(e) => setVettingSearch(e.target.value)}
                         />
                      </div>
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
                              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider group px-3" onClick={() => setSelectedUserForVetting(u)}>
                                <Eye className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">Details</span>
                              </Button>
                              {!u.isVatVerified && (
                                <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] uppercase font-bold group px-3" onClick={() => handleVerifyVat(u.uid)}>
                                  <FileText className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">VAT</span>
                                </Button>
                              )}
                              {u.vettingStatus !== 'approved' && (
                                <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold group px-3 shadow-sm shadow-primary/10" onClick={() => handleVetCompany(u.uid, 'approved')}>
                                  <CheckCircle2 className="h-3.5 w-3.5 transition-all group-hover:mr-2" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">Approve</span>
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

                  <Card className="glass border-primary/10 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Asset Sustainability Analysis</CardTitle>
                        <CardDescription>Detailed ESG impact breakdown for industrial listings.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-2xl border border-white/5 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/10">
                              <TableHead className="font-bold text-xs uppercase tracking-widest">Asset</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-widest">Seller</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-widest text-center">ESG Score</TableHead>
                              <TableHead className="text-right font-bold text-xs uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {listings.slice(0, 5).map((listing) => {
                              // ESG Score logic: (CO2/5 + Reuse*0.4 + Logistics*0.4) normalized
                              const co2Weight = Math.min(listing.co2Savings * 2, 20); // Max 20 points
                              const reuseWeight = (listing.materialReuse || 85) * 0.4; // Max 40 points
                              const logisticsWeight = (listing.logisticsOptimization || 78) * 0.4; // Max 40 points
                              const totalScore = Math.min(Math.round(co2Weight + reuseWeight + logisticsWeight), 100);

                              return (
                                <TableRow key={`esg-listing-${listing.id}`} className="hover:bg-white/5 border-white/5 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Package className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm truncate max-w-[200px]">{listing.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{listing.category}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs font-medium">
                                    {listing.sellerName}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${totalScore > 80 ? 'bg-primary' : totalScore > 60 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                          style={{ width: `${totalScore}%` }} 
                                        />
                                      </div>
                                      <span className="text-xs font-bold">{totalScore}/100</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="rounded-lg h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 transition-all font-black"
                                      onClick={() => {
                                        setSelectedListingForEsg(listing);
                                        setShowEsgBreakdownModal(true);
                                      }}
                                    >
                                      <BarChart3 className="h-3 w-3 mr-2" />
                                      View Breakdown
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
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

        {isSuperAdmin && (
          <TabsContent value="errors" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="glass border-destructive/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      System Error Registry
                    </CardTitle>
                    <CardDescription>Real-time monitoring of application failures and Firestore security rejections.</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/5"
                    onClick={async () => {
                      if (confirm("Clear all error logs?")) {
                        for (const log of errorLogs) {
                          await deleteDoc(doc(db, "error_logs", log.id));
                        }
                        toast.success("Error logs cleared");
                      }
                    }}
                  >
                    Clear All Logs
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-bold tracking-widest pl-8 w-40">Timestamp</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-widest w-32">Type / Op</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-widest">Error Description</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-widest">User / Auth</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-widest w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errorLogs.slice((errorPage - 1) * itemsPerPage, errorPage * itemsPerPage).map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/5 transition-colors group">
                            <TableCell className="pl-8 text-[10px] font-mono opacity-60">
                              {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd/MM HH:mm:ss') : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${
                                log.type === 'REACT_ERROR_BOUNDARY' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 'border-destructive/20 text-destructive bg-destructive/5'
                              }`}>
                                {log.operationType || log.type || "ERR"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <p className="text-xs font-bold text-foreground truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 relative">
                                  {log.error}
                                </p>
                                <p className="text-[9px] font-mono text-muted-foreground mt-1 truncate">
                                  Path: {log.path || log.url || "/"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-[10px] font-medium">
                                {log.authInfo?.email || "Anonymous"}
                                <div className="text-[9px] opacity-60 font-mono italic">
                                  {log.authInfo?.userId?.slice(0, 8) || "NO_UID"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Log Entry?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently remove this error report from the registry.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                      onClick={() => deleteDoc(doc(db, "error_logs", log.id))}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {errorLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs">
                              No system errors recorded. System stability optimal.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination 
                    currentPage={errorPage}
                    totalItems={errorLogs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setErrorPage}
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
                          <span className="text-[10px] text-muted-foreground/60 leading-tight">Company documentation review</span>
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

                {/* Document Verification Section */}
                <div className="md:col-span-2 border-t border-white/5 pt-8 mt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Company Verification Documents</h4>
                        <p className="text-xs text-muted-foreground font-medium">Registration certificates, identity docs, tax IDs</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5 group" asChild>
                      <label className="cursor-pointer">
                        {isUploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />}
                        Upload Document
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleUploadVettingDoc(selectedUserForVetting.uid, e)} 
                          disabled={isUploadingDoc} 
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                    </Button>
                  </div>

                  {selectedUserForVetting.verificationDocs && selectedUserForVetting.verificationDocs.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                       {selectedUserForVetting.verificationDocs.map((doc, idx) => (
                         <div key={`doc-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/doc">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                               <FileText className="h-4 w-4 text-muted-foreground" />
                             </div>
                             <div className="overflow-hidden">
                               <p className="text-xs font-bold truncate pr-2">{doc.name}</p>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                 {doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toLocaleDateString() : new Date(doc.uploadedAt).toLocaleDateString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                             <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20" asChild>
                               <a href={doc.url} target="_blank" rel="noreferrer">
                                 <Eye className="h-3.5 w-3.5" />
                               </a>
                             </Button>
                             <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/20"
                              onClick={() => handleRemoveVettingDoc(selectedUserForVetting.uid, doc.url)}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                       <FileText className="h-10 w-10 mb-4" />
                       <p className="text-sm font-medium">No verification documents uploaded yet</p>
                       <p className="text-xs">Upload registration certificates or identity proof to verify this company.</p>
                    </div>
                  )}
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

      <ESGBreakdownModal
        isOpen={showEsgBreakdownModal}
        onClose={() => setShowEsgBreakdownModal(false)}
        listing={selectedListingForEsg}
      />

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="glass max-w-2xl border-primary/20 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Transaction Details</DialogTitle>
                <DialogDescription className="font-mono text-[10px]">Reference ID: {selectedTransaction?.id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-2xl border-white/10 space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Entities Involved</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Buyer</Label>
                      <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                        <Avatar className="h-6 w-6 border border-white/10">
                          <AvatarFallback className="text-[8px]">B</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate">
                            {users.find(u => u.uid === selectedTransaction.buyerId)?.companyName || 'Unknown Buyer'}
                          </p>
                          <p className="text-[8px] font-mono text-muted-foreground truncate">{selectedTransaction.buyerId}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Seller</Label>
                      <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                        <Avatar className="h-6 w-6 border border-white/10">
                          <AvatarFallback className="text-[8px]">S</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate">
                            {users.find(u => u.uid === selectedTransaction.sellerId)?.companyName || 'Unknown Seller'}
                          </p>
                          <p className="text-[8px] font-mono text-muted-foreground truncate">{selectedTransaction.sellerId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-2xl border-white/10 space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Financial Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Subtotal ({selectedTransaction.quantity} items)</span>
                      <span className="font-bold">£{selectedTransaction.amount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">Buyer Commission</span>
                      <span className="text-destructive font-medium">+£{selectedTransaction.buyerCommission?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">Seller Commission (Deducted)</span>
                      <span className="text-amber-500 font-medium">-£{selectedTransaction.sellerCommission?.toLocaleString() || 0}</span>
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest">Total Value</span>
                      <span className="text-lg font-black text-primary">£{(selectedTransaction.amount + (selectedTransaction.buyerCommission || 0))?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-2xl border-white/10">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-primary mb-3">Carbon Offset</h4>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-green-500 tracking-tighter">
                        {selectedTransaction.co2Savings?.toLocaleString() || selectedTransaction.co2Saved?.toLocaleString() || 0} kg
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">CO2 Avoided</p>
                    </div>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl border-white/10">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500 mb-3">Resources</h4>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Recycle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-500 tracking-tighter">
                        {selectedTransaction.resourceSavings?.toLocaleString() || 'N/A'} kg
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Materials Saved</p>
                    </div>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl border-white/10">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-purple-500 mb-3">Circularity</h4>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <CircleDot className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-purple-500 tracking-tighter">
                        {selectedTransaction.circularityRate !== undefined ? `${selectedTransaction.circularityRate}%` : 'N/A'}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Reuse Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass p-4 rounded-2xl border-white/10">
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-primary mb-3">Escrow Status</h4>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase font-black">
                      {selectedTransaction.escrowStatus?.replace('_', ' ') || 'Secured'}
                    </Badge>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Platform Protection</p>
                  </div>
                </div>
              </div>

              {/* Logistics & Fulfillment */}
              {(selectedTransaction.shippingMethod || selectedTransaction.trackingNumber) && (
                <div className="glass p-4 rounded-2xl border-white/10 space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Logistics & Fulfillment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Carrier / Method</Label>
                      <p className="text-xs font-bold flex items-center gap-2">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        {selectedTransaction.carrier ? `${selectedTransaction.carrier} (${selectedTransaction.shippingMethod})` : (selectedTransaction.shippingMethod || 'Direct Collection')}
                      </p>
                    </div>
                    {selectedTransaction.trackingNumber && (
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Tracking Number</Label>
                        <p className="text-[10px] font-mono bg-white/5 p-1 rounded-md border border-white/5 font-bold">
                          {selectedTransaction.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Card className="glass border-primary/10 overflow-hidden">
                <CardHeader className="pb-2 bg-white/5 border-b border-white/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                    <Package className="h-4 w-4" />
                    Associated Technical Asset
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {loadingTransactionDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : selectedTransactionListing ? (
                    <div className="flex gap-4">
                      {selectedTransactionListing.images?.[0] && (
                        <div className="relative group shrink-0">
                          <img 
                            src={selectedTransactionListing.images[0]} 
                            alt={selectedTransactionListing.title}
                            className="h-20 w-20 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm tracking-tight leading-tight mb-1 truncate">{selectedTransactionListing.title}</h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 italic mb-2">"{selectedTransactionListing.description}"</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-black bg-white/5">{selectedTransactionListing.category}</Badge>
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-black bg-white/5">{selectedTransactionListing.condition}</Badge>
                          {selectedTransactionListing.year && (
                             <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-black bg-white/5">YOM: {selectedTransactionListing.year}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                       <AlertTriangle className="h-6 w-6 text-amber-500/50 mb-2" />
                       <p className="text-xs text-muted-foreground italic">Listing information unavailable or asset has been archived.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full shadow-[0_0_8px] ${
                    selectedTransaction.status === 'completed' ? 'bg-green-500 shadow-green-500/40' : 
                    selectedTransaction.status === 'failed' ? 'bg-destructive shadow-destructive/40' :
                    'bg-amber-500 shadow-amber-500/40'
                  }`} />
                  <span className="text-xs font-black uppercase tracking-widest">Global Status: {selectedTransaction.status}</span>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Opened {selectedTransaction.createdAt ? (
                      selectedTransaction.createdAt.seconds 
                        ? new Date(selectedTransaction.createdAt.seconds * 1000).toLocaleString()
                        : new Date(selectedTransaction.createdAt).toLocaleString()
                    ) : 'N/A'}
                  </p>
                  {selectedTransaction.updatedAt && (
                    <p className="text-[9px] text-muted-foreground italic">
                      Last modified {selectedTransaction.updatedAt.seconds 
                        ? new Date(selectedTransaction.updatedAt.seconds * 1000).toLocaleString()
                        : new Date(selectedTransaction.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t border-white/5 pt-4">
            <div className="flex gap-2 w-full">
               {selectedTransaction?.invoiceUrl && (
                  <Button variant="outline" className="rounded-xl flex-1 h-10 text-[10px] font-bold uppercase tracking-widest border-primary/20" asChild>
                    <a href={selectedTransaction.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3.5 w-3.5 mr-2" />
                      View Invoice
                    </a>
                  </Button>
               )}
               <Button className="rounded-xl flex-1 h-10 font-black uppercase tracking-widest text-[10px]" onClick={() => setSelectedTransaction(null)}>
                 Close Investigation
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
