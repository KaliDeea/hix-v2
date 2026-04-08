import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you shortly.");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-muted-foreground">
          Have questions about the exchange or need help with your account? Our team is here to support you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" placeholder="john@company.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" placeholder="e.g. Hartlepool Steel Ltd" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more about your inquiry..." className="min-h-[150px]" required />
                </div>
                <Button type="submit" className="w-full rounded-full h-12">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass">
            <CardContent className="p-6 space-y-8">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Email Us</h4>
                  <p className="text-sm text-muted-foreground">support@hix-exchange.com</p>
                  <p className="text-sm text-muted-foreground">admin@hix-exchange.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Call Us</h4>
                  <p className="text-sm text-muted-foreground">+44 (0) 1429 123 456</p>
                  <p className="text-xs text-muted-foreground">Mon-Fri, 9am - 5pm GMT</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Visit Us</h4>
                  <p className="text-sm text-muted-foreground">
                    Innovation Centre, Venture Court<br />
                    Queens Meadow Business Park<br />
                    Hartlepool, TS25 5TG
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass bg-primary/5 border-primary/10">
            <CardContent className="p-6">
              <h4 className="font-bold mb-2">Emergency Support?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                For urgent issues regarding active trades or payments, please use our priority support line.
              </p>
              <Button variant="outline" className="w-full rounded-full border-primary/20 text-primary">
                Priority Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
