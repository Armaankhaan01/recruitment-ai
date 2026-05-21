"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Briefcase, 
  Users, 
  Cpu,
  RefreshCw,
  Clock,
  Sparkles,
  UserPlus,
  ArrowRightLeft,
  Building,
  Key,
  ShieldAlert
} from "lucide-react";
import KPICard from "@/components/recruitment/KPICard";
import ApplicationStatusBadge from "@/components/recruitment/ApplicationStatusBadge";
import { getMetricsOverview, getScoreDistribution, getConversion } from "@/lib/api/metrics";
import { getApplications } from "@/lib/api/applications";
import { me, createTeam, joinTeam } from "@/lib/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Application {
  id: string;
  appliedAt: string;
  status: string;
  aiCompatibilityScore: number | null;
  candidate: {
    fullName: string;
    email: string;
  };
  job: {
    title: string;
  };
}

interface ScoreBucket {
  range: string;
  count: number;
}

export default function OverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [scoreData, setScoreData] = useState<{ buckets: ScoreBucket[]; mean: string; median: string } | null>(null);
  const [conversionData, setConversionData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Team onboarding local state
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // First verify who the user is
      const userRes = await me();
      setUser(userRes.user);

      // Only attempt to load pipeline metrics if the user is integrated into a team
      if (userRes.user?.teamId) {
        const [metricsRes, appsRes, scoreRes, conversionRes] = await Promise.all([
          getMetricsOverview(),
          getApplications(1, 10),
          getScoreDistribution(),
          getConversion()
        ]);
        
        setMetrics(metricsRes);
        setApplications(appsRes.data || []);
        setScoreData(scoreRes);
        setConversionData(conversionRes.data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch overview metrics:", err);
      setError("Failed to sync recruiter metrics dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreateLoading(true);
    setOnboardingError("");
    try {
      const res = await createTeam(teamName.trim());
      setUser(res.user);
      await loadData();
    } catch (err: any) {
      setOnboardingError(err.message || "Failed to initialize recruiting team.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinLoading(true);
    setOnboardingError("");
    try {
      const res = await joinTeam(inviteCode.trim().toUpperCase());
      setUser(res.user);
      await loadData();
    } catch (err: any) {
      setOnboardingError(err.message || "Failed to integrate with matching team.");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center pb-2">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="h-9 w-24 bg-muted rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 border border-border/40 rounded-xl bg-card/50" />
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 h-96 border border-border/40 rounded-xl bg-card/50" />
          <div className="lg:col-span-2 h-96 border border-border/40 rounded-xl bg-card/50" />
        </div>
      </div>
    );
  }

  // TEAM ONBOARDING SCREEN: Displays if the recruiter hasn't created/joined a team
  if (user && !user.teamId) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-300">
        
        {/* Welcome Greeting Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-sm animate-bounce">
            <Building className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Welcome to RecruitAI, {user.fullName}!
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Your recruiter account is active, but you don't belong to any hiring team. To access the recruitment pipelines and candidates, please create a new team or enter an invite code to join an existing organization.
          </p>
        </div>

        {onboardingError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 max-w-lg mx-auto shadow-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="text-xs font-semibold">{onboardingError}</p>
          </div>
        )}

        {/* Dual Actions Grid: Create or Join */}
        <div className="grid gap-8 md:grid-cols-2 mt-8">
          
          {/* Card 1: Create a Recruiting Team */}
          <Card className="border border-border/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
            <form onSubmit={handleCreateTeam} className="flex flex-col flex-grow p-6 justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20 flex items-center justify-center mb-1">
                  <Building className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold">Create a New Team</CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Establish an isolated tenant pipeline for your organization's recruiting activity.
                  </CardDescription>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="teamName" className="text-xs text-muted-foreground font-semibold">Team / Company Name</Label>
                  <Input 
                    id="teamName"
                    type="text"
                    required
                    disabled={createLoading}
                    placeholder="e.g. Acme Corp Recruiting"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-background border-border/60 text-sm py-5"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={createLoading || !teamName.trim()}
                  className="w-full bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-bold py-5 cursor-pointer transition-all duration-200"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initializing Team...
                    </>
                  ) : (
                    <>
                      Create Recruiting Team
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Join an Existing Team */}
          <Card className="border border-border/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
            <form onSubmit={handleJoinTeam} className="flex flex-col flex-grow p-6 justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#c8b3ff]/10 text-[#c8b3ff] border border-[#c8b3ff]/20 flex items-center justify-center mb-1">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold">Join an Existing Team</CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Enter an invitation code generated by a team administrator to join their workspace.
                  </CardDescription>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="inviteCode" className="text-xs text-muted-foreground font-semibold">Team Invite Code</Label>
                  <Input 
                    id="inviteCode"
                    type="text"
                    required
                    disabled={joinLoading}
                    placeholder="e.g. ACMECORP-A1B2"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="bg-background border-border/60 text-sm py-5 uppercase tracking-wider font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={joinLoading || !inviteCode.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 cursor-pointer transition-all duration-200"
                >
                  {joinLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining Team Workspace...
                    </>
                  ) : (
                    <>
                      Integrate with Team
                      <ArrowRightLeft className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

        </div>
        
        {/* Simple details summary */}
        <div className="text-center pt-8 border-t border-border/30 text-xs text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6">
          <p>Logged in as: <span className="font-semibold text-foreground">{user.email}</span></p>
          <span className="hidden sm:inline text-border/60">|</span>
          <p>System Authorization Role: <span className="font-semibold text-foreground">{user.role}</span></p>
        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 max-w-md shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Button onClick={loadData} className="bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-bold">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Fetching
        </Button>
      </div>
    );
  }

  // Fallback defaults if metrics database is empty
  const activeJobsCount = metrics?.totalJobs ?? 0;
  const totalAppsCount = metrics?.totalApplications ?? 0;
  const avgCompatibility = metrics?.avgAiScore ?? "0.0";
  const shortlistedCount = metrics?.totalShortlisted ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Overview Dashboard
            </h1>
            {user?.team && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full font-bold select-none">
                <Building className="h-3 w-3" />
                {user.team.name}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            AI-driven recruiting activities, queue performance, and talent metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.team && (
            <div className="hidden lg:flex items-center gap-1.5 border border-border/40 bg-card px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground shadow-sm">
              <Key className="h-3.5 w-3.5" />
              Invite Code: <span className="font-bold text-foreground font-sans">{user.team.inviteCode}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={loadData}
            className="bg-card hover:bg-muted border-border/60 hover:text-foreground text-muted-foreground gap-2 cursor-pointer transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Data
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Briefcase className="h-24 w-24" />
          </div>
          <KPICard 
            title="Active Requisitions" 
            value={activeJobsCount} 
            description="Positions open for candidate intake" 
            trend={activeJobsCount > 0 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Users className="h-24 w-24" />
          </div>
          <KPICard 
            title="Applications Received" 
            value={totalAppsCount} 
            description="Submitted resume screening pipeline" 
            trend={totalAppsCount > 0 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Cpu className="h-24 w-24" />
          </div>
          <KPICard 
            title="Avg AI Score" 
            value={`${avgCompatibility}%`} 
            description="Semantic compatibility profile mean" 
            trend={parseFloat(avgCompatibility) > 60 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Sparkles className="h-24 w-24" />
          </div>
          <KPICard 
            title="Shortlisted Talents" 
            value={shortlistedCount} 
            description="Candidates passed screening review" 
            trend={shortlistedCount > 0 ? "up" : "neutral"} 
          />
        </div>
      </div>

      {/* Main Grid: Analytical Chart & Recent Screening Activities Table */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Left Column Stack */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Card 1: AI Compatibility Score Distribution Card */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm flex flex-col justify-between shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">Score Distribution</CardTitle>
                  <CardDescription className="text-xs">
                    Candidate semantic alignment index counts
                  </CardDescription>
                </div>
                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  gpt-4o-mini
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 flex-grow flex flex-col justify-between min-h-[220px]">
              {scoreData && scoreData.buckets?.length > 0 ? (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  {/* SVG/CSS Bar Chart Grid */}
                  <div className="h-44 flex items-end gap-1.5 pt-4 px-2 relative border-b border-border/40">
                    {/* Decorative horizontal guidelines */}
                    <div className="absolute inset-x-0 top-1/4 border-t border-border/10 border-dashed pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/4 border-t border-border/10 border-dashed pointer-events-none" />
                    <div className="absolute inset-x-0 top-3/4 border-t border-border/10 border-dashed pointer-events-none" />
                    
                    {(() => {
                      const counts = scoreData.buckets.map(b => b.count);
                      const maxVal = Math.max(...counts, 1);
                      
                      return scoreData.buckets.map((b) => {
                        const percentage = (b.count / maxVal) * 100;
                        return (
                          <div key={b.range} className="flex flex-col items-center flex-1 h-full justify-end group relative cursor-help">
                            {/* Hover tooltip bubble */}
                            <span className="text-[10px] select-none font-bold text-foreground bg-popover border border-border px-2 py-1 rounded shadow-lg absolute -top-8 scale-0 group-hover:scale-100 transition-all z-10 whitespace-nowrap pointer-events-none">
                              {b.count} {b.count === 1 ? "applicant" : "applicants"}
                            </span>
                            {/* Animated Vertical Bar */}
                            <div 
                              style={{ height: `${percentage}%` }}
                              className="w-full bg-[#adc6ff]/20 hover:bg-[#adc6ff] border-t border-[#adc6ff]/50 rounded-t-sm transition-all duration-300 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#adc6ff]/10 animate-pulse group-hover:opacity-0" />
                            </div>
                            {/* X-Axis Range Marker */}
                            <span className="text-[9px] text-muted-foreground mt-2 truncate w-full text-center font-medium leading-none select-none">
                              {b.range}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
   
                  {/* Score Stats Detail Summary */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4 bg-muted/20 rounded-lg p-3">
                    <div className="text-center space-y-0.5">
                      <span className="text-xs text-muted-foreground font-semibold">Mean score</span>
                      <p className="text-lg font-black text-foreground">{scoreData.mean}%</p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-xs text-muted-foreground font-semibold">Median score</span>
                      <p className="text-lg font-black text-foreground">{scoreData.median}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground/60 space-y-2">
                  <Clock className="h-8 w-8 opacity-40 animate-pulse" />
                  <p className="text-xs">Gathering compatibility matching score samples...</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-border/20 py-3.5 bg-muted/10 text-center flex justify-center">
              <span className="text-xs text-muted-foreground font-medium">
                Data calibrated against live candidate database
              </span>
            </CardFooter>
          </Card>

          {/* Card 2: Pipeline Stage Volume */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Pipeline Stage Volume</CardTitle>
              <CardDescription className="text-xs">
                Relative candidate counts in each screening stage
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6 space-y-4">
              {(() => {
                const stageCounts: Record<string, number> = {
                  SUBMITTED: 0,
                  PROCESSING: 0,
                  REVIEWED: 0,
                  SHORTLISTED: 0,
                  REJECTED: 0,
                };

                conversionData.forEach((item) => {
                  const stage = item.stage;
                  if (stage === "SCORING" || stage === "PROCESSING") {
                    stageCounts.PROCESSING += item.count;
                  } else if (stageCounts[stage] !== undefined) {
                    stageCounts[stage] += item.count;
                  }
                });

                const totalInPipeline = Object.values(stageCounts).reduce((a, b) => a + b, 0) || 1;

                const stageLabels: Record<string, string> = {
                  SUBMITTED: "Intake / New",
                  PROCESSING: "AI Parsing & Scoring",
                  REVIEWED: "Screened / Pending",
                  SHORTLISTED: "Shortlisted",
                  REJECTED: "Rejected",
                };

                const stageColors: Record<string, string> = {
                  SUBMITTED: "bg-blue-500/80 border-blue-400/30",
                  PROCESSING: "bg-amber-500/80 border-amber-400/30",
                  REVIEWED: "bg-indigo-500/80 border-indigo-400/30",
                  SHORTLISTED: "bg-emerald-500/80 border-emerald-400/30",
                  REJECTED: "bg-rose-500/80 border-rose-400/30",
                };

                return Object.entries(stageCounts).map(([stage, count]) => {
                  const percentage = (count / totalInPipeline) * 100;
                  const label = stageLabels[stage] || stage;
                  const colorClass = stageColors[stage] || "bg-primary";

                  return (
                    <div key={stage} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground">{count} {count === 1 ? "candidate" : "candidates"}</span>
                      </div>
                      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                        <div 
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>

        </div>
 
        {/* Right Column: Latest Applications Queue Feed Table */}
        <Card className="lg:col-span-2 border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Latest Applications Received</CardTitle>
            <CardDescription className="text-xs">
              Live processing log showing the 10 most recent candidate uploads.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0 flex-grow">
            {applications.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Candidate</th>
                      <th className="py-3 px-4 font-bold">Applied Position</th>
                      <th className="py-3 px-4 font-bold">Date Received</th>
                      <th className="py-3 px-4 text-center font-bold">AI Match</th>
                      <th className="py-3 px-4 text-center font-bold">Stage Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {applications.map((app) => {
                      const score = app.aiCompatibilityScore !== null ? Math.round(Number(app.aiCompatibilityScore)) : null;
                      
                      // Semantic Color Class Matrix for score indicator
                      let scoreColorClass = "text-muted-foreground/50 font-medium";
                      let scoreBgClass = "bg-muted/10 border-border/30";
                      
                      if (score !== null) {
                        if (score >= 75) {
                          scoreColorClass = "text-emerald-400 font-extrabold";
                          scoreBgClass = "bg-emerald-500/10 border-emerald-500/20";
                        } else if (score >= 50) {
                          scoreColorClass = "text-amber-400 font-extrabold";
                          scoreBgClass = "bg-amber-500/10 border-amber-500/20";
                        } else {
                          scoreColorClass = "text-rose-400 font-extrabold";
                          scoreBgClass = "bg-rose-500/10 border-rose-500/20";
                        }
                      }
 
                      return (
                        <tr 
                          key={app.id} 
                          className="hover:bg-muted/30 transition-colors group cursor-pointer"
                          onClick={() => window.location.href = `/dashboard/applications/${app.id}`}
                        >
                          <td className="py-3.5 px-4 font-medium">
                            <div className="space-y-0.5">
                              <p className="font-bold text-foreground group-hover:text-[#adc6ff] transition-colors">
                                {app.candidate?.fullName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {app.candidate?.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                            {app.job?.title}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground/80">
                            {new Date(app.appliedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {score !== null ? (
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] border ${scoreBgClass} ${scoreColorClass}`}>
                                {score}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic">
                                Enqueued
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <ApplicationStatusBadge status={app.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 text-muted-foreground/60 space-y-3">
                <Briefcase className="h-10 w-10 opacity-30 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Intake queue is empty</h4>
                  <p className="text-xs">New applicants will show up here in real-time once received.</p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-border/20 py-4 flex items-center justify-center bg-muted/5">
            <Link 
              href="/dashboard/applications" 
              className="inline-flex items-center gap-2 text-xs font-bold text-[#adc6ff] hover:text-[#adc6ff]/90 transition-colors uppercase tracking-wider group/link cursor-pointer"
            >
              View All Applications
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover/link:translate-x-1 duration-200" />
            </Link>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
