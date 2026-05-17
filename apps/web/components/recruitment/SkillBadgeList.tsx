import { Badge } from "@/components/ui/badge";

interface SkillBadgeListProps {
  skills: { name: string; years: number }[];
}

export default function SkillBadgeList({ skills }: SkillBadgeListProps) {
  if (!skills?.length) return <span className="text-muted-foreground text-sm">No skills</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Badge key={skill.name} variant="secondary" className="gap-1">
          {skill.name}
          <span className="text-xs text-muted-foreground">({skill.years}y)</span>
        </Badge>
      ))}
    </div>
  );
}
