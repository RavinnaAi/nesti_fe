"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAnalyticsDashboard, formatAnalyticsData } from "@/hooks/useAnalyticsDashboard";
import FeaturePageGate from "@/components/billing/FeaturePageGate";
import { FEATURES, SUBSCRIPTION_PLAN } from "@/constants/features";
import {
  fetchChatAnalyticsFunnel,
  fetchChatAnalyticsLeadTrends,
  fetchChatAnalyticsSummary,
  fetchChatAnalyticsTimeseries,
} from "@/lib/chatClient";
import { fetchInviteMetrics } from "@/lib/inviteClient";
import AnalyticsHeroKpiRow from "@/components/analytics/AnalyticsHeroKpiRow";
import NetworkCircleMetricsRow from "@/components/analytics/NetworkCircleMetricsRow";
import NetworkCircleProgressBar from "@/components/analytics/NetworkCircleProgressBar";
import NetworkCircleLedger from "@/components/analytics/NetworkCircleLedger";
import AnalyticsQuadrantPanels from "@/components/analytics/AnalyticsQuadrantPanels";
import ReferralAnalyticsPanel from "@/components/analytics/ReferralAnalyticsPanel";
import InviteSignupsPanel from "@/components/analytics/InviteSignupsPanel";

const DEFAULT_WINDOW_DAYS = 30;
const WINDOW_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

function analyticsWindowDates(days) {
  const windowDays = Math.max(Number(days) || 30, 1);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - windowDays + 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start_date: start.toISOString(), end_date: end.toISOString() };
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthGuard();
  const { hasFeature, user } = useFeatureAccess();
  const canViewAnalytics = hasFeature(FEATURES.WORKSPACE_ANALYTICS_PAGE);
  const canUseProfileAnalytics = hasFeature(FEATURES.PROFILE_ANALYTICS);
  const canUseNetworkCircle = hasFeature(FEATURES.REFERRALS_INVITES);
  const planKey = String(user?.subscriptionPlan || user?.subscription_plan || "").toLowerCase();
  const isEnterprise = planKey === SUBSCRIPTION_PLAN.ENTERPRISE;
  const queryStaleTime = isEnterprise ? 15_000 : 60_000;
  const refetchInterval = isEnterprise ? 15_000 : false;

  const { token } = useAppSelector((state) => state.auth);
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary", token, windowDays],
    enabled: Boolean(token) && canViewAnalytics,
    queryFn: () => fetchChatAnalyticsSummary({ token, days: windowDays }),
    staleTime: queryStaleTime,
    refetchInterval,
  });

  const timeseriesQuery = useQuery({
    queryKey: ["analytics-timeseries", token, windowDays],
    enabled: Boolean(token) && canViewAnalytics,
    queryFn: () => fetchChatAnalyticsTimeseries({ token, days: windowDays }),
    staleTime: queryStaleTime,
    refetchInterval,
  });

  const funnelQuery = useQuery({
    queryKey: ["analytics-funnel", token, windowDays],
    enabled: Boolean(token) && canViewAnalytics,
    queryFn: () => fetchChatAnalyticsFunnel({ token, days: windowDays }),
    staleTime: queryStaleTime,
    refetchInterval,
  });

  const leadTrendsQuery = useQuery({
    queryKey: ["analytics-lead-trends", token, windowDays],
    enabled: Boolean(token) && canViewAnalytics,
    queryFn: () => fetchChatAnalyticsLeadTrends({ token, days: windowDays }),
    staleTime: queryStaleTime,
    refetchInterval,
  });

  const inviteMetricsQuery = useQuery({
    queryKey: ["analytics-invite-metrics", token, windowDays],
    enabled: Boolean(token) && canViewAnalytics && canUseNetworkCircle,
    queryFn: () => fetchInviteMetrics({ token, days: windowDays }),
    staleTime: queryStaleTime,
    refetchInterval,
  });

  const profileWindow = analyticsWindowDates(windowDays);
  const profileAnalyticsQuery = useAnalyticsDashboard(token, {
    period: "daily",
    start_date: profileWindow.start_date,
    end_date: profileWindow.end_date,
    staleTime: queryStaleTime,
    refetchInterval,
    enabled: Boolean(token) && canViewAnalytics && canUseProfileAnalytics,
  });
  const formattedProfileAnalytics = formatAnalyticsData(profileAnalyticsQuery.data);

  const networkCircle = inviteMetricsQuery.data?.metrics?.network_circle || null;
  const heroLoading = summaryQuery.isLoading;
  const quadrantsLoading =
    funnelQuery.isLoading || summaryQuery.isLoading || leadTrendsQuery.isLoading;
  const trafficLoading = canUseProfileAnalytics && profileAnalyticsQuery.isLoading;
  const hasQueryError =
    summaryQuery.isError ||
    funnelQuery.isError ||
    leadTrendsQuery.isError ||
    timeseriesQuery.isError ||
    (canUseProfileAnalytics && profileAnalyticsQuery.isError);

  if (!isAuthenticated) return null;

  return (
    <FeaturePageGate feature={FEATURES.WORKSPACE_ANALYTICS_PAGE}>
      <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50/50">
        <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-text-heading">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 size={16} strokeWidth={2.5} />
              </span>
              Analytics
            </h1>
            <div
              role="tablist"
              aria-label="Analytics window"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
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
                    className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-text-heading"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasQueryError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              Some analytics sections could not be refreshed. Data shown may be partial — try switching the time window or reloading the page.
            </div>
          ) : null}

          <AnalyticsHeroKpiRow
            summary={summaryQuery.data?.summary}
            performance={summaryQuery.data?.performance}
            pipelineValue={summaryQuery.data?.pipeline_value}
            isLoading={heroLoading}
          />

          {canUseNetworkCircle ? (
            <>
              <NetworkCircleMetricsRow
                networkCircle={networkCircle}
                isLoading={inviteMetricsQuery.isLoading}
              />
              <NetworkCircleProgressBar
                networkCircle={networkCircle}
                isLoading={inviteMetricsQuery.isLoading}
              />
            </>
          ) : null}

          <AnalyticsQuadrantPanels
            funnel={funnelQuery.data?.funnel}
            summary={summaryQuery.data?.summary}
            intentTrend={Array.isArray(leadTrendsQuery.data?.intent) ? leadTrendsQuery.data.intent : []}
            intentError={leadTrendsQuery.isError}
            trafficSources={formattedProfileAnalytics.trafficSources}
            trafficLoading={trafficLoading}
            trafficError={canUseProfileAnalytics && profileAnalyticsQuery.isError}
            trafficUnavailable={!canUseProfileAnalytics}
            timeseries={timeseriesQuery.data?.series || []}
            isLoading={quadrantsLoading}
          />

          <div className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Referral activity</h2>
            <ReferralAnalyticsPanel
              series={timeseriesQuery.data?.series || []}
              windowDays={timeseriesQuery.data?.window_days || windowDays}
              isLoading={timeseriesQuery.isLoading}
              isError={timeseriesQuery.isError}
              compact
            />
          </div>

          {canUseNetworkCircle ? (
            <NetworkCircleLedger token={token} enabled={canUseNetworkCircle} />
          ) : null}

          {canUseNetworkCircle ? (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Invite signups</h2>
              <InviteSignupsPanel
                token={token}
                days={windowDays}
                showMetrics={false}
                showHeader={false}
                skipMetricsFetch
                externalMetrics={inviteMetricsQuery.data?.metrics}
                externalMetricsLoading={inviteMetricsQuery.isLoading}
              />
            </div>
          ) : null}
        </div>
      </div>
    </FeaturePageGate>
  );
}
