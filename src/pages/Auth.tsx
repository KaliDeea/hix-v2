import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Mail, Lock, Phone, Hash } from "lucide-react";

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "register" ? "register" : "login");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register" || tab === "login") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regVat, setRegVat] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const formatAuthError = (error: any) => {
    const code = error.code || "";
    const message = error.message || "";

    if (code === "auth/invalid-credential") {
      return "The email or password you entered is incorrect. Please check your credentials and try again.";
    }
    if (code === "auth/user-not-found") {
      return "No account found with this email. Please register first.";
    }
    if (code === "auth/wrong-password") {
      return "Incorrect password. Please try again.";
    }
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Please login instead.";
    }
    if (code === "auth/weak-password") {
      return "The password is too weak. Please use at least 6 characters.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Email/Password login is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many failed attempts. Access to this account has been temporarily disabled. Please try again later.";
    }
    
    return message || "An unexpected error occurred. Please try again.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPass);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(formatAuthError(error), {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regEmail, regPass, {
        companyName: regCompanyName,
        vatNumber: regVat,
        phoneNumber: regPhone,
      });
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast.error(formatAuthError(error), {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md glass">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to HiX</CardTitle>
          <CardDescription>
            The industrial exchange for Hartlepool and beyond.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@company.com" 
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-company">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="reg-company" 
                      placeholder="Acme Corp" 
                      className="pl-10"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="reg-email" 
                      type="email" 
                      placeholder="name@company.com" 
                      className="pl-10"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-vat">VAT Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="reg-vat" 
                        placeholder="GB123456789" 
                        className="pl-10"
                        value={regVat}
                        onChange={(e) => setRegVat(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="reg-phone" 
                        placeholder="01234 567890" 
                        className="pl-10"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="reg-password" 
                      type="password" 
                      className="pl-10"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Register Business"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
