import React from "react";
import { motion } from "motion/react";
import { 
  Leaf, 
  Globe, 
  Recycle, 
  TrendingDown, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Truck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Sustainability() {
  const impactStats = [
    { label: "CO2 Offset", value: "1.2M kg", icon: Leaf, color: "text-primary" },
    { label: "Assets Reused", value: "15,000+", icon: Recycle, color: "text-blue-500" },
    { label: "Landfill Diverted", value: "850 Tons", icon: Globe, color: "text-amber-500" },
    { label: "Energy Saved", value: "4.2 GWh", icon: Zap, color: "text-purple-500" },
  ];

  const principles = [
    {
      title: "Circular Economy",
      description: "We move away from the 'take-make-dispose' model by keeping industrial assets in use for as long as possible.",
      icon: Recycle,
    },
    {
      title: "Carbon Transparency",
      description: "Every listing includes an estimated CO2 saving, calculated based on the energy required to manufacture a new equivalent.",
      icon: BarChart3,
    },
    {
      title: "Local Impact",
      description: "By facilitating local trade in Hartlepool and the North East, we significantly reduce transport-related emissions.",
      icon: Truck,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6"
            >
              <Leaf className="h-3 w-3" />
              Our ESG Commitment
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-none"
            >
              Trading for a <span className="text-primary">Greener</span> Industrial Future.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed mb-10"
            >
              HiX is more than a marketplace. We are a platform dedicated to reducing industrial waste and helping businesses achieve their Net Zero targets through the circular economy.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="rounded-full px-8" asChild>
                <Link to="/marketplace">Explore Green Assets</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link to="/about">Our Story</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 border-y border-primary/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-2"
              >
                <div className={`mx-auto w-12 h-12 rounded-2xl bg-background border border-primary/10 flex items-center justify-center ${stat.color} shadow-md shadow-primary/5`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 uppercase">The HiX Sustainability Framework</h2>
            <p className="text-muted-foreground">How we integrate environmental responsibility into every industrial transaction.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass h-full border-primary/10 hover:border-primary/30 transition-all group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <p.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{p.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CO2 Calculation Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-8 uppercase">How we calculate <span className="text-primary">CO2 Savings</span></h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <h4 className="font-bold mb-1">Embodied Carbon Analysis</h4>
                    <p className="text-sm text-muted-foreground">We estimate the carbon footprint required to manufacture a new equivalent of the asset, including raw material extraction and processing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <h4 className="font-bold mb-1">Logistics Comparison</h4>
                    <p className="text-sm text-muted-foreground">We compare the transport emissions of local trade versus international shipping of new machinery.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <h4 className="font-bold mb-1">Verified Reporting</h4>
                    <p className="text-sm text-muted-foreground">Our algorithms are based on industry-standard ESG reporting frameworks, providing you with reliable data for your annual sustainability reports.</p>
                  </div>
                </div>
              </div>
              <Button className="mt-10 rounded-full px-8" variant="outline" asChild>
                <Link to="/contact">Request Methodology Whitepaper</Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass p-8 rounded-[2.5rem] border-primary/20 shadow-xl relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold">ESG Impact Certificate</h3>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Verified</Badge>
                </div>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Asset Category</p>
                    <p className="font-semibold">Heavy Industrial Machinery</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Carbon Saved</p>
                      <p className="text-2xl font-black text-primary">450 kg</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Verification</p>
                      <p className="text-sm font-semibold">HiX-ESG-2024</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Blockchain Verified</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] -z-10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[80px] -z-10 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass p-12 md:p-20 rounded-[3rem] border-primary/20 bg-primary/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">Ready to start your <span className="text-primary">Net Zero</span> journey?</h2>
              <p className="text-lg text-muted-foreground mb-10">Join hundreds of businesses in Hartlepool and beyond who are already trading sustainably on HiX.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg" asChild>
                  <Link to="/auth">Join the Exchange</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg" asChild>
                  <Link to="/marketplace">View Marketplace</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
