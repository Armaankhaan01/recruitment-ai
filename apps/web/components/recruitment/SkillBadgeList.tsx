import { Badge } from "@/components/ui/badge";

interface SkillItem {
  name: string;
  years?: number;
  minYears?: number;
  required?: boolean;
}

interface SkillBadgeListProps {
  skills: (string | SkillItem)[];
}

export default function SkillBadgeList({ skills }: SkillBadgeListProps) {
  if (!skills?.length) return <span className="text-muted-foreground text-xs font-semibold">No skills specified</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill, idx) => {
        const isString = typeof skill === "string";
        const name = isString ? skill : skill.name;
        const exp = isString ? undefined : (skill.minYears ?? skill.years);
        const isRequired = isString ? false : !!skill.required;

        if (!name) return null;

        return (
          <Badge 
            key={`${name}-${idx}`} 
            variant={isRequired ? "default" : "secondary"} 
            className="text-[10px] px-2 py-0.5 font-semibold gap-1"
          >
            {name}
            {exp !== undefined && exp !== null && exp > 0 && (
              <span className="text-[9px] opacity-75">({exp}y)</span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
