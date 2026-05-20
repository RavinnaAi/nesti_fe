"use client";

function pct(rate) {
  const n = Number(rate || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

const TIER_LABELS = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  elite: "Elite",
};

export default function DashboardPerformanceCard({ performance, isLoading = false }) {
  const p = performance || {};
  const items = [
    { label: "Conversion rate", value: pct(p.conversion_rate) },
    { label: "Engagement quality", value: p.engagement_quality ?? "—" },
    { label: "Referral success", value: pct(p.referral_success_rate) },
    { label: "Closed deals", value: p.closed_deals ?? 0 },
    { label: "Collaboration", value: p.collaboration_score != null ? `${p.collaboration_score}/100` : "—" },
    { label: "Won in window", value: p.closed_deals_in_window ?? 0 },
  ];

  return (
    <section className="h-full rounded-xl border border-border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-text-heading">Professional performance</h3>
      <p className="mt-1 text-xs text-text-muted">Your outcomes and collaboration signals for this period.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border/70 bg-primary/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-text-heading tabular-nums">{isLoading ? "…" : item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function tierBadgeLabel(tier) {
  return TIER_LABELS[String(tier || "bronze").toLowerCase()] || "Bronze";
}
