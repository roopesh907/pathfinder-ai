import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CareerCard from "../career/CareerCard";
import RoadmapView from "../roadmap/RoadmapView";
import { GLASS } from "../../constants/styles";

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
export default WorkspaceContent