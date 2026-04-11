import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, db, doc, getDoc, updateDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
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
import { 
  ImagePlus, 
  Leaf, 
  ShieldAlert, 
  ArrowLeft, 
  Loader2, 
  HelpCircle, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { Listing } from "@/types";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export default function EditListing() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    co2Savings: "",
    condition: "used-good" as 'new' | 'used-excellent' | 'used-good' | 'used-fair',
    location: "",
    weight: "",
    dimensions: ""
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Title is required";
    else if (formData.title.length < 10) newErrors.title = "Title must be at least 10 characters";
    else if (formData.title.length > 100) newErrors.title = "Title must be less than 100 characters";

    if (!formData.price) newErrors.price = "Price is required";
    else if (parseFloat(formData.price) < 0) newErrors.price = "Price cannot be negative";

    if (!formData.quantity) newErrors.quantity = "Quantity is required";
    else if (parseInt(formData.quantity) <= 0) newErrors.quantity = "Quantity must be at least 1";

    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.location) newErrors.location = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const docRef = doc(db, "listings", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Listing;
          
          // Security check: only seller or admin can edit
          if (data.sellerId !== user?.uid && profile?.role !== 'superadmin') {
            toast.error("You don't have permission to edit this listing");
            navigate("/dashboard");
            return;
          }

          setFormData({
            title: data.title,
            description: data.description,
            price: data.price.toString(),
            quantity: data.quantity.toString(),
            category: data.category,
            co2Savings: data.co2Savings.toString(),
            condition: data.condition || "used-good",
            location: data.location || "",
            weight: data.weight?.toString() || "",
            dimensions: data.dimensions || ""
          });
          setImages(data.images || []);
        } else {
          toast.error("Listing not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Failed to load listing details");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchListing();
    }
  }, [id, user, profile, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let hasError = false;

    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 5000 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        hasError = true;
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (!hasError) toast.success("Images added");
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!validateForm()) {
      toast.error("Please fix the errors before updating");
      return;
    }

    setSaving(true);
    const path = `listings/${id}`;
    
    try {
      await updateDoc(doc(db, "listings", id), {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions,
        co2Savings: parseFloat(formData.co2Savings) || 0,
        images: images,
        updatedAt: new Date().toISOString()
      });
      
      toast.success("Listing updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 rounded-full gap-2" 
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>Update the information about your industrial asset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="title" className={errors.title ? "text-destructive" : ""}>
                    Listing Title *
                  </Label>
                  <span className={`text-[10px] font-medium ${formData.title.length > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                    {formData.title.length}/100
                  </span>
                </div>
                <Input 
                  id="title" 
                  placeholder="e.g. Used Hydraulic Press 50T" 
                  className={`rounded-xl ${errors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({...formData, title: e.target.value});
                    if (errors.title) setErrors({...errors, title: ""});
                  }}
                  required
                />
                {errors.title && <p className="text-[10px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.title}</p>}
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
                  <Label htmlFor="condition">Condition *</Label>
                  <Select 
                    value={formData.condition} 
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
                <div className="grid gap-2">
                  <Label htmlFor="location" className={errors.location ? "text-destructive" : ""}>
                    Location (City/Region) *
                  </Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Hartlepool, UK" 
                    className={`rounded-xl ${errors.location ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({...formData, location: e.target.value});
                      if (errors.location) setErrors({...errors, location: ""});
                    }}
                    required
                  />
                  {errors.location && <p className="text-[10px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.location}</p>}
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
                  <Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>
                    Category *
                  </Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(v) => {
                      setFormData({...formData, category: v});
                      if (errors.category) setErrors({...errors, category: ""});
                    }}
                  >
                    <SelectTrigger className={`rounded-xl ${errors.category ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-[10px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.category}</p>}
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="co2">Estimated CO2 Savings (kg)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs glass border-primary/20 p-3">
                        <p className="text-xs leading-relaxed">
                          Carbon savings are estimated based on the emissions avoided by reusing this asset instead of manufacturing a new one. 
                          Industrial reuse typically saves 70-90% of the original manufacturing carbon footprint.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input 
                      id="co2" 
                      type="number" 
                      placeholder="e.g. 250" 
                      className="rounded-xl pl-10"
                      value={formData.co2Savings}
                      onChange={(e) => setFormData({...formData, co2Savings: e.target.value})}
                    />
                    <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price" className={errors.price ? "text-destructive" : ""}>
                    Price per Unit (£) *
                  </Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="0.00" 
                    className={`rounded-xl ${errors.price ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({...formData, price: e.target.value});
                      if (errors.price) setErrors({...errors, price: ""});
                    }}
                    required
                  />
                  {errors.price && <p className="text-[10px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.price}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity" className={errors.quantity ? "text-destructive" : ""}>
                    Quantity Available *
                  </Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="1" 
                    className={`rounded-xl ${errors.quantity ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({...formData, quantity: e.target.value});
                      if (errors.quantity) setErrors({...errors, quantity: ""});
                    }}
                    required
                  />
                  {errors.quantity && <p className="text-[10px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.quantity}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Asset Images</Label>
                  <span className="text-[10px] text-muted-foreground font-medium">{images.length} images added</span>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Asset ${idx}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="h-8 w-8 rounded-full bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-[8px] font-bold uppercase tracking-widest text-white">
                            Primary
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-white/5 relative group">
                    {uploading ? (
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-2">
                          <ImagePlus className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Images</span>
                        <span className="text-[8px] text-muted-foreground/60 mt-1">Multiple allowed</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Max 5MB per image. First image will be used as the primary thumbnail.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button type="submit" className="w-full rounded-full h-12" disabled={saving}>
                {saving ? "Saving Changes..." : "Update Listing"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
