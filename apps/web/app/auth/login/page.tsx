"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { 
  Layers, 
  TrendingUp, 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message || "Login failed. Please check credentials.");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      window.location.href = "/dashboard/overview";
    } catch {
      setError("Network connection issue. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 min-h-screen w-full bg-[#09090b] text-[#f8fafc] flex font-sans z-50">
      {/* Left Column: SaaS Branding & Value Props */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-b from-[#10131a] to-[#09090b] border-r border-[#27272a]/20">
        {/* Top Header */}
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              alt="RecruitAI Logo"
              className="h-9 w-9 object-contain"
              src="/logo.png"
            />
            <span className="text-3xl font-black tracking-tighter text-[#adc6ff] uppercase">
              RECRUITAI
            </span>
          </Link>
          <p className="text-lg font-medium text-muted-foreground pl-1.5">
            The AI-native recruitment engine.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-8 max-w-lg my-auto">
          {/* Card 1: Deep Context Matching */}
          <div className="flex gap-4 items-start">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 shrink-0 text-[#adc6ff]">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f8fafc]">Deep Context Matching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI engine doesn't just read keywords; it understands career trajectories and semantic skill overlaps to surface hidden talent.
              </p>
            </div>
          </div>

          {/* Card 2: Predictive Insights */}
          <div className="flex gap-4 items-start">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 shrink-0 text-[#adc6ff]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f8fafc]">Predictive Insights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Forecast candidate success and retention risk before the first interview with enterprise-grade data modeling.
              </p>
            </div>
          </div>

          {/* Card 3: Automated Workflows */}
          <div className="flex gap-4 items-start">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 shrink-0 text-[#adc6ff]">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f8fafc]">Automated Workflows</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Eliminate administrative drag. Automate sourcing, initial outreach, and scheduling within a single ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-xs text-muted-foreground pl-1.5">
          © {new Date().getFullYear()} RecruitAI Inc. All rights reserved.
        </p>
      </div>

      {/* Right Column: Interactive Login Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#adc6ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-[#10131a] border border-[#27272a]/50 rounded-2xl p-8 md:p-10 w-full max-w-md shadow-2xl relative">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your AI talent pipelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address with Icon */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Work Email
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@company.com"
                  className="h-9 pl-9 bg-[#09090b] border-[#27272a] focus-visible:ring-[#adc6ff]/50 placeholder:text-muted-foreground/30 text-xs"
                />
              </div>
            </div>

            {/* Password Field with Locks & Visibility toggler */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <a href="#" className="text-[10px] text-[#adc6ff] hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-9 pl-9 pr-9 bg-[#09090b] border-[#27272a] focus-visible:ring-[#adc6ff]/50 placeholder:text-muted-foreground/30 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Error messages block */}
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 flex gap-2 items-center text-xs text-rose-400 shadow-sm">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 rounded-lg shadow-lg shadow-[#adc6ff]/10 hover:shadow-[#adc6ff]/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing In…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Register link */}
          <div className="mt-6 text-center">
            <span className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-[#adc6ff] font-bold hover:underline">
                Create one
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
