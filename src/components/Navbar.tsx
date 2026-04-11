import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  ShieldCheck, 
  Menu, 
  MessageSquare, 
  Bell, 
  Heart,
  Search,
  Settings
} from "lucide-react";
import { onSnapshot, collection, query, where, db, doc, updateDoc, handleFirestoreError, OperationType, writeBatch } from "@/lib/firebase";
import { Notification, UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

function NotificationDropdown({ notifications, unreadCount, markAsRead, markAllAsRead }: NotificationDropdownProps) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full relative p-2 hover:bg-white/10 transition-colors outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-destructive text-white border-2 border-background text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass p-0 overflow-hidden z-[100]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 border-b border-white/5 hover:bg-white/5 border-l-2 border-l-transparent hover:border-l-primary cursor-pointer transition-all ${!n.read ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  if (!n.read) markAsRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-white/10 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/notifications")}>
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserDropdownProps {
  user: any;
  profile: UserProfile | null;
  logout: () => void;
}

function UserDropdown({ user, profile, logout }: UserDropdownProps) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors outline-none flex items-center justify-center border-2 border-primary/20 hover:border-primary/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.logoUrl} alt={profile?.companyName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {profile?.companyName?.charAt(0) || user.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass z-[100] p-1.5">
        <div className="flex items-center justify-start gap-2 px-3 py-2 border-b border-white/10 mb-1">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{profile?.companyName || "Company Name"}</p>
            <p className="text-xs text-muted-foreground truncate w-[180px]">{user.email}</p>
          </div>
        </div>
        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer">
          <MessageSquare className="h-4 w-4" />
          Messages
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        {(['admin', 'superadmin'].includes(profile?.role || '') || ["admin@hix.co.uk", "superadmin@hix.co.uk"].includes(user?.email || "")) && (
          <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-primary">
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navbarSearch, setNavbarSearch] = useState(searchParams.get("q") || "");
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setNavbarSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navbarSearch.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(navbarSearch.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data.sort((a, b) => {
        const dateA = b.createdAt?.seconds || 0;
        const dateB = a.createdAt?.seconds || 0;
        return dateA - dateB;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "notifications");
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      
      await batch.commit();
      toast.success("All notifications marked as read");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "notifications/batch");
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-[#0f172a]/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          {platformLogo ? (
            <img 
              src={platformLogo} 
              alt="HiX Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground transition-transform group-hover:rotate-12">
                H
              </div>
              <span className="text-xl font-bold tracking-tight">HiX</span>
            </>
          )}
        </Link>

        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-10 rounded-full bg-white/5 border-white/10 focus:border-primary/50 transition-all"
              value={navbarSearch}
              onChange={(e) => setNavbarSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">Marketplace</Link>
          <Link to="/messages" className="text-sm font-medium hover:text-primary transition-colors">Messages</Link>
          <Link to="/hauling" className="text-sm font-medium hover:text-primary transition-colors">Hauling</Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {user && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full relative"
                onClick={() => navigate("/wishlist")}
              >
                <Heart className="h-5 w-5" />
              </Button>

              <NotificationDropdown 
                notifications={notifications}
                unreadCount={unreadCount}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
              />
            </>
          )}

          {user ? (
            <UserDropdown user={user} profile={profile} logout={logout} />
          ) : (
            <Button asChild className="rounded-full px-6">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="glass border-l border-primary/20">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8">
                <div className="lg:hidden mb-4">
                  <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-10 rounded-xl bg-white/5 border-white/10"
                      value={navbarSearch}
                      onChange={(e) => setNavbarSearch(e.target.value)}
                    />
                  </form>
                </div>
                <Link 
                  to="/marketplace" 
                  className="text-lg font-medium px-4 py-3 rounded-lg border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Marketplace
                </Link>
                <Link 
                  to="/messages" 
                  className="text-lg font-medium px-4 py-3 rounded-lg border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link 
                  to="/hauling" 
                  className="text-lg font-medium px-4 py-3 rounded-lg border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Hauling
                </Link>
                <Link 
                  to="/about" 
                  className="text-lg font-medium px-4 py-3 rounded-lg border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                {!user && (
                  <Button asChild className="rounded-full mt-4" onClick={() => setIsMobileMenuOpen(false)}>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
