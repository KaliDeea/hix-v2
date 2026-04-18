import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, doc, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";

export function Footer() {
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeLogo = onSnapshot(doc(db, "platform_settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        setPlatformLogo(docSnap.data().hixLogoUrl || null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "platform_settings/branding");
    });

    return () => unsubscribeLogo();
  }, []);

  return (
    <footer className="border-t border-primary/20 bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-4 group mb-10">
              {platformLogo ? (
                <img 
                  src={platformLogo} 
                  alt="Logo" 
                  className="h-20 w-20 rounded-full object-cover border-4 border-primary/30 transition-all group-hover:scale-110 logo-reflection logo-primary-glow" 
                />
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-black text-3xl text-primary-foreground transition-all group-hover:rotate-12 group-hover:scale-110 shadow-xl shadow-primary/30 logo-reflection logo-primary-glow">
                    H
                  </div>
                  <span className="text-4xl font-black tracking-tighter uppercase text-primary drop-shadow-md">HiX</span>
                </>
              )}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs pt-4">
              Hartlepool Industrial Exchange. The UK's leading B2B marketplace for sustainable industrial trading.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/hauling" className="hover:text-primary transition-colors">Hauling Services</Link></li>
              <li><Link to="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Legal</h3>
            <p className="text-xs text-muted-foreground">
              HiX is a registered trademark of Hartlepool Industrial Exchange LTD. 
              VAT Registration: GB 123 4567 89
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-primary/10 pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hartlepool Industrial Exchange LTD. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
