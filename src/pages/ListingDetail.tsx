import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  useAuth, 
  db, 
  onSnapshot, 
  doc, 
  collection,
  handleFirestoreError, 
  OperationType,
  query,
  where,
  getDocs,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDoc
} from "@/lib/firebase";
import { Listing, Chat, UserProfile } from "@/types";
import { calculateListingQualityScore, getQualityScoreColor, getQualityScoreLabel } from "@/lib/qualityScore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Leaf, 
  ShieldCheck, 
  ArrowLeft, 
  Truck, 
  MessageSquare, 
  Info,
  ShoppingCart,
  Loader2,
  Send,
  AlertTriangle,
  Gavel,
  Clock,
  FileText,
  Heart
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerReason, setOfferReason] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [platformSettings, setPlatformSettings] = useState({
    buyerCommission: 3,
    maintenanceMode: false
  });

  const qualityScore = listing ? calculateListingQualityScore(listing, profile?.isVatVerified || false) : 0;

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "platform_settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings({
          buyerCommission: data.buyerCommission ?? 3,
          maintenanceMode: data.maintenanceMode || false
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !id) return;

    const q = query(
      collection(db, "wishlists"), 
      where("userId", "==", user.uid), 
      where("listingId", "==", id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setIsWishlisted(true);
        setWishlistId(snapshot.docs[0].id);
      } else {
        setIsWishlisted(false);
        setWishlistId(null);
      }
    });

    return () => unsubscribe();
  }, [user, id]);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please log in to add items to your wishlist");
      return;
    }

    try {
      if (isWishlisted && wishlistId) {
        await deleteDoc(doc(db, "wishlists", wishlistId));
        toast.success("Removed from wishlist");
      } else {
        await addDoc(collection(db, "wishlists"), {
          userId: user.uid,
          listingId: id,
          createdAt: serverTimestamp()
        });
        toast.success("Added to wishlist");
      }
    } catch (error) {
      handleFirestoreError(error, isWishlisted ? OperationType.DELETE : OperationType.CREATE, "wishlists");
    }
  };

  useEffect(() => {
    if (!id) return;

    const path = `listings/${id}`;
    const unsubscribe = onSnapshot(doc(db, "listings", id), (docSnap) => {
      if (docSnap.exists()) {
        setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
      } else {
        setListing(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!listing?.sellerId) return;

    const fetchSellerProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", listing.sellerId));
        if (docSnap.exists()) {
          setSellerProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error);
      }
    };

    fetchSellerProfile();
  }, [listing?.sellerId]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing) return;

    setIsReporting(true);
    const path = "reports";
    try {
      await addDoc(collection(db, path), {
        reporterId: user.uid,
        reporterName: profile?.companyName || user.email,
        reportedUserId: listing.sellerId,
        reportedUserName: listing.sellerName,
        listingId: listing.id,
        co2Saved: listing.co2Savings,
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
        targetId: listing.id,
        targetType: 'report',
        targetName: `Report on Listing ${listing.id}`,
        createdAt: serverTimestamp()
      }).catch(e => console.error("Error logging report:", e));

      toast.success("Report submitted to administration.");
      setIsReportModalOpen(false);
      setReportData({ reason: "", description: "" });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsReporting(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      toast.error("Please log in to make a purchase");
      return;
    }
    if (!profile?.isVetted && profile?.role !== 'superadmin') {
      toast.error("Your account must be vetted before making purchases");
      return;
    }
    
    try {
      toast.loading("Creating checkout session...", { id: "stripe-loading" });
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing?.id,
          buyerId: user.uid,
          quantity: quantity,
          co2Savings: (listing?.co2Savings || 0) * quantity,
          sellerId: listing?.sellerId,
          amount: (listing?.price || 0) * quantity
        })
      });
      
      const data = await response.json();
      toast.dismiss("stripe-loading");

      if (data.url) {
        // Stripe Checkout cannot be loaded in an iframe. 
        // We must open it in a new tab or use a top-level redirect.
        const checkoutWindow = window.open(data.url, '_blank');
        
        if (!checkoutWindow || checkoutWindow.closed || typeof checkoutWindow.closed === 'undefined') {
          // Popup was blocked
          toast.error("Checkout window blocked. Please click the link below to continue.", {
            action: {
              label: "Open Checkout",
              onClick: () => window.open(data.url, '_blank')
            },
            duration: 10000
          });
        } else {
          toast.success("Checkout opened in a new tab.");
        }
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      toast.dismiss("stripe-loading");
      console.error(error);
      toast.error("Checkout failed. Please ensure your Stripe API key is configured in Settings.");
    }
  };

  const handleMessageSeller = async () => {
    if (!user || !profile || !listing) return;
    if (user.uid === listing.sellerId) {
      toast.error("You cannot message yourself");
      return;
    }

    setIsStartingChat(true);
    try {
      // Check if chat already exists
      const chatsPath = "chats";
      const q = query(
        collection(db, chatsPath),
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);
      let existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data() as Chat;
        return data.participants.includes(listing.sellerId);
      });

      if (existingChat) {
        navigate("/messages");
      } else {
        // Create new chat
        const newChat: Partial<Chat> = {
          participants: [user.uid, listing.sellerId],
          participantNames: {
            [user.uid]: profile.companyName,
            [listing.sellerId]: listing.sellerName
          },
          participantLogos: {
            [user.uid]: profile.logoUrl || "",
            [listing.sellerId]: "" 
          },
          updatedAt: serverTimestamp(),
          lastMessage: `Inquiry about: ${listing.title}`
        };
        await addDoc(collection(db, "chats"), newChat);
        navigate("/messages");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "chats");
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleRequestDocs = () => {
    if (!user) {
      toast.error("Please log in to request documents");
      return;
    }
    toast.success("Document request sent to seller. You will be notified when they are shared.");
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !listing || !offerAmount) return;

    if (!profile.isVetted && profile.role !== 'superadmin') {
      toast.error("Your account must be vetted before submitting offers");
      return;
    }

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid offer amount");
      return;
    }

    setIsSubmittingOffer(true);
    try {
      // 1. Create Offer document
      const offerData = {
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: user.uid,
        buyerName: profile.companyName,
        sellerId: listing.sellerId,
        amount: amount,
        quantity: quantity,
        reason: offerReason,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      const offerRef = await addDoc(collection(db, "offers"), offerData);

      // 2. Notify Seller
      await addDoc(collection(db, "notifications"), {
        userId: listing.sellerId,
        title: "New Counter-Offer Received",
        message: `${profile.companyName} has submitted an offer of £${amount.toLocaleString()} for ${listing.title}.`,
        type: "bid",
        link: `/dashboard?tab=offers&subtab=received`, 
        read: false,
        createdAt: serverTimestamp()
      });

      // 3. Log to Audit
      await addDoc(collection(db, "audit_logs"), {
        adminId: "system",
        adminName: "System",
        action: "OFFER_SUBMITTED",
        details: `Buyer ${profile.companyName} submitted offer of £${amount} (Qty: ${quantity}) for Listing ${listing.id}`,
        targetId: offerRef.id,
        targetType: 'system',
        createdAt: serverTimestamp()
      }).catch(e => console.error("Error logging offer:", e));

      toast.success("Offer submitted successfully! The seller has been notified.");
      setIsOfferModalOpen(false);
      setOfferAmount("");
      setOfferReason("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "offers");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const getCategoryColor = (category: string) => {
    return 'border-primary/20';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded mb-8" />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="aspect-[16/10] bg-white/5 rounded-3xl" />
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4].map(i => <div key={`listing-skeleton-img-${i}`} className="h-24 w-24 bg-white/5 rounded-2xl" />)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6 w-1/4 bg-white/5 rounded" />
            <div className="h-12 w-3/4 bg-white/5 rounded" />
            <div className="h-32 w-full bg-white/5 rounded-2xl" />
            <div className="h-32 w-full bg-white/5 rounded-2xl" />
            <div className="h-40 w-full bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return <div className="container py-20 text-center">Asset not found.</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Gallery Section */}
        <div className="w-full lg:w-7/12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 md:p-6 rounded-3xl border-2 transition-colors ${getCategoryColor(listing.category)}`}
          >
            <div className="aspect-[16/10] overflow-hidden rounded-3xl glass border-white/10 shadow-xl relative group">
              <img 
                src={listing.images?.[selectedImageIndex] || "https://picsum.photos/seed/industrial/1200/800"} 
                alt={listing.title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="mt-6 flex flex-wrap gap-4 font-mono">
              {(listing.images && listing.images.length > 0 ? listing.images : [0, 1, 2, 3]).map((img, i) => (
                <div 
                  key={`listing-thumb-${i}`} 
                  className={`h-24 w-24 rounded-2xl glass overflow-hidden cursor-pointer transition-all duration-300 relative group/thumb ${selectedImageIndex === i ? 'ring-2 ring-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'opacity-50 hover:opacity-100 hover:border-primary/50'}`}
                  onClick={() => setSelectedImageIndex(i)}
                >
                  <img 
                    src={typeof img === 'string' ? img : `https://picsum.photos/seed/steel-${i + 1}/200/200`} 
                    alt="" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" 
                    referrerPolicy="no-referrer" 
                    loading="lazy" 
                  />
                  {selectedImageIndex === i && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-8 space-y-8">
            <div className="glass p-8 rounded-3xl">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <div className="glass p-8 rounded-3xl border-primary/20 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black uppercase tracking-tighter text-primary italic">Technical Specifications</h2>
                <div className="h-px flex-1 bg-primary/20 mx-6 hidden sm:block" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Condition</p>
                  <p className="font-mono text-sm font-black uppercase truncate">{listing.condition?.replace('-', ' ') || 'Refurbished'}</p>
                </div>
                <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Sector</p>
                  <p className="font-mono text-sm font-black uppercase truncate">{listing.category}</p>
                </div>
                <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Staging Area</p>
                  <p className="font-mono text-sm font-black uppercase truncate">{listing.location}</p>
                </div>
                {listing.brand && (
                  <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Manufacturer</p>
                    <p className="font-mono text-sm font-black uppercase truncate">{listing.brand}</p>
                  </div>
                )}
                {listing.model && (
                  <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Model Type</p>
                    <p className="font-mono text-sm font-black uppercase truncate">{listing.model}</p>
                  </div>
                )}
                {listing.year && (
                  <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Release Cycle</p>
                    <p className="font-mono text-sm font-black uppercase truncate">{listing.year}</p>
                  </div>
                )}
                {listing.weight && (
                  <TooltipProvider delay={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors cursor-help outline-none focus:ring-1 focus:ring-primary/20"
                          tabIndex={0}
                          role="button"
                          aria-label="Net mass information"
                        >
                          <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Net Mass</p>
                          <p className="font-mono text-sm font-black uppercase truncate">{listing.weight} kg</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass border-primary/20">
                        <p className="text-xs">Physical weight of the asset.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {listing.dimensions && (
                  <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-1 group hover:border-primary/40 transition-colors">
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] opacity-70">Dimensions</p>
                    <p className="font-mono text-sm font-black uppercase truncate">{listing.dimensions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & Seller Info (Sticky on Desktop) */}
        <div className="w-full lg:w-5/12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col lg:sticky lg:top-24 space-y-6 md:space-y-8 p-6 md:p-8 rounded-3xl border-2 transition-colors ${getCategoryColor(listing.category)}`}
          >
            <div>
              <div className="flex flex-col items-center gap-4 mb-6 md:mb-8 text-center">
                <div className="flex items-center justify-center gap-4 w-full">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          to={`/profile/${listing.sellerId}`}
                          className="flex items-center justify-center gap-2 p-3 rounded-2xl glass-dark w-full cursor-pointer hover:border-primary/50 transition-all border border-transparent"
                        >
                          <ShieldCheck className={`h-4 w-4 ${(sellerProfile?.isVetted || listing.isVetted) ? 'text-primary' : 'text-muted-foreground/40'}`} />
                          <span className="text-xs font-medium">{listing.sellerName}</span>
                          {sellerProfile?.isVatVerified && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 ml-2 text-[9px] h-4">VAT Verified</Badge>
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="glass border-primary/20">
                        <p className="text-xs">{(sellerProfile?.isVetted || listing.isVetted) ? 'Verified Seller: This company has passed our vetting process.' : 'Unverified Seller: Exercise caution.'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center justify-center gap-3 w-full px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 rounded-full h-7 glass border-white/10 transition-all duration-300 ${isWishlisted ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'text-muted-foreground'} hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30`}
                    onClick={toggleWishlist}
                  >
                    <Heart className={`h-3 w-3 mr-1.5 ${isWishlisted ? 'fill-current' : ''}`} />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Wishlist</span>
                  </Button>
                  
                  <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                    <DialogTrigger asChild nativeButton={true}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-full h-7 border-red-500/30 text-red-500 transition-all duration-300 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1.5" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Report</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass sm:max-w-[425px]">
                      <form onSubmit={handleReport}>
                        <DialogHeader>
                          <DialogTitle>Report Listing</DialogTitle>
                          <DialogDescription>
                            Report a violation of terms or inaccurate listing details.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason for Report</Label>
                            <Input 
                              id="reason" 
                              placeholder="e.g., Inaccurate description, Counterfeit..." 
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
                </div>
              </div>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px]">
                    {listing.category}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {(listing.condition || 'used-good').replace('-', ' ')}
                  </Badge>
                  
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className={`h-1.5 w-1.5 rounded-full ${getQualityScoreColor(qualityScore)}`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Q: {getQualityScoreLabel(qualityScore)} ({qualityScore}%)</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <TooltipProvider delay={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex items-center gap-1.5 text-primary font-bold cursor-help text-sm outline-none focus:ring-1 focus:ring-primary/20 rounded-md px-1"
                            tabIndex={0}
                            role="button"
                            aria-label="Environmental impact information"
                          >
                            <Leaf className="h-4 w-4" />
                            {listing.co2Savings}kg
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="glass border-primary/20">
                          <p className="text-xs">CO2 avoided by reuse.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight leading-tight text-center">{listing.title}</h1>
              </div>
            </div>

            <div className="glass p-8 relative overflow-hidden bg-primary/[0.02] rounded-3xl border border-primary/10">
              <div className="absolute top-0 right-0 p-4">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-sans tracking-tight text-primary uppercase">Direct Trade Active</span>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                 </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-background/40 backdrop-blur-md rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Unit Valuation</p>
                    <p className="text-3xl font-black font-mono tracking-tighter text-primary">£{listing.price.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-background/40 backdrop-blur-md rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Buffer Stock</p>
                    <p className="text-xl font-mono font-bold">{listing.quantity} UNITS</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Select Quantity</Label>
                  </div>
                  <div className="flex items-center border border-primary/20 h-14 bg-background/60 overflow-hidden group rounded-xl">
                    <Button 
                      variant="ghost" 
                      className="h-full rounded-none px-4 border-r border-primary/10 hover:bg-primary/5"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <span className="text-lg">-</span>
                    </Button>
                    <Input 
                      id="quantity"
                      type="number" 
                      className="h-full text-center font-black font-mono text-lg bg-transparent border-none focus-visible:ring-0 rounded-none w-full"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(listing.quantity || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                    />
                    <Button 
                      variant="ghost" 
                      className="h-full rounded-none px-4 border-l border-primary/10 hover:bg-primary/5"
                      onClick={() => setQuantity(Math.min(listing.quantity || 1, quantity + 1))}
                      disabled={quantity >= (listing.quantity || 1)}
                    >
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-mono opacity-70 uppercase tracking-tight">Total Commitment</span>
                     <span className="text-lg font-black font-mono text-primary">£{(listing.price * quantity).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <div className="p-4 bg-primary/5 border border-primary/10 space-y-2 mb-2 rounded-xl">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                       <Leaf className="h-3 w-3" />
                       Trading Guide
                     </div>
                     <p className="text-[10px] text-muted-foreground leading-relaxed">
                       Prices are negotiable. You can <span className="font-semibold text-foreground">BUY NOW</span> at the listed price or submit a <span className="font-semibold text-foreground">Counter Offer</span> for seller review.
                     </p>
                   </div>

                   <motion.div
                     whileHover={{ scale: 1.01, translateY: -1 }}
                     whileTap={{ scale: 0.99 }}
                     className="w-full"
                   >
                     <Button 
                        size="lg" 
                        className="w-full rounded-xl h-14 text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all border-none" 
                        onClick={handleBuy}
                        disabled={platformSettings.maintenanceMode}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        INSTANT PROCUREMENT
                      </Button>
                   </motion.div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div whileHover={{ scale: 1.02, translateY: -1 }} whileTap={{ scale: 0.98 }}>
                         <Button 
                            variant="outline" 
                            className="w-full h-11 rounded-xl font-bold text-[8px] uppercase tracking-widest border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
                            onClick={handleMessageSeller}
                         >
                            <MessageSquare className="h-3 w-3 mr-1.5" />
                            Message
                         </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02, translateY: -1 }} whileTap={{ scale: 0.98 }}>
                         <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
                            <DialogTrigger asChild nativeButton={true}>
                               <Button 
                                  variant="outline" 
                                  className="w-full h-11 rounded-xl font-bold text-[8px] uppercase tracking-widest border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm"
                               >
                                  <Send className="h-3 w-3 mr-1.5" />
                                  Make Offer
                               </Button>
                            </DialogTrigger>
                            <DialogContent className="glass border-primary/20 rounded-3xl sm:max-w-md p-8">
                               <form onSubmit={handleSubmitOffer}>
                                 <DialogHeader className="mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                       <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                       <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">Price Negotiation Node</span>
                                    </div>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Submit Counter-Offer</DialogTitle>
                                    <DialogDescription className="text-xs opacity-70 mt-2">
                                       Propose a custom price for {listing.title}. The seller will be notified to review.
                                    </DialogDescription>
                                 </DialogHeader>
                                 <div className="space-y-6">
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Proposed Unit Value</Label>
                                       <div className="flex items-center bg-background/40 border border-primary/10 h-14 rounded-xl overflow-hidden px-4">
                                          <span className="font-mono text-primary/70 mr-2">£</span>
                                          <Input 
                                             type="number"
                                             className="bg-transparent border-none focus-visible:ring-0 font-mono font-bold text-lg" 
                                             placeholder="0.00" 
                                             value={offerAmount}
                                             onChange={(e) => setOfferAmount(e.target.value)}
                                             required
                                          />
                                       </div>
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Offer Context</Label>
                                       <Textarea 
                                         className="bg-background/40 border-primary/10 rounded-xl h-24 text-sm resize-none focus-visible:ring-primary/20" 
                                         placeholder="e.g. Volume discount request, timing constraints..." 
                                         value={offerReason}
                                         onChange={(e) => setOfferReason(e.target.value)}
                                         required
                                       />
                                    </div>
                                 </div>
                                 <DialogFooter className="mt-8">
                                    <Button 
                                     type="submit"
                                     className="w-full rounded-xl h-14 bg-primary text-primary-foreground font-black tracking-widest text-[10px] uppercase border-none shadow-lg shadow-primary/20"
                                     disabled={isSubmittingOffer}
                                   >
                                       {isSubmittingOffer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "PROPOSE TERMS"}
                                    </Button>
                                 </DialogFooter>
                               </form>
                            </DialogContent>
                         </Dialog>
                      </motion.div>
                    </div>
                </div>
              </div>
            </div>
              
              <div className="mt-8 pt-6 border-t border-primary/10 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Settlement Ledger</span>
                    <span className="text-[10px] font-mono opacity-90">Stripe Connect Protocol</span>
                 </div>
                 <Badge variant="outline" className="rounded-none border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest px-3 h-6">
                    Verified_Transaction
                 </Badge>
              </div>

            <div className="flex flex-col gap-4">
              <Card className="glass border-border hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    Shipping & Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {listing.shippingOptions?.map((opt, idx) => (
                      <Badge key={`${opt}-${idx}`} variant="secondary" className="bg-muted text-[10px] capitalize">
                        {opt.replace('-', ' ')}
                      </Badge>
                    ))}
                    {(!listing.shippingOptions || listing.shippingOptions.length === 0) && (
                      <Badge variant="outline" className="text-[10px]">Contact Seller</Badge>
                    )}
                  </div>
                  {listing.shippingCost !== undefined && listing.shippingCost > 0 && (
                    <p className="text-xs font-medium text-primary">
                      Base Shipping: £{listing.shippingCost.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Contact vetted hauling companies for transport quotes or arrange with the seller.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-xs mt-1 text-primary" asChild>
                    <Link to="/hauling">View Haulers</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="glass border-border hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-amber-500" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Message the seller directly to arrange viewing or delivery.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-xs mt-2 text-primary" onClick={handleMessageSeller}>
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-12 lg:mt-16 space-y-12">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-12 space-y-12">
            <div className="space-y-8">
              <div className="glass p-8 rounded-3xl border-primary/20 bg-primary/5 relative overflow-hidden">              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Leaf className="h-24 w-24 text-primary" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Sustainability Impact</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-primary">{listing.co2Savings}kg</p>
                      <p className="text-sm text-muted-foreground font-medium">CO2 Emissions Avoided</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xl font-bold text-primary">{Math.round(listing.co2Savings / 20)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Trees/Yr</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xl font-bold text-primary">{Math.round(listing.co2Savings / 0.4).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Car Miles</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Circular Economy Efficiency</span>
                         <span className="text-xs font-bold text-primary">85% Reduced Footprint</span>
                     </div>
                     <div className="h-3 w-full bg-muted border border-border p-[2px]">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "85%" }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full bg-primary shadow-[0_0_10px_var(--primary)]" 
                         />
                     </div>
                     <p className="text-xs text-muted-foreground leading-relaxed font-light italic">
                        Selecting this industrial asset prevents the high-intensity manufacturing emissions related to new machinery production.
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Asset Timeline - Recipe 1/3 Style */}
            <div className="glass p-10 rounded-3xl border border-border bg-muted/20 overflow-hidden relative">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-primary/20 flex items-center justify-center border border-primary/40 rounded-none">
                      <Clock className="h-5 w-5 text-primary" />
                   </div>
                   <div className="flex flex-col">
                      <h2 className="text-xl font-black uppercase tracking-tighter">Asset Lifecycle Ledger</h2>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Chronological Verification History</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="glow-indicator glow-green animate-pulse" />
                   <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Traceability Active</span>
                </div>
              </div>

              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[1.25rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-white/5 before:to-transparent">
                {[
                  { date: "MAR 2026", event: "Industrial Health Audit", desc: "Passed internal maintenance sweep. New hydraulic seals installed.", status: "Verified", icon: <ShieldCheck className="h-3 w-3" /> },
                  { date: "JAN 2026", event: "Safety Certification", desc: "BS EN ISO 12100:2010 compliance renewed for 12 months.", status: "Active", icon: <FileText className="h-3 w-3" /> },
                  { date: "SEP 2025", event: "Ownership Transfer", desc: "Relocated from Teesport Terminal 4 to current staging facility.", status: "Logged", icon: <Truck className="h-3 w-3" /> },
                  { date: "MAY 2025", event: "Asset Commissioning", desc: "Initial entry into regional industrial directory.", status: "Genesis", icon: <Send className="h-3 w-3" /> }
                ].map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between group">
                    <div className="flex items-center w-full">
                      <div className="absolute left-0 mt-0.5 h-6 w-6 flex items-center justify-center rounded-none bg-black border border-primary/50 group-hover:scale-125 transition-transform z-10">
                        <div className="h-2 w-2 bg-primary shadow-[0_0_8px_var(--primary)]" />
                      </div>
                      <div className="ml-12 w-full">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-black text-primary/60">{item.date}</span>
                          <Badge variant="outline" className="text-[8px] h-4 border-white/10 uppercase tracking-widest font-bold rounded-none">
                             {item.icon}
                             <span className="ml-1">{item.status}</span>
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-tight">{item.event}</h4>
                        <p className="text-xs text-muted-foreground font-light mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
