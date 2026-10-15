
import { Badge } from "@/components/ui/badge";

export default function SkillTag({ children, missing = false }) {
  return (
    <Badge
      variant="outline"
      className={`font-normal ${
        missing
          ? "border-dashed border-white/20 text-zinc-300"
          : "border-white/10 text-zinc-300"
      }`}
    >
      {children}
    </Badge>
  );
}
