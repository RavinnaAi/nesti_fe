'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAnalyticsDashboard, formatAnalyticsData, calculateConversionRate, calculateEngagementRate } from '@/hooks/useAnalyticsDashboard';
import { Eye, LineChart, Loader2, MessageCircle, Users } from 'lucide-react';

export default function ProfileAnalyticsPage() {
  const { token } = useAuthGuard();
  const [period, setPeriod] = useState('daily');
  const [dateRange] = useState({
    start_date: null,
    end_date: null,
  });

  const { data: analyticsData, isLoading } = useAnalyticsDashboard(token, {
    period,
    ...dateRange,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const { summary, timeSeriesData, trafficSources } = formatAnalyticsData(analyticsData);
  const conversionRate = calculateConversionRate(summary);
  const engagementRate = calculateEngagementRate(summary);

  const kpiCards = [
    {
      label: 'Profile Views',
      value: summary.profile_views?.toLocaleString() || '0',
      icon: <Eye />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Unique Visitors',
      value: summary.unique_visitors?.toLocaleString() || '0',
      icon: <Users />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Chatbot Opens',
      value: summary.chatbot_opens?.toLocaleString() || '0',
      icon: <MessageCircle />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Leads Generated',
      value: summary.leads_generated?.toLocaleString() || '0',
      icon: <LineChart />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-heading mb-2">
            Profile Analytics
          </h1>
          <p className="text-text-muted">
            Track your public profile performance and visitor engagement.
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md font-medium transition ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-muted hover:bg-gray-50 border border-border'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${kpi.bgColor} ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-text-heading mb-1">
                {kpi.value}
              </div>
              <div className="text-sm text-text-muted">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Conversion & Engagement Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-text-heading mb-4">
              Conversion Rate
            </h3>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {conversionRate}%
            </div>
            <p className="text-sm text-text-muted">
              Visitors who became leads or booked consultations
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-text-heading mb-4">
              Engagement Rate
            </h3>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {engagementRate}%
            </div>
            <p className="text-sm text-text-muted">
              Visitors who opened the chatbot
            </p>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-text-heading mb-4">
            Traffic Sources
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(trafficSources).map(([source, count]) => (
              <div key={source} className="text-center">
                <div className="text-2xl font-bold text-text-heading mb-1">
                  {count}
                </div>
                <div className="text-sm text-text-muted capitalize">{source}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Series Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-heading mb-4">
            Performance Over Time
          </h3>
          {timeSeriesData.length > 0 ? (
            <div className="space-y-3">
              {timeSeriesData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-text-muted">{item.date}</div>
                  <div className="flex-1 flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Views</span>
                        <span className="text-xs font-medium">{item.profile_views}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((item.profile_views / Math.max(...timeSeriesData.map(d => d.profile_views))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Leads</span>
                        <span className="text-xs font-medium">{item.leads_generated}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((item.leads_generated / Math.max(...timeSeriesData.map(d => d.leads_generated || 1))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <p>No data available for the selected period.</p>
              <p className="text-sm mt-2">Share your public profile to start collecting analytics!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
