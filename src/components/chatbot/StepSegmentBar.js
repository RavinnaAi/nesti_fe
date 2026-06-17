"use client";

/**
 * Full-width segmented progress bar with role-aware accent colours.
 * @param {{ key: string, label: string }[]} steps
 * @param {number} activeIndex - 0-based; this segment is highlighted
 * @param {string} [activeBgClass]   - Tailwind bg class for the active segment (default: "bg-emerald-50")
 * @param {string} [activeTextClass] - Tailwind text class for the active segment (default: "text-emerald-800")
 */
export default function StepSegmentBar({
  steps,
  activeIndex,
  activeBgClass = "bg-emerald-50",
  activeTextClass = "text-emerald-800",
  borderClass = "border-slate-200",
  divideClass = "divide-slate-200",
}) {
  if (!steps?.length) return null;

  const n = steps.length;

  return (
    <div
      className={`grid w-full min-w-0 gap-0 rounded-lg border bg-white shadow-sm overflow-hidden divide-x ${borderClass} ${divideClass}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      role="navigation"
      aria-label="Progress"
    >
      {steps.map((s, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <div
            key={s.key}
            className={`min-h-[2.25rem] sm:min-h-[2.5rem] flex items-center justify-center px-1 py-1 sm:px-1.5 transition-colors ${
              active
                ? `${activeBgClass} ${activeTextClass}`
                : done
                  ? "bg-slate-100 text-slate-700"
                  : "bg-white text-slate-600"
            }`}
          >
            <span
              className={`block w-full min-w-0 text-center leading-snug break-words hyphens-auto ${
                active ? "font-bold" : done ? "font-semibold" : "font-medium"
              } text-[10px] sm:text-[11px]`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
