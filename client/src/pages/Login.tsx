import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

type ViewMode = "login" | "signup" | "forgot";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, signup, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [error, setError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSendingReset(true);
    
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: formData.email });
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (viewMode === "signup") {
        await signup(formData.email, formData.password, formData.displayName);
      } else {
        await login(formData.email, formData.password);
      }
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
    setError("");
    setForgotSuccess(false);
  };

  const isSignup = viewMode === "signup";
  const isForgot = viewMode === "forgot";

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
      <div className="noise-bg" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold rounded-lg">
            <Zap className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl tracking-tight leading-none text-white">CREATOR</span>
            <span className="font-display font-bold text-2xl tracking-tight leading-none bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">PULSE</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-8">
          {isForgot ? (
            <>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm mb-6"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>

              {forgotSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Check your email</h2>
                  <p className="text-zinc-400 mb-6">
                    If an account exists for <span className="text-white">{formData.email}</span>, we've sent password reset instructions.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => switchMode("login")}
                    data-testid="button-return-to-login"
                  >
                    Return to sign in
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Reset your password</h2>
                  <p className="text-zinc-400 mb-8">
                    Enter your email and we'll send you instructions to reset your password.
                  </p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                      <p className="text-red-400 text-sm" data-testid="error-message">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                          data-testid="input-forgot-email"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-6"
                      disabled={isSendingReset}
                      data-testid="button-send-reset"
                    >
                      {isSendingReset ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-zinc-400 mb-8">
                {isSignup 
                  ? "Start managing your content like a pro" 
                  : "Sign in to continue to your dashboard"
                }
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm" data-testid="error-message">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-zinc-300">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                        data-testid="input-displayName"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      data-testid="input-email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-zinc-300">Password</Label>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
                        data-testid="button-forgot-password"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={isSignup ? "Min 8 characters" : "Your password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      data-testid="input-password"
                      required
                      minLength={isSignup ? 8 : 1}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-6"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    isSignup ? "Create Account" : "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => switchMode(isSignup ? "login" : "signup")}
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                  data-testid="button-toggle-mode"
                >
                  {isSignup 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
