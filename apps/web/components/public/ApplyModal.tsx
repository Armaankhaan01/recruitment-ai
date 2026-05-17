"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2, UploadCloud } from "lucide-react";

interface Job {
  id: string;
  title: string;
}

interface ApplyModalProps {
  job: Job | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ job, onClose, onSuccess }: ApplyModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState("");

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
      onSuccess();
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

  return (
    <Dialog open={job !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border/40 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Apply to {job?.title}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your profile has been enqueued in the AI parsing pipeline. Recruiter compatibility analysis will be completed shortly.
              </p>
            </div>
            <Button
              onClick={() => {
                setSuccess(false);
                onClose();
              }}
              className="w-full mt-4 bg-primary text-on-primary font-bold uppercase tracking-wider text-xs"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="Arman Khan"
                className="h-10 border-border/60 bg-background focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="arman@example.com"
                className="h-10 border-border/60 bg-background focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+91-99999-99999"
                className="h-10 border-border/60 bg-background focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Resume Upload (PDF / DOCX)
              </Label>
              <div className="relative border border-dashed border-border/80 hover:border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-background hover:bg-primary/5 transition-colors">
                <Input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.docx"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-xs font-medium text-foreground">
                  {fileName ? fileName : "Click to upload or drag & drop"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  PDF, DOCX (Max size: 5MB)
                </span>
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2 items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 mt-6 bg-primary text-on-primary font-bold uppercase tracking-wider text-xs"
              disabled={submitting}
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
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
