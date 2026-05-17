"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApplications } from "@/lib/api/applications";
import ApplicationStatusBadge from "@/components/recruitment/ApplicationStatusBadge";

interface ApplicationRecord {
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getApplications()
      .then((res) => {
        setApplications(res.data || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load applications");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatScore = (score: any) => {
    if (score === null || score === undefined) return "-";
    return `${Math.round(Number(score))}%`;
  };

  const getScoreColor = (score: any) => {
    if (score === null || score === undefined) return "text-muted-foreground";
    const num = Number(score);
    if (num >= 75) return "text-emerald-600 dark:text-emerald-400 font-semibold";
    if (num >= 50) return "text-amber-600 dark:text-amber-400 font-semibold";
    return "text-destructive font-semibold";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Job Applications</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground animate-pulse">Loading applications…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No applications found in the system.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Target Job</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>AI Match Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-accent/40 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{app.candidate.fullName}</p>
                      <p className="text-xs text-muted-foreground">{app.candidate.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{app.job.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={getScoreColor(app.aiCompatibilityScore)}>
                      {formatScore(app.aiCompatibilityScore)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 border"
                    >
                      Review AI
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
