import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface JobStatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  OPEN: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-700",
  ARCHIVED: "bg-gray-50 text-gray-500",
};

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return <Badge className={cn("rounded-full", statusColors[status] || statusColors.DRAFT)}>{status}</Badge>;
}
