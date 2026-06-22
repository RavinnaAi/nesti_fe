"use client";

import { Gift, Link2, TrendingDown, Users } from "lucide-react";

function MetricCard({ icon: Icon, label, value, accent = "slate", isLoading }) {
  const accents = {
    slate: "bg-slate-100 text-slate-600",
    primary: "bg-primary/10 text-primary-dark",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  const iconCls = accents[accent] || accents.slate;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconCls}`}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight text-text-heading">
          {isLoading ? "…" : value}
        </p>
      </div>
    </div>
  );
}

export default function NetworkCircleMetricsRow({ networkCircle, isLoading = false }) {
  const nc = networkCircle || {};
  const points = Number(nc.points_balance ?? 0).toLocaleString();
  const creditCents = Number(nc.pending_credit_cents ?? 0);
  const creditDisplay = creditCents > 0
    ? `-$${(creditCents / 100).toFixed(2)}`
    : "$0.00";

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Network Circle</h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          icon={Link2}
          label="Sent"
          value={Number(nc.referrals_sent_paid ?? 0).toLocaleString()}
          accent="primary"
          isLoading={isLoading}
        />
        <MetricCard
          icon={Users}
          label="Received"
          value={Number(nc.referrals_received ?? 0).toLocaleString()}
          accent="slate"
          isLoading={isLoading}
        />
        <MetricCard
          icon={Gift}
          label="Rewards"
          value={`${points} pts`}
          accent="amber"
          isLoading={isLoading}
        />
        <MetricCard
          icon={TrendingDown}
          label="Discount"
          value={creditDisplay}
          accent="emerald"
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
