
import { m } from "motion/react";

// A slowly drifting dot grid. Animation uses transforms only.
export default function DriftGrid({ children, className = "" }) {
  return (
    <div
      className={`relative isolate h-dvh min-h-0 overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <m.div
          animate={{ x: [0, 32], y: [0, 32] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -inset-8 will-change-transform"
          style={{
            backgroundImage:
              "radial-gradient(rgba(148,163,184,0.22) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 100%)",
          }}
        />
      </div>

      {children}
    </div>
  );
}
