import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Send, 
  ShieldCheck, 
  Leaf, 
  BarChart3, 
  Globe, 
  ChevronRight,
  Download,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addDoc, collection, db, serverTimestamp, handleFirestoreError, OperationType } from "@/lib/firebase";

export default function Whitepaper() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    interestReason: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "whitepaper_requests"), {
        ...formData,
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      setIsSubmitted(true);
      toast.success("Request submitted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "whitepaper_requests");
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass p-12 rounded-[2.5rem] text-center border-primary/20"
        >
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Request Received</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Thank you for your interest in HiX. Our team is reviewing your request and will send the whitepaper to <span className="text-primary font-bold">{formData.email}</span> within 24 hours.
          </p>
          <Button asChild className="w-full rounded-2xl h-12">
            <a href="/">Back to Home</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 bg-primary/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-primary/5 to-transparent blur-3xl" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-[0.2em] text-primary"
              >
                <FileText className="h-3 w-3" />
                Technical Whitepaper 2026
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]"
              >
                Revolutionizing <br />
                <span className="text-primary">Industrial</span> <br />
                Circular Economy
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-xl leading-relaxed italic font-serif"
              >
                An in-depth analysis of high-intensity asset reuse, carbon abatement methodologies, and the future of industrial procurement through the HiX ecosystem.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-dark border-white/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">45 Pages of Analysis</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-dark border-white/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">Vetted Methodologies</span>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="relative hidden lg:block"
            >
              <div className="aspect-[3/4] rounded-[3rem] bg-zinc-900 shadow-2xl p-8 border border-white/10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-foreground">H</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 text-white">Confidential / Partners Only</div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-white tracking-tighter uppercase leading-none">THE HIX <br /> ECOSYSTEM</h2>
                    <p className="text-xs text-zinc-400 font-mono tracking-tighter">VERSION 2.4 // QUARTER 2 2026</p>
                  </div>

                  <div className="space-y-6">
                    <div className="h-[1px] w-full bg-white/20" />
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-primary">Carbon Abatement</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="h-full bg-primary" 
                             />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-primary">Market Reach</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "92%" }}
                                transition={{ duration: 2, delay: 0.7 }}
                                className="h-full bg-primary" 
                             />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Overview */}
      <section className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Leaf,
              title: "Sustainability",
              desc: "How circular economy models in heavy industry can reduce Scope 3 emissions by up to 65%."
            },
            {
              icon: BarChart3,
              title: "Financial Impact",
              desc: "Cost-benefit analysis of secondhand asset acquisition vs. new equipment lead times."
            },
            {
              icon: Globe,
              title: "Global Supply",
              desc: "Addressing industrial scarcity through regional redistribution and smart logistics."
            }
          ].map((item, i) => (
            <motion.div
              key={`overview-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[2rem] border-primary/10 hover:border-primary/30 transition-all group"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 mt-32">
        <div className="max-w-6xl mx-auto glass rounded-[3rem] overflow-hidden border-primary/20 relative">
          <div className="grid lg:grid-cols-2">
            <div className="p-12 lg:p-20 space-y-8 bg-zinc-900 text-white">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">Request Access</h2>
                <p className="text-zinc-400 leading-relaxed italic font-serif">
                  Our whitepaper is exclusive to registered industrial partners, institutional investors, and sustainability researchers. Please provide your professional details to request a secure copy.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  "Detailed CO2 abatement calculation models",
                  "Cross-industry resource efficiency benchmarks",
                  "Blockchain verification of asset lifecycles",
                  "Q3 2026 Market projections"
                ].map((feature, i) => (
                  <div key={`feature-${i}`} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 mt-8 border-t border-white/10 flex items-center gap-4 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                <Lock className="h-4 w-4" />
                Secure distribution via encrypted link
              </div>
            </div>

            <div className="p-12 lg:p-20 bg-background/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Jane Doe" 
                      required 
                      className="rounded-xl border-primary/20 bg-primary/5 focus:bg-background"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60">Business Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="jane@company.com" 
                      required 
                      className="rounded-xl border-primary/20 bg-primary/5 focus:bg-background"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest opacity-60">Company</Label>
                    <Input 
                      id="company" 
                      placeholder="Acme Industrial" 
                      required 
                      className="rounded-xl border-primary/20 bg-primary/5 focus:bg-background"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-[10px] font-black uppercase tracking-widest opacity-60">Job Title</Label>
                    <Input 
                      id="jobTitle" 
                      placeholder="Head of Sustainability" 
                      className="rounded-xl border-primary/20 bg-primary/5 focus:bg-background"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-[10px] font-black uppercase tracking-widest opacity-60">Reason for Interest</Label>
                  <Textarea 
                    id="interest" 
                    placeholder="Tell us why you are interested in this research..." 
                    className="rounded-2xl border-primary/20 bg-primary/5 focus:bg-background min-h-[120px] resize-none"
                    value={formData.interestReason}
                    onChange={(e) => setFormData({ ...formData, interestReason: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Request Access
                      <Send className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground uppercase font-medium tracking-tight">
                  By submitting, you agree to our terms of information use and professional vetting.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
