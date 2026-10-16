
const GLASS =
  "border border-white/10 bg-white/[0.03] backdrop-blur-xl";

function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-white/[0.08] ${className}`}
    />
  );
}

export default function RoadmapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Generating your learning roadmap"
      className="space-y-6"
    >
      <span className="sr-only">
        Generating your learning roadmap. Please wait.
      </span>

      {/* Roadmap overview */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/[0.14] via-violet-500/[0.06] to-transparent p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-indigo-400/[0.08] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="size-8 rounded-lg" />
            <SkeletonBlock className="h-3 w-36" />
          </div>

          <SkeletonBlock className="mt-5 h-7 w-3/4 max-w-64" />
          <SkeletonBlock className="mt-3 h-3 w-full" />
          <SkeletonBlock className="mt-2 h-3 w-4/5" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="mt-3 h-6 w-20" />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="mt-3 h-6 w-16" />
            </div>
          </div>

          <SkeletonBlock className="mt-3 h-9 w-full rounded-lg" />
        </div>
      </section>

      {/* Skills section */}
      <section className={`rounded-xl p-4 ${GLASS}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="mt-2 h-3 w-44" />
          </div>

          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock
              key={index}
              className={`h-7 rounded-full ${
                index % 2 === 0 ? "w-20" : "w-24"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Journey heading */}
      <section>
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="mt-2 h-5 w-52 max-w-full" />
        <SkeletonBlock className="mt-2 h-3 w-full" />
        <SkeletonBlock className="mt-2 h-3 w-4/5" />

        {/* Learning phases */}
        <ol className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li
              key={index}
              className="relative"
            >
              {index < 2 && (
                <div
                  aria-hidden="true"
                  className="absolute bottom-[-13px] left-[19px] top-12 w-px bg-white/[0.08]"
                />
              )}

              <article className={`rounded-2xl p-4 ${GLASS}`}>
                <div className="flex items-start gap-3">
                  <SkeletonBlock className="size-10 shrink-0 rounded-xl" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <SkeletonBlock className="h-3 w-16" />
                      <SkeletonBlock className="h-5 w-16 rounded-full" />
                    </div>

                    <SkeletonBlock className="mt-3 h-4 w-3/4" />
                    <SkeletonBlock className="mt-3 h-3 w-full" />
                    <SkeletonBlock className="mt-2 h-3 w-5/6" />

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <SkeletonBlock className="h-6 w-16 rounded-full" />
                      <SkeletonBlock className="h-6 w-20 rounded-full" />
                      <SkeletonBlock className="h-6 w-14 rounded-full" />
                    </div>

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3">
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="mt-2 h-3 w-full" />
                      <SkeletonBlock className="mt-2 h-3 w-4/5" />
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
