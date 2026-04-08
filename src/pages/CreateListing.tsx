import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, db, collection, setDoc, doc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { CATEGORIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { ImagePlus, Leaf, ShieldAlert } from "lucide-react";

export default function CreateListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    co2Savings: ""
  });

  if (!user) {
    return <div className="container py-20 text-center">Please log in to create a listing.</div>;
  }

  if (!profile?.isVetted && profile?.role !== 'superadmin') {
    return (
      <div className="container py-20">
        <Card className="glass max-w-2xl mx-auto border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-6 w-6" />
              Account Vetting Required
            </CardTitle>
            <CardDescription>
              Your account must be vetted by the HiX admin team before you can list industrial assets for sale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vetting ensures a secure and trustworthy marketplace for all B2B participants. 
              If you have already submitted your company details, please wait 24-48 hours for approval.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/profile")}>
              Complete Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const listingId = crypto.randomUUID();
    const path = `listings/${listingId}`;
    
    try {
      await setDoc(doc(db, "listings", listingId), {
        sellerId: user.uid,
        sellerName: profile.companyName,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        co2Savings: parseFloat(formData.co2Savings) || 0,
        images: ["https://picsum.photos/seed/" + listingId + "/800/600"],
        status: "available",
        createdAt: new Date().toISOString()
      });
      
      toast.success("Listing created successfully!");
      navigate("/marketplace");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>Provide accurate information about the industrial asset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Listing Title *</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Used Hydraulic Press 50T" 
                  className="rounded-xl"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the condition, specifications, and history of the asset..." 
                  className="rounded-xl min-h-[150px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="co2">Estimated CO2 Savings (kg)</Label>
                  <div className="relative">
                    <Input 
                      id="co2" 
                      type="number" 
                      placeholder="e.g. 250" 
                      className="rounded-xl pl-10"
                      value={formData.co2Savings}
                      onChange={(e) => setFormData({...formData, co2Savings: e.target.value})}
                    />
                    <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price per Unit (£) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="0.00" 
                    className="rounded-xl"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity Available *</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="1" 
                    className="rounded-xl"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Asset Images</Label>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-white/5">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-[10px] text-muted-foreground">Add Image</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button type="submit" className="w-full rounded-full h-12" disabled={loading}>
                {loading ? "Creating Listing..." : "Publish Listing"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
