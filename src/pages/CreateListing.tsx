import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, db, collection, setDoc, doc, handleFirestoreError, OperationType, onSnapshot } from "@/lib/firebase";
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
import { Badge } from "@/components/ui/badge";
import { 
  ImagePlus, 
  Leaf, 
  ShieldAlert, 
  Sparkles, 
  Loader2, 
  HelpCircle, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export default function CreateListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
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
    voltage: "",
    listingType: "fixed" as 'fixed' | 'auction',
    reservePrice: "",
    auctionEndTime: "",
    shippingOptions: ['collection'] as ('collection' | 'standard' | 'express' | 'international')[],
    shippingCost: ""
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "platform_settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceMode(docSnap.data().maintenanceMode || false);
      }
    });
    return () => unsubscribe();
  }, []);

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

    if (formData.listingType === 'auction') {
      if (!formData.auctionEndTime) newErrors.auctionEndTime = "Auction end time is required";
      else if (new Date(formData.auctionEndTime) <= new Date()) newErrors.auctionEndTime = "End time must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAiExtract = async (base64Image: string) => {
    setIsAiExtracting(true);
    const toastId = toast.loading("Analyzing industrial data plate...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            imagePart,
            { text: "Extract technical specifications from this industrial machine nameplate. Return JSON: manufacturer, model, weightKg, voltageV, year, titleSuggestion." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              manufacturer: { type: Type.STRING },
              model: { type: Type.STRING },
              weightKg: { type: Type.NUMBER },
              voltageV: { type: Type.STRING },
              year: { type: Type.NUMBER },
              titleSuggestion: { type: Type.STRING }
            },
            required: ["manufacturer", "model"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setFormData(prev => ({
        ...prev,
        brand: result.manufacturer || prev.brand,
        model: result.model || prev.model,
        weight: result.weightKg ? result.weightKg.toString() : prev.weight,
        voltage: result.voltageV || prev.voltage,
        year: result.year ? result.year.toString() : prev.year,
        title: result.titleSuggestion || prev.title
      }));
      toast.success("Technical parameters extracted successfully!", { id: toastId });
    } catch (error) {
      console.error("AI Extraction Error:", error);
      toast.error("Failed to extract data from image", { id: toastId });
    } finally {
      setIsAiExtracting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 5000 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages(prev => {
          const newImages = [...prev, base64];
          // Offer extraction on the first image added if it's the very first one
          if (prev.length === 0) {
            toast("Industrial Data Plate detected?", {
              action: {
                label: "AI Extract Specs",
                onClick: () => handleAiExtract(base64)
              },
            });
          }
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const [primary] = newImages.splice(index, 1);
      newImages.unshift(primary);
      return newImages;
    });
    toast.success("Primary image updated");
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

  if (maintenanceMode) {
    return (
      <div className="container py-20">
        <Card className="glass max-w-2xl mx-auto border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              System Maintenance
            </CardTitle>
            <CardDescription>
              New listings are temporarily disabled during scheduled system maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We are currently performing essential platform updates to improve your experience. 
              You will be able to create new listings once the maintenance is complete.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/marketplace")}>
              Return to Marketplace
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
    if (e) e.preventDefault();

    if (maintenanceMode && status === 'available') {
      toast.error("New listings are currently disabled due to platform maintenance.");
      return;
    }
    
    if (status === 'available' && !validateForm()) {
      toast.error("Please fix the errors before publishing");
      return;
    }

    // For drafts, we only need a title
    if (status === 'draft' && !formData.title) {
      toast.error("Please enter at least a title to save a draft");
      setErrors({ title: "Title is required for drafts" });
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
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        condition: formData.condition,
        location: formData.location,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions,
        voltage: formData.voltage,
        co2Savings: parseFloat(formData.co2Savings) || 0,
        images: images.length > 0 ? images : ["https://picsum.photos/seed/" + listingId + "/800/600"],
        status: status,
        listingType: formData.listingType,
        shippingOptions: formData.shippingOptions,
        shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : 0,
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
            {maintenanceMode && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-500">Maintenance Mode Active</p>
                  <p className="text-xs text-amber-500/80">Publishing new listings is temporarily disabled. You can still save drafts.</p>
                </div>
              </div>
            )}
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
                <div className="grid gap-2">
                  <Label htmlFor="voltage">Operating Voltage (V)</Label>
                  <Input 
                    id="voltage" 
                    placeholder="e.g. 230V, 400V 3PH" 
                    className="rounded-xl"
                    value={formData.voltage}
                    onChange={(e) => setFormData({...formData, voltage: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>
                    Category *
                  </Label>
                  <Select onValueChange={(v) => {
                    setFormData({...formData, category: v});
                    if (errors.category) setErrors({...errors, category: ""});
                  }}>
                    <SelectTrigger className={`rounded-xl ${errors.category ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={`create-cat-${c}`} value={c}>{c}</SelectItem>
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

              <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <Label className="text-base font-bold">Shipping & Logistics</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Available Methods</Label>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'collection', label: 'Collection Only' },
                        { id: 'standard', label: 'Standard Shipping' },
                        { id: 'express', label: 'Express Shipping' },
                        { id: 'international', label: 'International' }
                      ].map((opt) => (
                        <label key={`create-ship-${opt.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/20 cursor-pointer transition-colors border border-transparent hover:border-border">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-border bg-muted/20 text-primary focus:ring-primary"
                            checked={formData.shippingOptions.includes(opt.id as any)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                shippingOptions: checked 
                                  ? [...prev.shippingOptions, opt.id as any]
                                  : prev.shippingOptions.filter(o => o !== opt.id)
                              }));
                            }}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="shippingCost" className="text-xs text-muted-foreground uppercase tracking-wider">Base Shipping Cost (£)</Label>
                    <Input 
                      id="shippingCost" 
                      type="number" 
                      placeholder="0.00" 
                      className="rounded-xl"
                      value={formData.shippingCost}
                      onChange={(e) => setFormData({...formData, shippingCost: e.target.value})}
                      disabled={formData.shippingOptions.length === 1 && formData.shippingOptions.includes('collection')}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Set to 0 if shipping is included or for collection only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Asset Images / Gallery</Label>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{images.length}/8 images</span>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {images.map((img, idx) => (
                    <div key={`create-img-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-border group bg-muted/20">
                      <img src={img} alt={`Asset ${idx}`} className="h-full w-full object-cover" />
                      
                      {/* Badge for Primary */}
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary text-[8px] font-black uppercase tracking-widest text-white shadow-lg border border-primary-foreground/20">
                          Primary Asset
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 px-4">
                        <Button 
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(idx)}
                          className="w-full h-8 rounded-full text-[10px] font-black uppercase tracking-widest"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Remove
                        </Button>
                        
                        {idx !== 0 && (
                          <Button 
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setPrimaryImage(idx)}
                            className="w-full h-8 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white border-none"
                          >
                            Set Primary
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all duration-300 bg-muted/5 hover:bg-muted/10 relative group">
                      {uploading ? (
                        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-2">
                            <ImagePlus className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Data</span>
                          <span className="text-[8px] text-muted-foreground/60 mt-1">Multi-upload</span>
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
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Max 5MB per capture. The 'Primary Asset' image will characterize this listing in the marketplace.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-6 flex flex-col sm:flex-row gap-4">
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
                  className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90 shadow-md shadow-primary/10" 
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
