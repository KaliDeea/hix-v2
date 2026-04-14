import React, { useState } from "react";
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
import { ShieldCheck, AlertCircle, Upload, Building2, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image-utils";

export default function Profile() {
  const { user, profile, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
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

          {/* Company Details */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your business details and VAT registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all group shadow-lg">
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
