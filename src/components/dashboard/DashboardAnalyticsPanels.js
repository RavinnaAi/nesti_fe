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
  Legend,
} from "recharts";
import { BarChart3, Mail, CalendarCheck, Users } from "lucide-react";

void LineChart;
void Line;

const PRIMARY = "#34C759";
const PRIMARY_DARK = "#2AA84A";
const ACCENT = "#4DD469";
const MUTED = "#94a3b8";
const ROLE_COLORS = ["#059669", "#0284c7", "#9333ea", "#d97706", "#e11d48", "#64748b"];

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

function roleLabel(v) {
  const raw = String(v || "unknown").trim().toLowerCase();
  if (raw === "mortgage_broker") return "Mortgage Broker";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardAnalyticsPanels({
  windowDays = 30,
  series = [],
  inviteRoleTrends,
  isLoading,
  isError,
}) {
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

  const inviteSignupChart = useMemo(
    () => ({
      roles: Array.isArray(inviteRoleTrends?.roles) ? inviteRoleTrends.roles : [],
      rows: Array.isArray(inviteRoleTrends?.series) ? inviteRoleTrends.series : [],
      total: Number(inviteRoleTrends?.total || 0),
    }),
    [inviteRoleTrends]
  );

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
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="h-4 w-40 rounded-md bg-primary/10 animate-pulse" />
              <div className="h-3 w-20 rounded-md bg-primary/10 animate-pulse" />
            </div>
            <div className="h-3 w-56 rounded-md bg-primary/10 animate-pulse mb-3" />
            <div className="h-[280px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
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
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3 size={16} className="text-primary shrink-0" />
              <h3 className="text-sm font-bold text-text-heading">Activity over time</h3>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline shrink-0">
              Open leads →
            </Link>
          </div>
          <p className="text-xs text-text-muted mb-3">New leads and lead views (daily)</p>
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
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={16} className="text-primary shrink-0" />
              <h3 className="text-sm font-bold text-text-heading">Invite signups by role</h3>
            </div>
            <span className="text-xs font-semibold tabular-nums text-text-muted">
              {inviteSignupChart.total} joined
            </span>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Users who joined through invite links or referrals, grouped by their role.
          </p>
          <div className="h-[240px] w-full min-w-0">
            {inviteSignupChart.roles.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/80 bg-background-light/40 text-xs text-text-muted">
                No invite or referral signups in this window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inviteSignupChart.rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  {inviteSignupChart.roles.map((role, idx) => (
                    <Line
                      key={role}
                      type="monotone"
                      dataKey={role}
                      name={roleLabel(role)}
                      stroke={ROLE_COLORS[idx % ROLE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
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
