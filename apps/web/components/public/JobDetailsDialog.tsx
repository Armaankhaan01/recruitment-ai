import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MapPin, DollarSign, Award, CheckCircle } from "lucide-react";
import SkillBadgeList from "@/components/recruitment/SkillBadgeList";

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
  skillRequirements: any;
}

interface JobDetailsDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  hasApplied: boolean;
  appStatus: { text: string; color: string } | null;
  formatSalary: (min: number | null, max: number | null) => string;
}

export default function JobDetailsDialog({
  job,
  isOpen,
  onClose,
  hasApplied,
  appStatus,
  formatSalary,
}: JobDetailsDialogProps) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border/40 text-foreground max-h-[85vh] overflow-y-auto p-6 md:p-8 animate-in fade-in duration-300">
        <DialogHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="border-border/60 text-muted-foreground font-semibold text-[10px] tracking-wider uppercase">
                {job.seniorityLevel} Role
              </Badge>
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

          <div className="space-y-1">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">{job.title}</DialogTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {job.location || "Remote"}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                {formatSalary(job.salaryRangeMin, job.salaryRangeMax)}
              </span>
              {job.minExperienceYears !== null && (
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  Min Exp: {job.minExperienceYears} yrs
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="my-6 space-y-6">
          {/* Skills Required */}
          {job.skillRequirements?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Technical Target Prerequisites
              </h3>
              <SkillBadgeList skills={job.skillRequirements} />
            </div>
          )}

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Position Overview
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium bg-muted/20 border border-border/20 rounded-xl p-4">
              {job.description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
          <Button variant="outline" onClick={onClose} className="h-10 px-6 font-semibold uppercase text-xs tracking-wider">
            Close
          </Button>
          {hasApplied ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Application Under Evaluation
            </div>
          ) : (
            <Link href={`/jobs/${job.id}/apply`}>
              <Button className="h-10 px-8 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-xs shadow-md">
                Apply for Position
              </Button>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
