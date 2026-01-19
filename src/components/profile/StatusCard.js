"use client";

const ringStyles = (percent, color) => ({
  backgroundImage: `conic-gradient(${color} ${percent}%, #e5e7eb ${percent}% 100%)`,
});

export default function StatusCard({
  title,
  value,
  percent,
  accent,
  subtitle,
}) {
  return (
    <div className="rounded-2xl border border-border bg-primary-dark/20 text-white p-4 flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full grid place-items-center text-xs font-semibold text-text-heading"
        style={ringStyles(percent, accent)}
      >
        <div className="w-12 h-12 rounded-full bg-white grid place-items-center text-sm font-bold text-text-heading shadow-inner">
          {Math.round(percent)}%
        </div>
      </div>
      <div>
        <p className="text-sm text-text-heading font-semibold">{title}</p>
        <p className="text-lg font-bold text-text-heading font-semibold">
          {value}
        </p>
        {subtitle ? (
          <p className="text-xs text-text-muted">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
