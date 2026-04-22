"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRecordLeadView } from "@/hooks/useRecordLeadView";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchChatAnalyticsFunnel,
  fetchChatAnalyticsLeadTrends,
  fetchChatAnalyticsSummary,
  fetchChatAnalyticsTimeseries,
  fetchNurtureLogs,
} from "@/lib/chatClient";
import { fetchLeads, fetchLeadProfiles } from "@/lib/leadsClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { formatLeadLocationLine, getLeadMeta, getLeadPropertyTypeDisplay } from "@/lib/leadConversationMeta";
import NewLeadPopup from "@/components/leads/NewLeadPopup";
import LeadDetailsModal from "@/components/dashboard/LeadDetailsModal";
import DashboardAnalyticsPanels from "@/components/dashboard/DashboardAnalyticsPanels";
import DashboardKpiStrip from "@/components/dashboard/DashboardKpiStrip";
import DashboardTopTables from "@/components/dashboard/DashboardTopTables";
import DashboardCalendlyButton from "@/components/dashboard/DashboardCalendlyButton";

const WINDOW_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];
const DEFAULT_WINDOW_DAYS = 30;

function normalizeProfilesPayload(data) {
  if (Array.isArray(data?.lead_profiles)) return data.lead_profiles;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

export default function DashboardPage() {
  const { user, token } = useAppSelector((state) => state.auth);
  const personalInfo = useAppSelector((state) => state.profile.personalInfo);
  const coverImage = personalInfo?.coverImage;
  const { isAuthenticated, profile } = useAuthGuard();
  const activeUser = profile?.user || profile?.data || user;

  const profileImageUrl =
    activeUser?.profileImage ||
    activeUser?.profile_image ||
    profile?.user?.profileImage ||
    profile?.user?.profile_image;

  const avatarInitials = useMemo(() => {
    const displayName =
      activeUser?.name ||
      [activeUser?.first_name, activeUser?.last_name].filter(Boolean).join(" ").trim() ||
      [activeUser?.firstName, activeUser?.lastName].filter(Boolean).join(" ").trim() ||
      [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(" ").trim() ||
      activeUser?.email ||
      personalInfo?.email ||
      "";
    if (!displayName) return "?";
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [activeUser, personalInfo]);

  const welcomeFirstName =
    activeUser?.firstName || activeUser?.first_name || personalInfo?.firstName || "";

  const [isMounted, setIsMounted] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [newLeadToNotify, setNewLeadToNotify] = useState(null);
  const [shownLeadIds, setShownLeadIds] = useState(new Set());
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);

  const leadsQuery = useQuery({
    queryKey: ["dashboard-leads", token],
    enabled: Boolean(token),
    queryFn: () => fetchLeads({ token, page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const analyticsSummaryQuery = useQuery({
    queryKey: ["dashboard-analytics-summary", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsSummary({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const analyticsFunnelQuery = useQuery({
    queryKey: ["dashboard-analytics-funnel", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsFunnel({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const analyticsTimeseriesQuery = useQuery({
    queryKey: ["dashboard-analytics-timeseries", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsTimeseries({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const nurtureLogsChartQuery = useQuery({
    queryKey: ["dashboard-nurture-logs-chart", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchNurtureLogs({ token, page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const leadTrendsQuery = useQuery({
    queryKey: ["dashboard-analytics-lead-trends", token, windowDays],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsLeadTrends({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const profilesTopQuery = useQuery({
    queryKey: ["dashboard-top-profiles", token],
    enabled: Boolean(token),
    queryFn: () => fetchLeadProfiles({ token, page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const refreshAll = () => {
    leadsQuery.refetch();
    analyticsSummaryQuery.refetch();
    analyticsFunnelQuery.refetch();
    analyticsTimeseriesQuery.refetch();
    nurtureLogsChartQuery.refetch();
    profilesTopQuery.refetch();
    leadTrendsQuery.refetch();
  };

  const isRefreshing =
    leadsQuery.isFetching ||
    analyticsSummaryQuery.isFetching ||
    analyticsFunnelQuery.isFetching ||
    analyticsTimeseriesQuery.isFetching ||
    nurtureLogsChartQuery.isFetching ||
    profilesTopQuery.isFetching ||
    leadTrendsQuery.isFetching;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detection logic for new leads (0-5 minutes)
  useEffect(() => {
    if (!leadsQuery.data?.leads) return;
    const list = Array.isArray(leadsQuery.data.leads) ? leadsQuery.data.leads : [];

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const freshLead = list.find((lead) => {
      const raw = lead?.created_at || lead?.createdAt;
      if (!raw) return false;
      const createdAt = new Date(raw);
      if (Number.isNaN(createdAt.getTime())) return false;
      const leadId = lead.id || lead._id;
      return createdAt > fiveMinutesAgo && !shownLeadIds.has(leadId);
    });

    if (freshLead) {
      const shaped = leadApiRowToConversationShape(freshLead);
      if (shaped) {
        setNewLeadToNotify(shaped);
        setShownLeadIds((prev) => new Set(prev).add(shaped.id || shaped.conversation_id));
      }
    }
  }, [leadsQuery.data, shownLeadIds]);

  const conversations = useMemo(() => {
    const raw = leadsQuery.data?.leads;
    if (!Array.isArray(raw)) return [];
    return raw.map(leadApiRowToConversationShape).filter(Boolean);
  }, [leadsQuery.data]);

  const selectedLead = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(conversation?.id || conversation?.conversation_id || conversation?.conversationId) ===
          String(selectedLeadId)
      ),
    [conversations, selectedLeadId]
  );

  useRecordLeadView(selectedLeadId, { token, enabled: Boolean(selectedLead) });

  const topLeadsRows = useMemo(() => {
    const gradeRank = (g) => {
      const x = String(g || "").toLowerCase();
      if (x === "hot") return 3;
      if (x === "warm") return 2;
      if (x === "cold") return 1;
      return 0;
    };
    return [...conversations]
      .map((c) => {
        const meta = getLeadMeta(c);
        const score = Number(meta.leadScore);
        const id = String(c?.id || c?.conversation_id || c?.conversationId || "").trim();
        const location = formatLeadLocationLine(c);
        const propertyType = getLeadPropertyTypeDisplay(c);
        const intent = String(meta.intent || "").trim() || "—";
        const grade = meta.leadGrade || "";
        const sortScore = Number.isFinite(score) && !Number.isNaN(score) ? score : -1;
        return {
          id,
          name: meta.name || "Unknown",
          email: meta.email || "",
          propertyType,
          intent,
          grade,
          scoreLabel: sortScore >= 0 ? String(score) : "—",
          location: location || "—",
          sortScore,
          sortGrade: gradeRank(grade),
        };
      })
      .filter((row) => row.id)
      .sort((a, b) => {
        if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
        return b.sortGrade - a.sortGrade;
      })
      .slice(0, 5)
      .map(({ sortScore: _s, sortGrade: _g, ...row }) => row);
  }, [conversations]);

  const topProfilesRows = useMemo(() => {
    const list = normalizeProfilesPayload(profilesTopQuery.data);
    return [...list]
      .sort((a, b) => {
        const ca = Array.isArray(a.lead_refs) ? a.lead_refs.length : 0;
        const cb = Array.isArray(b.lead_refs) ? b.lead_refs.length : 0;
        return cb - ca;
      })
      .slice(0, 5);
  }, [profilesTopQuery.data]);

  const intentTrend = useMemo(
    () => (Array.isArray(leadTrendsQuery.data?.intent) ? leadTrendsQuery.data.intent : []),
    [leadTrendsQuery.data]
  );

  const budgetTrend = useMemo(
    () => (Array.isArray(leadTrendsQuery.data?.budget) ? leadTrendsQuery.data.budget : []),
    [leadTrendsQuery.data]
  );

  /** Nurture sends per UTC day: merge KPI timeseries with NurtureLog rows (logs backfill before KPI existed). */
  const chartSeries = useMemo(() => {
    const base = analyticsTimeseriesQuery.data?.series;
    if (!Array.isArray(base) || base.length === 0) return [];
    const logPayload = nurtureLogsChartQuery.data;
    const items = Array.isArray(logPayload?.items) ? logPayload.items : [];
    const fromLogs = new Map();
    items.forEach((log) => {
      const st = String(log?.status || "sent").toLowerCase();
      if (st === "failed") return;
      const raw = log?.sent_at || log?.created_at;
      if (!raw) return;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return;
      const key = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())).toISOString().slice(0, 10);
      fromLogs.set(key, (fromLogs.get(key) || 0) + 1);
    });
    return base.map((row) => ({
      ...row,
      nurture_email_sent: Math.max(Number(row.nurture_email_sent || 0), fromLogs.get(row.date) || 0),
    }));
  }, [analyticsTimeseriesQuery.data, nurtureLogsChartQuery.data]);

  // Avoid hydration mismatch: server has no sessionStorage token; client may. First paint must match server.
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center px-6">
        <p className="text-sm text-text-muted">Loading workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center px-6">
        <p className="text-sm text-text-muted">Redirecting…</p>
      </div>
    );
  }

  const heroStyle = coverImage
    ? {
      backgroundImage: `
  linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
  url(${coverImage})
`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',

    }
    : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      {/* pt-* not py-10: avoids a large empty band under the workspace header (that gap was padding-top). */}
      <div className="max-w-6xl mx-auto space-y-8 px-4 pb-10 pt-3 sm:px-6 sm:pt-4">
        {/* Hero — layered gradient, glass badge, staggered entrance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`relative isolate overflow-hidden rounded-2xl border p-6 shadow-xl md:p-8 ${
            coverImage
              ? "border-white/10 text-white ring-1 ring-white/10 shadow-black/20"
              : "border-primary/20 bg-gradient-to-br from-primary via-primary-dark/95 to-emerald-700/90 text-white ring-1 ring-white/15 shadow-primary/25"
          }`}
          style={heroStyle}
        >
          {/* Photo cover: darken for readability */}
          {coverImage ? (
            <div
              className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-r from-black/75 via-black/55 to-black/35"
              aria-hidden
            />
          ) : null}
          {/* Soft light orbs (gradient hero only) */}
          {!coverImage ? (
            <>
              <div
                className="pointer-events-none absolute -right-12 -top-20 z-0 h-56 w-56 rounded-full bg-white/20 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-24 left-1/4 z-0 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl motion-safe:animate-[pulse_6s_ease-in-out_infinite_1s]"
                aria-hidden
              />
            </>
          ) : null}

          <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-white/25 blur-md motion-safe:animate-pulse" aria-hidden />
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white text-lg font-bold text-primary-dark shadow-lg ring-2 ring-white/30 md:h-[5.25rem] md:w-[5.25rem] md:text-xl">
                  {profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    avatarInitials
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="min-w-0 flex-1 space-y-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                <ShieldCheck size={14} className="shrink-0 opacity-95" aria-hidden />
                Secure workspace
              </span>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-[1.75rem] md:leading-tight lg:text-4xl">
                Welcome back{welcomeFirstName ? `, ${welcomeFirstName}` : "!"}
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
                Track your pipeline, nurture hot leads, and close faster.
              </p>
            </motion.div>

            <motion.div
              className="flex shrink-0 sm:ml-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardCalendlyButton className="w-full sm:w-auto" />
            </motion.div>
          </div>
        </motion.section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-heading">Performance overview</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Everything tracked in the last {windowDays} days.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-muted hover:text-text-heading"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading shadow-sm transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh dashboard"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <DashboardKpiStrip
          summary={analyticsSummaryQuery.data?.summary}
          isLoading={analyticsSummaryQuery.isLoading}
        />

        <DashboardAnalyticsPanels
          windowDays={analyticsTimeseriesQuery.data?.window_days || windowDays}
          funnel={analyticsFunnelQuery.data?.funnel}
          series={chartSeries}
          intentTrend={intentTrend}
          budgetTrend={budgetTrend}
          isLoading={
            analyticsFunnelQuery.isLoading ||
            analyticsTimeseriesQuery.isLoading ||
            leadTrendsQuery.isLoading ||
            nurtureLogsChartQuery.isLoading
          }
          isError={
            analyticsFunnelQuery.isError ||
            analyticsTimeseriesQuery.isError ||
            leadTrendsQuery.isError ||
            nurtureLogsChartQuery.isError
          }
        />

        <DashboardTopTables
          topLeads={topLeadsRows}
          topProfiles={topProfilesRows}
          leadsLoading={leadsQuery.isLoading}
          profilesLoading={profilesTopQuery.isLoading}
          leadsError={leadsQuery.isError}
          profilesError={profilesTopQuery.isError}
          onSelectLead={(id) => setSelectedLeadId(String(id))}
        />

      </div>
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailsModal
            lead={{
              ...selectedLead,
              ...getLeadMeta(selectedLead)
            }}
            onClose={() => setSelectedLeadId(null)}
          />
        )}
        {newLeadToNotify && (
          <NewLeadPopup
            lead={{
              ...newLeadToNotify,
              ...(newLeadToNotify ? getLeadMeta(newLeadToNotify) : {})
            }}
            onClose={() => setNewLeadToNotify(null)}
            onView={(id) => {
              setSelectedLeadId(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
