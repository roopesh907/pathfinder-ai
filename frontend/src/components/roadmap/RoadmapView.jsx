import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Target,
  Layers3,
  Code2,
  Rocket,
  GraduationCap,
} from "lucide-react";
import { GLASS } from "../../constants/styles";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import SkillTag from "../career/SkillTag";
import RoadmapSkeleton from "./RoadmapSkeleton";

function formatSkill(skill) {
  if (typeof skill !== "string") {
    return String(skill ?? "");
  }

  return skill
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeList(value) {
  return Array.isArray(value)
    ? value.filter((item) => item != null && String(item).trim() !== "")
    : [];
}

function formatMinutes(value) {
  const minutes = Number(value);

  if (value == null || value === "" || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10} hrs`;
}

const ROADMAP_PHASE_STYLES = [
  {
    icon: GraduationCap,
    surface: "border-sky-300/20 bg-sky-300/10",
    color: "text-sky-200",
  },
  {
    icon: Layers3,
    surface: "border-violet-300/20 bg-violet-300/10",
    color: "text-violet-200",
  },
  {
    icon: Code2,
    surface: "border-emerald-300/20 bg-emerald-300/10",
    color: "text-emerald-200",
  },
  {
    icon: Rocket,
    surface: "border-amber-300/20 bg-amber-300/10",
    color: "text-amber-200",
  },
];

export default function RoadmapView({ roadmap, loading = false, error = null }) {
  if (loading) return <RoadmapSkeleton />;

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-rose-900 bg-rose-950/40"
      >
        <AlertDescription className="text-rose-200">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!roadmap) {
    return (
      <div className={`rounded-2xl p-7 text-center ${GLASS}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10">
          <Target size={22} className="text-indigo-200" />
        </div>

        <p className="mt-4 text-sm font-medium text-zinc-100">
          Your next chapter starts here
        </p>

        <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-zinc-500">
          Choose a career from Matches to turn your interests into a structured
          learning journey.
        </p>
      </div>
    );
  }

  const phases = safeList(roadmap.phases);
  const skills = safeList(roadmap.skills_to_develop);

  const duration = Number(roadmap.estimated_duration_weeks);
  const weeklyHours = Number(roadmap.weekly_hours);

  const totalWeeks =
    roadmap.estimated_duration_weeks != null &&
    roadmap.estimated_duration_weeks !== "" &&
    Number.isFinite(duration) &&
    duration >= 0
      ? duration
      : null;

  const validWeeklyHours =
    roadmap.weekly_hours != null &&
    roadmap.weekly_hours !== "" &&
    Number.isFinite(weeklyHours) &&
    weeklyHours >= 0
      ? weeklyHours
      : null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/[0.16] via-violet-500/[0.08] to-transparent p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-400/10 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300/20 bg-indigo-300/10">
              <Target size={16} className="text-indigo-200" />
            </span>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200/80">
              Your learning journey
            </p>
          </div>

          <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-white">
            {roadmap.career?.title || roadmap.career_title || "Your career path"}
          </h3>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            A practical sequence of learning, practice, and project work built
            around your profile.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock3 size={14} />
                <span className="text-[11px]">Estimated timeline</span>
              </div>

              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {totalWeeks === null ? "—" : `${totalWeeks} weeks`}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <BookOpen size={14} />
                <span className="text-[11px]">Weekly commitment</span>
              </div>

              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {validWeeklyHours === null ? "—" : `${validWeeklyHours} hrs`}
              </p>
            </div>
          </div>

          {roadmap.pacing && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-xs leading-5 text-zinc-300">
                <span className="text-zinc-500">Suggested pace · </span>
                {roadmap.pacing}
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              Skills to develop
            </h4>
            <p className="mt-1 text-[11px] text-zinc-500">
              Focus areas identified for this path
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-zinc-300"
          >
            {skills.length} {skills.length === 1 ? "skill" : "skills"}
          </Badge>
        </div>

        <div className={`rounded-xl p-4 ${GLASS}`}>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <SkillTag key={`${String(skill)}-${index}`} missing>
                  {formatSkill(String(skill))}
                </SkillTag>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              No additional skills were listed for this profile.
            </p>
          )}
        </div>
      </section>

      <Separator className="bg-white/10" />

      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200/70">
            The journey
          </p>

          <h4 className="mt-1 text-base font-semibold text-zinc-100">
            From foundations to real projects
          </h4>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Work through each phase at your own pace. The timeline is an
            estimate, not a deadline.
          </p>
        </div>

        {phases.length ? (
          <ol className="space-y-3">
            {phases.map((phase, index) => {
              const style =
                ROADMAP_PHASE_STYLES[
                  Math.min(index, ROADMAP_PHASE_STYLES.length - 1)
                ];

              const PhaseIcon = style.icon;
              const phaseNumber = phase.phase ?? index + 1;
              const phaseSkills = safeList(phase.skills);
              const phaseMinutes = formatMinutes(
                phase.estimated_minutes ?? phase.estimatedMinutes,
              );

              return (
                <li key={phase.id ?? phase.phase ?? index} className="relative">
                  {index < phases.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute bottom-[-13px] left-[19px] top-12 w-px bg-gradient-to-b from-white/15 to-white/[0.03]"
                    />
                  )}

                  <article className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.surface}`}
                      >
                        <PhaseIcon size={18} className={style.color} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            Phase {phaseNumber}
                          </span>

                          {phase.duration_weeks != null && (
                            <Badge
                              variant="outline"
                              className="h-5 border-white/10 bg-white/[0.03] px-1.5 text-[10px] font-normal text-zinc-400"
                            >
                              <Clock3 size={10} className="mr-1" />
                              {phase.duration_weeks}{" "}
                              {Number(phase.duration_weeks) === 1
                                ? "week"
                                : "weeks"}
                            </Badge>
                          )}

                          {phaseMinutes && (
                            <Badge
                              variant="outline"
                              className="h-5 border-white/10 bg-white/[0.03] px-1.5 text-[10px] font-normal text-zinc-400"
                            >
                              <Clock3 size={10} className="mr-1" />
                              {phaseMinutes}
                            </Badge>
                          )}
                        </div>

                        <h5 className="mt-1 text-sm font-semibold leading-5 text-zinc-100">
                          {phase.title || `Learning phase ${phaseNumber}`}
                        </h5>

                        {(phase.description || phase.rationale) && (
                          <p className="mt-2 text-xs leading-5 text-zinc-400">
                            {phase.description || phase.rationale}
                          </p>
                        )}

                        {phaseSkills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {phaseSkills.map((skill, skillIndex) => (
                              <SkillTag
                                key={`${String(skill)}-${skillIndex}`}
                                missing
                              >
                                {formatSkill(String(skill))}
                              </SkillTag>
                            ))}
                          </div>
                        )}

                        {phase.milestone && (
                          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2
                                size={15}
                                className="mt-0.5 shrink-0 text-emerald-300/80"
                              />

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">
                                  Deliverable
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-300">
                                  {phase.milestone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={`rounded-xl p-4 text-xs text-zinc-500 ${GLASS}`}>
            No phases were returned for this roadmap.
          </div>
        )}
      </section>

      {roadmap.resource_guidance && (
        <section className={`rounded-xl p-4 ${GLASS}`}>
          <div className="flex items-start gap-3">
            <BookOpen
              size={16}
              className="mt-0.5 shrink-0 text-indigo-200"
            />

            <div>
              <h4 className="text-sm font-medium text-zinc-100">
                Resource strategy
              </h4>

              <p className="mt-1 text-xs leading-5 text-zinc-400">
                {roadmap.resource_guidance}
              </p>
            </div>
          </div>
        </section>
      )}

      <p className="text-[11px] leading-5 text-zinc-500">
        {roadmap.note ||
          "This is an illustrative plan. Adjust it as your progress changes."}
      </p>
    </div>
  );
}