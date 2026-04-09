import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  Settings
} from "lucide-react";
import { onSnapshot, collection, query, where, db, doc, updateDoc } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { Notification } from "@/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

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
      // Sort by date desc
      setNotifications(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
      toast.success("All notifications marked as read");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            H
          </div>
          <span className="text-xl font-bold tracking-tight">HiX</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">Marketplace</Link>
          <Link to="/messages" className="text-sm font-medium hover:text-primary transition-colors">Messages</Link>
          <Link to="/hauling" className="text-sm font-medium hover:text-primary transition-colors">Hauling</Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-destructive text-white border-2 border-background text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 glass p-0 overflow-hidden">
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
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
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
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors outline-none flex items-center justify-center">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarImage src={profile?.logoUrl} alt={profile?.companyName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.companyName?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.companyName || "Company Name"}</p>
                    <p className="text-xs text-muted-foreground truncate w-[180px]">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {(['admin', 'superadmin'].includes(profile?.role) || ["admin@hix.co.uk", "superadmin@hix.co.uk"].includes(user?.email || "")) && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-primary">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="rounded-full px-6">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
