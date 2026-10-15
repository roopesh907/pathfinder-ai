import { memo, useEffect, useState,} from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import {
  ArrowRight,
  LoaderCircle,
  PanelRight,
  PanelRightClose,
  Send,
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
import { sendChatMessage } from "./services/chat";

/* -------------------------------------------------------------------------- */
/*  Glass styles                                                              */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
const GLASS_INTERACTIVE = `${GLASS} transition-colors hover:border-white/20 hover:bg-white/[0.07]`;

/* -------------------------------------------------------------------------- */
/*  Options & helpers                                                         */
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

const formatRupees = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

function formatSkill(skill = "") {
  return skill
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
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

// Renders **bold** segments instead of printing the asterisks.
function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
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

// Plain buttons with explicit state, so selection never depends on Radix internals.
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

  return (
    <Card
      className={`gap-4 rounded-xl py-4 text-zinc-100 ${GLASS_INTERACTIVE}`}
    >
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-medium leading-6 text-zinc-100">
            {career.title}
          </CardTitle>
          {career.field && (
            <span className="shrink-0 text-xs text-zinc-500">
              {career.field}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4">
        <p className="line-clamp-3 text-xs leading-5 text-zinc-400">
          {career.description || "No description available."}
        </p>

        <div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Profile match</span>
            <span className="font-medium tabular-nums text-zinc-200">
              {score} / 100
            </span>
          </div>
          <Progress
            value={score}
            className="mt-2 h-1 bg-white/10 [&>div]:bg-indigo-300"
          />
        </div>

        {!!career.matched_skills?.length && (
          <div className="flex flex-wrap gap-1.5">
            {career.matched_skills.slice(0, 3).map((skill) => (
              <SkillTag key={skill}>{formatSkill(skill)}</SkillTag>
            ))}
          </div>
        )}
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
      <Skeleton className="h-24 w-full rounded-xl bg-white/6" />
      <Skeleton className="h-14 w-full rounded-xl bg-white/6" />
      <Skeleton className="h-14 w-full rounded-xl bg-white/6" />
      <p className="text-center text-xs text-zinc-500">
        Building your learning plan
      </p>
    </div>
  );
}

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
      <div className="py-14 text-center">
        <p className="text-sm font-medium text-zinc-200">No roadmap yet</p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-zinc-500">
          Select a career from the matches tab to generate a learning plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500">Selected path</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">
          {roadmap.career?.title || "Your career path"}
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Estimated timeline</dt>
            <dd className="mt-1 font-medium tabular-nums text-zinc-100">
              {roadmap.estimated_duration_weeks ?? "—"} weeks
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Weekly commitment</dt>
            <dd className="mt-1 font-medium tabular-nums text-zinc-100">
              {roadmap.weekly_hours ?? "—"} hours
            </dd>
          </div>
        </dl>
      </div>

      <section>
        <h4 className="mb-3 text-sm font-medium text-zinc-200">
          Skills to develop
        </h4>
        <div className="flex flex-wrap gap-2">
          {(roadmap.skills_to_develop || []).length ? (
            roadmap.skills_to_develop.map((skill) => (
              <SkillTag key={skill} missing>
                {formatSkill(skill)}
              </SkillTag>
            ))
          ) : (
            <p className="text-xs text-zinc-500">
              No additional skills were listed.
            </p>
          )}
        </div>
      </section>

      <Separator className="bg-white/10" />

      <section>
        <h4 className="mb-4 text-sm font-medium text-zinc-200">
          Learning phases
        </h4>
        <ol className="space-y-5">
          {(roadmap.phases || []).map((phase, index) => (
            <li
              key={phase.phase ?? index}
              className="border-l border-white/10 pl-4"
            >
              <p className="text-xs text-zinc-500">
                Phase {phase.phase ?? index + 1} · {phase.duration_weeks} weeks
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {phase.title}
              </p>
              {!!phase.skills?.length && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {phase.skills.map((skill) => (
                    <SkillTag key={skill} missing>
                      {formatSkill(skill)}
                    </SkillTag>
                  ))}
                </div>
              )}
              {phase.milestone && (
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  <span className="text-zinc-500">Milestone: </span>
                  {phase.milestone}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {roadmap.resource_guidance && (
        <section>
          <h4 className="mb-2 text-sm font-medium text-zinc-200">Resources</h4>
          <p className="text-xs leading-5 text-zinc-400">
            {roadmap.resource_guidance}
          </p>
        </section>
      )}

      <p className="text-xs leading-5 text-zinc-500">
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
            <p className="text-xs leading-5 text-zinc-500">
              Scores measure overlap with our catalog. They are not a prediction
              of hiring outcomes.
            </p>
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
/*  Profile setup                                                             */
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
/*  App                                                                       */
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

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isChat = screen === "chat";

  function addMessage(role, content) {
    setMessages((previous) => [
      ...previous,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }

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

  async function handleSend(rawText) {
    const message = rawText.trim();
    if (!message || chatBusy) return;

    addMessage("user", message);
    setChatBusy(true);

    try {
      const reply = await sendChatMessage(message, profile);
      addMessage("assistant", reply);
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

  const page = (
    <main className="relative z-10 min-h-screen w-full text-zinc-100">
      {/* Static colour wash. Painted once, so it costs nothing per frame. */}
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
                aria-label={workspaceOpen ? "Close workspace" : "Open workspace"}
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
    </main>
  );

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {isChat ? (
          // Chat: lightweight drifting dot grid.
          <DriftGrid className="bg-[#0a0c12] text-zinc-400">{page}</DriftGrid>
        ) : (
          // Selection: Kokonut background paths. Only one animated background is mounted at a time.
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