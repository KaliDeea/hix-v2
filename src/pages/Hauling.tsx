import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Truck, ShieldCheck, Mail, MapPin, Plus, Loader2 } from "lucide-react";
import { HaulingCompany } from "@/types";
import { useAuth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function Hauling() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedHauler, setSelectedHauler] = useState<HaulingCompany | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const [quoteData, setQuoteData] = useState({
    origin: "",
    destination: "",
    assetDetails: ""
  });

  const [applyData, setApplyData] = useState({
    companyName: "",
    contactEmail: "",
    phoneNumber: "",
    description: "",
    fleetSize: "",
    specializations: ""
  });

  const haulers: HaulingCompany[] = [
    {
      id: "h1",
      name: "Hartlepool Heavy Haulage",
      description: "Specializing in oversized industrial machinery transport across the UK.",
      contactEmail: "transport@hartlepool-haulage.co.uk",
      isVetted: true
    },
    {
      id: "h2",
      name: "Northern Logistics Group",
      description: "Full-service logistics for raw materials and chemical transport.",
      contactEmail: "quotes@northernlogistics.com",
      isVetted: true
    },
    {
      id: "h3",
      name: "EuroLink Industrial",
      description: "Cross-border industrial transport specialists for European trades.",
      contactEmail: "eu@eurolink.com",
      isVetted: true
    }
  ];

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedHauler) return;
    if (!profile?.isVetted) {
      toast.error("Your account must be vetted before requesting quotes.");
      return;
    }

    setLoading(true);
    const path = "hauling_quotes";
    try {
      await addDoc(collection(db, path), {
        haulerId: selectedHauler.id,
        haulerName: selectedHauler.name,
        userId: user.uid,
        userName: profile.companyName,
        userEmail: user.email,
        origin: quoteData.origin,
        destination: quoteData.destination,
        assetDetails: quoteData.assetDetails,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Quote request sent successfully!");
      setIsQuoteModalOpen(false);
      setQuoteData({ origin: "", destination: "", assetDetails: "" });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to apply.");
      return;
    }

    setLoading(true);
    const path = "hauling_applications";
    try {
      await addDoc(collection(db, path), {
        companyName: applyData.companyName,
        contactEmail: applyData.contactEmail,
        phoneNumber: applyData.phoneNumber,
        description: applyData.description,
        fleetSize: parseInt(applyData.fleetSize) || 0,
        specializations: applyData.specializations.split(",").map(s => s.trim()),
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Application submitted successfully!");
      setIsApplyModalOpen(false);
      setApplyData({
        companyName: "",
        contactEmail: "",
        phoneNumber: "",
        description: "",
        fleetSize: "",
        specializations: ""
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Vetted Hauling Partners</h1>
        <p className="text-muted-foreground">
          Connect with our list of vetted hauling companies specializing in industrial transport. 
          All partners are verified for insurance and safety compliance.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {haulers.map((hauler) => (
          <Card key={hauler.id} className="glass overflow-hidden flex flex-col">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Truck className="h-6 w-6 text-primary" />
                {hauler.isVetted && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Vetted Partner
                  </Badge>
                )}
              </div>
              <CardTitle>{hauler.name}</CardTitle>
              <CardDescription>{hauler.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {hauler.contactEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Hartlepool, UK
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Dialog open={isQuoteModalOpen && selectedHauler?.id === hauler.id} onOpenChange={(open) => {
                if (!open) setIsQuoteModalOpen(false);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full rounded-full" 
                    variant="outline"
                    onClick={() => {
                      setSelectedHauler(hauler);
                      setIsQuoteModalOpen(true);
                    }}
                  >
                    Request Quote
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass sm:max-w-[425px]">
                  <form onSubmit={handleRequestQuote}>
                    <DialogHeader>
                      <DialogTitle>Request Quote from {hauler.name}</DialogTitle>
                      <DialogDescription>
                        Provide transport details to receive a competitive quote.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="origin">Origin Address</Label>
                        <Input 
                          id="origin" 
                          placeholder="Full pickup address" 
                          value={quoteData.origin}
                          onChange={(e) => setQuoteData({...quoteData, origin: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="destination">Destination Address</Label>
                        <Input 
                          id="destination" 
                          placeholder="Full delivery address" 
                          value={quoteData.destination}
                          onChange={(e) => setQuoteData({...quoteData, destination: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="details">Asset Details</Label>
                        <Textarea 
                          id="details" 
                          placeholder="Weight, dimensions, and type of asset..." 
                          value={quoteData.assetDetails}
                          onChange={(e) => setQuoteData({...quoteData, assetDetails: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full rounded-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Request
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-20 glass rounded-3xl p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Are you a hauling company?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join our network of vetted industrial transport partners and connect with businesses across the UK and Europe.
        </p>
        
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-8">Apply to be a Partner</Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-[600px]">
            <form onSubmit={handleApply}>
              <DialogHeader>
                <DialogTitle>Partner Application</DialogTitle>
                <DialogDescription>
                  Tell us about your hauling business to start the vetting process.
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
                    <Label htmlFor="email">Contact Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={applyData.contactEmail}
                      onChange={(e) => setApplyData({...applyData, contactEmail: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={applyData.phoneNumber}
                      onChange={(e) => setApplyData({...applyData, phoneNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fleet">Fleet Size</Label>
                    <Input 
                      id="fleet" 
                      type="number"
                      value={applyData.fleetSize}
                      onChange={(e) => setApplyData({...applyData, fleetSize: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specializations">Specializations (comma separated)</Label>
                  <Input 
                    id="specializations" 
                    placeholder="Heavy machinery, Chemicals, Oversized..." 
                    value={applyData.specializations}
                    onChange={(e) => setApplyData({...applyData, specializations: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Business Description</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Describe your services and experience..." 
                    value={applyData.description}
                    onChange={(e) => setApplyData({...applyData, description: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
