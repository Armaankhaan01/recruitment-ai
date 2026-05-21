"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Plus, Trash2, CheckCircle2, DollarSign, Award, Settings, Layers } from "lucide-react";
import { createJob, publishJob } from "@/lib/api/jobs";
import { toast } from "sonner";

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [seniority, setSeniority] = useState("MID");
  const [location, setLocation] = useState("Remote");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<{ name: string; minYears: number; required: boolean }[]>([
    { name: "", minYears: 1, required: true }
  ]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const addSkill = () => setSkills([...skills, { name: "", minYears: 1, required: true }]);
  const removeSkill = (idx: number) => {
    if (skills.length === 1) {
      toast.error("You must target at least one skill requirement for matching evaluation.");
      return;
    }
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const updateSkill = (idx: number, fields: Partial<{ name: string; minYears: number; required: boolean }>) => {
    const updated = [...skills];
    updated[idx] = { ...updated[idx], ...fields };
    setSkills(updated);
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      toast.error("Please enter a professional job requisition title.");
      return;
    }
    if (step === 2) {
      if (description.length < 100) {
        toast.error(`Requisition description is too brief (${description.length}/100 chars minimum).`);
        return;
      }
      const hasEmptySkill = skills.some((s) => !s.name.trim());
      if (hasEmptySkill) {
        toast.error("Please ensure all added skill tags have specified names.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (publish: boolean) => {
    setIsSubmitting(true);
    try {
      const seniorityMap: Record<string, number> = {
        JUNIOR: 1,
        MID: 2,
        SENIOR: 5,
        LEAD: 8,
        PRINCIPAL: 12
      };

      const jobPayload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || "Remote",
        skillRequirements: skills.map(s => ({
          name: s.name.trim(),
          minYears: Number(s.minYears),
          required: s.required
        })),
        seniorityLevel: seniority,
        minExperienceYears: seniorityMap[seniority] ?? 2,
        salaryRangeMin: salaryMin ? Number(salaryMin) : undefined,
        salaryRangeMax: salaryMax ? Number(salaryMax) : undefined,
      };

      const res = await createJob(jobPayload);
      const createdJobId = res.job.id;

      if (publish) {
        await publishJob(createdJobId);
        toast.success("Job Requisition published successfully and live!");
      } else {
        toast.success("Job Requisition saved as Draft.");
      }

      router.push(`/dashboard/jobs/${createdJobId}`);
    } catch (err: any) {
      console.error("Failed to create job requisition:", err);
      toast.error(err.message || "Failed to create job requisition. Check form fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back to list */}
      <Link 
        href="/dashboard/jobs" 
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
        Back to Requisitions
      </Link>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">New Requisition</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure basic metadata, required match parameters, and estimated salary thresholds.</p>
      </div>

      {/* Exquisite connector steps status bar */}
      <div className="flex items-center justify-between relative px-2 py-4">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border/40 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 -z-10"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {/* Step 1 indicator */}
        <div className="flex flex-col items-center gap-2">
          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
            step >= 1 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground"
          }`}>
            1
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>Basic Info</span>
        </div>

        {/* Step 2 indicator */}
        <div className="flex flex-col items-center gap-2">
          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
            step >= 2 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground"
          }`}>
            2
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>Specifications</span>
        </div>

        {/* Step 3 indicator */}
        <div className="flex flex-col items-center gap-2">
          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
            step >= 3 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground"
          }`}>
            3
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>Compensation</span>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm relative overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            {step === 1 && <Settings className="w-4.5 h-4.5 text-primary" />}
            {step === 2 && <Award className="w-4.5 h-4.5 text-secondary" />}
            {step === 3 && <DollarSign className="w-4.5 h-4.5 text-primary" />}
            {step === 1 ? "Basic Information" : step === 2 ? "Role Specifications" : "Compensation Details"}
          </CardTitle>
          <CardDescription className="text-xs">
            {step === 1 && "Specify job designation and targeted organizational seniority."}
            {step === 2 && "Input detailed requisition description and configure matching skill sets."}
            {step === 3 && "Complete requisition by outlining expected min/max salary parameters."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Step 1 Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Role Title</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Senior Fullstack Engineer"
                  className="h-10 border-border/60 bg-background placeholder:text-muted-foreground/45"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Inferred Seniority Level</label>
                <Select value={seniority} onValueChange={setSeniority}>
                  <SelectTrigger className="h-10 border-border/60 bg-background">
                    <SelectValue placeholder="Select target seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JUNIOR">Junior (&lt; 2 yrs)</SelectItem>
                    <SelectItem value="MID">Mid Level (2-5 yrs)</SelectItem>
                    <SelectItem value="SENIOR">Senior (5-8 yrs)</SelectItem>
                    <SelectItem value="LEAD">Lead (8-12 yrs)</SelectItem>
                    <SelectItem value="PRINCIPAL">Principal (&gt; 12 yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Location</label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Remote, Hybrid, San Francisco, CA"
                  className="h-10 border-border/60 bg-background placeholder:text-muted-foreground/45"
                />
              </div>
            </div>
          )}

          {/* Step 2 Spec */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Role Description</label>
                  <span className={`text-[10px] font-black uppercase ${description.length >= 100 ? "text-emerald-500" : "text-amber-500 animate-pulse"}`}>
                    {description.length} / 100 chars min
                  </span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the primary duties, organizational relationships, and tech stack parameters (min 100 characters)..."
                  rows={6}
                  className="border-border/60 bg-background placeholder:text-muted-foreground/45 text-sm"
                />
              </div>

              <Separator className="border-border/20" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Match-Pipeline Skill Requirements</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">Configure experience year limits on each key skill.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addSkill}
                    className="h-8 border-border/60 hover:bg-muted font-bold text-[10px] tracking-wider uppercase gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Skill
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-muted/20 border border-border/30 p-2 rounded-xl group transition-all">
                      <Input 
                        placeholder="Skill Name (e.g. React)" 
                        value={skill.name} 
                        onChange={(e) => updateSkill(idx, { name: e.target.value })}
                        className="h-9 border-border/60 bg-background text-xs placeholder:text-muted-foreground/45 flex-1"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input 
                          type="number" 
                          placeholder="Yrs" 
                          min={0}
                          value={skill.minYears} 
                          onChange={(e) => updateSkill(idx, { minYears: Number(e.target.value) })}
                          className="h-9 border-border/60 bg-background text-xs w-16 text-center"
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">yrs</span>
                      </div>
                      
                      {/* Required Toggle */}
                      <Select 
                        value={skill.required ? "true" : "false"} 
                        onValueChange={(val) => updateSkill(idx, { required: val === "true" })}
                      >
                        <SelectTrigger className="h-9 border-border/60 bg-background text-xs w-28 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Required</SelectItem>
                          <SelectItem value="false">Preferred</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={() => removeSkill(idx)}
                        className="h-9 w-9 border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 Comp */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Salary Min (USD/yr)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5 opacity-60" />
                    </span>
                    <Input 
                      type="number" 
                      min={0}
                      value={salaryMin} 
                      onChange={(e) => setSalaryMin(e.target.value)} 
                      placeholder="e.g. 80000" 
                      className="pl-8 h-10 border-border/60 bg-background placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Salary Max (USD/yr)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5 opacity-60" />
                    </span>
                    <Input 
                      type="number" 
                      min={0}
                      value={salaryMax} 
                      onChange={(e) => setSalaryMax(e.target.value)} 
                      placeholder="e.g. 120000" 
                      className="pl-8 h-10 border-border/60 bg-background placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footers navigation */}
          <div className="flex justify-between border-t border-border/20 pt-6 mt-6">
            {step > 1 ? (
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className="h-10 px-5 border-border/60 hover:bg-muted font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Back
              </Button>
            ) : <div />}

            <div className="flex gap-3">
              {step < 3 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="h-10 px-5 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 shadow-md cursor-pointer"
                >
                  Continue
                </Button>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="h-10 px-5 border-border/60 hover:bg-muted font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="h-10 px-5 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 shadow-md gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save & Publish
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
