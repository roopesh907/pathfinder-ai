export function OptionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
        active
          ? "border-indigo-300/50 bg-indigo-500/15 text-zinc-100"
          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-indigo-300" : "border-zinc-600"
        }`}
      >
        {active && <span className="h-2 w-2 rounded-full bg-indigo-300" />}
      </span>
      {children}
    </button>
  );
}