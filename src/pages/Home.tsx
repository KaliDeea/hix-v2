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
    <div className="flex flex-col min-h-[calc(100vh-5rem)] page-transition bg-background text-foreground overflow-x-hidden">
      {/* Hero Section - Refined Professional Look */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-border bg-gradient-to-b from-muted/30 to-background w-full">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Vetted Industrial Exchange</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                  Infrastructure for <br className="hidden sm:block" />
                  <span className="text-primary italic font-serif">Circular</span> Liquidity.
                </h1>
                
                <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  The HiX network connects industrial clusters across the UK, allowing firms to trade surplus machinery with verified accuracy and secure settlement.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
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

                <div className="flex items-center justify-center lg:justify-start gap-6 pt-8 border-t border-border mt-12 overflow-x-auto no-scrollbar whitespace-nowrap">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-40">Trusted by:</div>
                  <div className="flex gap-8 opacity-60 font-black text-sm uppercase tracking-tighter">
                    <span>Cluster-Tees</span>
                    <span>H-Energy</span>
                    <span>UK-Steel</span>
                    <span>Marine-Procure</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-border"
              >
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070" 
                  alt="Industrial Precision"
                  className="w-full aspect-[4/3] object-cover"
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
              {/* Decorative background element */}
              <div className="absolute -z-10 -top-12 -right-12 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
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
                className="text-center md:text-left space-y-2 p-6 rounded-3xl bg-muted/20 md:bg-transparent"
              >
                <div className="text-primary mb-4 flex justify-center md:justify-start">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold tracking-tighter">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            <div className="lg:w-1/3 lg:sticky lg:top-32 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Designed for <br className="hidden md:block" /><span className="text-primary">Professionals.</span></h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                The HiX Dashboard provides the technical tools required for complex industrial inventory management and ESG reporting.
              </p>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/about">Our Protocol v4.0</Link>
              </Button>
            </div>
            
            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6 w-full">
              {[
                { title: "KYB Compliance", desc: "Rigorous manual vetting for all participating firms ensuring ecosystem integrity." },
                { title: "Smart Logistics", desc: "Route optimization for industrial haulage minimizing cluster-to-cluster emissions." },
                { title: "Asset Identity", desc: "Every piece of machinery is assigned a digital twin for lifecycle tracking." },
                { title: "Stripe Settlement", desc: "Enterprise-grade financial routing with secure escrow and multi-party splits." }
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
