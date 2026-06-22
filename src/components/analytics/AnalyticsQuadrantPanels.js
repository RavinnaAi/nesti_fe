"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock3, Globe2, PieChart as PieChartIcon } from "lucide-react";

const PRIMARY = "#34C759";
const MUTED = "#94a3b8";
const INTENT_COLORS = ["#34C759", "#2563eb", "#f59e0b", "#8b5cf6", "#64748b"];

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

function PanelShell({ title, icon: Icon, children, isLoading, isError, errorMessage }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        {Icon ? (
          <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
            <Icon size={12} strokeWidth={2.5} />
          </span>
        ) : null}
        <h3 className="text-xs font-semibold text-text-heading">{title}</h3>
      </div>
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        </div>
      ) : isError ? (
        <div className="flex h-[200px] items-center justify-center px-4 text-center text-[11px] text-amber-700">
          {errorMessage || "Could not load this section."}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function aggregateIntentFromTrend(intentTrend = []) {
  if (!Array.isArray(intentTrend) || intentTrend.length === 0) {
    return [
      { name: "Buyers", value: 0, color: INTENT_COLORS[0] },
      { name: "Sellers", value: 0, color: INTENT_COLORS[1] },
      { name: "General", value: 0, color: INTENT_COLORS[2] },
    ];
  }

  const sample = intentTrend[0] || {};
  const isDailyTrend =
    typeof sample.buyers === "number" ||
    typeof sample.sellers === "number" ||
    typeof sample.purchase_side === "number" ||
    typeof sample.sale_side === "number";

  if (isDailyTrend) {
    let buyers = 0;
    let sellers = 0;
    for (const row of intentTrend) {
      buyers += Number(row.buyers || row.purchase_side || 0);
      sellers += Number(row.sellers || row.sale_side || 0);
    }
    return [
      { name: "Buyers", value: buyers, color: INTENT_COLORS[0] },
      { name: "Sellers", value: sellers, color: INTENT_COLORS[1] },
    ];
  }

  return intentTrend.map((row, idx) => ({
    name: String(row.label || row.intent || row.name || "Other").replace(/_/g, " "),
    value: Number(row.count ?? row.total ?? row.value ?? 0),
    color: INTENT_COLORS[idx % INTENT_COLORS.length],
  }));
}

function IntentTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const total = Number(payload[0]?.payload?.total || 0);
  const value = Number(row.value || 0);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-md border border-border/80 bg-white/95 px-3 py-1.5 text-xs shadow-md backdrop-blur-sm">
      <span className="font-semibold text-text-heading">{row.name}</span>
      <span className="ml-2 tabular-nums text-text-muted">{value} · {pct}%</span>
    </div>
  );
}

function IntentLegend({ slices }) {
  const total = slices.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-xs font-medium text-text-heading">No data</p>
        <p className="mt-0.5 text-[10px] text-text-muted">Intent data appears with leads.</p>
      </div>
    );
  }

  const activeSlices = slices.filter((row) => row.value > 0);

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {activeSlices.map((row) => {
        const pct = Math.round((row.value / total) * 100);
        return (
          <div key={row.name} className="group">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-[11px] font-medium text-text-body">{row.name}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tabular-nums text-text-heading">{row.value}</span>
                <span className="text-[10px] tabular-nums text-text-muted">{pct}%</span>
              </div>
            </div>
            <div className="ml-4 mt-1.5 h-[3px] overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildIntentPie(intent = []) {
  return aggregateIntentFromTrend(intent);
}

function buildTrafficBars(trafficSources = {}) {
  const src = trafficSources || {};
  return [
    { name: "Direct", value: Number(src.direct || 0), color: "#2563eb" },
    { name: "Referral", value: Number(src.referral || 0), color: "#7c3aed" },
    { name: "Social", value: Number(src.social || 0), color: "#db2777" },
    { name: "Search", value: Number(src.search || 0), color: PRIMARY },
    { name: "Other", value: Number(src.other || 0), color: "#64748b" },
  ];
}

function buildPeakHours(series = []) {
  if (!Array.isArray(series) || series.length === 0) return [];
  return series.map((row) => ({
    label: row.label || row.date,
    leads: Number(row.lead_created || 0) + Number(row.appointment_booked || 0),
  }));
}

export default function AnalyticsQuadrantPanels({
  funnel,
  summary,
  intentTrend = [],
  intentError = false,
  trafficSources = {},
  trafficLoading = false,
  trafficError = false,
  trafficUnavailable = false,
  timeseries = [],
  isLoading = false,
}) {
  const stages = Array.isArray(funnel?.stages) ? funnel.stages : [];
  const dealsClosedWon = summary?.totals?.leads_closed_won;
  const funnelBars = [
    ...(typeof dealsClosedWon === "number"
      ? [{ name: "Deals (closed won)", count: dealsClosedWon }]
      : []),
    ...stages.map((s) => ({
      name: String(s.label || "").replace(/^Lead /, "").replace(/^Appointment /, "Appt "),
      count: Number(s.count) || 0,
    })),
  ];

  const intentPie = buildIntentPie(intentTrend);
  const intentTotal = intentPie.reduce((sum, row) => sum + row.value, 0);
  const intentSlices = intentPie
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, total: intentTotal }));
  const trafficBars = buildTrafficBars(trafficSources);
  const visibleTrafficBars = trafficBars.filter((row) => row.value > 0);
  const trafficTotal = trafficBars.reduce((sum, row) => sum + row.value, 0);
  const trafficMax = Math.max(...visibleTrafficBars.map((row) => row.value), 1);
  const peakData = buildPeakHours(timeseries);
  const peakTotal = peakData.reduce((sum, row) => sum + row.leads, 0);
  const funnelTotal = funnelBars.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Performance</h2>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <PanelShell
          title="Funnel"
          icon={BarChart3}
          isLoading={isLoading}
          isError={false}
        >
          {funnelTotal <= 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background-light/30 px-6 text-center">
              <p className="text-sm font-semibold text-text-heading">No funnel activity</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-text-muted">
                Stages populate as leads move through your pipeline.
              </p>
            </div>
          ) : (
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelBars} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Count" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelShell>

        <PanelShell
          title="Lead intent"
          icon={PieChartIcon}
          isLoading={isLoading}
          isError={intentError}
          errorMessage="Lead intent data could not be loaded."
        >
          <div className="flex h-[220px] items-center gap-6">
            {intentTotal > 0 ? (
              <div className="relative h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={intentSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={2}
                      cornerRadius={4}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {intentSlices.map((row) => (
                        <Cell key={row.name} fill={row.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<IntentTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold tabular-nums leading-none text-text-heading">{intentTotal}</p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-text-muted">total</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] w-[180px] shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50/50">
                <span className="text-[11px] text-text-muted">No data</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <IntentLegend slices={intentPie} />
            </div>
          </div>
        </PanelShell>

        <PanelShell
          title="Traffic sources"
          icon={Globe2}
          isLoading={trafficLoading}
          isError={trafficError}
          errorMessage="Traffic data could not be loaded."
        >
          {trafficUnavailable ? (
            <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background-light/30 px-6 text-center">
              <p className="text-sm font-semibold text-text-heading">Not available on your plan</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-text-muted">
                Upgrade to Standard to track profile traffic sources.
              </p>
            </div>
          ) : trafficTotal <= 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background-light/30 px-6 text-center">
              <p className="text-sm font-semibold text-text-heading">No visits tracked</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-text-muted">
                Traffic is recorded from your public profile page when visitors arrive.
              </p>
            </div>
          ) : (
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleTrafficBars}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, trafficMax]}
                    tick={{ fontSize: 10, fill: MUTED }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 10, fill: MUTED }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Visits" radius={[0, 4, 4, 0]} barSize={18}>
                    {visibleTrafficBars.map((row) => (
                      <Cell key={row.name} fill={row.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelShell>

        <PanelShell
          title="Lead activity"
          icon={Clock3}
          isLoading={isLoading}
        >
          {peakTotal <= 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background-light/30 px-6 text-center">
              <p className="text-sm font-semibold text-text-heading">No lead activity</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-text-muted">
                Daily lead and appointment activity will appear here.
              </p>
            </div>
          ) : (
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="leads" name="Lead activity" stroke={PRIMARY} fill="url(#peakFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelShell>
      </div>
    </section>
  );
}
