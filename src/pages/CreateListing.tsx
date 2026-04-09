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
import { ImagePlus, Leaf, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";

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
    co2Savings: "",
    brand: "",
    model: "",
    year: "",
    condition: "used-good" as 'new' | 'used-excellent' | 'used-good' | 'used-fair',
    location: "",
    weight: "",
    dimensions: "",
    listingType: "fixed" as 'fixed' | 'auction',
    reservePrice: "",
    auctionEndTime: ""
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5000 * 1024) {
      toast.error("File size too large. Max 5000KB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => [...prev, reader.result as string]);
      setUploading(false);
      toast.success("Image added");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleAiGenerate = async () => {
    if (!formData.title) {
      toast.error("Please enter a title first so AI has context");
      return;
    }

    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional industrial listing description and estimate CO2 savings (in kg) for an asset titled: "${formData.title}". 
        Category: ${formData.category || 'Industrial'}. 
        Condition: ${formData.condition}.
        Return the result in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              co2Savings: { type: Type.NUMBER }
            },
            required: ["description", "co2Savings"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setFormData(prev => ({
        ...prev,
        description: result.description,
        co2Savings: result.co2Savings.toString()
      }));
      toast.success("AI generated description and CO2 estimate!");
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate AI content");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: 'available' | 'draft' = 'available') => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.price || !formData.category || !formData.quantity || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    const quantity = parseInt(formData.quantity);
    const co2Savings = parseFloat(formData.co2Savings) || 0;

    if (isNaN(price) || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (formData.listingType === 'auction') {
      const reservePrice = formData.reservePrice ? parseFloat(formData.reservePrice) : null;
      if (reservePrice !== null && (isNaN(reservePrice) || reservePrice < 0)) {
        toast.error("Reserve price must be a positive number");
        return;
      }
      if (!formData.auctionEndTime) {
        toast.error("Auction end time is required for auctions");
        return;
      }
      if (new Date(formData.auctionEndTime) <= new Date()) {
        toast.error("Auction end time must be in the future");
        return;
      }
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
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        condition: formData.condition,
        location: formData.location,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions,
        co2Savings: parseFloat(formData.co2Savings) || 0,
        images: images.length > 0 ? images : ["https://picsum.photos/seed/" + listingId + "/800/600"],
        status: status,
        listingType: formData.listingType,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        auctionEndTime: formData.auctionEndTime || null,
        createdAt: new Date().toISOString()
      });
      
      toast.success(status === 'draft' ? "Draft saved!" : "Listing created successfully!");
      navigate(status === 'draft' ? "/dashboard" : "/marketplace");
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs gap-1 text-primary"
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating}
                  >
                    {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Generate
                  </Button>
                </div>
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
                  <Label htmlFor="listingType">Listing Type *</Label>
                  <Select 
                    defaultValue="fixed" 
                    onValueChange={(v) => setFormData({...formData, listingType: v as any})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="auction">Auction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select 
                    defaultValue="used-good" 
                    onValueChange={(v) => setFormData({...formData, condition: v as any})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used-excellent">Used - Excellent</SelectItem>
                      <SelectItem value="used-good">Used - Good</SelectItem>
                      <SelectItem value="used-fair">Used - Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.listingType === 'auction' && (
                <div className="grid gap-6 md:grid-cols-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="grid gap-2">
                    <Label htmlFor="reservePrice">Reserve Price (£)</Label>
                    <Input 
                      id="reservePrice" 
                      type="number" 
                      placeholder="Minimum price to sell" 
                      className="rounded-xl"
                      value={formData.reservePrice}
                      onChange={(e) => setFormData({...formData, reservePrice: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="auctionEndTime">Auction End Date/Time</Label>
                    <Input 
                      id="auctionEndTime" 
                      type="datetime-local" 
                      className="rounded-xl"
                      value={formData.auctionEndTime}
                      onChange={(e) => setFormData({...formData, auctionEndTime: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand / Manufacturer</Label>
                  <Input 
                    id="brand" 
                    placeholder="e.g. Siemens, Caterpillar" 
                    className="rounded-xl"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model / Series</Label>
                  <Input 
                    id="model" 
                    placeholder="e.g. S7-1200, CAT 320" 
                    className="rounded-xl"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="year">Year of Manufacture</Label>
                  <Input 
                    id="year" 
                    type="number"
                    placeholder="e.g. 2021" 
                    className="rounded-xl"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (City/Region) *</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Hartlepool, UK" 
                    className="rounded-xl"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    placeholder="e.g. 150" 
                    className="rounded-xl"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dimensions">Dimensions (LxWxH cm)</Label>
                  <Input 
                    id="dimensions" 
                    placeholder="e.g. 120x80x100" 
                    className="rounded-xl"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                  />
                </div>
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
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Asset ${idx}`} className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-xs">×</span>
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-white/5 relative">
                    {uploading ? (
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-[10px] text-muted-foreground">Add Image</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Max 5000KB per image.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6 flex flex-col sm:flex-row gap-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-full h-12 px-8" 
                onClick={() => navigate("/marketplace")}
              >
                Cancel
              </Button>
              <div className="flex-1 flex gap-4 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 rounded-full h-12" 
                  onClick={() => handleSubmit(new Event('submit') as any, 'draft')}
                  disabled={loading}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : "Publish Listing"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
