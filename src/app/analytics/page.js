 "use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, RefreshCw } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchAnalyticsSummary, fetchAnalyticsFunnel } from "@/lib/chatClient";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

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
  // Require advanced analytics feature (Pro)
  useFeatureAccess(FEATURES.LEADS_INSIGHTS_ADVANCED);
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

  const summary = useMemo(() => {
    const data = summaryQuery.data;
    if (Array.isArray(data) && data.length > 0) return data[0];
    return {};
  }, [summaryQuery.data]);

  const funnelData = useMemo(() => {
    const data = funnelQuery.data;
    if (data && !Array.isArray(data) && typeof data === "object") return data;
    return null;
  }, [funnelQuery.data]);

  const summaryEntries = useMemo(() => {
    return Object.entries(summary).filter(
      ([key, value]) => key !== "embed_token" && typeof value !== "object"
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

        <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-6">
          <div className="text-sm font-semibold text-text-heading">Funnel breakdown</div>
          {funnelQuery.isLoading ? (
            <div className="text-sm text-text-muted">Loading funnel...</div>
          ) : funnelQuery.isError ? (
            <div className="text-sm text-red-600">Failed to load funnel.</div>
          ) : !funnelData ? (
            <div className="text-sm text-text-muted">No funnel data yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: High Level Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="text-xs text-blue-600 font-semibold uppercase">Total Conversations</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">{funnelData.total_conversations || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="text-xs text-green-600 font-semibold uppercase">Qualified Leads</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">{funnelData.qualified || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="text-xs text-purple-600 font-semibold uppercase">Conversion Rate</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">
                      {funnelData.total_conversations > 0
                        ? Math.round((funnelData.qualified / funnelData.total_conversations) * 100)
                        : 0}%
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/60">
                  <h3 className="text-xs font-semibold text-text-muted uppercase mb-3">Lead Grades</h3>
                  <div className="space-y-3">
                    {Object.entries(funnelData.lead_grades || {}).map(([grade, count]) => (
                      <div key={grade} className="flex items-center justify-between text-sm">
                        <span className={`capitalize px-2 py-0.5 rounded text-xs font-semibold
                                    ${grade === 'hot' ? 'bg-red-100 text-red-700' :
                            grade === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'}`}>
                          {grade}
                        </span>
                        <div className="flex items-center gap-3 flex-1 mx-3">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${grade === 'hot' ? 'bg-red-500' : grade === 'warm' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              style={{ width: `${(count / (funnelData.total_conversations || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-medium text-text-muted">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Intents */}
              <div className="p-4 rounded-xl border border-border/60 h-full">
                <h3 className="text-xs font-semibold text-text-muted uppercase mb-4">Detected Intents</h3>
                <div className="space-y-4">
                  {Object.entries(funnelData.intents || {}).length === 0 ? (
                    <div className="text-sm text-text-muted">No intents detected yet.</div>
                  ) : (
                    Object.entries(funnelData.intents).map(([intent, count]) => (
                      <div key={intent}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-text-heading capitalize">{intent.replace(/_/g, ' ')}</span>
                          <span className="text-text-muted">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-full"
                            style={{ width: `${(count / (funnelData.total_conversations || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
