"use client";

import { MessageSquare, Users, TrendingUp, DollarSign } from "lucide-react";

function pct(rate) {
  const n = Number(rate || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

function formatUsd(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const TONES = {
  default: {
    card: "border-slate-200/80 bg-white",
    icon: "bg-slate-100 text-slate-600",
  },
  strong: {
    card: "border-primary/20 bg-gradient-to-br from-primary/[0.03] to-white",
    icon: "bg-primary/10 text-primary-dark",
  },
  rate: {
    card: "border-sky-200/60 bg-gradient-to-br from-sky-50/40 to-white",
    icon: "bg-sky-100 text-sky-600",
  },
  money: {
    card: "border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-white",
    icon: "bg-emerald-100 text-emerald-600",
  },
};

function HeroCard({ icon: Icon, label, value, sub, tone = "default", isLoading = false }) {
  const t = TONES[tone] || TONES.default;
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${t.card}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-text-heading">
            {isLoading ? "…" : value}
          </p>
          {sub && !isLoading && (
            <p className="mt-1.5 text-[10px] leading-tight text-slate-500">{sub}</p>
          )}
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.icon}`}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsHeroKpiRow({
  summary,
  performance,
  pipelineValue,
  isLoading = false,
}) {
  const totals = summary?.totals || {};
  const conversations = totals.ai_conversations ?? totals.events ?? 0;
  const leads = totals.leads_created ?? 0;
  const conversionRate = performance?.conversion_rate ?? summary?.conversion_rates?.closed_won_from_created ?? 0;
  const pipeline = pipelineValue || {};
  const estimated = pipeline.estimated_pipeline_value ?? 0;
  const hotLeads = pipeline.hot_leads ?? 0;
  const withBudget = pipeline.hot_leads_with_budget ?? 0;
  const pipelineSub = hotLeads > 0
    ? `${hotLeads} hot lead${hotLeads !== 1 ? "s" : ""}${withBudget > 0 ? ` · ${withBudget} with budget` : ""}`
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <HeroCard
        icon={MessageSquare}
        label="AI conversations"
        value={Number(conversations).toLocaleString()}
        isLoading={isLoading}
      />
      <HeroCard
        icon={Users}
        label="Captured leads"
        value={Number(leads).toLocaleString()}
        tone="strong"
        isLoading={isLoading}
      />
      <HeroCard
        icon={TrendingUp}
        label="Conversion rate"
        value={pct(conversionRate)}
        tone="rate"
        isLoading={isLoading}
      />
      <HeroCard
        icon={DollarSign}
        label="Pipeline value"
        value={formatUsd(estimated)}
        sub={pipelineSub}
        tone="money"
        isLoading={isLoading}
      />
    </div>
  );
}
