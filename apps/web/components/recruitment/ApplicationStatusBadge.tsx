import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ApplicationStatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SCORING: "bg-yellow-100 text-yellow-700",
  REVIEWED: "bg-green-100 text-green-700",
  SHORTLISTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return <Badge className={cn("rounded-full", statusColors[status] || "bg-muted text-muted-foreground")}>{status}</Badge>;
}
