export default function OptionButton({
  selected = false,
  label,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`
        flex w-full min-w-0 items-center gap-3
        rounded-xl border px-3 py-3 text-left text-sm
        font-medium transition-colors duration-200
        ${
          selected
            ? "border-indigo-300/60 bg-indigo-500/20 text-white"
            : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-indigo-300/40 hover:bg-white/[0.07] hover:text-white"
        }
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          flex h-4 w-4 shrink-0 items-center justify-center
          rounded-full border
          ${selected ? "border-indigo-300" : "border-zinc-500"}
        `}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-indigo-300" />
        )}
      </span>

      <span className="min-w-0 break-words">{label}</span>
    </button>
  );
}
