export default function Chip({
  label,
  children,
  selected = false,
  onClick,
  className = "",
}) {
  const content = label ?? children;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`
        inline-flex items-center justify-center
        rounded-full border px-3 py-1.5 text-sm
        font-medium transition-all duration-200
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-cyan-400/60
        ${
          selected
            ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
            : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white"
        }
        ${className}
      `}
    >
      {content}
    </button>
  );
}
