
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Map,
  Sparkles,
  Target,
} from "lucide-react";

import CareerCard from "../career/CareerCard";
import RoadmapView from "../roadmap/RoadmapView";
import { GLASS } from "../../constants/styles";

function WorkspaceEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-10 text-center">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-400/[0.08]">
        <Icon
          size={21}
          className="text-indigo-200"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-sm font-semibold text-zinc-100">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-xs leading-6 text-zinc-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-indigo-300/15 bg-indigo-400/[0.08] px-4 py-2.5 text-xs font-medium text-indigo-100 transition-colors hover:bg-indigo-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60 motion-reduce:transition-none"
        >
          {actionLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function WorkspaceContent({
  activeTab,
  setActiveTab,
  recommendations = [],
  onSelect,
  roadmap,
  roadmapBusy,
  roadmapError,
  matchBusy = false,
  missionContent,
}) {
  const hasRecommendations =
    Array.isArray(recommendations) &&
    recommendations.length > 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-0"
    >
      {/* Workspace header and navigation */}
      <div className="border-b border-white/[0.06] px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
              Your workspace
            </p>

            <h2 className="mt-1 text-sm font-semibold tracking-tight text-zinc-100">
              Career command center
            </h2>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <Compass
              size={17}
              className="text-indigo-200"
              aria-hidden="true"
            />
          </div>
        </div>

        <TabsList
          className={`grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1 ${GLASS}`}
        >
          <TabsTrigger
            value="mission"
            className="gap-1.5 rounded-lg py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-100 data-[state=active]:shadow-none motion-reduce:transition-none"
          >
            <Target size={13} aria-hidden="true" />
            Mission
          </TabsTrigger>

          <TabsTrigger
            value="careers"
            className="gap-1.5 rounded-lg py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-100 data-[state=active]:shadow-none motion-reduce:transition-none"
          >
            <BriefcaseBusiness size={13} aria-hidden="true" />
            Matches

            {hasRecommendations && (
              <span className="ml-0.5 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] tabular-nums">
                {recommendations.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="roadmap"
            className="gap-1.5 rounded-lg py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-100 data-[state=active]:shadow-none motion-reduce:transition-none"
          >
            <Map size={13} aria-hidden="true" />
            Roadmap
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Mission tab */}
      <TabsContent
        value="mission"
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 pt-4"
      >
        {missionContent || (
          <WorkspaceEmptyState
            icon={Sparkles}
            title="Your next mission starts here"
            description="Your career matches and learning roadmap will help you discover the next practical step toward your goal."
            actionLabel="Explore career matches"
            onAction={() => setActiveTab("careers")}
          />
        )}
      </TabsContent>

      {/* Career matches tab */}
      <TabsContent
        value="careers"
        className="min-h-0 flex-1 overflow-y-auto p-4 pt-4"
      >
        {hasRecommendations ? (
          <div className="space-y-4">
            {/* Matches overview */}
            <section className="relative overflow-hidden rounded-2xl border border-indigo-300/[0.13] bg-gradient-to-br from-indigo-400/[0.08] via-white/[0.025] to-violet-400/[0.04] p-4">
              <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-indigo-500/[0.08] blur-3xl" />

              <div className="relative flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/[0.09]">
                  <BriefcaseBusiness
                    size={18}
                    className="text-indigo-200"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Your career matches
                    </h3>

                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {recommendations.length}{" "}
                      {recommendations.length === 1
                        ? "path"
                        : "paths"}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                    Explore how your skills and interests align
                    with each path. Every missing skill is an
                    opportunity to learn.
                  </p>
                </div>
              </div>

              <div className="relative mt-3 flex items-start gap-2 border-t border-white/[0.06] pt-3">
                <CheckCircle2
                  size={13}
                  className="mt-0.5 shrink-0 text-emerald-300/80"
                  aria-hidden="true"
                />

                <p className="text-[10px] leading-5 text-zinc-500">
                  Match scores are heuristic indicators based
                  on your profile and career catalog—not
                  predictions of aptitude, employment, or
                  future success.
                </p>
              </div>
            </section>

            {/* Ranking labels */}
            <div className="flex items-center justify-between gap-3 px-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Ranked career paths
              </p>

              <p className="text-[10px] text-zinc-600">
                Highest match first
              </p>
            </div>

            {/* Career cards */}
            <div className="space-y-5">
              {recommendations.map((career, index) => {
                const careerKey =
                  career.career_id ||
                  career.id ||
                  career.title ||
                  `career-${index}`;

                const isTopMatch = index === 0;

                return (
                  <section
                    key={careerKey}
                    className={
                      isTopMatch
                        ? "relative rounded-2xl border border-indigo-300/25 bg-gradient-to-b from-indigo-400/[0.07] to-transparent p-1.5 shadow-[0_0_28px_rgba(99,102,241,0.06)]"
                        : "relative"
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={[
                            "flex size-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold tabular-nums",
                            isTopMatch
                              ? "border-indigo-300/25 bg-indigo-400/15 text-indigo-100"
                              : "border-white/[0.08] bg-white/[0.03] text-zinc-500",
                          ].join(" ")}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span
                          className={[
                            "truncate text-[10px] font-semibold uppercase tracking-[0.13em]",
                            isTopMatch
                              ? "text-indigo-200"
                              : "text-zinc-500",
                          ].join(" ")}
                        >
                          {isTopMatch
                            ? "Top profile match"
                            : `Career option ${index + 1}`}
                        </span>
                      </div>

                      {isTopMatch && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-300/20 bg-indigo-400/[0.09] px-2 py-1 text-[9px] font-medium text-indigo-100">
                          <Sparkles
                            size={10}
                            aria-hidden="true"
                          />
                          Best alignment
                        </span>
                      )}
                    </div>

                    <CareerCard
                      career={career}
                      onSelect={onSelect}
                    />
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <WorkspaceEmptyState
            icon={matchBusy ? Sparkles : BriefcaseBusiness}
            title={
              matchBusy
                ? "Finding your career matches..."
                : "Your matches are waiting"
            }
            description={
              matchBusy
                ? "Comparing your skills and interests with available career paths. Your results will appear here shortly."
                : "Complete your profile to discover career paths aligned with your skills and interests."
            }
            actionLabel={matchBusy ? undefined : "Back to mission"}
            onAction={
              matchBusy
                ? undefined
                : () => setActiveTab("mission")
            }
          />
        )}
      </TabsContent>

      {/* Roadmap tab */}
      <TabsContent
        value="roadmap"
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 pt-4"
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

export default WorkspaceContent;
