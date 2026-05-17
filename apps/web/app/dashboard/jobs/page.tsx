"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Briefcase, Plus, Users, Calendar, Eye, Edit3, Archive, Layers } from "lucide-react";
import JobStatusBadge from "@/components/recruitment/JobStatusBadge";
import { listJobs } from "@/lib/api/jobs";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  seniorityLevel: string;
  skillRequirements: any;
  minExperienceYears: number;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  createdAt: string;
  publishedAt: string | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSeniority, setSelectedSeniority] = useState<string>("all");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await listJobs();
      setJobs(res.data || []);
    } catch (err: any) {
      console.error("Failed to load jobs list:", err);
      toast.error(err.message || "Failed to retrieve job requisitions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const term = searchQuery.toLowerCase().trim();
    const titleMatch = job.title.toLowerCase().includes(term);
    const statusMatch = selectedStatus === "all" || job.status === selectedStatus;
    const seniorityMatch = selectedSeniority === "all" || job.seniorityLevel === selectedSeniority;
    return titleMatch && statusMatch && seniorityMatch;
  });

  // Calculate metrics
  const totalRequisitions = jobs.length;
  const activeRequisitions = jobs.filter((j) => j.status === "OPEN").length;
  const holdRequisitions = jobs.filter((j) => j.status === "ON_HOLD").length;
  const draftRequisitions = jobs.filter((j) => j.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Job Requisitions</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage corporate job requisitions, status lifecycles, and candidate compatibility thresholds.</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button className="h-10 px-5 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md gap-2 shrink-0 cursor-pointer">
            <Plus className="w-4 h-4" />
            Create Requisition
          </Button>
        </Link>
      </div>

      {/* Metrics overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 shadow-sm relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Requisitions</p>
                <p className="text-3xl font-black text-foreground">{totalRequisitions}</p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active Openings</p>
                <p className="text-3xl font-black text-foreground">{activeRequisitions}</p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">On Hold</p>
                <p className="text-3xl font-black text-foreground">{holdRequisitions}</p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Draft Reqs</p>
                <p className="text-3xl font-black text-foreground">{draftRequisitions}</p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisitions Catalog Filter */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search query */}
            <div className="relative md:col-span-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <Input 
                placeholder="Search requisitions by job title..." 
                className="pl-10 h-10 border-border/60 bg-background placeholder:text-muted-foreground/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 border-border/60 bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seniority Filter */}
            <div>
              <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
                <SelectTrigger className="h-10 border-border/60 bg-background">
                  <SelectValue placeholder="All Seniorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seniorities</SelectItem>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MID">Mid Level</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="PRINCIPAL">Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Catalog List Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse font-medium">Syncing job requisitions...</p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/20 border-b border-border/40">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Job Requisition</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Workflow Stage</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Seniority</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Min Experience</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Date Created</TableHead>
                    <TableHead className="py-4 px-6 text-center font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/20">
                  {filteredJobs.map((job) => (
                    <TableRow 
                      key={job.id} 
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/jobs/${job.id}`}
                    >
                      {/* Job Title info */}
                      <TableCell className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground group-hover:text-[#adc6ff] transition-colors">
                            {job.title}
                          </p>
                          {job.salaryRangeMin && job.salaryRangeMax && (
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              Est. Compensation: ${Number(job.salaryRangeMin).toLocaleString()} - ${Number(job.salaryRangeMax).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="py-4 px-6">
                        <JobStatusBadge status={job.status} />
                      </TableCell>

                      {/* Seniority Level */}
                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className="border-border/60 text-muted-foreground font-extrabold text-[10px] uppercase">
                          {job.seniorityLevel}
                        </Badge>
                      </TableCell>

                      {/* Min experience */}
                      <TableCell className="py-4 px-6 text-sm font-semibold text-muted-foreground">
                        {job.minExperienceYears} yrs
                      </TableCell>

                      {/* Date Created */}
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {new Date(job.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </div>
                      </TableCell>

                      {/* View & Edit Quick Actions */}
                      <TableCell className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/jobs/${job.id}`}>
                            <button className="h-8 w-8 rounded-lg border border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer" title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/jobs/${job.id}/edit`}>
                            <button className="h-8 w-8 rounded-lg border border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer" title="Edit details">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-6 space-y-3">
              <Briefcase className="h-10 w-10 opacity-30 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No job requisitions found</h4>
                <p className="text-xs max-w-xs leading-relaxed">No requisitions matched your search query or status criteria. Try starting a new requisition.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
