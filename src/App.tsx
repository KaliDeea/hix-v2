import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/firebase";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SystemBanner } from "@/components/SystemBanner";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/firebase";
import { AlertTriangle, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load pages
const Home = lazy(() => import("@/pages/Home"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const CreateListing = lazy(() => import("@/pages/CreateListing"));
const EditListing = lazy(() => import("@/pages/EditListing"));
const Messages = lazy(() => import("@/pages/Messages"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminUserTransactions = lazy(() => import("@/pages/AdminUserTransactions"));
const Hauling = lazy(() => import("@/pages/Hauling"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const About = lazy(() => import("@/pages/About"));
const Sustainability = lazy(() => import("@/pages/Sustainability"));
const Contact = lazy(() => import("@/pages/Contact"));
const Terms = lazy(() => import("@/pages/Terms"));
const Auth = lazy(() => import("@/pages/Auth"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const RequestAsset = lazy(() => import("@/pages/RequestAsset"));

function PageLoader() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-20" />
        <Loader2 className="absolute inset-0 h-12 w-12 text-primary animate-spin [animation-duration:3s]" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
        Initializing Ledger Data
      </p>
    </div>
  );
}

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
                  <Suspense fallback={<PageLoader />}>
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
                  </Suspense>
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
