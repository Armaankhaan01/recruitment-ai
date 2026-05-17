"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Sparkles, FileText, Download } from "lucide-react";
import SkillBadgeList from "@/components/recruitment/SkillBadgeList";
import ApplicationStatusBadge from "@/components/recruitment/ApplicationStatusBadge";
import { getApplication, submitDecision, getDecisions, reprocess } from "@/lib/api/applications";
import { toast } from "sonner";

export default function ApplicationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const unwrappedParams = use(params);
  const applicationId = unwrappedParams.applicationId;
  const [application, setApplication] = useState<Record<string, any> | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [showResume, setShowResume] = useState(true); // Default to true if a remote file exists

  useEffect(() => {
    Promise.all([getApplication(applicationId), getDecisions(applicationId)]).then(
      ([appData, decData]) => {
        setApplication(appData.application);
        setDecisions(decData.decisions ?? []);
        setLoading(false);
      }
    );
  }, [applicationId]);

  const handleDecision = async (type: string) => {
    if (rationale.length < 10) return;
    try {
      const result = await submitDecision(applicationId, type, rationale);
      
      // Update state by merging the updated fields from the patch result to preserve relations
      setApplication((prev) => prev ? { ...prev, ...result.application } : null);
      
      // Append the new decision locally in the list
      if (result.decision) {
        setDecisions((prev) => [result.decision, ...prev]);
      }
      
      setRationale("");
      toast.success(`Application status successfully updated to ${type.toLowerCase()}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to log recruitment decision.");
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await reprocess(applicationId);
      toast.success("AI extraction & scoring pipeline has been queued successfully!");
      
      const appData = await getApplication(applicationId);
      setApplication(appData.application);
      const decData = await getDecisions(applicationId);
      setDecisions(decData.decisions ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to request AI reprocessing.");
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!application) return <p>Application not found.</p>;

  const candidate = application.candidate as {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    resumeFilePath: string;
    resumeFileType: string;
    extractedSkills: { name: string; years: number }[];
    education: { institution: string; degree: string; field: string; year: number }[];
    employmentHistory: { company: string; role: string; startDate: string; endDate: string; description: string }[];
  } | null;

  const screening = application.screeningResult as {
    summaryText: string;
    strengths: string[];
    gaps: string[];
    interviewFocusAreas: string[];
  } | null;

  const score = Number(application.aiCompatibilityScore) ?? 0;
  const scoreColor = score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  // Check if a remote Cloudinary path is stored for the candidate
  const isCloudinary = candidate?.resumeFilePath?.startsWith("http");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{candidate?.fullName || "Candidate Details"}</h2>
          <p className="text-sm text-muted-foreground">Managing application profile & AI pipeline screening</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isCloudinary && (
            <Button
              variant={showResume ? "default" : "outline"}
              size="sm"
              onClick={() => setShowResume(!showResume)}
              className="flex items-center gap-1.5"
            >
              {showResume ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Resume
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Resume Split
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-1.5"
          >
            {reprocessing ? (
              <span className="flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Reprocessing...
              </span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Reprocess AI Pipeline
              </>
            )}
          </Button>
        </div>
      </div>

      {(!application.aiCompatibilityScore || application.status === "SUBMITTED") && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/50 p-4 text-sm text-yellow-800 dark:text-yellow-400 flex gap-2 items-center">
          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-ping" />
          <span>AI compatibility analysis is currently in queue. Click "Reprocess AI Pipeline" to trigger or speed up processing.</span>
        </div>
      )}

      {/* Side-by-Side Split layout */}
      {isCloudinary && showResume ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          {/* Left: Embedded Cloudinary Resume Viewer */}
          <div className="lg:col-span-6 flex flex-col h-[calc(100vh-7rem)] sticky top-6 border rounded-xl overflow-hidden bg-zinc-900/5 shadow-inner">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Cloudinary Resume Resource</span>
              </div>
              <a
                href={candidate?.resumeFilePath}
                target="_blank"
                rel="noreferrer"
                className="text-xs flex items-center gap-1 text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Open Original
              </a>
            </div>
            <iframe
              src={
                candidate?.resumeFilePath?.toLowerCase().endsWith(".pdf")
                  ? candidate?.resumeFilePath
                  : `https://docs.google.com/gview?url=${encodeURIComponent(candidate?.resumeFilePath || "")}&embedded=true`
              }
              className="w-full flex-1 border-none bg-white"
              title="Cloudinary Resume Viewer"
            />
          </div>

          {/* Right: Scrollable Details & Assessment */}
          <div className="lg:col-span-6 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar">
            {/* AI Assessment Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Compatibility Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}</span>
                    <span className="text-sm text-muted-foreground font-medium">/ 100 compatibility match</span>
                  </div>
                  <Progress value={score} className="w-full h-2.5" />
                </div>

                {screening?.summaryText && (
                  <>
                    <Separator className="bg-primary/10" />
                    <p className="text-sm leading-relaxed">{screening.summaryText}</p>
                  </>
                )}

                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  {screening?.strengths && screening.strengths.length > 0 && (
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                      <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Strengths</p>
                      {screening.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-green-800 dark:text-green-400 leading-normal">• {s}</p>
                      ))}
                    </div>
                  )}

                  {screening?.gaps && screening.gaps.length > 0 && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Gaps</p>
                      {screening.gaps.map((s, i) => (
                        <p key={i} className="text-xs text-amber-800 dark:text-amber-400 leading-normal">• {s}</p>
                      ))}
                    </div>
                  )}
                </div>

                {screening?.interviewFocusAreas && screening.interviewFocusAreas.length > 0 && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Suggested Interview Focus</p>
                    {screening.interviewFocusAreas.map((s, i) => (
                      <p key={i} className="text-xs text-blue-800 dark:text-blue-400 leading-normal">• {s}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decision Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Recruiter Decision & Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <ApplicationStatusBadge status={application.status as string} />
                </div>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Mandatory recruiter rationale (minimum 10 characters)..."
                  className="min-h-[80px]"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleDecision("ADVANCE")} disabled={rationale.length < 10}>
                    Advance
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecision("SHORTLIST")} disabled={rationale.length < 10}>
                    Shortlist
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecision("DEFER")} disabled={rationale.length < 10}>
                    Defer
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDecision("REJECT")} disabled={rationale.length < 10}>
                    Reject
                  </Button>
                </div>

                {decisions.length > 0 && (
                  <div className="mt-4">
                    <Separator className="my-2" />
                    <p className="text-sm font-semibold mb-2">Decision Log History</p>
                    <div className="space-y-3">
                      {decisions.map((dec: any, i: number) => (
                        <div key={i} className="text-xs bg-muted/40 border rounded p-2.5 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-primary">{dec.decisionType}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(dec.decidedAt as string).toLocaleString()}</span>
                          </div>
                          <p className="text-muted-foreground italic leading-normal">"{dec.rationale}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-semibold">{candidate?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-semibold">{candidate?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-semibold">{candidate?.location || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Skill containment</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillBadgeList skills={candidate?.extractedSkills ?? []} />
              </CardContent>
            </Card>

            {/* Employment History */}
            {candidate?.employmentHistory && candidate.employmentHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Employment Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.employmentHistory.map((entry, i) => (
                    <div key={i} className="border-l-2 border-primary/20 pl-3 space-y-1">
                      <p className="text-sm font-semibold">{entry.role} at {entry.company}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.startDate} — {entry.endDate || "Present"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Traditional Layout when split view is disabled/hidden */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Candidate Contact and Professional Profile */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold text-lg">{candidate?.fullName}</p>
                <p className="text-sm text-muted-foreground">{candidate?.email}</p>
                <p className="text-sm text-muted-foreground">{candidate?.phone || "No Phone Info"}</p>
                <p className="text-sm text-muted-foreground">{candidate?.location || "No Location Info"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillBadgeList skills={candidate?.extractedSkills ?? []} />
              </CardContent>
            </Card>

            {candidate?.employmentHistory && candidate.employmentHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Employment Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.employmentHistory.map((entry, i) => (
                    <div key={i} className="border-l-2 pl-3">
                      <p className="font-medium">{entry.role} at {entry.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.startDate} — {entry.endDate ?? "Present"}
                      </p>
                      <p className="text-sm mt-1 leading-normal">{entry.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: AI score, Gaps, Strengths and Decision Action Panel */}
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                  AI Requisition Fit Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}</span>
                    <span className="text-sm text-muted-foreground font-medium">/ 100 compatibility match</span>
                  </div>
                  <Progress value={score} className="w-full h-2.5" />
                </div>

                {screening?.summaryText && (
                  <>
                    <Separator className="bg-primary/10" />
                    <p className="text-sm leading-relaxed">{screening.summaryText}</p>
                  </>
                )}

                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  {screening?.strengths && screening.strengths.length > 0 && (
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                      <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Strengths</p>
                      {screening.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-green-800 dark:text-green-400 leading-normal">• {s}</p>
                      ))}
                    </div>
                  )}

                  {screening?.gaps && screening.gaps.length > 0 && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Gaps</p>
                      {screening.gaps.map((s, i) => (
                        <p key={i} className="text-xs text-amber-800 dark:text-amber-400 leading-normal">• {s}</p>
                      ))}
                    </div>
                  )}
                </div>

                {screening?.interviewFocusAreas && screening.interviewFocusAreas.length > 0 && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Suggested Interview Focus</p>
                    {screening.interviewFocusAreas.map((s, i) => (
                      <p key={i} className="text-xs text-blue-800 dark:text-blue-400 leading-normal">• {s}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recruiter Decision Action Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <ApplicationStatusBadge status={application.status as string} />
                </div>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Mandatory recruiter rationale (minimum 10 characters)..."
                  className="min-h-[80px]"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleDecision("ADVANCE")} disabled={rationale.length < 10}>
                    Advance
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecision("SHORTLIST")} disabled={rationale.length < 10}>
                    Shortlist
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecision("DEFER")} disabled={rationale.length < 10}>
                    Defer
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDecision("REJECT")} disabled={rationale.length < 10}>
                    Reject
                  </Button>
                </div>

                {decisions.length > 0 && (
                  <div className="mt-4">
                    <Separator className="my-2" />
                    <p className="text-sm font-semibold mb-2">Decision Log History</p>
                    <div className="space-y-3">
                      {decisions.map((dec: any, i: number) => (
                        <div key={i} className="text-xs bg-muted/40 border rounded p-2.5 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-primary">{dec.decisionType}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(dec.decidedAt as string).toLocaleString()}</span>
                          </div>
                          <p className="text-muted-foreground italic leading-normal">"{dec.rationale}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
