export default function LeadActionSection({
  title,
  subtitle,
  children,
  className = "",
  headerAction = null,
}) {
  return (
    <div className={`rounded-md border border-border bg-white shadow-sm p-4 space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text-heading">{title}</div>
          {subtitle ? <div className="text-xs text-text-muted mt-1">{subtitle}</div> : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </div>
  );
}
