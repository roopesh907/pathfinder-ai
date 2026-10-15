import { useRef } from "react";
import { m } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

// Slow-moving colour glow behind the page. Transform-only, no blur filter.
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <m.div
        animate={{ x: [0, 80, -40, 0], y: [0, 60, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.22), transparent)",
        }}
        className="absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full will-change-transform"
      />
      <m.div
        animate={{ x: [0, -60, 30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(closest-side, rgba(45,212,191,0.16), transparent)",
        }}
        className="absolute -right-40 top-1/4 h-[36rem] w-[36rem] rounded-full will-change-transform"
      />
      <m.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(closest-side, rgba(244,114,182,0.12), transparent)",
        }}
        className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full will-change-transform"
      />
    </div>
  );
}

// Spotlight that follows the cursor. Sets CSS variables directly,
// so pointer movement causes no React re-renders.
export function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null);

  function handlePointerMove(event) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={`group relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), rgba(167,139,250,0.14), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Bar that fills from left to right on mount.
export function AnimatedBar({ value, className = "" }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <m.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{ transformOrigin: "left" }}
        className="h-full w-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300"
      />
    </div>
  );
}

// Fades and lifts its children into place once.
export function Reveal({ children, delay = 0, className = "" }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className={className}
    >
      {children}
    </m.div>
  );
}