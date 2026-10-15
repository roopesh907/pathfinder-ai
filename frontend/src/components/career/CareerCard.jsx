
import { memo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { formatSkill } from "../../utils/formatters";
import { GLASS } from "../../constants/styles";
import SkillTag from "./SkillTag";

// Keep these values identical to the definitions in your original App.jsx.
const GLASS_INTERACTIVE =
  `${GLASS} transition-colors hover:border-white/20 hover:bg-white/[0.07]`;

const CareerCard = memo(function CareerCard({ career, onSelect }) {
  const score = Math.max(
    0,
    Math.min(100, Number(career.match_score) || 0)
  );

  const metrics = [
    {
      label: "Skill coverage",
      value: career.skill_coverage,
      color: "[&>div]:bg-sky-300",
    },
    {
      label: "Interest fit",
      value: career.interest_fit,
      color: "[&>div]:bg-violet-300",
    },
    ...(career.goal_alignment != null
      ? [
          {
            label: "Goal alignment",
            value: career.goal_alignment,
            color: "[&>div]:bg-emerald-300",
          },
        ]
      : []),
  ];

  const matchedSkills = Array.isArray(career.matched_skills)
    ? career.matched_skills
    : [];

  const missingSkills = Array.isArray(career.missing_skills)
    ? career.missing_skills
    : [];

  const matchedInterests = Array.isArray(career.matched_interests)
    ? career.matched_interests
    : [];

  const matchedGoals = Array.isArray(career.matched_goal_keywords)
    ? career.matched_goal_keywords
    : [];

  return (
    <Card
      className={`gap-4 rounded-xl py-4 text-zinc-100 ${GLASS_INTERACTIVE}`}
    >
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-medium leading-6 text-zinc-100">
              {career.title}
            </CardTitle>

            {career.field && (
              <p className="mt-1 text-xs text-zinc-500">
                {career.field}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tabular-nums text-indigo-200">
              {score}%
            </p>
            <p className="text-[10px] text-zinc-500">
              profile alignment
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4">
        <p className="text-xs leading-5 text-zinc-400">
          {career.description || "No description available."}
        </p>

        {/* Overall profile alignment */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Overall alignment</span>
            <span className="font-medium tabular-nums text-zinc-200">
              {score} / 100
            </span>
          </div>

          <Progress
            value={score}
            className="h-1.5 bg-white/10 [&>div]:bg-indigo-300"
          />

          <p className="mt-2 text-[11px] leading-4 text-zinc-500">
            A heuristic based on your profile and our career catalog—not a
            prediction of employment or aptitude.
          </p>
        </div>

        {/* Individual score components */}
        <div className="space-y-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Score breakdown
          </p>

          {metrics.map((metric) => {
            const value = Math.max(
              0,
              Math.min(100, Number(metric.value) || 0)
            );

            return (
              <div key={metric.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="text-zinc-400">{metric.label}</span>
                  <span className="tabular-nums text-zinc-300">
                    {value}%
                  </span>
                </div>

                <Progress
                  value={value}
                  className={`h-1 bg-white/10 ${metric.color}`}
                />
              </div>
            );
          })}
        </div>

        {/* Matched skills */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-300" />
            <p className="text-xs font-medium text-zinc-200">
              Skills you already have
            </p>
          </div>

          {matchedSkills.length ? (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill) => (
                <SkillTag key={skill}>
                  {formatSkill(skill)}
                </SkillTag>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              No matching skills identified yet. That's okay—you can build
              them through your roadmap.
            </p>
          )}
        </div>

        {/* Matched interests */}
        {matchedInterests.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Interests that align
            </p>

            <div className="flex flex-wrap gap-1.5">
              {matchedInterests.map((interest) => (
                <SkillTag key={interest}>
                  {formatSkill(interest)}
                </SkillTag>
              ))}
            </div>
          </div>
        )}

        {/* Goal keywords */}
        {matchedGoals.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Relevant parts of your goal
            </p>

            <div className="flex flex-wrap gap-1.5">
              {matchedGoals.map((goal) => (
                <SkillTag key={goal}>
                  {formatSkill(goal)}
                </SkillTag>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-300">
            Skills to explore next
          </p>

          {missingSkills.length ? (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <SkillTag key={skill} missing>
                  {formatSkill(skill)}
                </SkillTag>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              You've covered all the skills currently listed in this career
              catalog.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4">
        <Button
          type="button"
          onClick={() => onSelect(career)}
          className="w-full bg-indigo-500 font-medium text-white hover:bg-indigo-400"
        >
          Build roadmap
          <ArrowRight size={15} />
        </Button>
      </CardFooter>
    </Card>
  );
});

export default CareerCard;
