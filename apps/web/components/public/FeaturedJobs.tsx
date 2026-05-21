"use client";

import { useEffect, useState } from "react";
import { listPublicJobs } from "@/lib/api/jobs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import JobCard from "./JobCard";
import JobDetailsDialog from "./JobDetailsDialog";

interface Job {
  id: string;
  title: string;
  description: string;
  location?: string | null;
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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  // Dialog State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // Reset page when search query changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skillRequirements.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Paginated Jobs calculations
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
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

  const handleOpenDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
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
            onChange={(e) => handleSearchChange(e.target.value)}
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
        <div className="space-y-10">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {paginatedJobs.map((job) => {
              const hasApplied = appliedJobs[job.id] !== undefined;
              const appStatus = hasApplied ? mapStatus(appliedJobs[job.id].status) : null;

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  hasApplied={hasApplied}
                  appStatus={appStatus}
                  formatSalary={formatSalary}
                  onViewDetails={handleOpenDetails}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 px-3 border-border/60 text-xs font-bold gap-1 uppercase tracking-wider disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 text-xs font-bold ${
                      currentPage === page 
                        ? "bg-primary text-primary-foreground font-black" 
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, Math.min(totalPages, p + 1)))}
                disabled={currentPage === totalPages}
                className="h-9 px-3 border-border/60 text-xs font-bold gap-1 uppercase tracking-wider disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog Details Viewer */}
      <JobDetailsDialog
        job={selectedJob}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedJob(null);
        }}
        hasApplied={selectedJob ? appliedJobs[selectedJob.id] !== undefined : false}
        appStatus={selectedJob && appliedJobs[selectedJob.id] ? mapStatus(appliedJobs[selectedJob.id].status) : null}
        formatSalary={formatSalary}
      />
    </section>
  );
}
