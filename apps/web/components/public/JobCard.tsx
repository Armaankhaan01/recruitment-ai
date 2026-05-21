import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, ArrowRight } from "lucide-react";
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

interface JobCardProps {
  job: Job;
  hasApplied: boolean;
  appStatus: { text: string; color: string } | null;
  formatSalary: (min: number | null, max: number | null) => string;
  onViewDetails: (job: Job) => void;
}

export default function JobCard({
  job,
  hasApplied,
  appStatus,
  formatSalary,
  onViewDetails,
}: JobCardProps) {
  return (
    <Card
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
              {job.seniorityLevel}
            </span>
          )}
        </div>

        <CardTitle 
          className="text-xl font-bold tracking-tight text-foreground mt-4 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" 
          onClick={() => onViewDetails(job)}
        >
          {job.title}
        </CardTitle>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location || "Remote"}
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
                Required Skills
              </span>
              <SkillBadgeList skills={job.skillRequirements.slice(0, 3)} />
              {job.skillRequirements.length > 3 && (
                <button 
                  onClick={() => onViewDetails(job)}
                  className="text-[10px] font-semibold text-primary hover:underline cursor-pointer block mt-1 bg-transparent border-0 p-0"
                >
                  +{job.skillRequirements.length - 3} more skills & details
                </button>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border/40">
            <Button
              onClick={() => onViewDetails(job)}
              className="w-full h-10 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-black uppercase tracking-wider text-xs shadow-sm cursor-pointer transition-all duration-200 gap-1.5"
            >
              View Full Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
