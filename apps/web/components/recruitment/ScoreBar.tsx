import { Progress } from "@/components/ui/progress";

interface ScoreBarProps {
  value: number;
  className?: string;
}

export default function ScoreBar({ value, className }: ScoreBarProps) {
  const colorClass =
    value >= 75
      ? "text-green-600"
      : value >= 50
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
        <Progress value={value} className="flex-1" />
      </div>
    </div>
  );
}
