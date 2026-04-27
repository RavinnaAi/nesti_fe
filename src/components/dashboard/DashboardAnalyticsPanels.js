"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Mail, CalendarCheck } from "lucide-react";

void LineChart;
void Line;

const PRIMARY = "#34C759";
const PRIMARY_DARK = "#2AA84A";
const ACCENT = "#4DD469";
const MUTED = "#94a3b8";

/**
 * Funnel bar fills — same hue families as `DashboardKpiStrip` (emerald / sky / violet / amber / rose)
 * so the chart reads as one Nesti dashboard, not a separate color system.
 */
const FUNNEL_BAR_COLORS = {
  deals: "#e11d48", // rose-600 — Deals tile
  lead_created: "#059669", // emerald-600 — New leads
  lead_updated: "#0284c7", // sky-600 — Lead views / activity
  appointment_booked: "#9333ea", // violet-600 — Appointments
  appointment_canceled: "#d97706", // amber-600 — nurture / caution (distinct from wins)
};

/** Solid grid lines (avoid dashed “dotted” look from strokeDasharray). */
const gridStroke = "#e2e8f0";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-text-heading mb-1">{label}</p>
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
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

export default function DashboardAnalyticsPanels({
  windowDays = 30,
  funnel,
  summary = null,
  series = [],
  intentTrend = [],
  budgetTrend = [],
  isLoading,
  isError,
}) {
  const stages = funnel?.stages || [];

  const dealsClosedWon = summary?.totals?.leads_closed_won;

  const funnelBars = [
    ...(typeof dealsClosedWon === "number"
      ? [{ name: "Deals (closed won)", count: dealsClosedWon, segment: "deals" }]
      : []),
    ...stages.map((s) => ({
      name: s.label.replace(/^Lead /, "").replace(/^Appointment /, "Appt "),
      count: s.count,
      segment: s.id,
    })),
  ];

  const nurtureEmailsTotal = useMemo(
    () => series.reduce((sum, row) => sum + (Number(row.nurture_email_sent) || 0), 0),
    [series]
  );

  const appointmentsTotals = useMemo(() => {
    return series.reduce(
      (acc, row) => ({
        booked: acc.booked + (Number(row.appointment_booked) || 0),
        canceled: acc.canceled + (Number(row.appointment_canceled) || 0),
      }),
      { booked: 0, canceled: 0 }
    );
  }, [series]);

  if (isError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        Analytics could not be loaded. Charts may be incomplete.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading charts">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="h-4 w-40 rounded-md bg-primary/10 animate-pulse" />
              <div className="h-3 w-20 rounded-md bg-primary/10 animate-pulse" />
            </div>
            <div className="h-3 w-56 rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[280px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
          <div className="xl:col-span-2 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="h-4 w-24 rounded-md bg-primary/10 animate-pulse mb-1" />
            <div className="h-3 w-48 rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[280px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="h-4 w-36 rounded-md bg-primary/10 animate-pulse mb-1" />
            <div className="h-3 w-64 max-w-full rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[240px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
          <div className="xl:col-span-2 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="h-4 w-28 rounded-md bg-primary/10 animate-pulse mb-1" />
            <div className="h-3 w-56 max-w-full rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[240px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="h-4 w-44 rounded-md bg-primary/10 animate-pulse" />
              <div className="h-3 w-28 rounded-md bg-primary/10 animate-pulse" />
            </div>
            <div className="h-3 w-full max-w-sm rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[220px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="h-4 w-40 rounded-md bg-primary/10 animate-pulse" />
              <div className="h-3 w-20 rounded-md bg-primary/10 animate-pulse" />
            </div>
            <div className="h-3 w-full max-w-md rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[220px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3 size={16} className="text-primary shrink-0" />
              <h3 className="text-sm font-bold text-text-heading">Activity over time</h3>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline shrink-0">
              Open leads →
            </Link>
          </div>
          <p className="text-xs text-text-muted mb-3">New leads vs. profile views (daily)</p>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: MUTED }}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span className="text-text-body">{value}</span>} />
                <Area type="monotone" dataKey="lead_created" name="New leads" stroke={PRIMARY_DARK} strokeWidth={2} fill="url(#fillCreated)" />
                <Area type="monotone" dataKey="lead_viewed" name="Lead views" stroke={ACCENT} strokeWidth={2} fill="url(#fillViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-text-heading">Funnel</h3>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Deals use closed-won leads; other rows are activity event counts in the window.
          </p>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelBars} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {funnelBars.map((row) => (
                    <Cell
                      key={`${row.segment}-${row.name}`}
                      fill={FUNNEL_BAR_COLORS[row.segment] || "#64748b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-heading mb-1">Lead intent trend</h3>
          <p className="text-xs text-text-muted mb-3">Daily buyers vs sellers (from your CRM list)</p>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intentTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="intentFillBuyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="intentFillSellers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="buyers"
                  name="Buyers"
                  stroke={PRIMARY_DARK}
                  strokeWidth={2}
                  fill="url(#intentFillBuyers)"
                />
                <Area
                  type="monotone"
                  dataKey="sellers"
                  name="Sellers"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#intentFillSellers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-heading mb-1">Budget trend</h3>
          <p className="text-xs text-text-muted mb-3">Average budget signal per day (parsed from lead fields)</p>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="budgetFillAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatUsdCompact(v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload;
                    const v = row?.budget_avg;
                    return (
                      <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold text-text-heading mb-1">{label}</p>
                        <p className="text-text-muted">
                          Avg budget: <span className="font-mono font-semibold text-text-heading">{formatUsdCompact(v)}</span>
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
                  fill="url(#budgetFillAvg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-text-heading">Appointments trend</h3>
            </div>
            <span className="text-xs font-semibold tabular-nums text-text-muted">
              {appointmentsTotals.booked} booked · {appointmentsTotals.canceled} canceled
            </span>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Daily booked vs canceled appointments over the last {windowDays} days.
          </p>
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="apptFillBooked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="apptFillCanceled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="appointment_booked"
                  name="Booked"
                  stroke={PRIMARY_DARK}
                  strokeWidth={2}
                  fill="url(#apptFillBooked)"
                />
                <Area
                  type="monotone"
                  dataKey="appointment_canceled"
                  name="Canceled"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#apptFillCanceled)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-text-heading">Nurture emails sent</h3>
            </div>
            <span className="text-xs font-semibold tabular-nums text-text-muted">
              {nurtureEmailsTotal} in period
            </span>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Daily successful sends (last {windowDays} days), from activity events and your nurture send log (up to 100
            recent sends merged by day).
          </p>
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="nurtureFillEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="nurture_email_sent"
                  name="Emails sent"
                  stroke={PRIMARY_DARK}
                  strokeWidth={2}
                  fill="url(#nurtureFillEmails)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
