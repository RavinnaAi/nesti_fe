"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const MUTED = "#94a3b8";
const BAR_PALETTE = ["#34C759", "#2563eb", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9", "#64748b", "#16a34a"];

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

export default function AnalyticsCrmLeadInsights({ gradeMix = [], propertyTypeMix = [], matchBreakdown, isLoading }) {
  const matchTotal = Number(matchBreakdown?.total || 0);
  const matchedPct = matchTotal ? Math.round(((matchBreakdown?.matched || 0) / matchTotal) * 100) : 0;
  const mismatchedPct = matchTotal ? Math.round(((matchBreakdown?.mismatched || 0) / matchTotal) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading CRM insights">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 h-[240px] rounded-xl border border-border bg-white">
            <div className="h-full w-full rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
          <div className="xl:col-span-2 h-[240px] rounded-xl border border-border bg-white">
            <div className="h-full w-full rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
          <div className="xl:col-span-full mx-auto h-[250px] w-full max-w-3xl rounded-xl border border-border bg-white">
            <div className="h-full w-full rounded-lg bg-gradient-to-b from-primary/5 to-primary/[0.02] animate-pulse" />
          </div>
        </div>
        <p className="text-center text-xs font-medium text-primary">Loading CRM charts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-heading">Lead quality & demand</h2>
        <p className="text-sm text-text-muted mt-0.5">Derived from your current CRM lead list</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-heading mb-1">Lead grade distribution</h3>
          <p className="text-xs text-text-muted mb-3">How qualified your current leads are</p>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeMix} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                  {gradeMix.map((entry, idx) => (
                    <Cell key={`grade-${entry.name}`} fill={BAR_PALETTE[idx % BAR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-heading mb-1">Match quality</h3>
          <p className="text-xs text-text-muted mb-4">Current list-level fit status</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Matched</span>
                <span className="font-semibold text-text-heading">{matchedPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-background-light">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${matchedPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Mismatched</span>
                <span className="font-semibold text-text-heading">{mismatchedPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-background-light">
                <div className="h-2 rounded-full bg-red-500" style={{ width: `${mismatchedPct}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background-light/40 px-3 py-2 text-xs text-text-muted">
              <p>
                Total analyzed: <span className="font-semibold text-text-heading">{matchTotal}</span>
              </p>
              <p>
                Unknown status: <span className="font-semibold text-text-heading">{matchBreakdown?.unknown || 0}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-text-heading mb-1">Property type demand</h3>
        <p className="text-xs text-text-muted mb-3">Lead count by property type (connected for readability)</p>
        <div className="h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={propertyTypeMix} margin={{ top: 8, right: 8, left: 0, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: MUTED }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="linear"
                dataKey="count"
                name="Leads"
                stroke={BAR_PALETTE[0]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: BAR_PALETTE[0] }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
