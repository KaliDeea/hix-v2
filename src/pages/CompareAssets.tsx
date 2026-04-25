import React from 'react';
import { useComparison } from '../components/ComparisonProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowLeft, 
  Scale, 
  MapPin, 
  Package, 
  TrendingUp, 
  Leaf, 
  RefreshCw, 
  Car,
  ShoppingCart,
  CheckCircle2
} from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function CompareAssets() {
  const { selectedListings, removeFromListings, clearListings } = useComparison();

  if (selectedListings.length === 0) {
    return (
      <div className="container mx-auto py-20 px-4">
        <Card className="glass max-w-2xl mx-auto border-dashed border-primary/20 py-20 text-center">
          <CardContent className="space-y-6">
            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto border border-primary/10">
              <Scale className="h-12 w-12 text-primary/40" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Comparison Hub Empty</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Select up to 4 assets from the marketplace to perform a side-by-side technical and sustainability audit.
            </p>
            <Button className="rounded-full shadow-lg shadow-primary/20 h-12 px-8 uppercase font-bold tracking-widest text-xs" asChild>
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    { label: 'Condition', key: 'condition' },
    { label: 'Location', key: 'location' },
    { label: 'Quantity', key: 'quantity' },
    { label: 'Category', key: 'category' },
    { label: 'CO2 Savings', key: 'co2Savings', unit: ' kg' },
    { label: 'Price', key: 'price', prefix: '£' }
  ];

  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-white/10 pb-12">
        <div className="space-y-2">
          <Link to="/marketplace" className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-1 transition-transform">
            <ArrowLeft className="h-3 w-3" />
            Back to Marketplace
          </Link>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
            Technical <span className="text-primary underline decoration-primary/30">Audit</span> Hub
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg">
            Side-by-side comparison of industrial assets including ESG impact markers, technical specs, and financial metrics.
          </p>
        </div>
        <Button variant="outline" className="rounded-full h-11 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={clearListings}>
          Reset Comparison
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {selectedListings.map((listing) => (
            <motion.div
              key={listing.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-destructive text-white shadow-lg hover:scale-110 active:scale-95 border-2 border-background transition-all"
                onClick={() => removeFromListings(listing.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <Card className="glass hardware-surface border-white/10 overflow-hidden h-full flex flex-col hover:border-primary/40 transition-all duration-500">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 left-4">
                     <Badge className="bg-primary shadow-lg shadow-primary/40 text-[9px] uppercase font-bold border-none">
                        £{listing.price.toLocaleString()}
                     </Badge>
                  </div>
                </div>

                <CardHeader className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{listing.category}</p>
                  <CardTitle className="text-lg font-black line-clamp-1">{listing.title}</CardTitle>
                </CardHeader>

                <CardContent className="px-6 flex-1 space-y-8">
                   {/* Technical Spec List */}
                   <div className="space-y-4">
                      {features.map((f) => (
                        <div key={f.key} className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-2">
                           <span className="opacity-40 uppercase">{f.label}</span>
                           <span className="font-bold text-white">
                              {f.prefix}{(listing as any)[f.key]?.toLocaleString()}{f.unit}
                           </span>
                        </div>
                      ))}
                   </div>

                   {/* ESG Snapshot */}
                   <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                         <Leaf className="h-4 w-4 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">ESG Compliance</span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[10px] uppercase font-bold">
                            <span className="opacity-50">Circular Score</span>
                            <span className="text-primary">{listing.materialReuse || 85}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                               className="h-full bg-primary" 
                               style={{ width: `${listing.materialReuse || 85}%` }} 
                            />
                         </div>
                      </div>
                   </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 mt-auto">
                   <Button className="w-full rounded-xl h-11 uppercase font-bold tracking-widest text-[10px] shadow-lg shadow-primary/20" asChild>
                      <Link to={`/listing/${listing.id}`}>View Details</Link>
                   </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {selectedListings.length < 4 && (
          <Link 
            to="/marketplace" 
            className="border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all p-8 min-h-[400px]"
          >
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
               <Plus className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">
               Add Another Asset<br/>to Comparison
            </p>
          </Link>
        )}
      </div>

      {/* Audit Summary Card */}
      <Card className="glass border-primary/20 overflow-hidden rounded-[2.5rem]">
         <div className="bg-primary/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-primary/10">
            <div className="flex items-center gap-6">
               <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                  <CheckCircle2 className="h-8 w-8 text-black" />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Consolidated Impact Report</h3>
                  <p className="text-sm font-medium opacity-60">Aggregate sustainability value across selected assets.</p>
               </div>
            </div>
            <div className="text-center md:text-right">
               <div className="text-5xl font-black text-primary tracking-tighter tabular-nums leading-none mb-1">
                  {selectedListings.reduce((acc, curr) => acc + (curr.co2Savings || 0), 0).toLocaleString()}
                  <span className="text-xl ml-2 uppercase">kg</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Total Estimated CO2 Avoided</p>
            </div>
         </div>
         <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                     <TrendingUp className="h-5 w-5" />
                     <h4 className="text-xs font-black uppercase tracking-widest">Market Efficiency</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Selecting these {selectedListings.length} assets over new manufacturing alternatives reduces procurement lead times by an estimated 14 days on average.
                  </p>
               </div>
               <div className="space-y-4 border-x border-white/5 px-8">
                  <div className="flex items-center gap-3 text-primary">
                     <RefreshCw className="h-5 w-5" />
                     <h4 className="text-xs font-black uppercase tracking-widest">Circularity Audit</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Weighted average material recovery rate across selected equipment: {Math.round(selectedListings.reduce((acc, curr) => acc + (curr.materialReuse || 85), 0) / selectedListings.length)}%.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                     <Car className="h-5 w-5" />
                     <h4 className="text-xs font-black uppercase tracking-widest">Logistics Load</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Optimized combined weight for transport: {selectedListings.reduce((acc, curr) => acc + (curr.weight || 0), 0).toLocaleString()} kg. Estimated 12% reduction in fuel-burn vs standard routing.
                  </p>
               </div>
            </div>
         </CardContent>
         <CardFooter className="bg-white/5 border-t border-white/5 p-6 flex justify-center">
            <Button className="rounded-full bg-white text-black hover:bg-white/90 h-12 px-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => window.print()}>
               Export Audit Report (PDF)
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
