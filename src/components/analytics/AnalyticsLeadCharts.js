"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

const PRIMARY = "#34C759";
const PRIMARY_DARK = "#2AA84A";
const MUTED = "#94a3b8";
const gridStroke = "#e2e8f0";

const FUNNEL_BAR_COLORS = {
  deals: "#e11d48",
  lead_created: "#059669",
  lead_updated: "#0284c7",
  appointment_booked: "#9333ea",
  appointment_canceled: "#d97706",
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-text-heading">{label}</p>
      <ul className="space-y-0.5 text-text-muted">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex justify-between gap-4">
            <span>{p.name}</span>
            <span className="font-mono font-medium text-text-heading">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatUsdCompact(n) {
  const value = Number(n);
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

export default function AnalyticsLeadCharts({
  funnel,
  summary,
  budgetTrend = [],
  isLoading = false,
  isError = false,
}) {
  const stages = Array.isArray(funnel?.stages) ? funnel.stages : [];
  const dealsClosedWon = summary?.totals?.leads_closed_won;
  const funnelBars = [
    ...(typeof dealsClosedWon === "number"
      ? [{ name: "Deals (closed won)", count: dealsClosedWon, segment: "deals" }]
      : []),
    ...stages.map((s) => ({
      name: String(s.label || "").replace(/^Lead /, "").replace(/^Appointment /, "Appt "),
      count: Number(s.count) || 0,
      segment: s.id,
    })),
  ];

  if (isError) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        Funnel and budget trend could not be loaded.
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-busy="true" aria-label="Loading lead charts">
        <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
          <div className="mb-2 h-4 w-24 animate-pulse rounded-md bg-primary/10" />
          <div className="h-[220px] animate-pulse rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02]" />
        </div>
        <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
          <div className="mb-2 h-4 w-28 animate-pulse rounded-md bg-primary/10" />
          <div className="h-[220px] animate-pulse rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02]" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text-heading">Funnel</h3>
        </div>
        <p className="mb-2 text-xs text-text-muted">Closed-won deals and lead activity stages in this window.</p>
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelBars} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                {funnelBars.map((row) => (
                  <Cell key={`${row.segment}-${row.name}`} fill={FUNNEL_BAR_COLORS[row.segment] || "#64748b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-text-heading">Budget trend</h3>
        <p className="mb-2 text-xs text-text-muted">Average budget signal per day from lead fields.</p>
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={budgetTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsBudgetFillAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUsdCompact(v)} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload[0]?.payload?.budget_avg;
                  return (
                    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold text-text-heading">{label}</p>
                      <p className="text-text-muted">
                        Avg budget: <span className="font-mono font-semibold text-text-heading">{formatUsdCompact(value)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="budget_avg"
                name="Avg budget"
                stroke={PRIMARY_DARK}
                strokeWidth={2}
                fill="url(#analyticsBudgetFillAvg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
