import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, Leaf, ShieldCheck, Zap, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/firebase";

const MotionButton = motion.create(Button);

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen page-transition bg-background text-foreground overflow-x-hidden">
      {/* Hero Section - Refined Professional Look */}
      <section className="relative pt-20 pb-24 sm:pb-32 overflow-hidden border-b border-border bg-gradient-to-b from-muted/30 to-background max-w-full px-4 sm:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col items-center gap-12 lg:gap-16 max-w-4xl mx-auto">
            <div className="space-y-8 text-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 flex flex-col items-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Vetted Industrial Exchange</span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto">
                  Infrastructure for <br className="hidden sm:block" />
                  <span className="text-primary italic font-serif">Circular</span> Liquidity.
                </h1>
                
                <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed px-4">
                  The HiX network connects industrial clusters across the UK, allowing firms to trade surplus machinery with verified accuracy and secure settlement.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto rounded-full px-10 h-14 font-semibold shadow-lg shadow-primary/20"
                    onClick={() => navigate(user ? "/dashboard" : "/auth?tab=register")}
                  >
                    {user ? "View Dashboard" : "Get Started"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto rounded-full px-10 h-14 font-semibold"
                    onClick={() => navigate("/marketplace")}
                  >
                    Browse Assets
                  </Button>
                </div>

                <div className="pt-12 border-t border-border mt-12 w-full max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Trusted by:</div>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-8 opacity-60 font-black text-sm uppercase tracking-tighter">
                      <span>Cluster-Tees</span>
                      <span>H-Energy</span>
                      <span>UK-Steel</span>
                      <span>Marine-Procure</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="w-full max-w-4xl relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-border"
              >
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070" 
                  alt="Industrial Precision"
                  className="w-full aspect-[21/9] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sustainability Node</span>
                  </div>
                  <p className="text-lg font-serif italic">"Decarbonizing industrial procurement through secondary market liquidity."</p>
                </div>
              </motion.div>
              {/* Decorative background element - positioned more safely */}
              <div className="absolute -z-10 -top-12 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Assets Verified", val: "12,400+", icon: <Zap className="h-5 w-5" /> },
              { label: "Carbon Offset", val: "1.2M kg", icon: <Leaf className="h-5 w-5" /> },
              { label: "Network Growth", val: "24% MoM", icon: <Globe className="h-5 w-5" /> },
              { label: "Settlement Time", val: "Instant", icon: <ShieldCheck className="h-5 w-5" /> }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-2 p-6 rounded-3xl bg-muted/20 md:bg-transparent"
              >
                <div className="text-primary mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold tracking-tighter">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 md:py-32 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col gap-12 lg:gap-16 items-center">
            <div className="w-full flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Designed for <span className="text-primary italic font-serif">Professionals.</span></h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                The HiX Dashboard provides the technical tools required for complex industrial inventory management and ESG reporting.
              </p>
              <Button variant="outline" className="rounded-full mb-16" asChild>
                <Link to="/about">Our Protocol v4.0</Link>
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
              {[
                { title: "KYB Compliance", desc: "Rigorous manual vetting for all participating firms ensuring ecosystem integrity." },
                { title: "AI Smart Match", desc: "Automated semantic matching engine connects RFAs with inventory in real-time." },
                { title: "Digital Passport", desc: "Every asset includes a Digital Product Passport (DPP) for ESG and technical lineage." },
                { title: "B2B Negotiation", desc: "Structured negotiation protocols built specifically for high-value industrial trades." }
              ].map(item => (
                <div key={item.title} className="p-8 md:p-10 bg-background border border-border rounded-3xl hover:border-primary transition-all shadow-sm">
                  <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
