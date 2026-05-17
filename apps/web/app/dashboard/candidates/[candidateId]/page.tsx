"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { getCandidate } from "@/lib/api/candidates";
import { toast } from "sonner";
import SkillBadgeList from "@/components/recruitment/SkillBadgeList";
import ApplicationStatusBadge from "@/components/recruitment/ApplicationStatusBadge";

interface ApplicationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  aiCompatibilityScore: number | string | null;
  appliedAt: string;
}

interface CandidateDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  extractedSkills: any;
  totalExperienceYears?: string | number;
  education: any;
  employmentHistory: any;
  seniorityInferred?: string;
}

export default function CandidateDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params);
  const router = useRouter();
  
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!candidateId) return;

    setLoading(true);
    getCandidate(candidateId)
      .then((res) => {
        setCandidate(res.candidate);
        setApplications(res.applications || []);
      })
      .catch((err) => {
        console.error("Failed to load candidate profile details:", err);
        setError("Failed to fetch the requested candidate profile. They may have been anonymized.");
        toast.error("Error loading candidate profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [candidateId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing talent profile dossiers...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="max-w-md border-border/40 bg-card/40 backdrop-blur-md shadow-2xl p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{error || "Candidate profile could not be located."}</p>
          <button 
            onClick={() => router.push("/dashboard/candidates")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </button>
        </Card>
      </div>
    );
  }

  // Parse education and employment lists safely
  const educationList = Array.isArray(candidate.education) ? candidate.education : [];
  const employmentHistory = Array.isArray(candidate.employmentHistory) ? candidate.employmentHistory : [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/candidates"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
          Back to Candidates list
        </Link>
      </div>

      {/* Candidate dossier summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Dossier Card: Metadata and skills */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/40 shadow-sm relative overflow-hidden">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <CardHeader className="pb-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-foreground">{candidate.fullName}</h3>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {candidate.seniorityInferred && (
                    <Badge className="bg-primary/10 border-primary/20 text-primary font-extrabold text-[10px] tracking-wider uppercase">
                      {candidate.seniorityInferred}
                    </Badge>
                  )}
                  {candidate.totalExperienceYears !== null && (
                    <Badge className="bg-secondary/10 border-secondary/20 text-secondary font-extrabold text-[10px] tracking-wider uppercase">
                      {parseFloat(String(candidate.totalExperienceYears)).toFixed(1)} Yrs Exp
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-2 border-t border-border/20">
              {/* Contact info list */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Email Address</p>
                    <p className="font-bold text-foreground truncate max-w-[200px]">{candidate.email}</p>
                  </div>
                </div>

                {candidate.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Phone className="w-4 h-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Phone Number</p>
                      <p className="font-bold text-foreground">{candidate.phone}</p>
                    </div>
                  </div>
                )}

                {candidate.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Location</p>
                      <p className="font-bold text-foreground">{candidate.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border/20">
                  <Award className="w-4.5 h-4.5 text-primary" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Skills Catalog</h4>
                </div>
                <SkillBadgeList skills={candidate.extractedSkills || []} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right dossier column: Experience, Education, and historic applications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Historical applications list */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-secondary" />
                Application Portfolio
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">All historic roles applied by this candidate.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {applications.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-muted/5 border-b border-border/20 text-xs">
                      <TableRow>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider">Position</TableHead>
                        <TableHead className="py-3 px-5 text-center font-bold uppercase tracking-wider">AI Compat Score</TableHead>
                        <TableHead className="py-3 px-5 text-center font-bold uppercase tracking-wider">Workflow Stage</TableHead>
                        <TableHead className="py-3 px-5 font-bold uppercase tracking-wider">Applied Date</TableHead>
                        <TableHead className="py-3 px-5 text-center font-bold uppercase tracking-wider">Evaluation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody className="divide-y divide-border/10 text-xs">
                      {applications.map((app) => {
                        const scoreVal = app.aiCompatibilityScore !== null ? Math.round(Number(app.aiCompatibilityScore)) : null;
                        
                        let scoreColor = "text-muted-foreground bg-muted/10 border-border/30";
                        if (scoreVal !== null) {
                          if (scoreVal >= 75) {
                            scoreColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-extrabold";
                          } else if (scoreVal >= 50) {
                            scoreColor = "text-amber-400 bg-amber-500/10 border-amber-500/20 font-extrabold";
                          } else {
                            scoreColor = "text-rose-400 bg-rose-500/10 border-rose-500/20 font-extrabold";
                          }
                        }

                        return (
                          <TableRow key={app.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-5 font-bold text-foreground">{app.jobTitle}</td>
                            <td className="py-3 px-5 text-center">
                              {scoreVal !== null ? (
                                <span className={`inline-flex px-2 py-0.5 rounded-md border ${scoreColor}`}>
                                  {scoreVal}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/55 italic">Enqueued</span>
                              )}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <ApplicationStatusBadge status={app.status} />
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
                <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4 space-y-2">
                  <Calendar className="h-8 w-8 opacity-30 animate-pulse" />
                  <p className="text-xs">No current or past job applications matching this candidate profile.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline of Employment History */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5 text-primary" />
                Employment Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {employmentHistory.length > 0 ? (
                <div className="relative border-l border-border/60 ml-3 pl-6 space-y-6">
                  {employmentHistory.map((job: any, index: number) => (
                    <div key={index} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-foreground">{job.role}</h4>
                        <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-md border border-border/30 w-fit">
                          {job.startDate || "N/A"} — {job.endDate || "Present"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-primary font-bold">{job.company}</p>
                      {job.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed pt-1.5 font-medium whitespace-pre-line">
                          {job.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4 space-y-2">
                  <Briefcase className="h-8 w-8 opacity-30 animate-pulse" />
                  <p className="text-xs">Employment history not found or parsed on candidate CV.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parsed education info */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-secondary" />
                Academic Dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {educationList.length > 0 ? (
                <div className="space-y-4">
                  {educationList.map((edu: any, idx: number) => (
                    <div key={idx} className="flex gap-4 border border-border/30 rounded-xl p-3.5 bg-muted/10 hover:border-secondary/20 transition-all">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/30">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full">
                          <h4 className="font-bold text-sm text-foreground leading-tight">{edu.institution}</h4>
                          {edu.year && (
                            <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-md border border-border/30 w-fit">
                              Graduated {edu.year}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {edu.degree || "Degree"}{edu.field ? ` in ${edu.field}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4 space-y-2">
                  <GraduationCap className="h-8 w-8 opacity-30 animate-pulse" />
                  <p className="text-xs">Academic qualifications not found on candidate CV.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
