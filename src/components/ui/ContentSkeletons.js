"use client";

/** Theme-aligned pulse blocks (primary green tint, matches dashboard cards). */
export function SkeletonBlock({ className = "" }) {
  return <div className={`rounded-md bg-primary/10 animate-pulse ${className}`} />;
}

export function LeadsPageTableSkeleton({
  rows = 12,
  showPropertyMatchesColumn = true,
  showAgentLeadColumns = true,
  showMortgageLeadColumns = false,
}) {
  const headers = [
    ...(showAgentLeadColumns || showMortgageLeadColumns
      ? [showMortgageLeadColumns && !showAgentLeadColumns ? "Timeline" : "Type"]
      : []),
    "Name",
    "Email",
    "Status",
    "Consult",
    ...(showAgentLeadColumns ? ["Intent"] : []),
    "Location",
    ...(showPropertyMatchesColumn ? ["Matches"] : []),
    "Score",
    "Grade",
  ];
  const minClass = (() => {
    if (showAgentLeadColumns && showPropertyMatchesColumn) return "min-w-[1060px]";
    if (showAgentLeadColumns && !showPropertyMatchesColumn) return "min-w-[980px]";
    if (showMortgageLeadColumns && showPropertyMatchesColumn) return "min-w-[980px]";
    if (showMortgageLeadColumns && !showPropertyMatchesColumn) return "min-w-[900px]";
    if (!showAgentLeadColumns && showPropertyMatchesColumn) return "min-w-[940px]";
    return "min-w-[860px]";
  })();
  return (
    <div className="overflow-x-auto" aria-hidden>
      <table className={`w-full table-auto ${minClass}`}>
        <thead className="bg-primary/[0.04] border-b border-border">
          <tr className="text-left text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/70">
              {showAgentLeadColumns || showMortgageLeadColumns ? (
                <td className="px-3 py-2.5">
                  <SkeletonBlock className="h-3.5 w-32 max-w-full" />
                </td>
              ) : null}
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-28 max-w-full" />
              </td>
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-40 max-w-full" />
              </td>
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-20" />
              </td>
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-16" />
              </td>
              {showAgentLeadColumns ? (
                <td className="px-3 py-2.5">
                  <SkeletonBlock className="h-3.5 w-14" />
                </td>
              ) : null}
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-28" />
              </td>
              {showPropertyMatchesColumn ? (
                <td className="px-3 py-2.5">
                  <SkeletonBlock className="h-3.5 w-8" />
                </td>
              ) : null}
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-8" />
              </td>
              <td className="px-3 py-2.5">
                <SkeletonBlock className="h-3.5 w-12" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReferralsTableSkeleton({ rows = 10, showConsultColumn = true }) {
  const headers = [
    "Lead",
    "Lead type",
    "Details",
    "Lead category",
    "Status",
    ...(showConsultColumn ? ["Consult"] : []),
    "Referred by",
    "Referrer role",
  ];
  return (
    <div className="overflow-x-auto" aria-hidden>
      <table className="w-full max-w-full table-auto border-collapse text-left text-[11px] leading-tight">
        <thead className="border-b border-border bg-primary/[0.04]">
          <tr className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-2 py-1.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-text-body">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <SkeletonBlock className="h-3 w-3 rounded-full" />
                  <SkeletonBlock className="h-3.5 w-24 max-w-full" />
                </div>
              </td>
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-20" />
              </td>
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-24" />
              </td>
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-16" />
              </td>
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-14" />
              </td>
              {showConsultColumn ? (
                <td className="px-2 py-1.5">
                  <SkeletonBlock className="h-3.5 w-14" />
                </td>
              ) : null}
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-20" />
              </td>
              <td className="px-2 py-1.5">
                <SkeletonBlock className="h-3.5 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadDetailPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading lead workspace">
      <div className="rounded-xl border border-border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-24 rounded-md" />
          ))}
          <div className="ml-auto">
            <SkeletonBlock className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-7 w-28 rounded-md" />
          <SkeletonBlock className="h-7 w-32 rounded-md" />
        </div>

        <div className="rounded-md border border-border bg-white p-4 space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBlock key={`u-${i}`} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-9 w-56 rounded-lg" />
          </div>
          <SkeletonBlock className="h-3.5 w-4/5" />
        </div>

        <div className="rounded-md border border-border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonBlock key={`c-${i}`} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const thClients =
  "whitespace-nowrap px-1.5 py-1.5 text-left text-[10px] font-semibold capitalize tracking-wide text-text-muted sm:text-[11px]";
const tdClients = "px-1.5 py-1 align-middle";

/** Clients list table — matches `/clients` columns. */
export function ClientsTableSkeleton({ rows = 10, showMortgageColumn = true }) {
  const headers = showMortgageColumn
    ? ["Client", "Email", "Phone", "Address", "Timeline", "Mortgage", "Budget", "Appointment", "Leads"]
    : ["Client", "Email", "Phone", "Address", "Timeline", "Budget", "Appointment", "Leads"];
  const w = showMortgageColumn
    ? ["w-28", "w-24", "w-16", "w-20", "w-14", "w-16", "w-14", "w-14", "w-8"]
    : ["w-28", "w-24", "w-16", "w-20", "w-14", "w-14", "w-14", "w-8"];
  return (
    <div className="overflow-x-auto" aria-hidden>
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {headers.map((h) => (
              <th key={h} className={thClients}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td className={tdClients}>
                <div className="flex min-w-[108px] items-center gap-2">
                  <SkeletonBlock className="h-8 w-8 shrink-0 rounded-md" />
                  <SkeletonBlock className="h-3.5 w-24 max-w-[140px]" />
                </div>
              </td>
              {w.slice(1).map((cls, i) => (
                <td key={`${r}-${i}`} className={tdClients}>
                  <SkeletonBlock className={`h-3.5 ${cls}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Client profile header + detail grid (loading). */
export function ClientProfileCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-4" aria-hidden>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <SkeletonBlock className="mt-0.5 h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0 space-y-2">
            <SkeletonBlock className="h-5 w-40 max-w-full" />
            <SkeletonBlock className="h-3 w-56 max-w-full" />
            <SkeletonBlock className="h-3 w-32 max-w-full" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <SkeletonBlock className="ml-auto h-3 w-12" />
          <SkeletonBlock className="ml-auto h-6 w-20" />
        </div>
      </div>
      <div className="mt-3 border-t border-border/70 pt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            {Array.from({ length: 4 }).map((__, j) => (
              <SkeletonBlock key={j} className="h-3 flex-1 max-w-[120px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Leads-for-profile sub-table. */
export function ProfileLeadsTableSkeleton({ rows = 6, variant = "agent" }) {
  const headers =
    variant === "mortgage_broker"
      ? [
          "Location",
          "Timeline",
          "Budget",
          "Pre-approval",
          "Credit",
          "Grade",
          "Score",
          "Preferred",
          "Best time",
          "Appointment",
          "Open",
        ]
      : variant === "lawyer"
        ? [
            "Stage",
            "Transaction",
            "Location",
            "Closing",
            "Value",
            "Grade",
            "Score",
            "Preferred",
            "Best time",
            "Appointment",
            "Open",
          ]
        : [
            "Intent",
            "Type",
            "Location",
            "Timeline",
            "Budget",
            "Grade",
            "Score",
            "Preferred",
            "Best time",
            "Appointment",
            "Open",
          ];
  return (
    <div className="overflow-x-auto px-1" aria-hidden>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] font-semibold capitalize tracking-wide text-text-muted">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: headers.length }).map((__, c) => (
                <td key={c} className="px-2 py-2">
                  <SkeletonBlock className="h-3 w-full max-w-[72px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NurtureLogsListSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border/70 bg-white px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-full max-w-md" />
              <div className="flex flex-wrap gap-2">
                <SkeletonBlock className="h-3 w-40" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            </div>
            <SkeletonBlock className="h-5 w-12 shrink-0 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsListSkeleton({ rows = 6 }) {
  return (
    <ul className="divide-y divide-border/70" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <SkeletonBlock className="h-4 w-48 max-w-[70%]" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <SkeletonBlock className="mt-2 h-3 w-full max-w-xl" />
          <SkeletonBlock className="mt-1.5 h-3 w-full max-w-lg" />
        </li>
      ))}
    </ul>
  );
}

export function ChatbotEmbedPageSkeleton() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4"
      aria-busy="true"
      aria-label="Loading chatbot"
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <SkeletonBlock className="h-14 w-14 rounded-2xl" />
        </div>
        <SkeletonBlock className="mx-auto h-4 w-48" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="mx-auto h-3 w-[85%] max-w-xs" />
        <p className="text-center text-sm text-text-muted">Loading your chatbot…</p>
      </div>
    </div>
  );
}

export function AnalyticsSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border bg-white p-4 shadow-sm">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsFunnelBlockSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <SkeletonBlock className="h-32 w-full rounded-xl" />
        </div>
        <SkeletonBlock className="min-h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Public profile page — matches hero + Contact + Business sections. */
export function ProfilePageContentSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-2" aria-hidden>
      {/* Hero — cover strip + white footer (matches Dashboard / Personal info) */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <SkeletonBlock className="h-28 w-full rounded-none sm:h-32 md:h-36" />
        <div className="flex items-end gap-4 px-5 pb-5 sm:px-7 sm:pb-6">
          <SkeletonBlock className="-mt-8 h-[5rem] w-[5rem] shrink-0 rounded-xl border-2 border-white sm:-mt-10 sm:h-[6rem] sm:w-[6rem] sm:rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2 pb-0.5">
            <SkeletonBlock className="h-5 w-44 max-w-full" />
            <SkeletonBlock className="h-3.5 w-full max-w-md" />
          </div>
        </div>
      </div>

      {/* Contact card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[2, 2, 1, 1, 2, 2].map((span, i) => (
            <SkeletonBlock
              key={i}
              className={`h-[3.25rem] rounded-xl ${span === 2 ? "col-span-2" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Business card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-3 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[3.25rem] rounded-xl" />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-6 w-20 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
