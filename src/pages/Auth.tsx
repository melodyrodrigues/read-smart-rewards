import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Sparkles, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isResetPassword) {
        navigate("/");
      }
    };
    checkSession();

    // Listen for password recovery events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPassword(true);
        setIsForgotPassword(false);
        setIsLogin(false);
        toast({
          title: "Reset your password",
          description: "Please enter your new password below.",
        });
      } else if (event === 'SIGNED_IN' && session) {
        if (!isResetPassword) {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isResetPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        // Validate password match
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const { error } = await supabase.auth.updateUser({ 
          password: newPassword 
        });
        
        if (error) throw error;
        
        toast({ 
          title: "Password updated successfully!", 
          description: "You can now sign in with your new password." 
        });
        
        // Reset states and redirect to login
        setIsResetPassword(false);
        setIsLogin(true);
        setNewPassword("");
        setConfirmPassword("");
        
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({ 
          title: "Password reset email sent!", 
          description: "Check your email for the reset link." 
        });
        setIsForgotPassword(false);
        setEmail("");
        
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Successfully signed in!" });
        navigate("/");
        
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({ 
          title: "Account created!", 
          description: "You can now sign in." 
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md p-8 animate-fade-in shadow-glow">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-10 h-10" />
            <Sparkles className="w-6 h-6 animate-glow-pulse" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Cosmos Reader
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {isResetPassword
            ? "Create your new password"
            : isForgotPassword 
            ? "Reset your password" 
            : isLogin 
            ? "Sign in to your account" 
            : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isResetPassword ? (
            <>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm your new password"
                  className="mt-1"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading || (isResetPassword && newPassword !== confirmPassword)}
          >
            {loading 
              ? "Loading..." 
              : isResetPassword
              ? "Update Password"
              : isForgotPassword 
              ? "Send Reset Link" 
              : isLogin 
              ? "Sign In" 
              : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {isResetPassword ? (
            <p className="text-xs text-muted-foreground">
              After updating your password, you'll be able to sign in with your new credentials.
            </p>
          ) : isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(true);
                setEmail("");
              }}
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </button>
          ) : (
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;