"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  fetchChatAnalyticsFunnel,
  fetchChatAnalyticsLeadTrends,
  fetchChatAnalyticsSummary,
  fetchChatAnalyticsTimeseries,
} from "@/lib/chatClient";
import { fetchInviteMetrics } from "@/lib/inviteClient";
import AnalyticsKpiStrip from "@/components/analytics/AnalyticsKpiStrip";
import AnalyticsLeadCharts from "@/components/analytics/AnalyticsLeadCharts";
import InviteSignupsPanel from "@/components/analytics/InviteSignupsPanel";
import ReferralAnalyticsPanel from "@/components/analytics/ReferralAnalyticsPanel";

const DEFAULT_WINDOW_DAYS = 30;
const WINDOW_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthGuard();
  useFeatureAccess();
  const { token } = useAppSelector((state) => state.auth);
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsSummary({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const timeseriesQuery = useQuery({
    queryKey: ["analytics-timeseries", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsTimeseries({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const funnelQuery = useQuery({
    queryKey: ["analytics-funnel", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsFunnel({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const leadTrendsQuery = useQuery({
    queryKey: ["analytics-lead-trends", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsLeadTrends({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const inviteMetricsQuery = useQuery({
    queryKey: ["analytics-invite-metrics", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchInviteMetrics({ token, days: windowDays }),
    staleTime: 60_000,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-background-light/30">
      <div className="mx-auto w-full max-w-screen-2xl space-y-4 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-text-heading">
              <BarChart3 size={21} className="text-primary" />
              Analytics
            </h1>
            <p className="text-xs text-text-muted">Referral growth, professional performance, and invite signups.</p>
          </div>
          <div
            role="tablist"
            aria-label="Analytics window"
            className="inline-flex items-center rounded-lg border border-border bg-white p-0.5 shadow-sm"
          >
            {WINDOW_OPTIONS.map((opt) => {
              const active = opt.value === windowDays;
              return (
                <button
                  type="button"
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setWindowDays(opt.value)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    active ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-heading"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnalyticsKpiStrip
          performance={summaryQuery.data?.performance}
          inviteMetrics={inviteMetricsQuery.data?.metrics}
          isPerformanceLoading={summaryQuery.isLoading}
          isInviteLoading={inviteMetricsQuery.isLoading}
        />

        <div className="space-y-2">
          <div>
            <h2 className="text-sm font-bold text-text-heading">Referral activity</h2>
            <p className="text-xs text-text-muted">Inbound and outbound referral movement over time.</p>
          </div>
          <ReferralAnalyticsPanel
            series={timeseriesQuery.data?.series || []}
            windowDays={timeseriesQuery.data?.window_days || windowDays}
            isLoading={timeseriesQuery.isLoading}
            isError={timeseriesQuery.isError}
          />
        </div>

        <AnalyticsLeadCharts
          funnel={funnelQuery.data?.funnel}
          summary={summaryQuery.data?.summary}
          budgetTrend={Array.isArray(leadTrendsQuery.data?.budget) ? leadTrendsQuery.data.budget : []}
          isLoading={funnelQuery.isLoading || summaryQuery.isLoading || leadTrendsQuery.isLoading}
          isError={funnelQuery.isError || summaryQuery.isError || leadTrendsQuery.isError}
        />

        <div className="space-y-2">
          <div>
            <h2 className="text-sm font-bold text-text-heading">Invite signups</h2>
            <p className="text-xs text-text-muted">
              People who joined through your invite links and their signup details.
            </p>
          </div>
          <InviteSignupsPanel token={token} days={windowDays} showMetrics={false} showHeader={false} />
        </div>
      </div>
    </div>
  );
}
