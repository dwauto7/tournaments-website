import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { createUserAPI } from "@/lib/api";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [handicap, setHandicap] = useState("");
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!name.trim()) {
    toast.error("Name is required");
    return;
  }

  if (!phone.trim()) {
    toast.error("Phone number is required");
    return;
  }

  // Validate phone format (E.164)
// Enhanced phone validation
  let formattedPhone = phone.trim();
  
  // Auto-format: if user enters 0123456789, convert to +60123456789
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+60' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('60') && !formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+60' + formattedPhone;
  }

  // Validate E.164 format: +[1-15 digits]
  if (!formattedPhone.match(/^\+\d{10,15}$/)) {
    toast.error("Phone must be valid (10-15 digits after country code)");
    return;
  }

  setLoading(true);

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: name.trim(),
          phone: formattedPhone, // ← Use formatted phone
          handicap: handicap ? parseInt(handicap) : null,
        }
      }
    });
    
    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("Failed to create user account");
    }

    console.log("✅ Auth user created:", authData.user.id);
    console.log("✅ Database trigger will auto-create profile in public.users");

    toast.success("Account created! Please check your email to confirm.");

    // Clear form
    setName("");
    setPhone("");
    setHandicap("");
    setEmail("");
    setPassword("");

  } catch (error: any) {
    console.error("❌ Signup error:", error);
    toast.error(error.message || "Failed to create account");
  } finally {
    setLoading(false);
  }
};
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to TourneyHub</CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name *</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (E.164 format) *</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+60123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: +[country code][number] (e.g., +60123456789)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-handicap">Handicap (Optional)</Label>
                  <Input
                    id="signup-handicap"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 12.5"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
