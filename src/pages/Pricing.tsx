import React, { useState } from "react";
import { useAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Shield, Globe } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    description: "For individual traders and small workshops.",
    features: [
      "Up to 5 active listings",
      "Standard marketplace access",
      "Basic messaging",
      "Community support",
      "3% buyer commission"
    ],
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: "pro",
    name: "Business Pro",
    price: 49,
    description: "For established industrial businesses.",
    features: [
      "Unlimited active listings",
      "Priority search placement",
      "Advanced analytics",
      "Bulk upload tools",
      "Dedicated account manager",
      "1.5% buyer commission"
    ],
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    popular: true,
    stripePriceId: "price_pro_monthly"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    description: "For large industrial groups and multi-site operations.",
    features: [
      "Multi-user team accounts",
      "API access for ERP integration",
      "Custom contract templates",
      "White-label reports",
      "Verified logistics partners",
      "0.5% buyer commission"
    ],
    icon: Shield,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    stripePriceId: "price_enterprise_monthly"
  }
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, stripePriceId?: string) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      return;
    }

    if (!stripePriceId) {
      toast.info("This is a free plan. You are already on it or can switch easily.");
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/stripe/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: stripePriceId,
          userId: user.uid,
          email: user.email,
          planName: planId
        })
      });

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success("Checkout opened in a new tab.");
      } else {
        throw new Error(data.error || "Failed to create subscription session");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Subscription failed. Please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">
          Join the circular industrial economy. Scale your asset recovery and reduce your carbon footprint with our flexible plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`h-full flex flex-col glass border-2 transition-all duration-300 ${plan.popular ? 'border-primary shadow-xl shadow-primary/10 scale-105' : 'border-white/10 hover:border-primary/50'}`}>
              <CardHeader>
                {plan.popular && (
                  <Badge className="w-fit mb-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">Most Popular</Badge>
                )}
                <div className={`h-12 w-12 rounded-2xl ${plan.bg} flex items-center justify-center mb-4`}>
                  <plan.icon className={`h-6 w-6 ${plan.color}`} />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter">£{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full rounded-xl h-12 font-bold uppercase tracking-widest text-xs ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'glass border-white/10 hover:bg-white/5'}`}
                  onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (profile?.plan === plan.id ? "Current Plan" : "Get Started")}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 glass p-12 rounded-[3rem] border-primary/20 text-center">
        <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase">Need a Custom Solution?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          For global corporations with specific compliance, security, and integration requirements, we offer tailored enterprise agreements.
        </p>
        <Button variant="outline" className="rounded-full px-8 h-12 border-primary/20 text-primary hover:bg-primary/5">
          Contact Sales Team
        </Button>
      </div>
    </div>
  );
}
