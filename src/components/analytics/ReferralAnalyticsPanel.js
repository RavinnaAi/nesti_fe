"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitBranch } from "lucide-react";

const gridStroke = "#e2e8f0";
const MUTED = "#94a3b8";

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

export default function ReferralAnalyticsPanel({
  series = [],
  windowDays = 30,
  isLoading = false,
  isError = false,
  compact = false,
}) {
  const totals = useMemo(
    () =>
      series.reduce(
        (acc, row) => ({
          inbound: acc.inbound + (Number(row.inbound_referred) || 0),
          outbound: acc.outbound + (Number(row.outbound_referred) || 0),
        }),
        { inbound: 0, outbound: 0 },
      ),
    [series],
  );

  if (isError) {
    return (
      <section className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-xs text-amber-700">
        Referral analytics could not be loaded.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {!compact ? (
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
              <GitBranch size={12} strokeWidth={2.5} />
            </span>
            <h2 className="text-xs font-semibold text-text-heading">Referral flow</h2>
          </div>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Inbound vs outbound
          </span>
        )}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {totals.inbound} in
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {totals.outbound} out
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        </div>
      ) : (
        <div className="h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="referralInboundFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="referralOutboundFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
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
              <Area
                type="monotone"
                dataKey="inbound_referred"
                name="Inbound referrals"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#referralInboundFill)"
              />
              <Area
                type="monotone"
                dataKey="outbound_referred"
                name="Outbound referrals"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#referralOutboundFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
