import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Clock3,
  Compass,
  ExternalLink,
  Flag,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";

function getMissionKey(careerId) {
  return `pathfinder-mission-v1:${careerId || "default"}`;
}

function makeTasks(roadmap) {
  if (!roadmap || !Array.isArray(roadmap.phases)) {
    return [];
  }

  return roadmap.phases.map((phase, index) => {
    const skills = Array.isArray(phase.skills)
      ? phase.skills.filter(Boolean)
      : [];

    const firstSkill = skills[0];

    const title = firstSkill
      ? `Start learning ${firstSkill}`
      : phase.title || `Mission ${index + 1}`;

    const description = firstSkill
      ? `Spend a focused study session building your foundation in ${firstSkill}. Use a free learning resource, then practise what you learned.`
      : `Work through the "${phase.title}" phase and take one practical step toward its milestone.`;

    return {
      id: String(phase.phase ?? index + 1),
      title,
      phaseTitle: phase.title || `Phase ${index + 1}`,
      description,
      rationale: index === 0
        ? `This is the first phase of your ${roadmap.career?.title || "career"} roadmap. Building this foundation makes the later milestones easier to tackle.`
        : `This phase follows the earlier foundations in your roadmap. Complete it after the preceding mission so your progress stays in order.`,
      milestone: phase.milestone || "Make measurable progress on this phase.",
      estimatedMinutes: Math.max(
        30,
        Math.min(180, Math.round(
          (Number(roadmap.weekly_hours) || 5) * 60 /
          Math.max(1, roadmap.phases.length)
        ))
      ),
      skills,
    };
  });
}

function readProgress(key, taskIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");

    return {
      completed: Array.isArray(saved.completed)
        ? saved.completed.filter((id) => taskIds.includes(id))
        : [],
      stuck: Array.isArray(saved.stuck)
        ? saved.stuck.filter((id) => taskIds.includes(id))
        : [],
    };
  } catch {
    return { completed: [], stuck: [] };
  }
}

export default function MissionControl({
  roadmap,
  loading = false,
  error = null,
  recommendations = [],
  onChooseCareer,
}) {
  const careerId = roadmap?.career?.id;
  const storageKey = getMissionKey(careerId);
  const tasks = useMemo(() => makeTasks(roadmap), [roadmap]);
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  const [progress, setProgress] = useState({
    completed: [],
    stuck: [],
  });

  useEffect(() => {
    setProgress(readProgress(storageKey, taskIds));
  }, [storageKey, taskIds.join("|")]);

  useEffect(() => {
    if (!taskIds.length) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // The feature remains usable if browser storage is unavailable.
    }
  }, [progress, storageKey, taskIds.length]);

  const activeTask = tasks.find(
    (task) => !progress.completed.includes(task.id)
  );

  const completedCount = progress.completed.length;
  const totalCount = tasks.length;
  const completionPercent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  function completeTask(taskId) {
    setProgress((current) => ({
      completed: current.completed.includes(taskId)
        ? current.completed
        : [...current.completed, taskId],
      stuck: current.stuck.filter((id) => id !== taskId),
    }));
  }

  function markStuck(taskId) {
    setProgress((current) => ({
      ...current,
      stuck: current.stuck.includes(taskId)
        ? current.stuck
        : [...current.stuck, taskId],
    }));
  }

  function resetProgress() {
    setProgress({ completed: [], stuck: [] });
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/[0.06] p-4">
        <p className="text-sm font-medium text-red-200">
          Couldn't load your roadmap
        </p>
        <p className="mt-2 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
          <Compass size={21} />
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-300">
          Your career, one step at a time
        </p>

        <h3 className="mt-3 text-xl font-semibold text-white">
          Find your next mission
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Generate a career roadmap to get your first prioritized task,
          a reason to start there, and a milestone to work toward.
        </p>

        {recommendations.length > 0 ? (
          <div className="mt-5 space-y-2">
            <p className="text-xs text-zinc-500">
              Choose a career to generate its roadmap:
            </p>

            {recommendations.slice(0, 3).map((career) => (
              <button
                key={career.career_id || career.id || career.title}
                type="button"
                onClick={() => onChooseCareer?.(career)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/[0.06]"
              >
                <span>
                  <span className="block text-sm font-medium text-zinc-100">
                    {career.title}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    Generate a personalized starter roadmap
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-indigo-300" />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-zinc-500">
            Save your profile to get career matches and start a roadmap.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.13] via-zinc-950 to-violet-500/[0.08] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-indigo-500/[0.10] blur-3xl" />

        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-indigo-200">
            <Sparkles size={12} />
            Mission Control
          </span>

          <span className="text-xs text-zinc-500">
            {completedCount}/{totalCount} completed
          </span>
        </div>

        <h2 className="relative mt-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {roadmap.career?.title || "Your career journey"}
        </h2>

        <p className="relative mt-2 max-w-md text-sm leading-6 text-zinc-400">
          No need to figure out the entire journey today. Focus on the
          next step, make progress, and keep going.
        </p>

        <div className="relative mt-5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-label="Roadmap completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercent}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {completionPercent}% of roadmap phases completed
          </p>
        </div>
      </section>

      {activeTask ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">
            <Target size={15} />
            Your next priority
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            {activeTask.phaseTitle}
          </p>

          <h3 className="mt-1 text-xl font-semibold leading-snug text-white">
            {activeTask.title}
          </h3>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {activeTask.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
              <Clock3 size={13} />
              About {activeTask.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
              <Flag size={13} />
              {activeTask.skills.length
                ? `${activeTask.skills.length} focus skill${activeTask.skills.length === 1 ? "" : "s"}`
                : "Practical milestone"}
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-indigo-300/10 bg-indigo-400/[0.04] p-4">
            <p className="text-xs font-semibold text-indigo-200">
              Why this comes next
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {activeTask.rationale}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/10 p-4">
            <p className="text-xs font-semibold text-zinc-200">
              Your milestone
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {activeTask.milestone}
            </p>
          </div>

          {progress.stuck.includes(activeTask.id) && (
            <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-200">
              No worries. Break this task into a smaller step or ask
              PathFinder chat for help before continuing.
            </p>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => completeTask(activeTask.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Check size={16} />
              Complete mission
            </button>

            <button
              type="button"
              onClick={() => markStuck(activeTask.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              I’m stuck
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <div className="flex items-center gap-2 text-emerald-200">
            <Check size={19} />
            <h3 className="font-semibold">All roadmap phases completed!</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            You've completed the milestones in this starter roadmap.
            Review what you've learned and update your roadmap when you're
            ready for the next challenge.
          </p>
          <button
            type="button"
            onClick={resetProgress}
            className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset demo progress
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-white/[0.07] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Mission timeline
          </h3>
          <span className="text-xs text-zinc-600">
            {totalCount} phases
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map((task, index) => {
            const completed = progress.completed.includes(task.id);
            const current = activeTask?.id === task.id;

            return (
              <div key={task.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      completed
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : current
                          ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200"
                          : "border-white/10 text-zinc-600"
                    }`}
                  >
                    {completed ? (
                      <Check size={14} />
                    ) : current ? (
                      <Circle size={10} fill="currentColor" />
                    ) : (
                      <span className="text-[10px]">{index + 1}</span>
                    )}
                  </div>
                  {index < tasks.length - 1 && (
                    <div className="mt-1 min-h-5 w-px flex-1 bg-white/[0.08]" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-2">
                  <p
                    className={`text-sm ${
                      completed
                        ? "text-zinc-500 line-through"
                        : current
                          ? "font-medium text-zinc-100"
                          : "text-zinc-400"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {completed
                      ? "Completed"
                      : current
                        ? "Up next"
                        : "Upcoming"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-center text-[11px] leading-5 text-zinc-600">
        Starter missions are generated from your roadmap phases. Time
        estimates are illustrative, and progress is saved in this browser.
      </p>
    </div>
  );
}