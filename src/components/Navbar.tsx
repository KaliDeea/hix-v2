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
import { LayoutDashboard, LogOut, User, ShieldCheck, Menu } from "lucide-react";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

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
          <Link to="/hauling" className="text-sm font-medium hover:text-primary transition-colors">Hauling</Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-4">
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
