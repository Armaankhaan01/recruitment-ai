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
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: `${firstName} ${lastName}`.trim(),
          role: "RECRUITER"
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message || "Registration failed. Please try again.");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      
      // Redirect to Recruiter Dashboard
      window.location.href = "/dashboard/overview";
    } catch (err) {
      setError("Network connection issue. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#f8fafc] flex font-sans">
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

      {/* Right Column: Interactive Recruiter Registration Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#adc6ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-[#10131a] border border-[#27272a]/50 rounded-2xl p-8 md:p-10 w-full max-w-md shadow-2xl relative">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Start building your AI-powered talent pool today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name horizontal layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Jane"
                  className="h-9 bg-[#09090b] border-[#27272a] focus-visible:ring-[#adc6ff]/50 placeholder:text-muted-foreground/30 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="h-9 bg-[#09090b] border-[#27272a] focus-visible:ring-[#adc6ff]/50 placeholder:text-muted-foreground/30 text-xs"
                />
              </div>
            </div>

            {/* Work Email Address with Icon */}
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
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
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
              <p className="text-[10px] text-muted-foreground/80">
                Must be at least 8 characters long.
              </p>
            </div>

            {/* Company Size styled Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="companySize" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Company Size
              </Label>
              <div className="relative">
                <select
                  id="companySize"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  required
                  className="w-full h-9 pl-3 pr-9 bg-[#09090b] border border-[#27272a] hover:border-[#27272a]/80 focus:border-[#adc6ff]/50 focus:ring-1 focus:ring-[#adc6ff]/50 rounded-lg text-xs text-foreground/80 placeholder:text-muted-foreground/30 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select company size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground/80">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-3 pt-0.5">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                className="h-3.5 w-3.5 rounded border-[#27272a] bg-[#09090b] text-[#adc6ff] focus:ring-[#adc6ff]/50 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[10px] text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-[#adc6ff] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#adc6ff] hover:underline">
                  Privacy Policy
                </a>
                .
              </label>
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
                  Creating Account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Already have an account routing link */}
          <div className="mt-6 text-center">
            <span className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#adc6ff] font-bold hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
