import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, db, onSnapshot, doc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Listing } from "@/types";
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
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ListingDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isSending, setIsSending] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing) return;
    if (!messageContent.trim()) return;

    setIsSending(true);
    const path = "messages";
    try {
      await addDoc(collection(db, path), {
        senderId: user.uid,
        senderName: profile?.companyName || user.email,
        receiverId: listing.sellerId,
        listingId: listing.id,
        listingTitle: listing.title,
        content: messageContent,
        status: "unread",
        createdAt: serverTimestamp()
      });
      toast.success("Message sent to seller!");
      setIsMessageModalOpen(false);
      setMessageContent("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSending(false);
    }
  };

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
        reason: reportData.reason,
        description: reportData.description,
        status: "pending",
        createdAt: serverTimestamp()
      });
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
          quantity: 1
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

  if (loading) return <div className="container py-20 text-center">Loading asset details...</div>;
  if (!listing) return <div className="container py-20 text-center">Asset not found.</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="aspect-[4/3] overflow-hidden rounded-3xl glass border-white/10">
            <img 
              src={listing.images[0]} 
              alt={listing.title} 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl glass overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                <img src={`https://picsum.photos/seed/steel-${i}/200/200`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-6 flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {listing.category}
            </Badge>
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <Leaf className="h-5 w-5" />
              {listing.co2Savings}kg CO2 Savings
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">{listing.title}</h1>
          
          <div className="flex items-center gap-2 mb-8 p-3 rounded-2xl glass-dark inline-flex self-start">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{listing.sellerName}</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-2">Verified</Badge>
            
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

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {listing.description}
          </p>

          <div className="glass rounded-3xl p-8 mb-8">
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
            <Button size="lg" className="w-full rounded-full h-14 text-lg" onClick={handleBuy}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buy Now
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Secure transaction via Stripe Connect. 3% buyer commission applies.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="glass border-white/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  Logistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Contact vetted hauling companies for transport quotes.
                </p>
                <Button variant="link" className="p-0 h-auto text-xs mt-2" asChild>
                  <Link to="/hauling">View Haulers</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="glass border-white/5">
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
                <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-xs mt-2">Send Message</Button>
                  </DialogTrigger>
                  <DialogContent className="glass sm:max-w-[425px]">
                    <form onSubmit={handleSendMessage}>
                      <DialogHeader>
                        <DialogTitle>Message {listing.sellerName}</DialogTitle>
                        <DialogDescription>
                          Inquire about "{listing.title}" directly with the seller.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea 
                            id="message" 
                            placeholder="Ask about condition, viewing, or delivery options..." 
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="h-32"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full rounded-full" disabled={isSending}>
                          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Send Message
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
