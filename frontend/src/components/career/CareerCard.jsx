import { memo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { formatSkill } from "../../utils/formatters";
import { GLASS } from "../../constants/styles";
import SkillTag from "./SkillTag";

const GLASS_INTERACTIVE =
  `${GLASS} transition-colors hover:border-white/20 hover:bg-white/[0.07]`;

function clampPercentage(value) {
  const number = Number(value);

  if (value == null || value === "" || !Number.isFinite(number)) {
    return 0;
  }

  return Math.round(Math.min(100, Math.max(0, number)) * 10) / 10;
}

function safeList(value) {
  return Array.isArray(value)
    ? value.filter((item) => item != null && String(item).trim() !== "")
    : [];
}

function PercentageBar({ value, colorClass, label }) {
  const percentage = clampPercentage(value);

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-label={label || `${percentage}%`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function SkillList({ items, missing = false }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((skill, index) => (
        <SkillTag
          key={`${String(skill)}-${index}`}
          missing={missing}
        >
          {formatSkill(String(skill))}
        </SkillTag>
      ))}
    </div>
  );
}

const CareerCard = memo(function CareerCard({ career = {}, onSelect }) {
  const score = clampPercentage(career.match_score);

  const metrics = [
    {
      label: "Skill coverage",
      value: career.skill_coverage,
      color: "bg-sky-300",
    },
    {
      label: "Interest fit",
      value: career.interest_fit,
      color: "bg-violet-300",
    },
    ...(career.goal_alignment != null
      ? [
          {
            label: "Goal alignment",
            value: career.goal_alignment,
            color: "bg-emerald-300",
          },
        ]
      : []),
  ];

  const matchedSkills = safeList(career.matched_skills);
  const missingSkills = safeList(career.missing_skills);
  const matchedInterests = safeList(career.matched_interests);
  const matchedGoals = safeList(career.matched_goal_keywords);

  const careerTitle = career.title || "Career path";
  const careerId = career.career_id ?? career.id;

  return (
    <Card
      className={`gap-4 rounded-xl py-4 text-zinc-100 ${GLASS_INTERACTIVE}`}
    >
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-medium leading-6 text-zinc-100">
              {careerTitle}
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

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Overall alignment</span>
            <span className="font-medium tabular-nums text-zinc-200">
              {score} / 100
            </span>
          </div>

          <PercentageBar
            value={score}
            colorClass="bg-indigo-300"
            label={`Overall profile alignment: ${score}%`}
          />

          <p className="mt-2 text-[11px] leading-4 text-zinc-500">
            A heuristic based on your profile and our career catalog—not a
            prediction of employment or aptitude.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Score breakdown
          </p>

          {metrics.map((metric) => {
            const value = clampPercentage(metric.value);

            return (
              <div key={metric.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="text-zinc-400">{metric.label}</span>
                  <span className="tabular-nums text-zinc-300">
                    {value}%
                  </span>
                </div>

                <PercentageBar
                  value={value}
                  colorClass={metric.color}
                  label={`${metric.label}: ${value}%`}
                />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-300" />
            <p className="text-xs font-medium text-zinc-200">
              Skills you already have
            </p>
          </div>

          {matchedSkills.length > 0 ? (
            <SkillList items={matchedSkills} />
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              No matching skills identified yet. That's okay—you can build
              them through your roadmap.
            </p>
          )}
        </div>

        {matchedInterests.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Interests that align
            </p>
            <SkillList items={matchedInterests} />
          </div>
        )}

        {matchedGoals.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Relevant parts of your goal
            </p>
            <SkillList items={matchedGoals} />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-300">
            Skills to explore next
          </p>

          {missingSkills.length > 0 ? (
            <SkillList items={missingSkills} missing />
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
          onClick={() => onSelect?.(career)}
          disabled={typeof onSelect !== "function"}
          className="w-full bg-indigo-500 font-medium text-white hover:bg-indigo-400"
        >
          Build roadmap
          <ArrowRight size={15} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
});

export default CareerCard;