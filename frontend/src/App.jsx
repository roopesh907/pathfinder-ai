import { memo, useEffect, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  History,
  LoaderCircle,
  PanelRight,
  PanelRightClose,
  Plus,
  Rocket,
  Send,
  Target,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import BackgroundPaths from "@/components/ui/background-paths";
import DriftGrid from "@/components/ui/drift-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { matchCareers, generateRoadmap } from "./services/api";
import {
  sendChatMessage,
  getConversations,
  getConversationMessages,
  getActiveConversationId,
  setActiveConversationId,
  startNewConversation,
  deleteConversation,
} from "./services/chat";

/* -------------------------------------------------------------------------- */
/* Glass styles                                                               */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const GLASS_INTERACTIVE = `${GLASS} transition-colors hover:border-white/20 hover:bg-white/[0.07]`;

/* -------------------------------------------------------------------------- */
/* Options & helpers                                                          */
/* -------------------------------------------------------------------------- */

const EDUCATION_OPTIONS = [
  "Undergraduate",
  "Postgraduate",
  "Working professional",
  "Self-taught",
];

const INTEREST_OPTIONS = [
  "physics",
  "math",
  "programming",
  "data",
  "artificial intelligence",
  "design",
  "finance",
  "biology",
  "robotics",
  "engineering",
];

const SKILL_OPTIONS = [
  "python",
  "javascript",
  "react",
  "sql",
  "linear algebra",
  "statistics",
  "machine learning",
  "html",
];

const DEFAULT_PROFILE = {
  education_level: "Undergraduate",
  interests: ["physics", "math", "programming"],
  skills: ["python"],
  goals: "",
  weekly_hours: 5,
  monthly_budget: 0,
};

const CHAT_SUGGESTIONS = [
  "Which match should I start with?",
  "How do I fit this into my weekly schedule?",
  "What should I learn first?",
];

const ROADMAP_PHASE_STYLES = [
  {
    icon: BookOpen,
    label: "Learn",
    color: "text-sky-200",
    surface: "border-sky-300/20 bg-sky-400/10",
  },
  {
    icon: Target,
    label: "Practice",
    color: "text-violet-200",
    surface: "border-violet-300/20 bg-violet-400/10",
  },
  {
    icon: Rocket,
    label: "Build",
    color: "text-emerald-200",
    surface: "border-emerald-300/20 bg-emerald-400/10",
  },
];

const formatRupees = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

function formatSkill(skill = "") {
  return String(skill)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    setMatches(mq.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

function RichText({ text }) {
  return String(text ?? "")
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      ),
    );
}

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
          isUser
            ? "border border-indigo-300/20 bg-indigo-500/15 text-zinc-100"
            : `${GLASS} text-zinc-300`
        }`}
      >
        <RichText text={message.content} />
      </div>
    </div>
  );
});

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-indigo-300/50 bg-indigo-500/20 text-indigo-100"
          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function OptionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
        active
          ? "border-indigo-300/50 bg-indigo-500/15 text-zinc-100"
          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-indigo-300" : "border-zinc-600"
        }`}
      >
        {active && <span className="h-2 w-2 rounded-full bg-indigo-300" />}
      </span>
      {children}
    </button>
  );
}

function SkillTag({ children, missing = false }) {
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

function ProfileSummary({ profile }) {
  return (
    <div
      className={`mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl px-4 py-3 text-xs ${GLASS}`}
    >
      <span>
        <span className="text-zinc-500">Time: </span>
        <span className="text-zinc-200">
          {profile.weekly_hours} hours per week
        </span>
      </span>

      <span>
        <span className="text-zinc-500">Budget: </span>
        <span className="text-zinc-200">
          {formatRupees(profile.monthly_budget)} per month
        </span>
      </span>

      <span>
        <span className="text-zinc-500">Level: </span>
        <span className="text-zinc-200">{profile.education_level}</span>
      </span>
    </div>
  );
}

const CareerCard = memo(function CareerCard({ career, onSelect }) {
  const score = Math.max(0, Math.min(100, Number(career.match_score) || 0));

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
              <p className="mt-1 text-xs text-zinc-500">{career.field}</p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tabular-nums text-indigo-200">
              {score}%
            </p>
            <p className="text-[10px] text-zinc-500">profile alignment</p>
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
            const value = Math.max(0, Math.min(100, Number(metric.value) || 0));

            return (
              <div key={metric.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="text-zinc-400">{metric.label}</span>
                  <span className="tabular-nums text-zinc-300">{value}%</span>
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
                <SkillTag key={skill}>{formatSkill(skill)}</SkillTag>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              No matching skills identified yet. That's okay—you can build them
              through your roadmap.
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
                <SkillTag key={interest}>{formatSkill(interest)}</SkillTag>
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
                <SkillTag key={goal}>{formatSkill(goal)}</SkillTag>
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

function RoadmapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full rounded-2xl bg-white/[0.06]" />
      <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
      <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />
      <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.06]" />

      <p className="text-center text-xs text-zinc-500">
        Building your learning plan…
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Redesigned roadmap                                                         */
/* -------------------------------------------------------------------------- */

function RoadmapView({ roadmap, loading, error }) {
  if (loading) return <RoadmapSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive" className="border-rose-900 bg-rose-950/40">
        <AlertDescription className="text-rose-200">{error}</AlertDescription>
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

  const phases = Array.isArray(roadmap.phases) ? roadmap.phases : [];
  const skills = Array.isArray(roadmap.skills_to_develop)
    ? roadmap.skills_to_develop
    : [];
  const duration = Number(roadmap.estimated_duration_weeks);
  const weeklyHours = Number(roadmap.weekly_hours);
  const totalWeeks =
    Number.isFinite(duration) && duration >= 0 ? duration : null;
  const validWeeklyHours =
    Number.isFinite(weeklyHours) && weeklyHours >= 0 ? weeklyHours : null;

  return (
    <div className="space-y-6">
      {/* Roadmap overview */}
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
            {roadmap.career?.title || "Your career path"}
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

      {/* Skill gap */}
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
              {skills.map((skill) => (
                <SkillTag key={skill} missing>
                  {formatSkill(skill)}
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

      {/* Visual learning journey */}
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
              const phaseSkills = Array.isArray(phase.skills)
                ? phase.skills
                : [];

              return (
                <li key={phase.phase ?? index} className="relative">
                  {index < phases.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute bottom-[-13px] left-[19px] top-12 w-px bg-gradient-to-b from-white/15 to-white/[0.03]"
                    />
                  )}

                  <article
                    className={`relative rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]`}
                  >
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
                        </div>

                        <h5 className="mt-1 text-sm font-semibold leading-5 text-zinc-100">
                          {phase.title || `Learning phase ${phaseNumber}`}
                        </h5>

                        {phaseSkills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {phaseSkills.map((skill) => (
                              <SkillTag key={skill} missing>
                                {formatSkill(skill)}
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

      {/* Resource guidance */}
      {roadmap.resource_guidance && (
        <section className={`rounded-xl p-4 ${GLASS}`}>
          <div className="flex items-start gap-3">
            <BookOpen size={16} className="mt-0.5 shrink-0 text-indigo-200" />
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

function WorkspaceContent({
  activeTab,
  setActiveTab,
  recommendations,
  onSelect,
  roadmap,
  roadmapBusy,
  roadmapError,
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <TabsList
        className={`m-4 grid h-auto grid-cols-2 gap-1 rounded-lg p-1 ${GLASS}`}
      >
        <TabsTrigger
          value="careers"
          className="rounded-md py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-100 data-[state=active]:shadow-none"
        >
          Matches
        </TabsTrigger>

        <TabsTrigger
          value="roadmap"
          className="rounded-md py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-100 data-[state=active]:shadow-none"
        >
          Roadmap
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="careers"
        className="min-h-0 flex-1 overflow-y-auto p-4 pt-0"
      >
        {recommendations.length ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <p className="text-xs font-medium text-zinc-200">
                Your career matches
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Explore how your skills, interests, and stated goals align with
                each career. Missing skills are learning opportunities, not
                disqualifiers. Scores are heuristic indicators—not predictions
                of hiring outcomes.
              </p>
            </div>

            {recommendations.map((career) => (
              <CareerCard
                key={career.career_id || career.id || career.title}
                career={career}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-sm font-medium text-zinc-200">No matches yet</p>
            <p className="mt-2 max-w-[240px] text-xs leading-5 text-zinc-500">
              Matches appear here after you save your profile.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent
        value="roadmap"
        className="min-h-0 flex-1 overflow-y-auto p-4 pt-0"
      >
        <RoadmapView
          roadmap={roadmap}
          loading={roadmapBusy}
          error={roadmapError}
        />
      </TabsContent>
    </Tabs>
  );
}

// Owns its own input state, so typing never re-renders the chat.
const ChatInput = memo(function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    const text = value;
    setValue("");
    onSend(text);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={`rounded-xl p-2 transition-colors focus-within:border-indigo-300/40 ${GLASS}`}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            submit();
          }
        }}
        rows={2}
        maxLength={2000}
        aria-label="Message PathFinder"
        placeholder="Ask about careers, timelines, or what to learn next"
        className="max-h-40 min-h-[58px] resize-y border-0 bg-transparent px-3 py-2 text-sm leading-6 text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
      />

      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <p className="text-[11px] text-zinc-600">
          Enter to send, Shift + Enter for a new line
        </p>

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Send message"
          className="h-8 w-8 shrink-0 bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40"
        >
          {disabled ? (
            <LoaderCircle className="animate-spin" size={15} />
          ) : (
            <Send size={15} />
          )}
        </Button>
      </div>
    </form>
  );
});

/* -------------------------------------------------------------------------- */
/* Profile setup                                                              */
/* -------------------------------------------------------------------------- */

function ProfileForm({ initialProfile, onSubmit, onCancel, submitting }) {
  const [draft, setDraft] = useState(initialProfile);
  const canSubmit = draft.interests.length > 0 && !submitting;

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggle(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ ...draft, goals: draft.goals.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={`space-y-4 rounded-xl p-5 ${GLASS}`}>
        <div className="flex items-baseline justify-between">
          <Label className="text-sm font-medium text-zinc-200">
            Time per week
          </Label>
          <span className="text-sm tabular-nums text-zinc-100">
            {draft.weekly_hours} hours
          </span>
        </div>

        <Slider
          aria-label="Hours per week"
          min={1}
          max={40}
          step={1}
          value={[draft.weekly_hours]}
          onValueChange={([value]) => update("weekly_hours", value)}
        />

        <p className="text-xs text-zinc-500">
          The time you can realistically spend learning each week.
        </p>
      </section>

      <section className={`space-y-4 rounded-xl p-5 ${GLASS}`}>
        <div className="flex items-baseline justify-between">
          <Label className="text-sm font-medium text-zinc-200">
            Monthly budget for courses
          </Label>
          <span className="text-sm tabular-nums text-zinc-100">
            {formatRupees(draft.monthly_budget)}
          </span>
        </div>

        <Slider
          aria-label="Monthly budget in rupees"
          min={0}
          max={5000}
          step={100}
          value={[draft.monthly_budget]}
          onValueChange={([value]) => update("monthly_budget", value)}
        />

        <p className="text-xs text-zinc-500">
          Set to ₹0 to use free resources only.
        </p>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">
          Education level
        </Label>

        <div
          role="radiogroup"
          aria-label="Education level"
          className="grid gap-2 sm:grid-cols-2"
        >
          {EDUCATION_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={draft.education_level === option}
              onClick={() => update("education_level", option)}
            >
              {option}
            </OptionButton>
          ))}
        </div>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">Interests</Label>

        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <Chip
              key={interest}
              active={draft.interests.includes(interest)}
              onClick={() => toggle("interests", interest)}
            >
              {formatSkill(interest)}
            </Chip>
          ))}
        </div>

        {draft.interests.length === 0 && (
          <p className="text-xs text-rose-300">Select at least one interest.</p>
        )}
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">
          Current skills
        </Label>

        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((skill) => (
            <Chip
              key={skill}
              active={draft.skills.includes(skill)}
              onClick={() => toggle("skills", skill)}
            >
              {formatSkill(skill)}
            </Chip>
          ))}
        </div>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label htmlFor="goal" className="text-sm font-medium text-zinc-200">
          Goal <span className="font-normal text-zinc-500">(optional)</span>
        </Label>

        <Textarea
          id="goal"
          value={draft.goals}
          onChange={(event) => update("goals", event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="For example: build scientific simulations for research"
          className="resize-none border-white/10 bg-white/[0.02] text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </section>

      <Separator className="bg-white/10" />

      <div className="flex items-center justify-between gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
          >
            Back to chat
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40"
        >
          {submitting && <LoaderCircle className="animate-spin" size={15} />}
          {onCancel ? "Save and refresh matches" : "Continue"}
          {!submitting && <ArrowRight size={15} />}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [screen, setScreen] = useState("onboarding");
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("careers");
  const [matchBusy, setMatchBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [roadmapBusy, setRoadmapBusy] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [roadmapError, setRoadmapError] = useState("");

  // Conversation history state.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [activeConversationId, setActiveConversationIdState] = useState(() =>
    getActiveConversationId(),
  );

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isChat = screen === "chat";

  function addMessage(role, content) {
    setMessages((previous) => [
      ...previous,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }

  /* -------------------------- Conversation history ----------------------- */

  async function refreshConversations() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const items = await getConversations();
      setConversations(Array.isArray(items) ? items : []);
    } catch (err) {
      setHistoryError(
        err.message || "Couldn't load your conversation history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleNewChat() {
    startNewConversation();
    setActiveConversationIdState(null);
    setMessages([]);
    setHistoryError("");
    setHistoryOpen(false);
    setScreen("chat");
  }

  async function handleLoadConversation(conversation) {
    if (!conversation?.id || historyLoading || deletingConversationId) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const items = await getConversationMessages(conversation.id);

      setActiveConversationId(conversation.id);
      setActiveConversationIdState(conversation.id);

      setMessages(
        (Array.isArray(items) ? items : []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })),
      );

      setHistoryOpen(false);
      setScreen("chat");
    } catch (err) {
      setHistoryError(err.message || "Couldn't load this conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleDeleteConversation(conversation) {
    if (!conversation?.id || historyLoading || deletingConversationId) return;

    const title =
      conversation.title && conversation.title !== "New conversation"
        ? conversation.title
        : "this conversation";

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis will permanently delete the conversation and its saved messages.`,
    );

    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setHistoryError("");

    try {
      await deleteConversation(conversation.id);

      setConversations((previous) =>
        previous.filter((item) => item.id !== conversation.id),
      );

      // Deleting the active conversation should leave the user in a clean chat.
      if (activeConversationId === conversation.id) {
        startNewConversation();
        setActiveConversationIdState(null);
        setMessages([]);
      }
    } catch (err) {
      setHistoryError(
        err.message || "Couldn't delete this conversation. Please try again.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  useEffect(() => {
    if (screen !== "chat") return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const items = await getConversations();

        if (!cancelled) {
          setConversations(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err.message || "Couldn't load your conversation history.",
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [screen]);

  /* ------------------------------ Career flow ---------------------------- */

  async function findMatches(nextProfile) {
    setMatchBusy(true);
    setMatchError("");

    try {
      const result = await matchCareers(nextProfile);

      if (!Array.isArray(result?.recommendations)) {
        throw new Error("The career service returned an unexpected response.");
      }

      setRecommendations(result.recommendations);
      setRoadmap(null);
      setSelectedCareer(null);
      setActiveTab("careers");
      setWorkspaceOpen(true);

      addMessage(
        "assistant",
        result.recommendations.length
          ? `Your strongest match is **${result.recommendations[0].title}**. The full list is in the workspace.`
          : "No matches were found for this profile. Try adding more interests or skills.",
      );
    } catch (err) {
      setMatchError(err.message || "Couldn't connect to the career service.");

      addMessage(
        "assistant",
        "The career service is unavailable. Make sure the backend is running, then try again.",
      );
    } finally {
      setMatchBusy(false);
    }
  }

  async function handleProfileSubmit(nextProfile) {
    const isUpdate = profile !== null;

    setProfile(nextProfile);
    setScreen("chat");

    addMessage(
      "assistant",
      isUpdate
        ? "Profile updated. Refreshing your matches."
        : "Profile saved. Finding career matches for you.",
    );

    await findMatches(nextProfile);
  }

  /* ------------------------------- Chat flow ----------------------------- */

  async function handleSend(rawText) {
    const message = rawText.trim();

    if (!message || chatBusy) return;

    addMessage("user", message);
    setChatBusy(true);

    try {
      const reply = await sendChatMessage(message, profile);
      addMessage("assistant", reply);

      setActiveConversationIdState(getActiveConversationId());

      // Refresh the sidebar after the message has been saved.
      void refreshConversations();
    } catch (err) {
      addMessage(
        "assistant",
        err.message ||
          "The chat service is unavailable right now. Try again in a moment.",
      );
    } finally {
      setChatBusy(false);
    }
  }

  /* ------------------------------ Roadmaps ------------------------------- */

  async function handleRoadmap(career) {
    if (!profile || !career) return;

    setSelectedCareer(career);
    setActiveTab("roadmap");
    setWorkspaceOpen(true);
    setRoadmapBusy(true);
    setRoadmapError("");

    try {
      const result = await generateRoadmap(
        profile,
        career.career_id || career.id,
      );

      setRoadmap(result);

      addMessage(
        "assistant",
        `Your roadmap for **${result.career?.title || career.title}** is ready. It assumes ${result.weekly_hours} hours per week over about ${result.estimated_duration_weeks} weeks.`,
      );
    } catch (err) {
      setRoadmapError(err.message || "Couldn't generate your roadmap.");
    } finally {
      setRoadmapBusy(false);
    }
  }

  /* ------------------------------ Workspace ------------------------------ */

  const workspace = (
    <WorkspaceContent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      recommendations={recommendations}
      onSelect={handleRoadmap}
      roadmap={roadmap}
      roadmapBusy={roadmapBusy}
      roadmapError={roadmapError}
    />
  );

  /* --------------------------------- Page -------------------------------- */

  const page = (
    <main className="relative z-10 min-h-screen w-full text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(99,102,241,0.20),transparent),radial-gradient(45%_40%_at_90%_100%,rgba(56,189,248,0.12),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            PathFinder
          </span>

          {isChat && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistoryOpen(true);
                  void refreshConversations();
                }}
                className="border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.07] hover:text-zinc-100"
              >
                <History size={15} />
                <span>History</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setScreen("onboarding")}
                className="text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
              >
                Edit profile
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWorkspaceOpen((open) => !open)}
                aria-expanded={workspaceOpen}
                aria-label={
                  workspaceOpen ? "Close workspace" : "Open workspace"
                }
                className="border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.07] hover:text-zinc-100"
              >
                {workspaceOpen ? (
                  <PanelRightClose size={15} />
                ) : (
                  <PanelRight size={15} />
                )}

                <span className="hidden sm:inline">
                  {workspaceOpen ? "Hide workspace" : "Workspace"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {!isChat ? (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Set up your profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              We use this to match careers and estimate a realistic plan. You
              can change it at any time.
            </p>
          </div>

          <ProfileForm
            key={profile ? "edit" : "new"}
            initialProfile={profile ?? DEFAULT_PROFILE}
            submitting={matchBusy}
            onSubmit={handleProfileSubmit}
            onCancel={profile ? () => setScreen("chat") : undefined}
          />
        </div>
      ) : (
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1500px]">
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-8">
              <div className="py-6">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                  Career chat
                </h1>

                <p className="mt-1 text-sm text-zinc-400">
                  Ask about your matches, timelines, or what to learn next.
                </p>
              </div>

              {profile && <ProfileSummary profile={profile} />}

              <div
                className="flex-1 space-y-4 pb-6"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {(matchBusy || chatBusy) && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <LoaderCircle size={14} className="animate-spin" />
                    {matchBusy
                      ? "Comparing your profile with career paths"
                      : "Thinking"}
                  </div>
                )}

                {matchError && (
                  <Alert className="border-rose-900 bg-rose-950/40">
                    <AlertDescription className="text-xs text-rose-200">
                      {matchError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {messages.length <= 1 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs text-zinc-500">
                    Suggested questions
                  </p>

                  <div className="flex flex-col items-start gap-2">
                    {CHAT_SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        onClick={() => handleSend(suggestion)}
                        disabled={chatBusy}
                        className={`h-auto whitespace-normal rounded-lg px-3 py-2 text-left text-xs font-normal leading-5 text-zinc-300 hover:text-zinc-100 ${GLASS_INTERACTIVE}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 pb-4 pt-2">
                <ChatInput
                  onSend={handleSend}
                  disabled={chatBusy || matchBusy}
                />

                <p className="mt-2 text-center text-[11px] text-zinc-600">
                  Scores are heuristic indicators, not employment predictions.
                </p>
              </div>
            </div>
          </section>

          {isDesktop && (
            <AnimatePresence initial={false}>
              {workspaceOpen && (
                <m.aside
                  key="workspace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="sticky top-16 flex h-[calc(100vh-4rem)] w-[min(420px,40vw)] shrink-0 flex-col self-start border-l border-white/10 bg-zinc-950/80"
                >
                  <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-sm font-medium text-zinc-100">
                      Workspace
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      Matches and learning plan
                    </p>
                  </div>

                  {workspace}
                </m.aside>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Mobile and tablet workspace drawer */}
      {isChat && !isDesktop && (
        <Sheet open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 border-white/10 bg-zinc-950 p-0 text-zinc-100 sm:max-w-md"
          >
            <SheetHeader className="border-b border-white/10 p-4">
              <SheetTitle className="text-zinc-100">Workspace</SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                Matches and learning plan
              </SheetDescription>
            </SheetHeader>

            {workspace}
          </SheetContent>
        </Sheet>
      )}

      {/* Conversation history drawer */}
      {isChat && (
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent
            side="left"
            className="flex w-full flex-col gap-0 border-white/10 bg-zinc-950 p-0 text-zinc-100 sm:max-w-sm"
          >
            <SheetHeader className="border-b border-white/10 p-4 text-left">
              <SheetTitle className="text-zinc-100">Chat history</SheetTitle>

              <SheetDescription className="text-xs text-zinc-500">
                Your saved PathFinder conversations
              </SheetDescription>
            </SheetHeader>

            <div className="border-b border-white/10 p-4">
              <Button
                type="button"
                onClick={handleNewChat}
                className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
              >
                <Plus size={16} />
                New Chat
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {historyError && (
                <Alert className="border-rose-900 bg-rose-950/40">
                  <AlertDescription className="text-xs text-rose-200">
                    {historyError}
                  </AlertDescription>
                </Alert>
              )}

              {historyLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading conversations...
                </div>
              )}

              {!historyLoading &&
                !historyError &&
                conversations.length === 0 && (
                  <div className="px-3 py-12 text-center">
                    <History size={24} className="mx-auto mb-3 text-zinc-600" />

                    <p className="text-sm text-zinc-300">
                      No saved conversations yet
                    </p>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Your chats will appear here after you send a message.
                    </p>
                  </div>
                )}

              {conversations.map((conversation) => {
                const isDeleting = deletingConversationId === conversation.id;
                const isActive = activeConversationId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`flex items-stretch gap-1 rounded-xl border p-2 transition-colors ${
                      isActive
                        ? "border-indigo-400/30 bg-indigo-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={
                        historyLoading ||
                        Boolean(deletingConversationId) ||
                        chatBusy
                      }
                      onClick={() => handleLoadConversation(conversation)}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <History
                        size={16}
                        className="mt-0.5 shrink-0 text-indigo-300"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {conversation.title &&
                          conversation.title !== "New conversation"
                            ? conversation.title
                            : "Conversation"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {conversation.updated_at
                            ? new Date(conversation.updated_at).toLocaleString(
                                [],
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )
                            : "Saved conversation"}
                        </p>
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        historyLoading ||
                        Boolean(deletingConversationId) ||
                        chatBusy
                      }
                      aria-label={`Delete ${
                        conversation.title || "conversation"
                      }`}
                      title="Delete conversation"
                      onClick={() => handleDeleteConversation(conversation)}
                      className="h-9 w-9 shrink-0 self-center text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                    >
                      {isDeleting ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[11px] leading-5 text-zinc-600">
                Deleting a conversation permanently removes its saved messages.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </main>
  );

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {isChat ? (
          <DriftGrid className="bg-[#0a0c12] text-zinc-400">{page}</DriftGrid>
        ) : (
          <BackgroundPaths
            count={10}
            speed={0.4}
            className="min-h-screen items-stretch justify-start bg-[#0a0c12] text-zinc-400"
          >
            {page}
          </BackgroundPaths>
        )}
      </LazyMotion>
    </MotionConfig>
  );
}
