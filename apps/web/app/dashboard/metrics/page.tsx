"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, BarChart2, CheckCircle2, FileText, ArrowRight, Info, Award, Compass, Layers } from "lucide-react";
import { me } from "@/lib/api/auth";
import { getMetricsOverview, getScoreDistribution, getSourceEffectiveness } from "@/lib/api/metrics";
import { listJobs } from "@/lib/api/jobs";
import KPICard from "@/components/recruitment/KPICard";

interface ScoreBucket {
  range: string;
  count: number;
}

interface SourceData {
  sourceChannel: string;
  total: number;
  shortlisted: number;
  conversionRate: number;
}

export default function MetricsPage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [scoreData, setScoreData] = useState<{ buckets: ScoreBucket[]; mean: string; median: string } | null>(null);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const userRes = await me();
      setUser(userRes.user);

      if (userRes.user?.teamId) {
        const [metricsRes, scoreRes, sourcesRes, jobsRes] = await Promise.all([
          getMetricsOverview(),
          getScoreDistribution(),
          getSourceEffectiveness(),
          listJobs()
        ]);
        
        setMetrics(metricsRes);
        setScoreData(scoreRes);
        setSources(sourcesRes.data || []);
        setJobs(jobsRes.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load metrics data:", err);
      setError("Failed to fetch recruitment metrics. Please make sure you are integrated into a team.");
    } finally {
      setLoading(false);
    }
  };

  const handleJobChange = async (jobId: string) => {
    setSelectedJobId(jobId);
    setScoreLoading(true);
    try {
      const apiJobId = jobId === "all" ? undefined : jobId;
      const scoreRes = await getScoreDistribution(apiJobId);
      setScoreData(scoreRes);
    } catch (err) {
      console.error("Failed to fetch score distribution by job:", err);
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing talent analytics platform...</p>
      </div>
    );
  }

  if (error || !user?.teamId) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <Card className="max-w-md border-border/40 bg-card/40 backdrop-blur-md shadow-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Info className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold mb-2">Team Integration Required</CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-6">
            Recruitment pipeline analytics and applicant metrics are structured around team workspaces. Please onboard or join a hiring team from the main dashboard to unlock these reports.
          </CardDescription>
          <Link href="/dashboard/overview">
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-all shadow-md">
              Go to Team Onboarding
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </Card>
      </div>
    );
  }

  // Fallback defaults if metrics are empty
  const activeJobsCount = metrics?.totalJobs ?? 0;
  const totalAppsCount = metrics?.totalApplications ?? 0;
  const avgCompatibility = metrics?.avgAiScore ?? "0.0";
  const shortlistedCount = metrics?.totalShortlisted ?? 0;

  // Max score bucket count to dynamically scale the CSS graph
  const maxBucketCount = scoreData ? Math.max(...scoreData.buckets.map(b => b.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Talent Metrics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time candidate compatibility scores, pipeline metrics, and conversion funnels.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden group rounded-xl">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Layers className="h-24 w-24" />
          </div>
          <KPICard 
            title="Total Requisitions" 
            value={activeJobsCount} 
            description="Requisitions in recruitment workflow" 
            trend={activeJobsCount > 0 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group rounded-xl">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <FileText className="h-24 w-24" />
          </div>
          <KPICard 
            title="Applications Processed" 
            value={totalAppsCount} 
            description="Total candidate pipeline count" 
            trend={totalAppsCount > 0 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group rounded-xl">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <Award className="h-24 w-24" />
          </div>
          <KPICard 
            title="Average Match Score" 
            value={`${parseFloat(avgCompatibility).toFixed(1)}%`} 
            description="AI semantic compatibility profile mean" 
            trend={parseFloat(avgCompatibility) > 60 ? "up" : "neutral"} 
          />
        </div>
        <div className="relative overflow-hidden group rounded-xl">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-muted-foreground transition-transform group-hover:scale-110 duration-300">
            <CheckCircle2 className="h-24 w-24" />
          </div>
          <KPICard 
            title="Shortlisted Status" 
            value={shortlistedCount} 
            description="Applicants recommended for interview" 
            trend={shortlistedCount > 0 ? "up" : "neutral"} 
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Score Distribution Chart */}
        <Card className="lg:col-span-2 border-border/40 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/20">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Score Distribution
              </CardTitle>
              <CardDescription className="text-xs mt-0.5 text-muted-foreground">Bucketed AI match scores across applicant pipeline.</CardDescription>
            </div>
            
            <Select value={selectedJobId} onValueChange={handleJobChange}>
              <SelectTrigger className="w-full sm:w-[220px] bg-background border-border/60 text-xs py-1.5 h-9">
                <SelectValue placeholder="All Job Requisitions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Requisitions</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          
          <CardContent className="pt-6 pb-4 flex-grow flex flex-col justify-between">
            {scoreLoading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Filtering distribution data...</p>
              </div>
            ) : scoreData && scoreData.buckets.some(b => b.count > 0) ? (
              <div className="space-y-6">
                {/* CSS Histogram chart bar */}
                <div className="relative h-60 flex items-end gap-1.5 sm:gap-2.5 px-2 pt-6 border-b border-border/30">
                  {scoreData.buckets.map((bucket, idx) => {
                    const heightPercent = (bucket.count / maxBucketCount) * 100;
                    
                    // Color matrix based on score tiers
                    let barBg = "bg-rose-500/80 hover:bg-rose-500 dark:bg-rose-500/70 dark:hover:bg-rose-400";
                    let glowBg = "shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                    const scoreVal = idx * 10;
                    
                    if (scoreVal >= 80) {
                      barBg = "bg-emerald-500/80 hover:bg-emerald-500 dark:bg-emerald-500/70 dark:hover:bg-emerald-400";
                      glowBg = "shadow-[0_0_10px_rgba(16,185,129,0.2)]";
                    } else if (scoreVal >= 50) {
                      barBg = "bg-amber-500/80 hover:bg-amber-500 dark:bg-amber-500/70 dark:hover:bg-amber-400";
                      glowBg = "shadow-[0_0_10px_rgba(245,158,11,0.2)]";
                    }

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer">
                        {/* Hover Tooltip card */}
                        <div className="absolute bottom-full mb-2 opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 pointer-events-none transition-all duration-200 z-30 bg-popover text-popover-foreground border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-center min-w-[70px]">
                          <p className="text-[10px] font-semibold text-muted-foreground">Applicants</p>
                          <p className="text-sm font-black">{bucket.count}</p>
                        </div>

                        {/* Histogram Bar element */}
                        <div 
                          style={{ height: heightPercent > 0 ? `${heightPercent}%` : "4px" }}
                          className={`w-full rounded-t-md transition-all duration-300 origin-bottom group-hover:scale-y-[1.03] ${barBg} ${heightPercent > 0 ? glowBg : ""}`}
                        />
                        
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-2.5 transform group-hover:text-foreground transition-colors truncate w-full text-center">
                          {bucket.range}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Secondary scores description metrics */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 border border-border/20 p-3 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Mean</p>
                      <p className="text-2xl font-black">{scoreData.mean}%</p>
                    </div>
                    <Award className="w-8 h-8 opacity-20 text-primary" />
                  </div>
                  <div className="bg-muted/30 border border-border/20 p-3 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Median</p>
                      <p className="text-2xl font-black">{scoreData.median}%</p>
                    </div>
                    <Compass className="w-8 h-8 opacity-20 text-secondary" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground/60 space-y-2">
                <BarChart2 className="w-10 h-10 opacity-30 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground">No score distribution data</h4>
                  <p className="text-xs max-w-xs">Data will accumulate as soon as applicants complete AI screening compatibility.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Source Effectiveness */}
        <Card className="border-border/40 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-4 border-b border-border/20">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Source Channels
            </CardTitle>
            <CardDescription className="text-xs mt-0.5 text-muted-foreground">Evaluation of incoming candidate channel metrics.</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 flex-grow">
            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map((src, i) => {
                  const ratePercent = Math.round(src.conversionRate * 100);
                  
                  // Color codes for conversion efficiency
                  let rateColor = "text-emerald-500";
                  let rateBg = "bg-emerald-500/10";
                  let barBg = "bg-emerald-500";
                  
                  if (ratePercent < 15) {
                    rateColor = "text-rose-500";
                    rateBg = "bg-rose-500/10";
                    barBg = "bg-rose-500";
                  } else if (ratePercent < 30) {
                    rateColor = "text-amber-500";
                    rateBg = "bg-amber-500/10";
                    barBg = "bg-amber-500";
                  }

                  return (
                    <div key={i} className="border border-border/30 rounded-xl p-3.5 space-y-3 hover:border-secondary/20 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Badge variant="secondary" className="font-bold py-0.5 text-[10px] uppercase tracking-wider">
                            {src.sourceChannel || "Unknown Source"}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">
                            {src.total} applicants • {src.shortlisted} shortlisted
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-black border ${rateBg} ${rateColor}`}>
                          {ratePercent}% cvr
                        </span>
                      </div>
                      
                      {/* CVR visual progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${ratePercent}%` }} 
                            className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground/60 space-y-2">
                <TrendingUp className="w-10 h-10 opacity-30 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground">No source metrics available</h4>
                  <p className="text-xs max-w-xs">Conversion funnel and effectiveness by sources will populate when applications are logged.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
