"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, RefreshCw } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchAnalyticsSummary, fetchAnalyticsFunnel } from "@/lib/chatClient";

const normalizeObject = (data) => {
  if (!data) return {};
  if (data?.data && typeof data.data === "object") return data.data;
  if (typeof data === "object" && !Array.isArray(data)) return data;
  return {};
};

const normalizeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthGuard();
  const { token } = useAppSelector((state) => state.auth);
  const defaults = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const summaryQuery = useQuery({
    queryKey: ["chat-analytics-summary", token, startDate, endDate],
    enabled: Boolean(token),
    queryFn: () => fetchAnalyticsSummary({ token, start: startDate, end: endDate }),
  });

  const funnelQuery = useQuery({
    queryKey: ["chat-analytics-funnel", token, startDate, endDate],
    enabled: Boolean(token),
    queryFn: () => fetchAnalyticsFunnel({ token, start: startDate, end: endDate }),
  });

  const summary = useMemo(() => normalizeObject(summaryQuery.data), [summaryQuery.data]);
  const funnelRows = useMemo(() => normalizeArray(funnelQuery.data), [funnelQuery.data]);
  const summaryEntries = useMemo(() => {
    return Object.entries(summary).filter(
      ([, value]) => typeof value !== "object" && value !== null && value !== undefined
    );
  }, [summary]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-heading">Analytics</h1>
            <p className="text-sm text-text-muted">Monitor lead funnel performance.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              summaryQuery.refetch();
              funnelQuery.refetch();
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary border border-primary/30 rounded-md px-3 py-2 hover:bg-primary/5 transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="rounded-md border border-border bg-white shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-text-muted">
            <Calendar size={14} />
            Date range
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-9 rounded-md border border-border px-2 text-xs"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-9 rounded-md border border-border px-2 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryQuery.isLoading ? (
            <div className="col-span-full rounded-md border border-border bg-white p-4 text-sm text-text-muted">
              Loading summary...
            </div>
          ) : summaryQuery.isError ? (
            <div className="col-span-full rounded-md border border-border bg-white p-4 text-sm text-red-600">
              Failed to load summary.
            </div>
          ) : summaryEntries.length === 0 ? (
            <div className="col-span-full rounded-md border border-border bg-white p-4 text-sm text-text-muted">
              No summary data yet.
            </div>
          ) : (
            summaryEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-md border border-border bg-white shadow-sm p-4"
              >
                <div className="text-xs uppercase tracking-wide text-text-muted">
                  {String(key).replace(/_/g, " ")}
                </div>
                <div className="text-2xl font-bold text-text-heading mt-2">{value}</div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-3">
          <div className="text-sm font-semibold text-text-heading">Funnel breakdown</div>
          {funnelQuery.isLoading ? (
            <div className="text-sm text-text-muted">Loading funnel...</div>
          ) : funnelQuery.isError ? (
            <div className="text-sm text-red-600">Failed to load funnel.</div>
          ) : funnelRows.length === 0 ? (
            <div className="text-sm text-text-muted">No funnel data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-text-muted uppercase">
                  <tr>
                    {Object.keys(funnelRows[0] || {}).map((header) => (
                      <th key={header} className="text-left py-2 px-3">
                        {String(header).replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funnelRows.map((row, index) => (
                    <tr key={index} className="border-t border-border/60">
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-2 px-3 text-text-heading">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
