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
  serverTimestamp
} from "@/lib/firebase";
import { Listing, Chat } from "@/types";
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
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
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

  const handlePlaceBid = async () => {
    if (!user || !profile || !listing || !bidAmount) return;
    const amount = parseFloat(bidAmount);
    
    if (amount <= (listing.currentBid || listing.price)) {
      toast.error("Bid must be higher than the current price");
      return;
    }

    setIsBidding(true);
    try {
      await addDoc(collection(db, "bids"), {
        listingId: listing.id,
        bidderId: user.uid,
        bidderName: profile.companyName,
        amount,
        createdAt: serverTimestamp()
      });
      
      toast.success("Bid placed successfully!");
      setBidAmount("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bids");
    } finally {
      setIsBidding(false);
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
            <div className="aspect-[4/3] bg-white/5 rounded-3xl" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={`listing-skeleton-img-${i}`} className="aspect-square bg-white/5 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6 w-1/4 bg-white/5 rounded" />
            <div className="h-12 w-3/4 bg-white/5 rounded" />
            <div className="h-10 w-1/2 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={`listing-skeleton-info-${i}`} className="h-20 bg-white/5 rounded-2xl" />)}
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery Section */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border-2 transition-colors ${getCategoryColor(listing.category)}`}
          >
            <div className="aspect-[16/10] overflow-hidden rounded-3xl glass border-white/10 shadow-xl relative group">
              <img 
                src={listing.images?.[0] || "https://picsum.photos/seed/industrial/1200/800"} 
                alt={listing.title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={`listing-thumb-${i}`} className="aspect-square rounded-2xl glass overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                  <img src={`https://picsum.photos/seed/steel-${i}/200/200`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar: Actions & Seller Info (Sticky on Desktop) */}
        <div className="lg:col-span-5 lg:row-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col lg:sticky lg:top-24 space-y-8 p-8 rounded-3xl border-2 transition-colors ${getCategoryColor(listing.category)}`}
          >
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {listing.category}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {(listing.condition || 'used-good').replace('-', ' ')}
                </Badge>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <div className={`h-2 w-2 rounded-full ${getQualityScoreColor(qualityScore)}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Quality: {getQualityScoreLabel(qualityScore)} ({qualityScore}%)</span>
                </div>

                <div className="flex flex-col items-end ml-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-primary font-bold cursor-help">
                          <Leaf className="h-5 w-5" />
                          {listing.co2Savings}kg CO2
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass border-primary/20">
                        <p className="text-xs">Estimated CO2 emissions avoided by reusing this asset.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="text-[10px] text-muted-foreground">
                    ≈ {Math.round(listing.co2Savings / 20)} trees/yr
                  </div>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight leading-tight">{listing.title}</h1>
              
              <div className="flex items-center gap-4 mb-8">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-3 rounded-2xl glass-dark inline-flex cursor-help">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{listing.sellerName}</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-2">Verified</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="glass border-primary/20">
                      <p className="text-xs">Verified Seller: This company has passed our vetting process.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full h-11 w-11 glass border-white/10 ${isWishlisted ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>
                
                <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-4 text-muted-foreground hover:text-destructive">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Report
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

            <div className="glass rounded-3xl p-8 border-primary/20 shadow-lg">
              {listing.listingType === 'auction' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Bid</p>
                      <p className="text-4xl font-bold text-primary">£{(listing.currentBid || listing.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        Ends in
                      </p>
                      <p className="text-lg font-semibold">
                        {listing.auctionEndTime ? formatDistanceToNow(new Date(listing.auctionEndTime)) : "2 days"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        className="pl-7 rounded-full h-12"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="rounded-full h-12 px-8" 
                      onClick={handlePlaceBid} 
                      disabled={isBidding || platformSettings.maintenanceMode}
                    >
                      {isBidding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                      {platformSettings.maintenanceMode ? "System Maintenance" : "Bid"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price per unit</p>
                      <p className="text-4xl font-bold text-primary">£{listing.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Available</p>
                      <p className="text-xl font-semibold">{listing.quantity} units</p>
                    </div>
                  </div>

                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quantity" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quantity</Label>
                      <span className="text-xs font-medium text-primary">Total: £{(listing.price * quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl glass border-white/10"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <Input 
                        id="quantity"
                        type="number" 
                        min="1" 
                        max={listing.quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(listing.quantity || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="h-10 text-center font-bold glass border-white/10 rounded-xl"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl glass border-white/10"
                        onClick={() => setQuantity(Math.min(listing.quantity || 1, quantity + 1))}
                        disabled={quantity >= (listing.quantity || 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full rounded-full h-14 text-lg shadow-md shadow-primary/10" 
                    onClick={handleBuy}
                    disabled={platformSettings.maintenanceMode}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {platformSettings.maintenanceMode ? "System Maintenance" : `Buy ${quantity} Now`}
                  </Button>
                </>
              )}
              
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="outline" className="rounded-2xl h-12 w-full border-white/10 hover:bg-white/5" onClick={handleMessageSeller} disabled={isStartingChat}>
                  {isStartingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                  Message Seller
                </Button>
                <Button variant="outline" className="rounded-2xl h-12 w-full border-white/10 hover:bg-white/5" onClick={handleRequestDocs}>
                  <FileText className="mr-2 h-4 w-4" />
                  Request Docs
                </Button>
              </div>
              
              <p className="text-center text-[10px] text-muted-foreground mt-4">
                Secure transaction via Stripe Connect. {platformSettings.buyerCommission}% buyer commission applies.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="glass border-white/5 hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    Shipping & Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {listing.shippingOptions?.map((opt, idx) => (
                      <Badge key={`${opt}-${idx}`} variant="secondary" className="bg-white/5 text-[10px] capitalize">
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
              <Card className="glass border-white/5 hover:border-primary/20 transition-colors">
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

        {/* Main Content: Description & Specs */}
        <div className="lg:col-span-7 space-y-12">
          <div className="space-y-8">
            <div className="glass p-8 rounded-3xl">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <div className="glass p-8 rounded-3xl">
              <h2 className="text-xl font-bold mb-6">Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Condition</p>
                  <p className="font-medium capitalize">{listing.condition?.replace('-', ' ') || 'Used'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                  <p className="font-medium">{listing.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                  <p className="font-medium">{listing.location}</p>
                </div>
                {listing.brand && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Brand</p>
                    <p className="font-medium">{listing.brand}</p>
                  </div>
                )}
                {listing.model && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Model</p>
                    <p className="font-medium">{listing.model}</p>
                  </div>
                )}
                {listing.year && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Year</p>
                    <p className="font-medium">{listing.year}</p>
                  </div>
                )}
                {listing.weight && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Weight</p>
                    <p className="font-medium">{listing.weight} kg</p>
                  </div>
                )}
                {listing.dimensions && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Dimensions</p>
                    <p className="font-medium">{listing.dimensions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
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
                        <p className="text-[10px] text-muted-foreground uppercase">Trees/Year</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xl font-bold text-primary">{Math.round(listing.co2Savings / 0.4).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Car Miles</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[85%]" />
                      </div>
                      <span className="text-xs font-medium text-primary">85% Lower Footprint</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Choosing this circular asset instead of buying new prevents significant carbon emissions associated with manufacturing and raw material extraction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
