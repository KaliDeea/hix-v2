import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, query, where, handleFirestoreError, OperationType, addDoc, serverTimestamp } from "@/lib/firebase";
import { HaulingCompany, HaulingQuoteRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Plus,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function Hauling() {
  const { user, profile } = useAuth();
  const [partners, setPartners] = useState<HaulingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<HaulingCompany | null>(null);
  
  const [quoteData, setQuoteData] = useState({
    origin: "",
    destination: "",
    assetDescription: "",
    weight: "",
    dimensions: "",
    preferredDate: ""
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const [applyData, setApplyData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    fleetSize: "",
    specializations: "",
    insuranceDetails: ""
  });
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  useEffect(() => {
    const path = "hauling_partners";
    const q = query(collection(db, path), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HaulingCompany[];
      setPartners(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));

    return () => unsub();
  }, []);

  const handleQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPartner) return;

    setIsSubmittingQuote(true);
    const path = "hauling_quotes";
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        ...quoteData,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Quote request sent to " + selectedPartner.name);
      setIsQuoteModalOpen(false);
      setQuoteData({
        origin: "",
        destination: "",
        assetDescription: "",
        weight: "",
        dimensions: "",
        preferredDate: ""
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handlePartnerApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApply(true);
    const path = "hauling_partner_applications";
    try {
      await addDoc(collection(db, path), {
        ...applyData,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Application submitted! We will review your details shortly.");
      setIsApplyModalOpen(false);
      setApplyData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        fleetSize: "",
        specializations: "",
        insuranceDetails: ""
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Industrial Hauling Partners</h1>
            <p className="text-lg text-muted-foreground">
              Specialized logistics for heavy machinery and industrial assets.
            </p>
          </div>
          <Button className="rounded-full h-12 px-8 gap-2" onClick={() => setIsApplyModalOpen(true)}>
            <Plus className="h-5 w-5" />
            Become a Partner
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id} className="glass flex flex-col group hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold">{partner.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{partner.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {partner.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {partner.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-white/5 text-[10px]">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Fully Insured & Vetted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{partner.fleetSize} Vehicles in Fleet</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 border-t border-white/5">
                  <Button 
                    className="w-full rounded-full" 
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsQuoteModalOpen(true);
                    }}
                  >
                    Request Quote
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {partners.length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-3xl">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No partners found</h3>
                <p className="text-muted-foreground">We're currently onboarding specialized hauling partners.</p>
              </div>
            )}
          </div>
        )}

        {/* Quote Modal */}
        <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
          <DialogContent className="glass sm:max-w-[500px]">
            <form onSubmit={handleQuoteRequest}>
              <DialogHeader>
                <DialogTitle>Request Hauling Quote</DialogTitle>
                <DialogDescription>
                  Get a specialized logistics quote from {selectedPartner?.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="origin">Origin (Postcode/City)</Label>
                    <Input 
                      id="origin" 
                      placeholder="e.g. NE1 1AA" 
                      value={quoteData.origin}
                      onChange={(e) => setQuoteData({...quoteData, origin: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input 
                      id="destination" 
                      placeholder="e.g. London, UK" 
                      value={quoteData.destination}
                      onChange={(e) => setQuoteData({...quoteData, destination: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="asset">Asset Description</Label>
                  <Textarea 
                    id="asset" 
                    placeholder="What needs to be moved? (e.g. 50T Hydraulic Press)" 
                    value={quoteData.assetDescription}
                    onChange={(e) => setQuoteData({...quoteData, assetDescription: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number"
                      placeholder="e.g. 1500" 
                      value={quoteData.weight}
                      onChange={(e) => setQuoteData({...quoteData, weight: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={quoteData.preferredDate}
                      onChange={(e) => setQuoteData({...quoteData, preferredDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-full" disabled={isSubmittingQuote}>
                  {isSubmittingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Quote Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Apply Modal */}
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogContent className="glass sm:max-w-[600px]">
            <form onSubmit={handlePartnerApply}>
              <DialogHeader>
                <DialogTitle>Become a Hauling Partner</DialogTitle>
                <DialogDescription>
                  Join the HiX logistics network and access industrial hauling opportunities.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      value={applyData.companyName}
                      onChange={(e) => setApplyData({...applyData, companyName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input 
                      id="contactPerson" 
                      value={applyData.contactPerson}
                      onChange={(e) => setApplyData({...applyData, contactPerson: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={applyData.email}
                      onChange={(e) => setApplyData({...applyData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={applyData.phone}
                      onChange={(e) => setApplyData({...applyData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specializations">Specializations (e.g. Heavy Lift, Abnormal Loads)</Label>
                  <Input 
                    id="specializations" 
                    placeholder="Comma separated list"
                    value={applyData.specializations}
                    onChange={(e) => setApplyData({...applyData, specializations: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insurance">Insurance & Certification Details</Label>
                  <Textarea 
                    id="insurance" 
                    placeholder="Provide details about your goods-in-transit and public liability insurance..." 
                    value={applyData.insuranceDetails}
                    onChange={(e) => setApplyData({...applyData, insuranceDetails: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-full" disabled={isSubmittingApply}>
                  {isSubmittingApply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
