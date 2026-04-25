import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, AlertCircle, Upload, Building2, Loader2, ShoppingCart, ArrowRight, Leaf } from "lucide-react";
import { compressImage } from "@/lib/image-utils";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { Transaction, UserProfile } from "@/types";
import { format } from "date-fns";
import { 
  calculateUserESGImpactScore, 
  getUserESGScoreColor, 
  getUserESGScoreBadge, 
  getUserESGLevel 
} from "@/lib/qualityScore";

export default function Profile() {
  const { user, profile, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [formData, setFormData] = useState({
    companyName: profile?.companyName || "",
    vatNumber: profile?.vatNumber || "",
    logoUrl: profile?.logoUrl || "",
    address: profile?.address || "",
    website: profile?.website || "",
    bio: profile?.bio || "",
    phoneNumber: profile?.phoneNumber || ""
  });
  const [uploading, setUploading] = useState(false);

  // Update form data when profile is loaded
  React.useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        vatNumber: profile.vatNumber || "",
        logoUrl: profile.logoUrl || "",
        address: profile.address || "",
        website: profile.website || "",
        bio: profile.bio || "",
        phoneNumber: profile.phoneNumber || ""
      });
    }
  }, [profile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check before processing (5MB raw limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Max 5MB for processing.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        // Compress the image to ensure it fits in Firestore
        const compressed = await compressImage(base64, 400, 400, 0.8);
        setFormData(prev => ({ ...prev, logoUrl: compressed }));
        
        // Auto-save logo to profile
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { logoUrl: compressed }, { merge: true });
            toast.success("Profile picture updated and saved!");
          } catch (error) {
            console.error("Error auto-saving logo:", error);
            toast.error("Logo uploaded but failed to save to database.");
          }
        }
      } catch (err) {
        console.error("Compression error:", err);
        toast.error("Failed to process image");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const q2 = query(
      collection(db, "transactions"),
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub1 = onSnapshot(q, (snapshot) => {
      const buyerTx = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(prev => {
        const combined = [...prev.filter(t => t.sellerId === user.uid), ...buyerTx];
        return combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });
      setLoadingTransactions(false);
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const sellerTx = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(prev => {
        const combined = [...prev.filter(t => t.buyerId === user.uid), ...sellerTx];
        return combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });
      setLoadingTransactions(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        ...formData,
        uid: user.uid,
        email: user.email,
        isVetted: profile?.isVetted || false,
        isVatVerified: profile?.isVatVerified || false,
        role: profile?.role || 'user',
        revenue: profile?.revenue || 0,
        commissionsPaid: profile?.commissionsPaid || 0,
        createdAt: profile?.createdAt || new Date().toISOString()
      }, { merge: true });
      toast.success("Profile updated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Please log in to view your profile.</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Company Profile</h1>
        
        <div className="grid gap-8">
          {/* Verification Status */}
          <Card className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Your current standing on the exchange.</CardDescription>
              </div>
              {profile?.role === 'superadmin' ? (
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Super Admin
                </Badge>
              ) : profile?.isVetted && profile?.isVatVerified ? (
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Fully Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Pending Verification
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border transition-all ${profile?.isVatVerified ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">VAT Status</span>
                    {profile?.isVatVerified ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="font-bold">{profile?.isVatVerified ? 'Verified' : 'Pending Verification'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Required for tax compliance and B2B trading.</p>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${profile?.isVetted ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity Vetting</span>
                    {profile?.isVetted ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="font-bold">{profile?.isVetted ? 'Approved' : 'Under Review'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Manual review of company registration and history.</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-6 italic">
                All companies must be manually vetted by the HiX admin team before they can list assets or make purchases. Vetting usually takes 24-48 hours.
              </p>
            </CardContent>
          </Card>

          {/* ESG Impact Score Card */}
          <Card className="glass border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between group">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-500" />
                    ESG Impact Rating
                  </CardTitle>
                  <CardDescription>Your environmental and social governance standing.</CardDescription>
                </div>
                {profile && (
                  <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center transition-all group-hover:scale-105 ${getUserESGScoreBadge(calculateUserESGImpactScore(profile))}`}>
                    <span className="text-2xl font-black font-display tracking-tighter">
                      {calculateUserESGImpactScore(profile)}
                    </span>
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] leading-none">SCORE</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase opacity-60">Impact Level</span>
                    <Badge variant="outline" className={`font-mono text-[10px] uppercase font-black px-3 ${profile ? getUserESGScoreBadge(calculateUserESGImpactScore(profile)) : ''}`}>
                      {profile ? getUserESGLevel(calculateUserESGImpactScore(profile)) : 'Calculating...'}
                    </Badge>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase">
                       <span>Marketplace Contribution</span>
                       <span>{(profile?.totalCo2Saved || 0).toLocaleString()} kg CO2 Saved</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((profile?.totalCo2Saved || 0) / 10000) * 100)}%` }}
                       />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic mt-2">
                      Score is derived from total environmental savings from completed circular transactions and the depth of your organizational verification.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="glass border-primary/20 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Transaction History</CardTitle>
                  <CardDescription>View your recent buys and sells on the platform.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTransactions ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No transactions found.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-6 hover:bg-white/5 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-2xl ${tx.buyerId === user?.uid ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                            {tx.buyerId === user?.uid ? <ShoppingCart className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{tx.listingTitle}</h4>
                              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest">
                                {tx.buyerId === user?.uid ? 'Purchase' : 'Sale'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "dd MMM yyyy, HH:mm") : "Recent"}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <Leaf className="h-3 w-3" />
                                {tx.co2Saved}kg CO2 Saved
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xl font-black text-primary">£{tx.amount?.toLocaleString() || '0'}</div>
                          <Badge className={`${
                            tx.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          } rounded-md capitalize`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your business details and VAT registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all group shadow-md">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-white" />
                      <span className="text-[10px] text-white font-medium">Change</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Company Logo</h3>
                  <p className="text-sm text-muted-foreground">JPG, PNG or SVG. Max 5000KB.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="e.g. Hartlepool Steel Ltd" 
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input 
                    id="email" 
                    value={user.email || ""} 
                    disabled 
                    className="rounded-xl bg-muted/50"
                  />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed as it is linked to your account.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="e.g. +44 123 456 7890" 
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vat">VAT Number</Label>
                  <div className="relative">
                    <Input 
                      id="vat" 
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                      placeholder="GB 123 4567 89" 
                      className="rounded-xl"
                    />
                    {profile?.isVatVerified && (
                      <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Required for B2B transactions and Stripe Connect.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Industrial Way, Hartlepool, TS24 0RE" 
                    className="rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://www.yourcompany.co.uk" 
                    className="rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Company Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell other members about your business..." 
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full rounded-full"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
