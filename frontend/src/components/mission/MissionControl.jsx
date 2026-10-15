
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Clock3,
  Compass,
  Flag,
  RotateCcw,
  Sparkles,
  Target,
  Bot,
  X,
  Send,
  BookOpen,
  CalendarClock,
  Bug,
  MessageCircle,
  LoaderCircle,
} from "lucide-react";

const getMissionKey = (careerId) =>
  `pathfinder-mission-v1:${careerId || "default"}`;

function makeTasks(roadmap) {
  if (!Array.isArray(roadmap?.phases)) return [];

  return roadmap.phases.map((phase, index) => {
    const skills = Array.isArray(phase.skills) ? phase.skills : [];

    return {
      id: String(phase.phase ?? index + 1),
      phase: phase.phase ?? index + 1,
      title:
        skills[0] ||
        phase.title ||
        `Complete phase ${index + 1}`,
      description:
        phase.description ||
        phase.rationale ||
        "Build your knowledge through focused practice.",
      rationale: phase.rationale || phase.description || "",
      milestone: phase.milestone || "",
      estimatedMinutes: Number(phase.estimatedMinutes) || 60,
      skills,
    };
  });
}

function readProgress(storageKey, taskIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");

    return {
      completed: Array.isArray(saved.completed)
        ? saved.completed.filter((id) => taskIds.includes(String(id)))
        : [],
      stuck: Array.isArray(saved.stuck)
        ? saved.stuck.filter((id) => taskIds.includes(String(id)))
        : [],
    };
  } catch {
    return { completed: [], stuck: [] };
  }
}

const MENTOR_OPTIONS = [
  {
    label: "Explain this concept",
    prompt: "Explain this mission's main concept in simple terms.",
    icon: BookOpen,
  },
  {
    label: "I'm falling behind",
    prompt: "I'm falling behind. Help me make a realistic study plan.",
    icon: CalendarClock,
  },
  {
    label: "Help me solve a problem",
    prompt: "Help me work through a problem related to this mission step by step.",
    icon: Bug,
  },
  {
    label: "What should I do next?",
    prompt: "Help me identify the next practical step for this mission.",
    icon: Compass,
  },
];

export default function MissionControl({
  roadmap,
  loading = false,
  error = null,
  recommendations = [],
  onChooseCareer,
  onAskMentor,
}) {
  const careerId = roadmap?.career?.id || roadmap?.career?.career_id;
  const storageKey = getMissionKey(careerId);

  const tasks = useMemo(() => makeTasks(roadmap), [roadmap]);
  const taskIds = useMemo(
    () => tasks.map((task) => task.id),
    [tasks]
  );

  const [progress, setProgress] = useState({
    completed: [],
    stuck: [],
  });

  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorTaskId, setMentorTaskId] = useState(null);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorMessages, setMentorMessages] = useState([]);
  const [mentorBusy, setMentorBusy] = useState(false);
  const [mentorError, setMentorError] = useState("");

  // References used to bring the mentor panel into view.
  const mentorPanelRef = useRef(null);
  const mentorInputRef = useRef(null);

  useEffect(() => {
    setProgress(readProgress(storageKey, taskIds));
  }, [storageKey, taskIds.join("|")]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Progress remains available in React state if storage is unavailable.
    }
  }, [storageKey, progress]);

  const activeTask = tasks.find(
    (task) => !progress.completed.includes(task.id)
  );

  const mentorTask =
    tasks.find((task) => task.id === mentorTaskId) || activeTask;

  const completedCount = progress.completed.length;
  const totalCount = tasks.length;
  const completionPercent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // FIX: when the panel opens, scroll the nested workspace to reveal it.
  useEffect(() => {
    if (!mentorOpen || !mentorTask) return;

    const frame = requestAnimationFrame(() => {
      mentorPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [mentorOpen, mentorTask]);

  function closeMentor() {
    setMentorOpen(false);
    setMentorError("");
    setMentorInput("");
  }

  function markStuck(taskId) {
    const selectedTask = tasks.find(
      (task) => task.id === String(taskId)
    );

    if (!selectedTask) return;

    setProgress((current) => ({
      ...current,
      stuck: current.stuck.includes(selectedTask.id)
        ? current.stuck
        : [...current.stuck, selectedTask.id],
    }));

    setMentorTaskId(selectedTask.id);
    setMentorError("");
    setMentorInput("");

    setMentorMessages([
      {
        role: "assistant",
        content:
          `Hey, you're not expected to figure everything out alone. 💜\n\n` +
          `Let's work through **${selectedTask.title}** together. ` +
          `What's making it difficult? Pick an option below, or tell me in your own words.`,
      },
    ]);

    setMentorOpen(true);
  }

  function completeTask(taskId) {
    setProgress((current) => ({
      completed: current.completed.includes(taskId)
        ? current.completed
        : [...current.completed, taskId],
      stuck: current.stuck.filter((id) => id !== taskId),
    }));

    if (mentorTaskId === taskId) {
      closeMentor();
    }
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Reset your mission progress? This cannot be undone."
    );

    if (!confirmed) return;

    setProgress({ completed: [], stuck: [] });
    closeMentor();
    setMentorTaskId(null);
  }

  async function askMentor(question) {
    const text = String(question || "").trim();

    if (!text || mentorBusy || !mentorTask) return;

    if (typeof onAskMentor !== "function") {
      setMentorError(
        "The mentor service isn't connected yet. Please try again shortly."
      );
      return;
    }

    const context = [
      "You are PathFinder AI's supportive career-learning mentor.",
      "Help the learner make progress on the specific mission below.",
      "Explain concepts clearly, give practical examples, and guide the learner step by step.",
      "Do not overwhelm the learner with too many tasks at once.",
      "",
      `Career: ${roadmap?.career?.title || roadmap?.career?.name || "Selected career"}`,
      `Mission phase: ${mentorTask.phase}`,
      `Mission: ${mentorTask.title}`,
      `Description: ${mentorTask.description}`,
      `Skills: ${mentorTask.skills.join(", ") || "Not specified"}`,
      `Milestone: ${mentorTask.milestone || "Not specified"}`,
      `Estimated time: ${mentorTask.estimatedMinutes} minutes`,
      "",
      `Learner's question: ${text}`,
    ].join("\n");

    setMentorMessages((current) => [
      ...current,
      { role: "user", content: text },
    ]);

    setMentorInput("");
    setMentorError("");
    setMentorBusy(true);

    try {
      const response = await onAskMentor(context);

      const reply =
        typeof response === "string"
          ? response
          : response?.reply || response?.answer || "";

      if (!String(reply).trim()) {
        throw new Error("The mentor returned an empty response.");
      }

      setMentorMessages((current) => [
        ...current,
        { role: "assistant", content: String(reply) },
      ]);
    } catch (err) {
      setMentorError(
        err?.message ||
          "I couldn't get a response right now. Please try again."
      );
    } finally {
      setMentorBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <LoaderCircle size={18} className="animate-spin" />
          Preparing your mission plan...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-400/20 bg-zinc-950/50 p-6">
        <h3 className="font-semibold text-zinc-100">
          Couldn't load your mission plan
        </h3>
        <p className="mt-2 text-sm text-zinc-400">{String(error)}</p>
      </section>
    );
  }

  if (!tasks.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">
              Your mission starts here
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Choose a career and generate a roadmap to create your learning missions.
            </p>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recommended careers
            </p>

            {recommendations.slice(0, 3).map((career, index) => (
              <button
                key={career.career_id || career.id || index}
                type="button"
                onClick={() => onChooseCareer?.(career)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-zinc-200 transition hover:bg-white/[0.06]"
              >
                <span>
                  {career.title || career.name || career.career_name || "Explore career"}
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Mission overview */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Target size={15} />
              Mission control
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              {roadmap?.career?.title ||
                roadmap?.career?.name ||
                "Your learning journey"}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Make consistent progress, one mission at a time.
            </p>
          </div>

          <button
            type="button"
            onClick={resetProgress}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
          >
            <RotateCcw size={14} />
            Reset progress
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-zinc-400">
            <span>
              {completedCount} of {totalCount} missions completed
            </span>
            <span>{completionPercent}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mentor panel: deliberately rendered before the active task. */}
      {mentorOpen && mentorTask && (
        <section
          ref={mentorPanelRef}
          className="scroll-mt-6 overflow-hidden rounded-2xl border border-indigo-400/25 bg-zinc-950/80 shadow-lg shadow-indigo-950/20"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
                <Bot size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-zinc-100">
                  PathFinder Mentor
                </h3>
                <p className="text-xs text-zinc-400">
                  Mission: {mentorTask.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeMentor}
              aria-label="Close mentor"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
            {mentorMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[95%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-indigo-500/20 text-indigo-100"
                      : "border border-white/10 bg-white/[0.04] text-zinc-300"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {mentorBusy && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <LoaderCircle size={14} className="animate-spin" />
                Your mentor is thinking...
              </div>
            )}

            {mentorError && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
              >
                {mentorError}
                <button
                  type="button"
                  onClick={() => setMentorError("")}
                  className="ml-2 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {mentorMessages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {MENTOR_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.label}
                    type="button"
                    disabled={mentorBusy}
                    onClick={() => askMentor(option.prompt)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/[0.06] disabled:opacity-50"
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-white/10 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              askMentor(mentorInput);
            }}
          >
            <input
              ref={mentorInputRef}
              value={mentorInput}
              onChange={(event) => setMentorInput(event.target.value)}
              placeholder="Tell your mentor what's difficult..."
              disabled={mentorBusy}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-indigo-400/50 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={mentorBusy || !mentorInput.trim()}
              aria-label="Send message"
              className="rounded-xl bg-indigo-500 p-3 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      {/* Current mission */}
      {activeTask ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles size={15} />
            Your next priority
          </div>

          <div className="mt-4 flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
              <Flag size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500">
                Phase {activeTask.phase}
              </p>

              <h3 className="mt-1 text-lg font-semibold text-zinc-100">
                {activeTask.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {activeTask.description}
              </p>

              {activeTask.rationale && (
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {activeTask.rationale}
                </p>
              )}

              {activeTask.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeTask.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-zinc-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {activeTask.milestone && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs font-semibold text-zinc-300">
                    Success milestone
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {activeTask.milestone}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Clock3 size={14} />
                Approximately {activeTask.estimatedMinutes} minutes
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => completeTask(activeTask.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Check size={16} />
              Complete mission
            </button>

            <button
              type="button"
              onClick={() => markStuck(activeTask.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <MessageCircle size={16} />
              I'm stuck — help me
            </button>
          </div>

          {progress.stuck.includes(activeTask.id) && !mentorOpen && (
            <button
              type="button"
              onClick={() => markStuck(activeTask.id)}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-left text-sm text-amber-200"
            >
              <MessageCircle size={16} />
              You're working through this mission with your mentor.
              <ArrowRight size={15} className="ml-auto" />
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
              <Check size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">
                All missions completed!
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Amazing work. You've completed every mission in this roadmap.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mission timeline */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
        <h3 className="font-semibold text-zinc-100">Mission timeline</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Track your progress across every phase.
        </p>

        <div className="mt-5 space-y-3">
          {tasks.map((task, index) => {
            const isCompleted = progress.completed.includes(task.id);
            const isActive = activeTask?.id === task.id;
            const isStuck = progress.stuck.includes(task.id);

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  isActive
                    ? "border-indigo-400/25 bg-indigo-500/[0.05]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    isCompleted ? "text-emerald-300" : "text-zinc-600"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-zinc-500 line-through"
                          : "text-zinc-200"
                      }`}
                    >
                      {task.title}
                    </p>

                    {isActive && (
                      <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                        CURRENT
                      </span>
                    )}

                    {isStuck && (
                      <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        NEEDS HELP
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    Phase {task.phase} · {task.estimatedMinutes} minutes
                  </p>
                </div>

                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => markStuck(task.id)}
                    aria-label={`Get help with ${task.title}`}
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-indigo-500/10 hover:text-indigo-300"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
