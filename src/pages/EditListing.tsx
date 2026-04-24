import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, db, doc, getDoc, updateDoc, handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
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
  ArrowLeft, 
  Loader2, 
  HelpCircle, 
  Trash2, 
  AlertCircle,
  FileText,
  FileUp,
  X,
  Globe,
  Clock,
  Plus,
  History,
  CheckCircle2,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Listing, LedgerEvent } from "@/types";
import { scanAssetDocument, AssetVerificationResult } from "@/services/geminiService";
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
    dimensions: "",
    tags: [] as string[],
    shippingOptions: [] as ('collection' | 'standard' | 'express' | 'international')[],
    shippingCost: ""
  });
  const [images, setImages] = useState<{url: string, file?: File}[]>([]);
  const [documents, setDocuments] = useState<{name: string, url: string, type: string, file?: File}[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [verificationData, setVerificationData] = useState<AssetVerificationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [newEvent, setNewEvent] = useState<Partial<LedgerEvent>>({
    event: "",
    desc: "",
    status: "",
    type: "maintenance"
  });

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
            dimensions: data.dimensions || "",
            tags: data.tags || [],
            shippingOptions: data.shippingOptions || ['collection'],
            shippingCost: data.shippingCost?.toString() || ""
          });
          setImages(data.images?.map(url => ({ url })) || []);
          setDocuments(data.documents?.map(doc => ({ ...doc })) || []);
          setLedger(data.ledger || []);
          if (data.verificationData) {
            setVerificationData({
              title: data.title,
              category: data.category,
              verificationScore: data.verificationData.score,
              esgAnalysis: data.verificationData.analysis,
              specs: {}
            });
          }
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

    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 5000 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, { url, file }]);
    });

    toast.success("Images added");
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const target = prev[index];
      if (target.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
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

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setDocuments(prev => [...prev, {
        name: file.name,
        url,
        type: file.type,
        file
      }]);
    });
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addLedgerEvent = () => {
    if (!newEvent.event || !newEvent.desc) {
      toast.error("Please provide event title and description");
      return;
    }

    const eventToAdd: LedgerEvent = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase(),
      event: newEvent.event!,
      desc: newEvent.desc!,
      status: newEvent.status || "Logged",
      type: newEvent.type as any || "maintenance"
    };

    setLedger(prev => [eventToAdd, ...prev]);
    setNewEvent({
      event: "",
      desc: "",
      status: "",
      type: "maintenance"
    });
    toast.success("Event added to ledger");
  };

  const removeLedgerEvent = (eventId: string) => {
    setLedger(prev => prev.filter(e => e.id !== eventId));
  };

  const handleSmartScan = async () => {
    const fileToScan = documents[0]?.file || images[0]?.file;
    if (!fileToScan) {
      toast.error("Please upload a new technical document or nameplate image to re-scan.");
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading("HiX-AI Intelligence Node re-scanning technical lineage...");

    try {
      const result = await scanAssetDocument(fileToScan);
      setVerificationData(result);
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        category: result.category || prev.category,
        weight: result.specs.weight ? result.specs.weight.replace(/[^0-9.]/g, '') : prev.weight,
        dimensions: result.specs.dimensions || prev.dimensions,
        description: result.esgAnalysis ? `${result.esgAnalysis}\n\n${result.title} technical audit update.` : prev.description
      }));
      
      toast.success("HiX-AI node re-sync successful.", { id: toastId });
    } catch (error) {
      console.error("Smart Scan Error:", error);
      toast.error("Intelligence node failed to re-parse document.", { id: toastId });
    } finally {
      setIsScanning(false);
    }
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
      // Upload New Images
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.file) {
          const imgRef = ref(storage, `listings/${id}/images/image_${i}_${Date.now()}`);
          await uploadBytes(imgRef, image.file);
          const downloadUrl = await getDownloadURL(imgRef);
          imageUrls.push(downloadUrl);
        } else {
          imageUrls.push(image.url);
        }
      }

      // Upload New Documents
      const finalDocs: {name: string, url: string, type: string}[] = [];
      for (const docInfo of documents) {
        if (docInfo.file) {
          const docRef = ref(storage, `listings/${id}/dpp/${docInfo.name}`);
          await uploadBytes(docRef, docInfo.file);
          const downloadUrl = await getDownloadURL(docRef);
          finalDocs.push({
            name: docInfo.name,
            url: downloadUrl,
            type: docInfo.type
          });
        } else {
          finalDocs.push({
            name: docInfo.name,
            url: docInfo.url,
            type: docInfo.type
          });
        }
      }

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
        images: imageUrls,
        documents: finalDocs,
        ledger: ledger,
        shippingOptions: formData.shippingOptions,
        shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : 0,
        verificationData: verificationData ? {
          score: verificationData.verificationScore,
          analysis: verificationData.esgAnalysis,
          verifiedAt: new Date().toISOString(),
          verifiedBy: "HiX-AI"
        } : null,
        tags: formData.tags || [],
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Edit Listing</h1>
        
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
                  <div className="flex items-center gap-2">
                    {verificationData && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        AI Verified ({verificationData.verificationScore}%)
                      </Badge>
                    )}
                    <span className={`text-[10px] font-medium ${formData.title.length > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                      {formData.title.length}/100
                    </span>
                  </div>
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
                
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="tags" className="text-[10px] uppercase font-black tracking-widest opacity-60">Asset Tags / Keywords</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 rounded-lg bg-primary/10 border-primary/20 text-primary">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-primary/20 rounded-full"
                          onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add tags (e.g. Siemens, 3-Phase, Heavy Duty)"
                      className="rounded-xl border-primary/20 bg-primary/5 focus:bg-background"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          if (!formData.tags.includes(tagInput.trim())) {
                            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                          }
                          setTagInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-primary/20"
                      onClick={() => {
                        if (tagInput.trim()) {
                          if (!formData.tags.includes(tagInput.trim())) {
                            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                          }
                          setTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Press enter to add tags for better discoverability.</p>
                </div>

                <Button 
                   type="button" 
                   variant="outline" 
                   className="w-full rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-black uppercase tracking-tighter italic h-10 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                   onClick={handleSmartScan}
                   disabled={isScanning || (documents.length === 0 && images.length === 0)}
                 >
                   {isScanning ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Intelligence Node Syncing...
                     </>
                   ) : (
                     <>
                       <Sparkles className="mr-2 h-4 w-4 text-primary" />
                       Re-Scan Attachment (AI Spec Audit)
                     </>
                   )}
                 </Button>
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
                        <SelectItem key={`edit-cat-${c}`} value={c}>{c}</SelectItem>
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
                        <label key={`edit-ship-${opt.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
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
                    <div key={`edit-img-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-muted/20">
                      <img src={img.url} alt={`Asset ${idx}`} className="h-full w-full object-cover" />
                      
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
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all duration-300 bg-white/5 hover:bg-white/10 relative group">
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

              {/* DPP Technical Documentation Section */}
              <div className="space-y-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                {/* ... existing document code ... */}
              </div>

              {/* Asset Lifecycle Ledger Management */}
              <div className="space-y-6 p-6 rounded-3xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20">
                      <History className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Active Lifecycle Ledger</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Chronological Asset Verification</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 p-4 rounded-2xl bg-background/50 border border-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Log New Event</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Event Title</Label>
                        <Input 
                          placeholder="e.g. Annual Maintenance" 
                          value={newEvent.event}
                          onChange={e => setNewEvent({...newEvent, event: e.target.value})}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status Label</Label>
                        <Input 
                          placeholder="e.g. Verified, Completed" 
                          value={newEvent.status}
                          onChange={e => setNewEvent({...newEvent, status: e.target.value})}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
                      <Textarea 
                        placeholder="Detail the work performed, certifications obtained, etc..." 
                        value={newEvent.desc}
                        onChange={e => setNewEvent({...newEvent, desc: e.target.value})}
                        className="rounded-xl min-h-[80px] text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Select value={newEvent.type} onValueChange={v => setNewEvent({...newEvent, type: v as any})}>
                          <SelectTrigger className="rounded-xl text-xs h-10">
                            <SelectValue placeholder="Event Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="audit">Industrial Audit</SelectItem>
                            <SelectItem value="maintenance">Maintenance Log</SelectItem>
                            <SelectItem value="certification">Certification</SelectItem>
                            <SelectItem value="transfer">Ownership Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button" 
                        onClick={addLedgerEvent} 
                        className="rounded-full gap-2 px-6 h-10"
                      >
                        <Plus className="h-4 w-4" />
                        Add Node
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Current History ({ledger.length})</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {ledger.map((item) => (
                        <div key={item.id} className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono text-primary/60 font-bold">{item.date}</span>
                              <Badge variant="outline" className="text-[8px] h-4 border-white/10 uppercase font-bold rounded-none">
                                {item.status}
                              </Badge>
                            </div>
                            <h4 className="text-xs font-bold uppercase truncate">{item.event}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{item.desc}</p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeLedgerEvent(item.id)}
                            className="hidden group-hover:flex h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
