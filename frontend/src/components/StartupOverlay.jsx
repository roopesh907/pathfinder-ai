import {
  AlertCircle,
  ArrowRight,
  Compass,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { m } from "motion/react";
import { Button } from "@/components/ui/button";

function StartupOverlay({ state, elapsedSeconds, onRetry, onContinue }) {
  const isReady = state === "ready";
  const isFailed = state === "failed";
  const statusMessage = isReady
    ? "You're all set. Let's find your path."
    : elapsedSeconds >= 25
      ? "Establishing a secure connection..."
      : elapsedSeconds >= 4
        ? "Waking up your AI career guide..."
        : "Connecting to PathFinder AI...";

  return (
    <m.div
      className="startup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="startup-title"
      aria-describedby="startup-description"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="startup-content">
        <div className="startup-brand" aria-label="PathFinder AI">
          <span className="startup-brand-mark">
            <Compass size={17} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>
            PathFinder <strong>AI</strong>
          </span>
        </div>

        <div className="startup-orbit" aria-hidden="true">
          <span className="startup-orbit-ring" />
          <span className="startup-orbit-glow" />
          <span className="startup-orbit-icon">
            {isFailed ? (
              <AlertCircle size={24} strokeWidth={1.6} />
            ) : isReady ? (
              <Sparkles size={24} strokeWidth={1.6} />
            ) : (
              <Compass size={25} strokeWidth={1.5} />
            )}
          </span>
          {!isFailed && !isReady && (
            <span className="startup-orbit-spark">
              <Sparkles size={12} />
            </span>
          )}
        </div>

        <h1
          id="startup-title"
          className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]"
        >
          Preparing your journey
        </h1>
        <p
          id="startup-description"
          className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-300/75"
        >
          We're bringing your AI career guide online. This may take a moment.
        </p>

        {isFailed ? (
          <div className="startup-failure" role="alert">
            <h2 className="text-sm font-semibold text-white">
              We're having trouble connecting.
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-300/70">
              The server may still be starting up or temporarily unavailable.
              You can retry the connection or continue into the app.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={onRetry}
                className="gap-2 bg-indigo-400 text-slate-950 hover:bg-indigo-300 focus-visible:ring-indigo-200"
              >
                <RotateCw size={15} aria-hidden="true" />
                Retry connection
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onContinue}
                className="gap-2 border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white"
              >
                Continue to app
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            {!isReady && (
              <div
                className="startup-progress"
                role="progressbar"
                aria-label="Connecting to the backend"
                aria-valuemin={0}
                aria-valuemax={100}
              />
            )}
            <p
              className="mt-4 min-h-5 text-xs font-medium tracking-wide text-indigo-100/75"
              aria-live="polite"
              aria-atomic="true"
            >
              {statusMessage}
            </p>
          </div>
        )}
      </div>
    </m.div>
  );
}

export default StartupOverlay;
