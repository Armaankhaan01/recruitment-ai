"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublicJobs } from "@/lib/api/jobs";
import Link from "next/link";
import { Briefcase, MapPin, DollarSign, Search, Loader2, Sparkles, ChevronRight, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  seniorityLevel: string;
  status: string;
  publishedAt: string;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  minExperienceYears: number | null;
  skillRequirements: { name: string; minYears: number; required: boolean }[];
}

interface LocalApplication {
  applicationId: string;
  status: string;
  appliedAt: string;
  jobTitle: string;
}

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Local applications loaded from localStorage
  const [appliedJobs, setAppliedJobs] = useState<Record<string, LocalApplication>>({});

  const loadLocalApplications = () => {
    try {
      const stored = localStorage.getItem("appliedJobs");
      if (stored) {
        setAppliedJobs(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load local applications", e);
    }
  };

  useEffect(() => {
    // 1. Fetch public jobs
    listPublicJobs()
      .then((res) => {
        setJobs(res.data || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to retrieve available jobs.");
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Load initial applied jobs from localStorage
    loadLocalApplications();
  }, []);

  // Sync applied jobs status from backend on mount
  useEffect(() => {
    const syncStatus = async () => {
      const stored = localStorage.getItem("appliedJobs");
      if (!stored) return;

      const localApps: Record<string, LocalApplication> = JSON.parse(stored);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
      let updated = false;

      for (const jobId of Object.keys(localApps)) {
        const app = localApps[jobId];
        try {
          const res = await fetch(`${apiBase}/applications/public/status/${app.applicationId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status && data.status !== app.status) {
              localApps[jobId].status = data.status;
              updated = true;
            }
          }
        } catch (err) {
          console.error(`Failed to sync status for application ${app.applicationId}`, err);
        }
      }

      if (updated) {
        localStorage.setItem("appliedJobs", JSON.stringify(localApps));
        setAppliedJobs(localApps);
      }
    };

    if (Object.keys(appliedJobs).length > 0) {
      syncStatus();
    }
  }, [loading]);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skillRequirements.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatSalary = (min: number | null, max: number | null) => {
    if (min === null && max === null) return "Salary Undisclosed";
    if (min !== null && max !== null) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min !== null) return `From $${(min / 1000).toFixed(0)}k`;
    if (max !== null) return `Up to $${(max / 1000).toFixed(0)}k`;
    return "Salary Undisclosed";
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { text: "Applied - Under Review", color: "bg-primary/10 text-primary border-primary/30" };
      case "PROCESSING":
      case "SCORING":
        return { text: "Applied - AI Screening Active", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" };
      case "REVIEWED":
        return { text: "Applied - Screening Completed", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" };
      case "SHORTLISTED":
        return { text: "Shortlisted 🎉", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold" };
      case "REJECTED":
        return { text: "Not Selected", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" };
      case "WITHDRAWN":
        return { text: "Withdrawn", color: "bg-muted text-muted-foreground border-muted-foreground/30" };
      default:
        return { text: "Applied", color: "bg-primary/10 text-primary border-primary/30" };
    }
  };

  return (
    <section id="featured-opportunities" className="w-full px-gutter py-20 max-w-container-max mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Featured Opportunities
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Browse our list of curated tech roles matching your skillset.
          </p>
        </div>

        {/* Dynamic Search Bar */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles or skills…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 border-border/60 bg-card focus-visible:ring-primary shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Retrieving premium job listings…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h3 className="text-lg font-bold text-destructive">Failed to Load Positions</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-16 text-center max-w-lg mx-auto bg-card shadow-sm">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Open Openings</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We couldn't find any opportunities matching your request at the moment. Try altering your keywords.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {filteredJobs.map((job) => {
            const hasApplied = appliedJobs[job.id] !== undefined;
            const appStatus = hasApplied ? mapStatus(appliedJobs[job.id].status) : null;

            return (
              <Card
                key={job.id}
                className="bg-card border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm group"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="bg-muted p-2.5 rounded-lg border border-border/40 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>

                    {hasApplied && appStatus ? (
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded border shadow-inner ${appStatus.color}`}>
                        {appStatus.text}
                      </span>
                    ) : (
                      <span className="bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                        Open Role
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-4 line-clamp-1 group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Remote / Hybrid
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatSalary(job.salaryRangeMin, job.salaryRangeMax)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                    {job.description}
                  </p>

                  <div className="space-y-6">
                    {/* Skills badges */}
                    {job.skillRequirements?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Skills Requirements
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skillRequirements.slice(0, 3).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant={skill.required ? "default" : "secondary"}
                              className="text-[10px] px-2 py-0.5"
                            >
                              {skill.name} ({skill.minYears}y)
                            </Badge>
                          ))}
                          {job.skillRequirements.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-dashed">
                              +{job.skillRequirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/40">
                      {hasApplied && appStatus ? (
                        <div className="text-center py-2.5 rounded-lg border border-dashed border-border/80 bg-background/50 text-xs font-medium text-muted-foreground">
                          Application Pending Review
                        </div>
                      ) : (
                        <Link href={`/jobs/${job.id}/apply`} className="w-full">
                          <Button
                            className="w-full h-10 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-xs shadow-sm cursor-pointer transition-all duration-200"
                          >
                            Apply Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
