export default function LeadActionSection({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-text-heading">{title}</div>
        {subtitle ? <div className="text-xs text-text-muted mt-1">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}
