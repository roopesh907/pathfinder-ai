
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import {
  History,
  LoaderCircle,
  PanelRight,
  PanelRightClose,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  MessageCircle,
  Target,
  BookOpen,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import BackgroundPaths from "@/components/ui/background-paths";
import DriftGrid from "@/components/ui/drift-grid";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

import ProfileForm from "./components/profile/ProfileForm";
import ProfileSummary from "./components/profile/ProfileSummary";
import ChatInput from "./components/chat/ChatInput";
import MessageBubble from "./components/chat/MessageBubble";
import WorkspaceContent from "./components/workspace/WorkspaceContent";
import Navbar from "./components/Navbar";
import MissionControl from "./components/mission/MissionControl";

import { GLASS } from "./constants/styles";
import { DEFAULT_PROFILE } from "./constants/profile";

const GLASS_INTERACTIVE = `${GLASS} transition-colors duration-200 hover:border-indigo-300/25 hover:bg-white/[0.065] motion-reduce:transition-none`;

const CHAT_SUGGESTIONS = [
  "Which match should I start with?",
  "How do I fit this into my weekly schedule?",
  "What should I learn first?",
];

const MIN_WORKSPACE_WIDTH = 320;
const MIN_CHAT_WIDTH = 360;
const DEFAULT_WORKSPACE_WIDTH = 440;
const MAX_WORKSPACE_WIDTH = 720;

function clampWorkspaceWidth(width) {
  const maxWidth = Math.max(
    MIN_WORKSPACE_WIDTH,
    Math.min(MAX_WORKSPACE_WIDTH, window.innerWidth - MIN_CHAT_WIDTH),
  );

  return Math.round(
    Math.max(MIN_WORKSPACE_WIDTH, Math.min(maxWidth, width)),
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function SectionEyebrow({ children }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-400/[0.07] px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-indigo-200/90">
      <span className="size-1.5 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
      {children}
    </div>
  );
}

function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="group flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors duration-200 hover:border-indigo-300/20 hover:bg-white/[0.045] motion-reduce:transition-none">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-indigo-300/15 bg-indigo-400/[0.08] text-indigo-200">
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

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

  const [workspaceWidth, setWorkspaceWidth] = useState(
    DEFAULT_WORKSPACE_WIDTH,
  );
  const [isResizingWorkspace, setIsResizingWorkspace] = useState(false);
  const resizeOrigin = useRef(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [deletingConversationId, setDeletingConversationId] =
    useState(null);

  const [activeConversationId, setActiveConversationIdState] = useState(
    () => getActiveConversationId(),
  );

  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isChat = screen === "chat";

  // Follow new messages when the user is already near the bottom.
  useEffect(() => {
    if (!isChat || !shouldAutoScrollRef.current) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, chatBusy, matchBusy, isChat]);

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }

  /* Workspace resizing */

  useEffect(() => {
    if (!isResizingWorkspace) return;

    const handlePointerMove = (event) => {
      if (!resizeOrigin.current) return;

      const { pointerX, initialWidth } = resizeOrigin.current;

      setWorkspaceWidth(
        clampWorkspaceWidth(initialWidth + pointerX - event.clientX),
      );
    };

    const handlePointerUp = () => {
      setIsResizingWorkspace(false);
      resizeOrigin.current = null;
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsResizingWorkspace(false);
        resizeOrigin.current = null;
      }
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResizingWorkspace]);

  useEffect(() => {
    const handleWindowResize = () => {
      setWorkspaceWidth((width) => clampWorkspaceWidth(width));
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  function handleWorkspaceResizeStart(event) {
    if (!isDesktop || !workspaceOpen) return;

    event.preventDefault();

    resizeOrigin.current = {
      pointerX: event.clientX,
      initialWidth: workspaceWidth,
    };

    setIsResizingWorkspace(true);
  }

  function handleWorkspaceResizeKeyDown(event) {
    if (!isDesktop || !workspaceOpen) return;

    const step = event.shiftKey ? 48 : 16;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setWorkspaceWidth((width) => clampWorkspaceWidth(width + step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setWorkspaceWidth((width) => clampWorkspaceWidth(width - step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setWorkspaceWidth(MIN_WORKSPACE_WIDTH);
    } else if (event.key === "End") {
      event.preventDefault();
      setWorkspaceWidth(clampWorkspaceWidth(MAX_WORKSPACE_WIDTH));
    }
  }

  /* Navigation */

  function handleNavigate(href) {
    if (href === "/" || href === "/onboarding") {
      setScreen("onboarding");
      setWorkspaceOpen(false);
      return;
    }

    if (href === "/dashboard") {
      setScreen("chat");
      setWorkspaceOpen(true);
      setActiveTab("mission");
      shouldAutoScrollRef.current = true;
      return;
    }

    if (href === "/careers") {
      setScreen("chat");
      setWorkspaceOpen(true);
      setActiveTab("careers");
      shouldAutoScrollRef.current = true;
      return;
    }

    if (href === "/roadmap") {
      setScreen("chat");
      setWorkspaceOpen(true);
      setActiveTab("roadmap");
      shouldAutoScrollRef.current = true;
      return;
    }

    if (href === "/#explore" || href === "/#how-it-works") {
      setScreen("onboarding");
      setWorkspaceOpen(false);

      const id = href.endsWith("#explore")
        ? "explore"
        : "how-it-works";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const section = document.getElementById(id);
          if (!section) return;

          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;

          section.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
          });
        });
      });
    }
  }

  function addMessage(role, content) {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
      },
    ]);
  }

  /* Conversation history */

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
    shouldAutoScrollRef.current = true;

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }

  async function handleLoadConversation(conversation) {
    if (!conversation?.id || historyLoading || deletingConversationId) {
      return;
    }

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

      shouldAutoScrollRef.current = true;
      setHistoryOpen(false);
      setScreen("chat");
    } catch (err) {
      setHistoryError(err.message || "Couldn't load this conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleDeleteConversation(conversation) {
    if (!conversation?.id || historyLoading || deletingConversationId) {
      return;
    }

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

      if (activeConversationId === conversation.id) {
        startNewConversation();
        setActiveConversationIdState(null);
        setMessages([]);
        shouldAutoScrollRef.current = true;
      }
    } catch (err) {
      setHistoryError(
        err.message ||
          "Couldn't delete this conversation. Please try again.",
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
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [screen]);

  /* Career flow */

  async function findMatches(nextProfile) {
    setMatchBusy(true);
    setMatchError("");

    try {
      const result = await matchCareers(nextProfile);

      if (!Array.isArray(result?.recommendations)) {
        throw new Error(
          "The career service returned an unexpected response.",
        );
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
    shouldAutoScrollRef.current = true;

    addMessage(
      "assistant",
      isUpdate
        ? "Profile updated. Refreshing your matches."
        : "Profile saved. Finding career matches for you.",
    );

    await findMatches(nextProfile);
  }

  /* Chat flow */

  async function handleSend(rawText) {
    const message = rawText.trim();

    if (!message || chatBusy) return;

    shouldAutoScrollRef.current = true;
    addMessage("user", message);
    setChatBusy(true);

    try {
      const reply = await sendChatMessage(message, profile);

      addMessage("assistant", reply);
      setActiveConversationIdState(getActiveConversationId());
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

  async function handleMentorQuestion(question) {
    const reply = await sendChatMessage(question, profile);

    setActiveConversationIdState(getActiveConversationId());
    void refreshConversations();

    return reply;
  }

  /* Roadmaps */

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

  /* Workspace */

  const workspace = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <WorkspaceContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recommendations={recommendations}
        onSelect={handleRoadmap}
        roadmap={roadmap}
        roadmapBusy={roadmapBusy}
        roadmapError={roadmapError}
        missionContent={
          <MissionControl
            roadmap={roadmap}
            loading={roadmapBusy}
            error={roadmapError}
            recommendations={recommendations}
            onChooseCareer={handleRoadmap}
            onAskMentor={handleMentorQuestion}
          />
        }
      />
    </div>
  );

  /* Page */

  const page = (
    <main
      className={
        isChat
          ? "relative z-10 flex h-dvh min-h-0 w-full flex-col overflow-hidden text-zinc-100"
          : "relative z-10 min-h-screen w-full overflow-x-clip text-zinc-100"
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-48 left-[12%] h-[440px] w-[440px] rounded-full bg-indigo-600/[0.13] blur-[120px]" />
        <div className="absolute right-[-160px] top-[35%] h-[400px] w-[400px] rounded-full bg-violet-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-160px] left-[25%] h-[360px] w-[360px] rounded-full bg-blue-500/[0.07] blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,15,0.05),rgba(9,9,15,0.5))]" />
      </div>

      <div className={isChat ? "shrink-0" : ""}>
        <Navbar
          links={
            isChat
              ? [
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Career paths", href: "/careers" },
                ]
              : [
                  { label: "Explore", href: "/#explore" },
                  { label: "Career paths", href: "/careers" },
                ]
          }
          ctaLabel={isChat ? "Edit profile" : "Find my path"}
          ctaHref={isChat ? "/onboarding" : "/dashboard"}
          onNavigate={handleNavigate}
        />
      </div>

      {isChat && (
        <div className="z-20 flex h-12 shrink-0 items-center justify-end border-b border-white/[0.07] bg-[#0b0b13]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setHistoryOpen(true);
                void refreshConversations();
              }}
              className="h-8 gap-1.5 border-white/10 bg-white/[0.025] text-xs text-zinc-300 transition-colors hover:border-indigo-300/25 hover:bg-indigo-400/[0.08] hover:text-white"
            >
              <History size={14} />
              History
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
              className={`h-8 gap-1.5 border-white/10 bg-white/[0.025] text-xs transition-colors hover:border-indigo-300/25 hover:bg-indigo-400/[0.08] hover:text-white ${
                workspaceOpen
                  ? "border-indigo-300/25 bg-indigo-400/[0.08] text-indigo-100"
                  : "text-zinc-300"
              }`}
            >
              {workspaceOpen ? (
                <PanelRightClose size={14} />
              ) : (
                <PanelRight size={14} />
              )}
              <span className="hidden sm:inline">
                {workspaceOpen ? "Hide workspace" : "Workspace"}
              </span>
            </Button>
          </div>
        </div>
      )}

      {!isChat ? (
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:gap-14 xl:gap-20">
            <div className="relative lg:sticky lg:top-24">
              <SectionEyebrow>YOUR NEXT CHAPTER STARTS HERE</SectionEyebrow>

              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.7rem] xl:text-[4.15rem]">
                Your future,
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
                  without the guesswork.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
                Discover career paths that fit your interests, understand
                which skills to build, and turn your ambition into a
                realistic plan you can follow.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck size={13} />
                  </span>
                  Built around your profile
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-indigo-400/10 text-indigo-300">
                    <Sparkles size={13} />
                  </span>
                  AI-assisted guidance
                </span>
              </div>

              <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <FeatureItem
                  icon={Compass}
                  title="Find your direction"
                  description="Explore careers aligned with your interests and skills."
                />
                <FeatureItem
                  icon={Target}
                  title="Know your next step"
                  description="See the skills you already have and what to develop."
                />
                <FeatureItem
                  icon={BookOpen}
                  title="Build a learning plan"
                  description="Turn your goals and available time into a roadmap."
                />
                <FeatureItem
                  icon={MessageCircle}
                  title="Get ongoing guidance"
                  description="Ask questions as you explore and refine your path."
                />
              </div>

              <div className="mt-8 hidden max-w-xl items-center gap-3 border-t border-white/[0.08] pt-5 sm:flex">
                <div className="flex -space-x-2">
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#0a0c12] bg-indigo-400/20 text-indigo-200">
                    <Compass size={14} />
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#0a0c12] bg-violet-400/20 text-violet-200">
                    <Target size={14} />
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#0a0c12] bg-blue-400/20 text-blue-200">
                    <BookOpen size={14} />
                  </span>
                </div>
                <p className="text-xs leading-5 text-zinc-500">
                  Discover options. Compare your matches. Plan what comes next.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-indigo-300/80">
                    {profile ? "Your profile" : "Step 01"}
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {profile ? "Refine your profile" : "Let's find your path"}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                  <span className="size-1.5 rounded-full bg-indigo-300" />
                  <span className="text-[11px] text-zinc-400">
                    {profile ? "Editable anytime" : "Personalized to you"}
                  </span>
                </div>
              </div>

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-400/20 via-violet-400/[0.07] to-transparent blur-sm"
                />
                <div className="relative rounded-2xl border border-white/[0.10] bg-[#11111a]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
                  <div className="mb-5 flex items-start gap-3 border-b border-white/[0.07] pb-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-gradient-to-br from-indigo-400/15 to-violet-400/[0.06] text-indigo-200">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        A little about you
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Tell us what you're interested in and how much time
                        you can invest.
                      </p>
                    </div>
                  </div>

                  <ProfileForm
                    key={profile ? "edit" : "new"}
                    initialProfile={profile ?? DEFAULT_PROFILE}
                    submitting={matchBusy}
                    onSubmit={handleProfileSubmit}
                    onCancel={profile ? () => setScreen("chat") : undefined}
                  />

                  <div className="mt-5 flex items-start gap-2 border-t border-white/[0.07] pt-4">
                    <ShieldCheck
                      size={14}
                      className="mt-0.5 shrink-0 text-zinc-500"
                    />
                    <p className="text-[11px] leading-5 text-zinc-500">
                      Your answers help personalize recommendations. You can
                      update your profile whenever your goals change.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 sm:px-8">
              {/* Compact chat header */}
              <div className="shrink-0 py-3 sm:py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-gradient-to-br from-indigo-400/15 to-violet-400/[0.06] text-indigo-200">
                    <Sparkles size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-300/80">
                      YOUR CAREER COMPANION
                    </p>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      Let's figure out your next move.
                    </h1>
                  </div>
                </div>

                <p className="mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                  Explore your matches, ask for advice, or turn a career goal
                  into a practical learning plan.
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-400">
                    <Target size={12} className="text-indigo-300" />
                    Career matches
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-400">
                    <BookOpen size={12} className="text-violet-300" />
                    Learning roadmaps
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-400">
                    <MessageCircle size={12} className="text-blue-300" />
                    AI guidance
                  </span>
                </div>
              </div>

              {profile && (
                <div className="mb-2 max-h-24 shrink-0 overflow-y-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5 sm:p-3">
                  <ProfileSummary profile={profile} />
                </div>
              )}

              {/* Independent scrolling message area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-5 pr-2"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Chat messages"
                tabIndex={0}
              >
                {messages.length === 0 && (
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-300/[0.13] bg-gradient-to-br from-indigo-500/[0.09] via-[#14131f]/90 to-violet-500/[0.05] p-5 sm:p-7">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-indigo-500/[0.12] blur-3xl"
                    />
                    <div className="relative">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/[0.10] text-indigo-200">
                        <Sparkles size={19} />
                      </div>
                      <h2 className="text-lg font-medium tracking-tight text-white">
                        What would you like to work on?
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                        Start with a question about your career matches,
                        your skills, or the best next step for your goals.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {(matchBusy || chatBusy) && (
                  <div className="flex items-center gap-3 rounded-xl border border-indigo-300/[0.10] bg-indigo-400/[0.035] px-4 py-3 text-xs text-zinc-400">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-400/[0.10] text-indigo-200">
                      <LoaderCircle size={15} className="animate-spin" />
                    </span>
                    <span>
                      <span className="block font-medium text-zinc-200">
                        {matchBusy
                          ? "Finding your career matches"
                          : "Thinking it through"}
                      </span>
                      <span className="mt-0.5 block text-zinc-500">
                        {matchBusy
                          ? "Comparing your profile with career paths…"
                          : "Preparing a response for you…"}
                      </span>
                    </span>
                  </div>
                )}

                {matchError && (
                  <Alert className="border-rose-900/70 bg-rose-950/30">
                    <AlertDescription className="text-xs text-rose-200">
                      {matchError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Suggestions disappear once the first message is sent */}
              {messages.length === 0 && (
                <div className="shrink-0 pb-2 pt-2">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                    A few places to start
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CHAT_SUGGESTIONS.map((suggestion, index) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        onClick={() => handleSend(suggestion)}
                        disabled={chatBusy || matchBusy}
                        className={`group h-auto min-h-10 justify-between gap-3 whitespace-normal rounded-xl px-3.5 py-2.5 text-left text-xs font-normal leading-5 text-zinc-300 ${GLASS_INTERACTIVE}`}
                      >
                        <span>{suggestion}</span>
                        <ArrowUpRight
                          size={14}
                          className={`shrink-0 text-zinc-600 transition-colors group-hover:text-indigo-200 motion-reduce:transition-none ${
                            index === 2 ? "hidden sm:block" : ""
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input remains outside the message scroller */}
              <div className="shrink-0 bg-gradient-to-t from-[#0a0c12] via-[#0a0c12]/95 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                <ChatInput
                  onSend={handleSend}
                  disabled={chatBusy || matchBusy}
                />
                <p className="mt-1.5 text-center text-[10px] leading-4 text-zinc-600">
                  AI guidance can help you explore options. Career scores are
                  heuristic indicators, not employment predictions.
                </p>
              </div>
            </div>
          </section>

          {isDesktop && (
            <AnimatePresence initial={false}>
              {workspaceOpen && (
                <m.aside
                  key="workspace"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  style={{ width: `${workspaceWidth}px` }}
                  className="relative flex h-full min-h-0 shrink-0 flex-col border-l border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl"
                >
                  <div
                    role="separator"
                    aria-label="Resize chat and workspace panels"
                    aria-orientation="vertical"
                    aria-valuemin={MIN_WORKSPACE_WIDTH}
                    aria-valuemax={clampWorkspaceWidth(MAX_WORKSPACE_WIDTH)}
                    aria-valuenow={workspaceWidth}
                    aria-valuetext={`Workspace width ${workspaceWidth} pixels`}
                    tabIndex={0}
                    onPointerDown={handleWorkspaceResizeStart}
                    onKeyDown={handleWorkspaceResizeKeyDown}
                    title="Drag to resize. Use left and right arrow keys to adjust."
                    className={`group absolute -left-2 top-0 z-30 flex h-full w-4 touch-none cursor-col-resize items-center justify-center outline-none ${
                      isResizingWorkspace ? "bg-indigo-400/10" : ""
                    }`}
                  >
                    <span
                      className={`flex h-16 w-4 items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 text-zinc-500 shadow-lg transition-all group-hover:border-indigo-300/40 group-hover:text-indigo-200 group-focus-visible:border-indigo-300 group-focus-visible:text-indigo-200 ${
                        isResizingWorkspace
                          ? "border-indigo-300/50 text-indigo-200"
                          : ""
                      }`}
                    >
                      <GripVertical size={14} />
                    </span>
                  </div>

                  <div className="shrink-0 border-b border-white/[0.07] bg-white/[0.015] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/[0.08] text-indigo-200">
                        <Target size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100">
                          Your workspace
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Matches, insights and learning plan
                        </p>
                      </div>
                    </div>
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
            className="flex min-h-0 w-full flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c14] p-0 text-zinc-100 sm:max-w-md"
          >
            <SheetHeader className="shrink-0 border-b border-white/[0.07] p-4">
              <SheetTitle className="text-zinc-100">
                Your workspace
              </SheetTitle>
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
            className="flex min-h-0 w-full flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c14] p-0 text-zinc-100 sm:max-w-sm"
          >
            <SheetHeader className="shrink-0 border-b border-white/[0.07] p-4 text-left">
              <div className="mb-1 flex size-9 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/[0.08] text-indigo-200">
                <History size={17} />
              </div>
              <SheetTitle className="text-zinc-100">
                Chat history
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                Your saved PathFinder conversations
              </SheetDescription>
            </SheetHeader>

            <div className="shrink-0 border-b border-white/[0.07] p-4">
              <Button
                type="button"
                onClick={handleNewChat}
                className="h-10 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_5px_22px_rgba(99,102,241,0.16)] transition-all hover:from-indigo-400 hover:to-violet-400"
              >
                <Plus size={16} />
                New conversation
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
              {historyError && (
                <Alert className="border-rose-900/70 bg-rose-950/30">
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
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-500">
                      <History size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      No conversations yet
                    </p>
                    <p className="mx-auto mt-2 max-w-[230px] text-xs leading-5 text-zinc-500">
                      Your saved chats will appear here when you start
                      talking with PathFinder.
                    </p>
                  </div>
                )}

              {conversations.map((conversation) => {
                const isDeleting =
                  deletingConversationId === conversation.id;
                const isActive =
                  activeConversationId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`flex items-stretch gap-1 rounded-xl border p-2 transition-colors motion-reduce:transition-none ${
                      isActive
                        ? "border-indigo-400/30 bg-indigo-500/[0.09]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
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
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-indigo-400/[0.12] text-indigo-200"
                            : "bg-white/[0.04] text-zinc-500"
                        }`}
                      >
                        <History size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {conversation.title &&
                          conversation.title !== "New conversation"
                            ? conversation.title
                            : "Conversation"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {conversation.updated_at
                            ? new Date(
                                conversation.updated_at,
                              ).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
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
                      onClick={() =>
                        handleDeleteConversation(conversation)
                      }
                      className="h-9 w-9 shrink-0 self-center text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
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

            <div className="shrink-0 border-t border-white/[0.07] px-4 py-3">
              <p className="text-[11px] leading-5 text-zinc-600">
                Deleting a conversation permanently removes its saved
                messages.
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
          <DriftGrid className="h-dvh min-h-0 overflow-hidden bg-[#0a0c12] text-zinc-400">
            {page}
          </DriftGrid>
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
