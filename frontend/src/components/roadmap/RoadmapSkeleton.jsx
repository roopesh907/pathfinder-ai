
const GLASS =
  "border border-white/10 bg-white/[0.03] backdrop-blur-xl";

export default function RoadmapSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Roadmap overview */}
      <section className="rounded-2xl border border-indigo-300/20 bg-indigo-500/[0.08] p-5">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="mt-5 h-7 w-2/3 rounded bg-white/10" />
        <div className="mt-3 h-3 w-full rounded bg-white/10" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-3 h-6 w-20 rounded bg-white/10" />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="mt-3 h-6 w-16 rounded bg-white/10" />
          </div>
        </div>
      </section>

      {/* Skills section */}
      <section className={`rounded-xl p-4 ${GLASS}`}>
        <div className="h-4 w-36 rounded bg-white/10" />

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-7 w-20 rounded-full bg-white/10"
            />
          ))}
        </div>
      </section>

      {/* Learning phases */}
      <section className="space-y-3">
        <div className="mb-4 h-5 w-48 rounded bg-white/10" />

        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`rounded-2xl p-4 ${GLASS}`}
          >
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />

              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/[0.06]" />
                <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
