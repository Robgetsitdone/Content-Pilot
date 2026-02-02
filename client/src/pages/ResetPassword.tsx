import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type TokenStatus = "loading" | "valid" | "invalid";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus("invalid");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.valid) {
          setTokenStatus("valid");
        } else {
          setTokenStatus("invalid");
        }
      } catch {
        setTokenStatus("invalid");
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

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
          {tokenStatus === "loading" ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
              <p className="text-zinc-400">Verifying reset link...</p>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Password reset successful</h2>
              <p className="text-zinc-400 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Button
                type="button"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                Sign In
              </Button>
            </div>
          ) : tokenStatus === "invalid" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-zinc-400 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button
                type="button"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold"
                onClick={() => setLocation("/login")}
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Set new password</h2>
              <p className="text-zinc-400 mb-8">
                Enter your new password below.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm" data-testid="error-message">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      data-testid="input-new-password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      data-testid="input-confirm-password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-6"
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
