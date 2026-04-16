import { motion } from "motion/react";
import { Leaf, Globe, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="mb-20 text-center max-w-3xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-6 md:text-5xl"
        >
          Revolutionizing Industrial Trade through <span className="text-primary">Sustainability</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Hartlepool Industrial Exchange (HiX) was founded with a clear mission: to create a more efficient, secure, and sustainable future for industrial commerce.
        </motion.p>
      </section>

      <div className="grid gap-12 md:grid-cols-2 mb-24">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe that the industrial sector has a massive role to play in the global transition to a circular economy. By facilitating the trade of surplus assets, recycled materials, and refurbished machinery, we help businesses reduce waste and significantly lower their carbon footprint.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-6 w-6 text-primary"><Globe /></div>
              <div>
                <h4 className="font-semibold">Global Connectivity</h4>
                <p className="text-sm text-muted-foreground">Connecting local Hartlepool businesses with industrial buyers across the UK.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-6 w-6 text-primary"><Leaf /></div>
              <div>
                <h4 className="font-semibold">CO2 Impact</h4>
                <p className="text-sm text-muted-foreground">Every transaction on HiX reflects real-world CO2 savings, promoting a circular economy.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="glass rounded-3xl overflow-hidden aspect-video relative">
          <img 
            src="https://picsum.photos/seed/industrial-about/800/600" 
            alt="Industrial Exchange" 
            className="object-cover w-full h-full"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        </div>
      </div>

      <section className="py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-center mb-16">Our Core Values</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="glass p-8 rounded-2xl text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Trust & Security</h3>
            <p className="text-sm text-muted-foreground">Manual vetting of every company and secure Stripe Connect payments ensure a safe trading environment.</p>
          </div>
          <div className="glass p-8 rounded-2xl text-center">
            <TrendingUp className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Efficiency</h3>
            <p className="text-sm text-muted-foreground">Streamlined listings and integrated logistics support make industrial trading faster than ever.</p>
          </div>
          <div className="glass p-8 rounded-2xl text-center">
            <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Community</h3>
            <p className="text-sm text-muted-foreground">Supporting local Hartlepool businesses while fostering international industrial partnerships.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
