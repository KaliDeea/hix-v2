import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-[#0f172a] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                H
              </div>
              <span className="text-xl font-bold tracking-tight">HiX</span>
            </Link>
            <p className="text-sm text-muted-foreground">
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
