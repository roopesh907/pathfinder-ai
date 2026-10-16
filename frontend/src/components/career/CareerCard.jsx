
import { memo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";

import { formatSkill } from "../../utils/formatters";
import { GLASS } from "../../constants/styles";
import SkillTag from "./SkillTag";

const GLASS_INTERACTIVE = [
  GLASS,
  "gap-0 overflow-hidden rounded-2xl py-0 text-zinc-100",
  "transition-[border-color,background-color,box-shadow] duration-200",
  "hover:border-indigo-300/25 hover:bg-white/[0.045]",
  "hover:shadow-[0_8px_32px_rgba(79,70,229,0.07)]",
  "focus-within:border-indigo-300/25",
  "motion-reduce:transition-none",
].join(" ");

function clampPercentage(value) {
  const number = Number(value);

  if (value == null || value === "" || !Number.isFinite(number)) {
    return 0;
  }

  return Math.round(Math.min(100, Math.max(0, number)) * 10) / 10;
}

function safeList(value) {
  return Array.isArray(value)
    ? value.filter(
        (item) => item != null && String(item).trim() !== ""
      )
    : [];
}

function PercentageBar({ value, colorClass, label }) {
  const percentage = clampPercentage(value);

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-label={label || `${percentage}%`}
    >
      <div
        className={[
          "h-full rounded-full",
          "transition-[width] duration-300 ease-out",
          "motion-reduce:transition-none",
          colorClass,
        ].join(" ")}
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

const CareerCard = memo(function CareerCard({
  career = {},
  onSelect,
}) {
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

  return (
    <Card className={GLASS_INTERACTIVE}>
      <CardHeader className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/[0.09]">
                <Target
                  size={16}
                  className="text-indigo-200"
                  aria-hidden="true"
                />
              </span>

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Career match
              </span>
            </div>

            <CardTitle className="text-base font-semibold leading-6 tracking-tight text-zinc-100 sm:text-lg">
              {careerTitle}
            </CardTitle>

            {career.field && (
              <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                {career.field}
              </p>
            )}
          </div>

          <div className="shrink-0 rounded-xl border border-indigo-300/15 bg-indigo-400/[0.07] px-3 py-2 text-right">
            <p className="text-2xl font-semibold tracking-tight text-indigo-200 tabular-nums">
              {score}%
            </p>
            <p className="text-[10px] text-zinc-400">
              profile fit
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 py-4 sm:px-5">
        <p className="text-sm leading-6 text-zinc-400">
          {career.description || "No description available."}
        </p>

        {/* Overall alignment */}
        <section aria-label="Overall profile alignment">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-300">
              Overall alignment
            </span>
            <span className="text-xs font-medium tabular-nums text-zinc-200">
              {score} / 100
            </span>
          </div>

          <PercentageBar
            value={score}
            colorClass="bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-300"
            label={`Overall profile alignment: ${score}%`}
          />

          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            A heuristic based on your profile and career catalog—not a
            prediction of employment or aptitude.
          </p>
        </section>

        {/* Score breakdown */}
        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-black/10 p-3.5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles
              size={13}
              className="text-violet-300"
              aria-hidden="true"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Score breakdown
            </p>
          </div>

          {metrics.map((metric) => {
            const value = clampPercentage(metric.value);

            return (
              <div key={metric.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="text-zinc-400">
                    {metric.label}
                  </span>
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
        </section>

        {/* Existing skills */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <CheckCircle2
              size={15}
              className="shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-zinc-200">
              Skills you already have
            </p>
          </div>

          {matchedSkills.length > 0 ? (
            <SkillList items={matchedSkills} />
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              No matching skills identified yet. That's okay—you can
              build them through your roadmap.
            </p>
          )}
        </section>

        {/* Matching interests */}
        {matchedInterests.length > 0 && (
          <section>
            <p className="mb-2.5 text-xs font-medium text-zinc-300">
              Interests that align
            </p>
            <SkillList items={matchedInterests} />
          </section>
        )}

        {/* Relevant goals */}
        {matchedGoals.length > 0 && (
          <section>
            <p className="mb-2.5 text-xs font-medium text-zinc-300">
              Relevant parts of your goal
            </p>
            <SkillList items={matchedGoals} />
          </section>
        )}

        {/* Skills to develop */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <BookOpen
              size={14}
              className="shrink-0 text-violet-300"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-zinc-200">
              Skills to explore next
            </p>
          </div>

          {missingSkills.length > 0 ? (
            <SkillList items={missingSkills} missing />
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              You've covered all the skills currently listed in this
              career catalog.
            </p>
          )}
        </section>
      </CardContent>

      <CardFooter className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
        <Button
          type="button"
          onClick={() => onSelect?.(career)}
          disabled={typeof onSelect !== "function"}
          className={[
            "group w-full gap-2 rounded-xl",
            "bg-gradient-to-r from-indigo-500 to-violet-500",
            "font-medium text-white",
            "transition-[background,box-shadow] duration-200",
            "hover:from-indigo-400 hover:to-violet-400",
            "hover:shadow-md hover:shadow-indigo-950/30",
            "focus-visible:ring-2 focus-visible:ring-violet-400",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            "disabled:opacity-40",
            "motion-reduce:transition-none",
          ].join(" ")}
        >
          Build roadmap
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Button>
      </CardFooter>
    </Card>
  );
});

export default CareerCard;
