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
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-text-heading mb-1">{label}</p>
      <ul className="space-y-0.5 text-slate-500">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-mono font-semibold text-text-heading">{p.value}</span>
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
  showInviteSignups = true,
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
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-xs text-amber-700">
        Analytics could not be loaded. Charts may be incomplete.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading charts">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-[280px] flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="h-4 w-44 rounded bg-slate-100 animate-pulse mb-4" />
            <div className="h-[220px] flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
            </div>
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="h-4 w-40 rounded bg-slate-100 animate-pulse mb-4" />
            <div className="h-[220px] flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                <BarChart3 size={12} strokeWidth={2.5} />
              </span>
              <h3 className="text-xs font-semibold text-text-heading">Activity over time</h3>
            </div>
            <Link href="/leads" className="text-[11px] font-semibold text-primary hover:text-primary-dark shrink-0">
              Open leads →
            </Link>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">New leads and lead views (daily)</p>
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

      {showInviteSignups ? (
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                <Users size={12} strokeWidth={2.5} />
              </span>
              <h3 className="text-xs font-semibold text-text-heading">Invite signups by role</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
              {inviteSignupChart.total} joined
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">
            Users who joined through invite links or referrals, grouped by their role.
          </p>
          <div className="h-[240px] w-full min-w-0">
            {inviteSignupChart.roles.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/40 text-[11px] text-slate-400">
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
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                <CalendarCheck size={12} strokeWidth={2.5} />
              </span>
              <h3 className="text-xs font-semibold text-text-heading">Appointments trend</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
              {appointmentsTotals.booked} booked · {appointmentsTotals.canceled} canceled
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">
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

        <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                <Mail size={12} strokeWidth={2.5} />
              </span>
              <h3 className="text-xs font-semibold text-text-heading">Nurture emails sent</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
              {nurtureEmailsTotal} in period
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">
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
