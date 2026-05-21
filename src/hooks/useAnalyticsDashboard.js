import { useQuery } from '@tanstack/react-query';
import { getProfileAnalytics } from '@/lib/publicProfileClient';

export function useAnalyticsDashboard(token, options = {}) {
  const { period = 'daily', start_date, end_date } = options;

  return useQuery({
    queryKey: ['profile-analytics', period, start_date, end_date],
    queryFn: () => getProfileAnalytics(token, { period, start_date, end_date }),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function formatAnalyticsData(analyticsData) {
  if (!analyticsData || !analyticsData.data) {
    return {
      summary: {
        profile_views: 0,
        unique_visitors: 0,
        chatbot_opens: 0,
        consultation_requests: 0,
        leads_generated: 0,
      },
      timeSeriesData: [],
      trafficSources: {
        direct: 0,
        referral: 0,
        social: 0,
        search: 0,
        other: 0,
      },
    };
  }

  const data = analyticsData.data;

  const timeSeriesData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    profile_views: item.metrics.profile_views || 0,
    unique_visitors: item.metrics.unique_visitors || 0,
    chatbot_opens: item.metrics.chatbot_opens || 0,
    leads_generated: item.metrics.leads_generated || 0,
  }));

  const trafficSources = data.reduce(
    (acc, item) => {
      const sources = item.metrics.traffic_sources || {};
      return {
        direct: acc.direct + (sources.direct || 0),
        referral: acc.referral + (sources.referral || 0),
        social: acc.social + (sources.social || 0),
        search: acc.search + (sources.search || 0),
        other: acc.other + (sources.other || 0),
      };
    },
    { direct: 0, referral: 0, social: 0, search: 0, other: 0 }
  );

  return {
    summary: analyticsData.summary || {
      profile_views: 0,
      unique_visitors: 0,
      chatbot_opens: 0,
      consultation_requests: 0,
      leads_generated: 0,
    },
    timeSeriesData,
    trafficSources,
  };
}

export function calculateConversionRate(summary) {
  if (!summary || !summary.unique_visitors) return 0;
  
  const conversions = (summary.leads_generated || 0) + (summary.consultation_requests || 0);
  return ((conversions / summary.unique_visitors) * 100).toFixed(1);
}

export function calculateEngagementRate(summary) {
  if (!summary || !summary.profile_views) return 0;
  
  return ((summary.chatbot_opens / summary.profile_views) * 100).toFixed(1);
}
