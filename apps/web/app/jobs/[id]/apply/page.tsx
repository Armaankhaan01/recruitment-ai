"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublicJob } from "@/lib/api/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Loader2, UploadCloud, Link2, FileText } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
}

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getPublicJob(jobId)
      .then((res) => {
        setJob(res.job);
      })
      .catch((err) => {
        setError(err.message || "Failed to load job details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!job) return;

    setSubmitting(true);
    setSubmitError("");

    const formData = new FormData(e.currentTarget);
    formData.append("jobId", job.id);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiBase}/applications`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to submit application.");
      }

      const data = await res.json();

      // Save application details in local storage
      const localApps = JSON.parse(localStorage.getItem("appliedJobs") || "{}");
      localApps[job.id] = {
        applicationId: data.applicationId,
        status: data.status || "SUBMITTED",
        appliedAt: new Date().toISOString(),
        jobTitle: job.title,
      };
      localStorage.setItem("appliedJobs", JSON.stringify(localApps));

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading job requisition details…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-8 text-center space-y-4 shadow-lg">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Failed to Load Page</h2>
          <p className="text-sm text-muted-foreground">{error || "The requested job position could not be found."}</p>
          <Button onClick={() => router.push("/")} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img
              alt="RecruitAI Logo"
              className="h-8 w-8 object-contain"
              src="/logo.png"
            />
            <span className="text-xl font-black tracking-tighter text-primary uppercase">
              RECRUITAI
            </span>
          </Link>
          <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            View Open Roles
          </Link>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-12">
        {success ? (
          <div className="bg-card border border-border/40 rounded-2xl p-10 text-center space-y-6 shadow-sm max-w-xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Application Received!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your application for <span className="font-semibold text-foreground">{job.title}</span> has been securely submitted and enqueued in our three-stage semantic AI pipeline.
              </p>
              <p className="text-xs text-muted-foreground">
                We've stored your status locally. You will see real-time updates directly on the home page as recruiters review your profile.
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-xs py-5 rounded-lg shadow-sm cursor-pointer transition-all duration-200"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-300">
            {/* Page Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Apply for {job.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Submit your application to join the Neural Talent team. Fields marked with an asterisk (<span className="text-primary">*</span>) are required.
              </p>
            </div>

            {/* Block 1: Personal Information */}
            <div className="bg-card border border-border/40 rounded-xl p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/40 pb-3">
                Personal Information
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider">
                    Full Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    placeholder="Enter your full name"
                    className="h-11 border-border/60 bg-background focus-visible:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                      Email Address <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="h-11 border-border/60 bg-background focus-visible:ring-primary placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+91-XXXXX-XXXXX"
                      className="h-11 border-border/60 bg-background focus-visible:ring-primary placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Professional Profiles */}
            <div className="bg-card border border-border/40 rounded-xl p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/40 pb-3">
                Professional Profiles
              </h2>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="text-xs font-semibold uppercase tracking-wider">
                  LinkedIn Profile URL <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    required
                    placeholder="https://linkedin.com/in/..."
                    className="h-11 pl-10 border-border/60 bg-background focus-visible:ring-primary placeholder:text-muted-foreground/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Block 3: Resume Upload */}
            <div className="bg-card border border-border/40 rounded-xl p-8 space-y-6 shadow-sm">
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Resume / CV <span className="text-primary">*</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Please upload your most recent resume. PDF or DOCX formats accepted (Max 5MB).
                </p>
              </div>

              <div className="relative border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-background/50 hover:bg-primary/5 transition-all duration-200">
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.docx"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <UploadCloud className="h-10 w-10 text-muted-foreground/80 mb-3" />
                <span className="text-sm font-semibold text-foreground">
                  {fileName ? fileName : "Drag and drop your file here"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  or click to browse files
                </span>
              </div>
            </div>

            {/* Block 4: Why are you a fit? */}
            <div className="bg-card border border-border/40 rounded-xl p-8 space-y-6 shadow-sm">
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Why are you a fit? <span className="text-primary">*</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Briefly describe your experience with AI systems and why you're interested in joining Neural Talent.
                </p>
              </div>

              <Textarea
                id="whyFit"
                name="whyFit"
                required
                placeholder="Share your experience and aspirations..."
                rows={5}
                className="border-border/60 bg-background focus-visible:ring-primary placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {/* Errors */}
            {submitError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 items-center text-sm text-destructive shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form submission controls */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-xs px-8 py-5 rounded-lg shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Application…
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full px-gutter py-8 flex flex-col md:flex-row justify-between items-center border-t border-border/40 bg-card shadow-sm mt-12 max-w-container-max mx-auto">
        <div className="mb-4 md:mb-0 flex items-center gap-2">
          <img
            alt="RecruitAI Logo"
            className="h-6 w-6 object-contain opacity-80 grayscale"
            src="/logo.png"
          />
          <span className="text-xs font-bold text-muted-foreground">
            © 2024 Neural Talent AI. Precision Engineered Recruiting.
          </span>
        </div>
        <nav className="flex gap-6 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Protocol</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">AI Ethics</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
        </nav>
      </footer>
    </div>
  );
}
