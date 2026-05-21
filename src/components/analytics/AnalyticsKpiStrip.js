"use client";

function pct(rate) {
  const n = Number(rate || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

function titleCase(value) {
  return String(value || "bronze")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tierTone(value) {
  const tier = String(value || "").toLowerCase();
  if (tier.includes("gold")) return "border-amber-300/70 bg-gradient-to-br from-amber-50 via-yellow-50 to-white";
  if (tier.includes("silver")) return "border-slate-300/80 bg-gradient-to-br from-slate-50 via-white to-slate-100";
  if (tier.includes("platinum")) return "border-cyan-300/70 bg-gradient-to-br from-cyan-50 via-white to-indigo-50";
  return "border-orange-300/60 bg-gradient-to-br from-orange-50 via-amber-50 to-white";
}

function KpiCard({ label, value, isLoading = false, tone = "default" }) {
  const isTier = tone === "tier";
  const toneClass =
    tone === "strong"
      ? "border-primary/25 bg-primary/[0.06]"
      : isTier
        ? tierTone(value)
        : "border-border/70 bg-white";
  return (
    <div className={`relative overflow-hidden rounded-lg border px-3 py-2.5 shadow-sm ${toneClass}`}>
      {isTier ? <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/55" /> : null}
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-text-heading tabular-nums">{isLoading ? "..." : value}</p>
        </div>
        {isTier ? (
          <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            Tier
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HealthMetric({ label, value, helper, isLoading = false }) {
  return (
    <div className="rounded-md border border-border/70 bg-background-light/40 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 text-base font-bold text-text-heading tabular-nums">{isLoading ? "..." : value}</p>
      {helper ? <p className="mt-0.5 text-[10px] leading-snug text-text-muted">{helper}</p> : null}
    </div>
  );
}

export default function AnalyticsKpiStrip({
  performance,
  inviteMetrics,
  isPerformanceLoading = false,
  isInviteLoading = false,
}) {
  const perf = performance || {};
  const totals = inviteMetrics?.totals || {};
  const points = inviteMetrics?.points || {};

  const primaryCards = [
    { label: "Conversion rate", value: pct(perf.conversion_rate), loading: isPerformanceLoading, tone: "strong" },
    { label: "Closed deals", value: perf.closed_deals ?? 0, loading: isPerformanceLoading },
    { label: "Points", value: points.points_balance ?? 0, loading: isInviteLoading, tone: "strong" },
    { label: "Tier", value: titleCase(points.tier), loading: isInviteLoading, tone: "tier" },
  ];

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-text-heading">Key performance indicators</h2>
        <p className="text-xs text-text-muted">Your main performance and reward status at a glance.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {primaryCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            isLoading={card.loading}
            tone={card.tone}
          />
        ))}
      </div>
      <div className="rounded-lg border border-border/70 bg-white p-3 shadow-sm">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-text-heading">Referral health</h3>
          <p className="text-xs text-text-muted">
            Secondary referral and trust signals, separated from the main KPI strip.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <HealthMetric
            label="Invites"
            value={totals.invites_sent ?? 0}
            isLoading={isInviteLoading}
            helper="Invite links sent or created in this window."
          />
          <HealthMetric
            label="Completed"
            value={totals.completed ?? 0}
            isLoading={isInviteLoading}
            helper="Invite signups completed through your links."
          />
          <HealthMetric
            label="Collaboration"
            value={perf.collaboration_score != null ? `${perf.collaboration_score}/100` : "-"}
            isLoading={isPerformanceLoading}
            helper="Accepted or completed referrals divided by total referrals."
          />
          <HealthMetric
            label="Reputation"
            value={`${points.reputation_score ?? 50}/100`}
            isLoading={isInviteLoading}
            helper="Starts at 50 and changes with verified wins, referrals, and reviews."
          />
        </div>
      </div>
    </section>
  );
}
