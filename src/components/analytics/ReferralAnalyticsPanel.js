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

export default function ReferralAnalyticsPanel({ series = [], windowDays = 30, isLoading = false, isError = false }) {
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
      <section className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        Referral analytics could not be loaded.
      </section>
    );
  }

  return (
    <section className="h-full rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-primary" />
          <h2 className="text-sm font-bold text-text-heading">Referral flow</h2>
        </div>
        <span className="text-xs font-semibold tabular-nums text-text-muted">
          {totals.inbound} inbound · {totals.outbound} outbound
        </span>
      </div>
      <p className="mb-2 text-xs text-text-muted">
        Inbound and outbound referral activity over the last {Number(windowDays) || 30} days.
      </p>

      {isLoading ? (
        <div className="h-[230px] rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
      ) : (
        <div className="h-[230px] w-full min-w-0">
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
