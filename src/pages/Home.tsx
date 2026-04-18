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
    <div className="flex flex-col min-h-[calc(100vh-5rem)] page-transition bg-background text-foreground">
      {/* Hero Section - Recipe 10.1 B2B SaaS Split & Recipe 11 Giant Typography */}
      <section className="relative flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[85vh]">
        {/* Left Panel: High Impact Typography */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-20 z-10 border-r border-border relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[2px] w-16 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">
                Industrial Exchange Protocol v4.0
              </span>
            </div>
            
            <h1 className="giant-header mb-12 text-foreground">
              INDUSTRIAL <br />
              <span className="text-primary italic font-serif">LIQUIDITY</span> <br />
              DEFINED.
            </h1>
            
            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed font-mono uppercase text-xs tracking-wider mb-12">
              Transform surplus machinery into active working capital. <br />
              The premium marketplace for Net-Zero industrial procurement.
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <MotionButton 
                size="lg" 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="rounded-full px-12 h-16 text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-shadow hover:shadow-primary/40 border-none"
                onClick={() => navigate(user ? "/dashboard" : "/auth?tab=register")}
              >
                {user ? "Go to Dashboard" : "Sign Up"}
                <ArrowRight className="ml-4 h-4 w-4" />
              </MotionButton>
              
              <MotionButton 
                size="lg" 
                variant="outline" 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="rounded-full px-12 h-16 text-[10px] font-bold uppercase tracking-[0.2em] border-border hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => navigate("/marketplace")}
              >
                Marketplace
              </MotionButton>
            </div>
          </motion.div>

          {/* Background Decorative Element */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />
        </div>

        {/* Right Panel: Industrial Precision Imagery */}
        <div className="flex-1 relative bg-muted/10 overflow-hidden group">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full w-full"
          >
            <img 
              src="https://images.unsplash.com/photo-1513828742140-ccaa28f3eda0?auto=format&fit=crop&q=80&w=2070" 
              alt="Industrial Precision"
              className="w-full h-full object-cover brightness-75 grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[2s] ease-in-out"
              referrerPolicy="no-referrer"
            />
            {/* Overlay Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none" />
            
            {/* Interactive Badge */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-20 right-0 glass border-primary/30 p-10 max-w-sm rounded-none border-r-0"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-4 w-4 rounded-none bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                <span className="font-mono text-[10px] uppercase font-black tracking-widest text-primary">Live Buffer Activity</span>
              </div>
              <p className="font-serif italic text-2xl mb-4 leading-tight whitespace-pre-line text-foreground">
                "Every trade synchronizes your balance sheet with the planet."
              </p>
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-mono tracking-widest">
                <Leaf className="h-3 w-3" />
                12,402kg Offset Recorded Today
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats - Card Based Approach */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Assets Traded", val: "8.4k", icon: <Zap className="h-5 w-5" /> },
              { label: "CO2 Offset", val: "1.2M", unit: "kg", icon: <Leaf className="h-5 w-5" /> },
              { label: "Vetted Firms", val: "500+", icon: <ShieldCheck className="h-5 w-5" /> },
              { label: "Industrial Liquidity", val: "£4.5M", icon: <Globe className="h-5 w-5" /> }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-[2rem] border-primary/20 hover:border-primary/50 transition-all group hover:shadow-2xl hover:shadow-primary/10 bg-white/50 dark:bg-white/5"
              >
                <div className="mb-6 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black font-display tracking-tighter text-foreground">
                    {stat.val}<span className="text-lg opacity-40 ml-1">{stat.unit || ""}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary opacity-80">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Decorative subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* Industry Pillars */}
      <section className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight font-display">The HiX <br /> <span className="text-primary">Ecosystem</span></h2>
              <p className="text-muted-foreground leading-relaxed">We provide the technical infrastructure for circular industrial procurement.</p>
              <Button variant="link" className="p-0 text-primary h-auto group text-xs uppercase font-bold tracking-widest" asChild>
                <Link to="/about">
                  Learn about our vetting protocol 
                  <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-2" />
                </Link>
              </Button>
            </div>
            
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <ShieldCheck className="h-6 w-6" />,
                  title: "KYB Compliance",
                  desc: "Every participants undergoes rigorous manual vetting ensuring only legitimate industrial operators access the exchange."
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: "Instant Settlement",
                  desc: "Integrated Stripe Connect workflows for instant, secure financial routing across complex industrial supply chains."
                },
                {
                  icon: <Leaf className="h-6 w-6" />,
                  title: "ESG Reporting",
                  desc: "Automated data generation for Scope 3 emissions reporting, verified through the HiX sustainability engine."
                },
                {
                  icon: <Globe className="h-6 w-6" />,
                  title: "Regional Network",
                  desc: "Connecting the Tees Valley industrial cluster with buyers across the UK to minimize haulage emissions."
                }
              ].map((item, i) => (
                <div key={item.title} className="p-8 border border-border bg-muted/10 rounded-3xl hover:border-primary/50 transition-colors">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
