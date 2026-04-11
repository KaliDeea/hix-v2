import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/firebase";

export default function Home() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                The Future of Industrial B2B
              </span>
              <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
                Trade Industrial Assets, <span className="text-primary">Save the Planet.</span>
              </h1>
              <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                Hartlepool Industrial Exchange (HiX) connects businesses across the UK and Europe for secure, efficient, and sustainable industrial transactions.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="rounded-full px-8 text-lg" asChild>
                  <Link to="/auth">
                    Register Your Business
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-lg" asChild>
                  <Link to="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-orange-500/10 blur-[100px]" />
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose HiX?</h2>
            <p className="text-muted-foreground">Built for reliability, security, and sustainability.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck className="h-8 w-8 text-primary" />,
                title: "Vetted Companies",
                desc: "Every business on HiX is manually verified for VAT and legitimacy."
              },
              {
                icon: <Leaf className="h-8 w-8 text-orange-500" />,
                title: "Sustainability First",
                desc: "Track CO2 savings for every transaction and receive ESG certificates."
              },
              {
                icon: <Zap className="h-8 w-8 text-amber-500" />,
                title: "Stripe Connect",
                desc: "Secure B2B payments with automated commission handling."
              },
              {
                icon: <Globe className="h-8 w-8 text-blue-500" />,
                title: "Global Reach",
                desc: "Connect Hartlepool businesses with buyers across the UK and Europe."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-8"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass-dark rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 grid gap-12 md:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-primary md:text-6xl">500+</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">Verified Businesses</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary md:text-6xl">1.2M</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">kg CO2 Saved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary md:text-6xl">£4.5M</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">Trade Volume</div>
              </div>
            </div>
            <div className="absolute top-0 left-0 h-full w-full hix-gradient -z-10" />
          </div>
        </div>
      </section>
    </div>
  );
}
