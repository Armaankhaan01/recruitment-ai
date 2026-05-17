"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Edit3, Calendar, DollarSign, Layers, Award, Sparkles, Play, Pause, XCircle, Trash2, ArrowUpRight } from "lucide-react";
import JobStatusBadge from "@/components/recruitment/JobStatusBadge";
import ApplicationStatusBadge from "@/components/recruitment/ApplicationStatusBadge";
import ScoreBar from "@/components/recruitment/ScoreBar";
import SkillBadgeList from "@/components/recruitment/SkillBadgeList";
import { getJob, getCandidates, updateJob } from "@/lib/api/jobs";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  seniorityLevel: string;
  skillRequirements: any;
  minExperienceYears: number;
  salaryRangeMin: number | string | null;
  salaryRangeMax: number | string | null;
  createdAt: string;
  publishedAt: string | null;
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const unwrappedParams = use(params);
  const jobId = unwrappedParams.jobId;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchJobDetails = async () => {
    try {
      const [jobData, candidatesData] = await Promise.all([
        getJob(jobId),
        getCandidates(jobId)
      ]);
      setJob(jobData.job);
      setCandidates(candidatesData.data ?? []);
    } catch (err: any) {
      console.error("Failed to load job requisition details:", err);
      toast.error("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    
    // Confirm archiving as it is highly destructive
    if (newStatus === "ARCHIVED" && !confirm("Are you sure you want to permanently ARCHIVE this job requisition?")) return;

    setUpdatingStatus(newStatus);
    try {
      const res = await updateJob(job.id, { status: newStatus });
      setJob(res.job);
      toast.success(`Job status successfully transitioned to ${newStatus}!`);
    } catch (err: any) {
      console.error("Failed to transition job status:", err);
      toast.error(err.message || "Failed to update requisition lifecycle status.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing job requisition portfolio...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="max-w-md border-border/40 p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">The requested job requisition could not be located.</p>
          <Button onClick={() => router.push("/dashboard/jobs")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Requisitions
          </Button>
        </Card>
      </div>
    );
  }

  // Define valid status changes based on backend limits
  const currentStatus = job.status;

  return (
    <div className="space-y-6">
      {/* Back navigations */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
          Back to Requisitions
        </Link>
      </div>

      {/* Hero Header block */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b border-border/20 pb-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{job.title}</h2>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              Requisition created on {new Date(job.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <JobStatusBadge status={job.status} />
            <Badge variant="outline" className="border-border/60 text-muted-foreground font-extrabold text-[10px] tracking-wider uppercase">
              Seniority: {job.seniorityLevel}
            </Badge>
            <Badge variant="outline" className="border-border/60 text-muted-foreground font-extrabold text-[10px] tracking-wider uppercase">
              Min Exp: {job.minExperienceYears} yrs
            </Badge>
            {job.salaryRangeMin && job.salaryRangeMax && (
              <Badge variant="outline" className="border-border/60 text-muted-foreground font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                Compensation: ${Number(job.salaryRangeMin).toLocaleString()} - ${Number(job.salaryRangeMax).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href={`/dashboard/jobs/${job.id}/edit`}>
            <Button variant="outline" className="h-10 px-4 border-border/60 hover:bg-muted font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer">
              <Edit3 className="w-4 h-4" />
              Edit details
            </Button>
          </Link>

          {/* Quick status controls */}
          <div className="flex items-center gap-2 border border-border/30 rounded-xl p-1 bg-muted/20">
            {updatingStatus ? (
              <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Transitioning stage...
              </div>
            ) : (
              <>
                {/* DRAFT -> OPEN */}
                {currentStatus === "DRAFT" && (
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusChange("OPEN")} 
                    className="bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Publish Role
                  </Button>
                )}

                {/* OPEN -> ON_HOLD, CLOSED, ARCHIVED */}
                {currentStatus === "OPEN" && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleStatusChange("ON_HOLD")} 
                      className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      Put On Hold
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleStatusChange("CLOSED")} 
                      className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Close Role
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleStatusChange("ARCHIVED")} 
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Archive
                    </Button>
                  </>
                )}

                {/* ON_HOLD -> OPEN, ARCHIVED */}
                {currentStatus === "ON_HOLD" && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange("OPEN")} 
                      className="bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Reactivate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleStatusChange("ARCHIVED")} 
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Archive
                    </Button>
                  </>
                )}

                {/* CLOSED -> ARCHIVED */}
                {currentStatus === "CLOSED" && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleStatusChange("ARCHIVED")} 
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-[10px] tracking-wider uppercase h-8 px-3 cursor-pointer gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Archive Requisition
                  </Button>
                )}

                {/* ARCHIVED -> No transitions available */}
                {currentStatus === "ARCHIVED" && (
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase px-3 py-1 italic">
                    Requisition Archived
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Job Description and Skills */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-primary" />
                Target Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <SkillBadgeList skills={(job.skillRequirements as { name: string; years: number }[]) ?? []} />
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-secondary" />
                Description Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                {job.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Applicants Pipeline Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" />
                    AI Scored Applicants Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Applicants dynamically sorted by compatibility scores (gpt-4o-mini engine).
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-extrabold text-[10px] tracking-wider uppercase shrink-0">
                  {candidates.length} Applicants
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {candidates.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-muted/5 border-b border-border/20 text-xs">
                      <TableRow>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider w-12 text-center">Rank</TableHead>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider">Candidate</TableHead>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider">AI Score</TableHead>
                        <TableHead className="py-3 px-5 text-center font-bold uppercase tracking-wider">Status</TableHead>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider">Applied</TableHead>
                        <TableHead className="py-3 px-5 text-center font-bold uppercase tracking-wider">Evaluation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody className="divide-y divide-border/10 text-xs">
                      {candidates.map((app: any, idx: number) => {
                        const scoreVal = app.aiCompatibilityScore !== null ? Math.round(Number(app.aiCompatibilityScore)) : null;

                        return (
                          <TableRow key={app.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-5 text-center font-bold text-muted-foreground/60">{idx + 1}</td>
                            <td className="py-3 px-5 font-bold text-foreground">
                              {(app.candidate as { fullName: string })?.fullName ?? "Anonymized Profile"}
                            </td>
                            <td className="py-3 px-5 w-48">
                              <ScoreBar value={scoreVal ?? 0} />
                            </td>
                            <td className="py-3 px-5 text-center">
                              <ApplicationStatusBadge status={app.status as string} />
                            </td>
                            <td className="py-3 px-5 text-muted-foreground font-semibold">
                              {new Date(app.appliedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <Link href={`/dashboard/applications/${app.id}`}>
                                <button className="inline-flex items-center gap-1 text-[11px] font-bold text-[#adc6ff] hover:text-[#adc6ff]/80 transition-colors uppercase tracking-wider cursor-pointer">
                                  Review
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            </td>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-6 space-y-3">
                  <Layers className="h-10 w-10 opacity-30 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">No candidate applications yet</h4>
                    <p className="text-xs max-w-xs leading-relaxed">
                      Applicants will automatically appear here once candidate portfolios are uploaded through the public applying page.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
