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

    if (file.size > 5000 * 1024) {
      toast.error("File size too large. Max 5000KB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      setUploading(false);
      toast.success("Logo uploaded to profile (pending save)");
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
              ) : profile?.isVetted ? (
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Vetted
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Pending Vetting
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
                <div className="relative h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="h-6 w-6 text-white" />
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
