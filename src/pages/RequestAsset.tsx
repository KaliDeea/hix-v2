import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, where } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ClipboardList, 
  Search, 
  Sparkles, 
  HardHat, 
  Calendar, 
  PoundSterling, 
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Building2,
  Cpu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { scanAssetDocument, AssetVerificationResult, matchMarketplaceInventory } from "@/services/geminiService";

export default function RequestAsset() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: location.state?.title || "",
    description: location.state?.description || "",
    budget: "",
    deadline: "",
    technicalSpecs: location.state?.technicalSpecs || ""
  });

  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleAiScan = async () => {
    if (!formData.description && !formData.title) {
      toast.error("Please provide requirements first");
      return;
    }

    setIsAiMatching(true);
    const toastId = toast.loading("Industrial Procurement Agent scanning global buffer for technical matches...");

    try {
      // 1. Fetch current listings
      const listingsSnap = await getDocs(query(collection(db, "listings"), where("status", "==", "available")));
      const availableAssets = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // 2. Use the centralized matching service
      const requirementsStr = `Target: ${formData.title}. Details: ${formData.description}. Critical Specs: ${formData.technicalSpecs}. Deadline: ${formData.deadline}. Budget: £${formData.budget}`;
      const result = await matchMarketplaceInventory(requirementsStr, availableAssets);

      const matchedAssets = result.matches
        .map((m: any) => {
          const asset = availableAssets.find(a => a.id === m.listingId);
          return asset ? { ...asset, ...m, score: m.confidenceScore, reasoning: m.matchReason } : null;
        })
        .filter(Boolean);

      setMatches(matchedAssets);
      if (matchedAssets.length > 0) {
        toast.success(`Semantic scan complete. Found ${matchedAssets.length} verified matches.`, { id: toastId });
      } else {
        toast.info("No immediate matches found in the current inventory. Your RFA will be matched as new assets arrive.", { id: toastId });
      }
      return matchedAssets;
    } catch (error) {
      console.error("AI Matching Error:", error);
      toast.error("Failed to connect to the marketplace matching node.", { id: toastId });
      return [];
    } finally {
      setIsAiMatching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "asset_requests"), {
        userId: user.uid,
        companyName: profile?.companyName || "Anonymous Buyer",
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget) || 0,
        deadline: formData.deadline,
        technicalSpecs: formData.technicalSpecs,
        status: "active",
        createdAt: serverTimestamp()
      });

      toast.success("Request for Asset (RFA) published.");
      
      // Automatically scan for matches after submission
      const foundMatches = await handleAiScan();
      
      if (foundMatches && foundMatches.length > 0) {
        setShowSuccess(true);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("RFA Submission Error:", error);
      toast.error("Failed to post request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background font-sans selection:bg-primary/30 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full"
        >
          <Card className="glass hardware-surface border-primary/20 overflow-hidden rounded-3xl shadow-2xl">
            <div className="bg-primary/10 p-12 text-center border-b border-primary/20 relative">
              <div className="absolute top-4 right-4">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">RFA Published <span className="text-primary not-italic">Successfully</span></h2>
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                Our AI Agent has discovered {matches.length} compatible units in the marketplace buffer.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="space-y-4 mb-8">
                {matches.map((match, i) => (
                  <motion.div
                    key={`success-match-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="glass-dark border-primary/20 hover:border-primary/50 transition-all group overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-4 gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-emerald-500/20 text-emerald-500 font-mono text-[9px] rounded-none border-emerald-500/30 font-black">
                              {match.score}% MATCH
                            </Badge>
                            <span className="font-bold text-sm uppercase tracking-tight">{match.title}</span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase leading-tight italic truncate max-w-[400px]">
                            {match.reasoning}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:border-l border-white/5 sm:pl-6">
                          <div className="font-mono text-lg font-black text-primary">£{match.price?.toLocaleString()}</div>
                          <Button size="sm" className="bg-primary hover:bg-primary/80 text-[10px] font-black uppercase rounded-none px-6" asChild>
                            <Link to={`/listing/${match.id}`}>View Unit</Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1 font-mono text-[10px] uppercase rounded-none border-primary/30 h-12" onClick={() => navigate("/dashboard")}>
                  Return to Dashboard
                </Button>
                <Button className="flex-1 font-mono text-[10px] uppercase rounded-none h-12" onClick={() => setShowSuccess(false)}>
                  Submit Another RFA
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 border-l-4 border-primary pl-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-[0.2em] mb-2"
            >
              <Building2 className="h-3 w-3" />
              Procurement Protocol v3.1
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
              Request for <span className="text-primary not-italic">Asset</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
              Define your project requirements. Our AI Agent will scan the global buffer for technical compatibility.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="glass hardware-surface border-primary/20 overflow-hidden rounded-2xl shadow-xl">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Settings className="h-3 w-3 animate-spin-slow" />
                      Project Specification Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid gap-2">
                      <Label htmlFor="title" className="font-mono text-[10px] uppercase opacity-70">Asset Title / Required Unit</Label>
                      <Input 
                        id="title"
                        placeholder="e.g. 50T Industrial Hydraulic Press"
                        className="rounded-xl border-primary/20 bg-primary/5 focus:ring-1 focus:ring-primary font-mono text-sm transition-all"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description" className="font-mono text-[10px] uppercase opacity-70">Project Context & Technical Need</Label>
                      <Textarea 
                        id="description"
                        placeholder="Describe what you need this asset for and any critical constraints..."
                        className="min-h-[150px] rounded-xl border-primary/20 bg-primary/5 focus:ring-1 focus:ring-primary font-mono text-sm resize-none transition-all"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="budget" className="font-mono text-[10px] uppercase opacity-70">Target Budget (£)</Label>
                        <div className="relative">
                          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/60" />
                          <Input 
                            id="budget"
                            type="number"
                            placeholder="0.00"
                            className="pl-9 rounded-xl border-primary/20 bg-primary/5 focus:ring-1 focus:ring-primary font-mono text-sm transition-all"
                            value={formData.budget}
                            onChange={(e) => setFormData({...formData, budget: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deadline" className="font-mono text-[10px] uppercase opacity-70">Operation Deadline</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/60" />
                          <Input 
                            id="deadline"
                            type="date"
                            className="pl-9 rounded-xl border-primary/20 bg-primary/5 focus:ring-1 focus:ring-primary font-mono text-sm transition-all text-muted-foreground uppercase"
                            value={formData.deadline}
                            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="specs" className="font-mono text-[10px] uppercase opacity-70">Critical Components / Dimensions</Label>
                      <Input 
                        id="specs"
                        placeholder="e.g. 400V, 3PH, Min 1200mm Stroke"
                        className="rounded-xl border-primary/20 bg-primary/5 focus:ring-1 focus:ring-primary font-mono text-sm transition-all"
                        value={formData.technicalSpecs}
                        onChange={(e) => setFormData({...formData, technicalSpecs: e.target.value})}
                      />
                    </div>
                  </CardContent>
                  <div className="bg-primary/10 p-4 border-t border-primary/20 flex items-center justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-primary/30 text-primary font-mono text-[10px] uppercase hover:bg-primary/20 rounded-full"
                      onClick={handleAiScan}
                      disabled={isAiMatching}
                    >
                      {isAiMatching ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                      Scan Global Buffer
                    </Button>
                    <Button 
                      type="submit" 
                      className="font-mono text-[10px] uppercase px-8 rounded-full shadow-[0_4px_15px_rgba(var(--primary),0.3)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.4)] transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Submit RFA"}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              </form>

              {/* AI Matches Section */}
              <AnimatePresence>
                {matches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-12 space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="font-mono text-[10px] uppercase text-primary font-bold">AI Diagnostics: Potential Matches</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    
                    <div className="grid gap-4">
                      {matches.map((match, i) => (
                        <Card key={`ai-match-${i}`} className="glass hardware-surface border-primary/20 hover:border-primary/50 transition-colors">
                          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary font-mono text-[10px] rounded-none border-primary/30">
                                  {match.score}% MATCH
                                </Badge>
                                <span className="font-bold text-sm">{match.title}</span>
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground uppercase">{match.reasoning}</p>
                              {match.technicalOverlap && match.technicalOverlap.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {match.technicalOverlap.map((overlap: string, oi: number) => (
                                    <span key={`overlap-${oi}`} className="text-[8px] font-mono bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded italic">
                                      ✓ {overlap}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                              <div className="font-mono text-sm font-bold">£{match.price?.toLocaleString()}</div>
                              <Button size="sm" variant="outline" className="font-mono text-[10px] uppercase" asChild>
                                <Link to={`/listing/${match.id}`}>View Unit</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Sidebar Guidelines */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="glass hardware-surface border-border border-l-primary/50 border-l-2">
                <CardHeader>
                  <CardTitle className="font-mono text-[10px] uppercase tracking-widest text-primary">Procurement Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
                      Requests are broadcasted to vetted sellers matching your criteria.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
                      AI Agent monitors incoming inventory 24/7 for your requirements.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Cpu className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
                      Semantic matching prioritizes compatibility over keywords.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/20 shadow-[0_10px_30px_rgba(245,158,11,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldAlert className="h-16 w-16 text-amber-500" />
                </div>
                <HardHat className="h-12 w-12 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <div className="space-y-1 relative z-10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 drop-shadow-sm">Global Safety Protocol</h4>
                  <p className="text-[10px] font-mono text-amber-600/80 font-bold uppercase tracking-wider leading-relaxed">
                    All RFAs are subject to verification by <br />
                    <span className="text-amber-500">HI-X COMPLIANCE ENGINES</span>
                  </p>
                </div>
                <div className="w-12 h-1 bg-amber-500/30 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
