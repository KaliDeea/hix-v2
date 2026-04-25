import React from 'react';
import { useComparison } from './ComparisonProvider';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, X, ArrowRight } from "lucide-react";
import { Button } from '@/components/ui/button';

export const ComparisonBar = () => {
  const { selectedListings, removeFromListings, clearListings } = useComparison();
  const location = useLocation();

  if (selectedListings.length === 0 || location.pathname === '/compare') return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="glass border-primary/40 p-4 rounded-[2rem] shadow-2xl shadow-primary/20 flex items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
             <Scale className="h-5 w-5 text-black" />
          </div>
          <div className="flex -space-x-3 overflow-hidden">
             {selectedListings.map(listing => (
                <div key={listing.id} className="relative group">
                   <img 
                      src={listing.images[0]} 
                      alt="" 
                      className="h-10 w-10 rounded-xl object-cover border-2 border-background"
                   />
                   <button 
                      onClick={() => removeFromListings(listing.id)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                      <X className="h-2 w-2" />
                   </button>
                </div>
             ))}
          </div>
          <div className="hidden sm:block">
             <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Comparison Hub</p>
             <p className="text-[9px] font-medium text-muted-foreground mt-1">{selectedListings.length} of 4 slots used</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white" onClick={clearListings}>
              Clear
           </Button>
           <Button className="rounded-full shadow-lg shadow-primary/20 h-10 px-6 uppercase font-bold tracking-widest text-[10px] gap-2" asChild>
              <Link to="/compare">
                 Audit Hub
                 <ArrowRight className="h-3 w-3" />
              </Link>
           </Button>
        </div>
      </motion.div>
    </div>
  );
};
