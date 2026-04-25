import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Truck, CheckCircle2 } from 'lucide-react';

interface LogisticsTrackerProps {
  origin: string;
  destination: string;
  status: 'quote_requested' | 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
}

export const LogisticsTracker: React.FC<LogisticsTrackerProps> = ({ origin, destination, status }) => {
  const getProgress = () => {
    switch (status) {
      case 'quote_requested': return 10;
      case 'scheduled': return 30;
      case 'in_transit': return 65;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const progress = getProgress();

  return (
    <div className="p-6 bg-slate-950/20 rounded-3xl border border-white/5 space-y-8 overflow-hidden relative group">
      {/* Schematic Map Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Load Origin</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h4 className="text-sm font-bold text-white uppercase">{origin}</h4>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Node</p>
          <div className="flex items-center gap-2 justify-end">
            <h4 className="text-sm font-bold text-white uppercase">{destination}</h4>
            <div className={`h-2 w-2 rounded-full ${status === 'delivered' ? 'bg-primary' : 'bg-white/20'}`} />
          </div>
        </div>
      </div>

      {/* Route Animation */}
      <div className="relative h-20 flex items-center px-4">
        {/* Track Line */}
        <div className="absolute left-4 right-4 h-[2px] bg-white/10 rounded-full" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-4 h-[2px] bg-primary rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"
        />

        {/* Technical Nodes */}
        <div className="absolute left-4 right-4 flex justify-between">
           {[0, 25, 50, 75, 100].map(p => (
              <div key={p} className={`h-1.5 w-1.5 rounded-full border ${progress >= p ? 'bg-primary border-primary shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-900 border-white/20'}`} />
           ))}
        </div>

        {/* Truck Marker */}
        <motion.div 
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -translate-x-1/2 flex flex-col items-center gap-2"
        >
           <div className={`p-2 rounded-xl border ${status === 'in_transit' ? 'bg-primary text-black border-primary' : 'bg-white/10 text-white border-white/20'}`}>
              <Truck className={`h-4 w-4 ${status === 'in_transit' ? 'animate-bounce' : ''}`} />
           </div>
           {status === 'in_transit' && (
              <Badge className="text-[7px] bg-primary/20 text-primary border-none whitespace-nowrap">TRANSMITTING LOCATION</Badge>
           )}
        </motion.div>
      </div>

      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] relative z-10">
         <div className="flex items-center gap-2 opacity-50">
            <MapPin className="h-3 w-3" />
            Node-to-Node Transfer
         </div>
         <div className="flex items-center gap-4">
            <span className={status === 'in_transit' ? 'text-amber-500' : 'text-white/40'}>
               {status === 'in_transit' ? 'LIVE TRAJECTORY' : 'SCHEDULED'}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-primary">{progress}% COMPLETED</span>
         </div>
      </div>
    </div>
  );
};

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${className}`}>
     {children}
  </span>
);
