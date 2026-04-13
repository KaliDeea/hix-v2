import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/firebase";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
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
import Hauling from "@/pages/Hauling";
import Wishlist from "@/pages/Wishlist";
import Notifications from "@/pages/Notifications";
import About from "@/pages/About";
import Sustainability from "@/pages/Sustainability";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Auth from "@/pages/Auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Placeholder components for other pages
// All pages are now imported from @/pages

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="hix-theme">
        <AuthProvider>
          <TooltipProvider>
            <Router>
              <div className="flex min-h-screen flex-col">
                <SystemBanner />
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/create-listing" element={<CreateListing />} />
                    <Route path="/edit-listing/:id" element={<EditListing />} />
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/hauling" element={<Hauling />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/sustainability" element={<Sustainability />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/auth" element={<Auth />} />
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
