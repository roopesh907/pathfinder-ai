import { useEffect, useState } from "react";
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

const GLASS_INTERACTIVE = `${GLASS} transition-colors hover:border-white/20 hover:bg-white/[0.07]`;

const CHAT_SUGGESTIONS = [
  "Which match should I start with?",
  "How do I fit this into my weekly schedule?",
  "What should I learn first?",
];

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
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
      },
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

      // If the active conversation is deleted, start a clean chat.
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

    void loadHistory();

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

      // Refresh saved conversations after sending a message.
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
      missionContent={<MissionControl
      roadmap={roadmap}
      loading={roadmapBusy}
      error={roadmapError}
      recommendations={recommendations}
      onChooseCareer={handleRoadmap}
    />}
    />
  );

  /* --------------------------------- Page -------------------------------- */

  const page = (
    <main className="relative z-10 min-h-screen w-full text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(99,102,241,0.20),transparent),radial-gradient(45%_40%_at_90%_100%,rgba(56,189,248,0.12),transparent)]"
      />

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
                { label: "How it works", href: "/#how-it-works" },
              ]
        }
        ctaLabel={isChat ? "Edit profile" : "Find my path"}
        ctaHref={isChat ? "/onboarding" : "/dashboard"}
      />

      {isChat && (
        <div className="relative z-20 flex items-center justify-end gap-2 border-b border-white/[0.06] bg-zinc-950/60 px-4 py-2 sm:px-6">
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
