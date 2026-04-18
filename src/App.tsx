import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/firebase";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SystemBanner } from "@/components/SystemBanner";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import ListingDetail from "@/pages/ListingDetail";
import CreateListing from "@/pages/CreateListing";
import EditListing from "@/pages/EditListing";
import Messages from "@/pages/Messages";
import Admin from "@/pages/Admin";
import AdminUserTransactions from "@/pages/AdminUserTransactions";
import Hauling from "@/pages/Hauling";
import Wishlist from "@/pages/Wishlist";
import Notifications from "@/pages/Notifications";
import About from "@/pages/About";
import Sustainability from "@/pages/Sustainability";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Auth from "@/pages/Auth";
import PublicProfile from "@/pages/PublicProfile";
import RequestAsset from "@/pages/RequestAsset";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/firebase";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuspendedOverlay() {
  const { profile, logout } = useAuth();
  
  if (!profile?.isSuspended) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full glass border-destructive/20 p-8 rounded-[2rem] text-center shadow-xl">
        <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Account Suspended</h2>
        <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2">Reason for Suspension</p>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "{profile.suspensionReason || "Your account has been suspended for violating platform terms."}"
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          If you believe this is a mistake, please contact our support team at support@hix.co.uk.
        </p>
        <Button 
          variant="destructive" 
          className="w-full rounded-xl h-12 font-bold uppercase tracking-widest text-xs"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="hix-theme">
        <AuthProvider>
          <TooltipProvider>
            <SuspendedOverlay />
            <Router>
              <ScrollToTop />
              <div className="flex min-h-screen flex-col">
                <SystemBanner />
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/create-listing" element={<CreateListing />} />
                    <Route path="/post-asset" element={<CreateListing />} />
                    <Route path="/edit-listing/:id" element={<EditListing />} />
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:uid" element={<PublicProfile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/transactions" element={<AdminUserTransactions />} />
                    <Route path="/hauling" element={<Hauling />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/sustainability" element={<Sustainability />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/request-asset" element={<RequestAsset />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <Toaster />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
