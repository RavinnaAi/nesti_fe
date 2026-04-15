"use client";

/**
 * Full-width segmented progress bar: equal columns; active step uses theme `primary` (not hardcoded blue).
 * @param {{ key: string, label: string }[]} steps
 * @param {number} activeIndex - 0-based; this segment is highlighted
 */
export default function StepSegmentBar({ steps, activeIndex }) {
  if (!steps?.length) return null;

  const n = steps.length;

  return (
    <div
      className="grid w-full gap-0 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden divide-x divide-slate-200"
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
                ? "bg-primary/15 text-primary"
                : done
                  ? "bg-background-light text-text-heading/80"
                  : "bg-white text-text-muted"
            }`}
          >
            <span
              className={`block w-full text-center leading-snug ${
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
