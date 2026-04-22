import React, { useState, useEffect } from "react";
import { db, onSnapshot, doc } from "@/lib/firebase";
import { AlertTriangle, Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SystemBanner() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    announcementBanner: ""
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "platform_settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          maintenanceMode: data.maintenanceMode || false,
          announcementBanner: data.announcementBanner || ""
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (!settings.maintenanceMode && !settings.announcementBanner) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-[60]"
        >
          {settings.maintenanceMode ? (
            <div className="bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-bold animate-pulse text-center">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>SYSTEM MAINTENANCE: Trading and bidding are currently disabled.</span>
            </div>
          ) : settings.announcementBanner ? (
            <div className="bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium relative text-center">
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="pr-6">{settings.announcementBanner}</span>
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute right-2 sm:right-4 hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
