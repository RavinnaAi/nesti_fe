"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useProfileQuery } from "@/hooks/useAuthApi";
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
import { fetchCalendarBookings } from "@/lib/calendarClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { formatLeadLocationLine, getLeadMeta, getLeadPropertyTypeDisplay } from "@/lib/leadConversationMeta";
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
  const queryClient = useQueryClient();
  const { user, token } = useAppSelector((state) => state.auth);
  const personalInfo = useAppSelector((state) => state.profile.personalInfo);
  const businessInfo = useAppSelector((state) => state.profile.businessInfo);
  const profileQuery = useProfileQuery();
  const { isAuthenticated, profile } = useAuthGuard();
  const activeUser = profile?.user || profile?.data || user;

  const apiUser = profile?.user;
  const coverImageUrl = useMemo(() => {
    const fromStore = personalInfo?.coverImage && String(personalInfo.coverImage).trim();
    const fromApi = apiUser?.cover_image && String(apiUser.cover_image).trim();
    const fromActive = activeUser?.cover_image && String(activeUser.cover_image).trim();
    return fromStore || fromApi || fromActive || "";
  }, [personalInfo?.coverImage, apiUser?.cover_image, activeUser?.cover_image]);

  const profileImageUrl = useMemo(() => {
    const fromStore = personalInfo?.profileImage && String(personalInfo.profileImage).trim();
    const fromApi =
      apiUser?.profile_image && String(apiUser.profile_image).trim();
    const fromActive =
      activeUser?.profile_image ||
      activeUser?.profileImage ||
      "";
    const s = String(fromStore || fromApi || fromActive || "").trim();
    return s || "";
  }, [
    personalInfo?.profileImage,
    apiUser?.profile_image,
    activeUser?.profile_image,
    activeUser?.profileImage,
  ]);

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

  const userRole = activeUser?.role || "agent";

  const displayFullName = useMemo(() => {
    const fromBiz = businessInfo?.fullName && String(businessInfo.fullName).trim();
    if (fromBiz) return fromBiz;
    const fromPersonal = [personalInfo?.firstName, personalInfo?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fromPersonal) return fromPersonal;
    return (
      activeUser?.name ||
      [activeUser?.first_name, activeUser?.last_name].filter(Boolean).join(" ").trim() ||
      [activeUser?.firstName, activeUser?.lastName].filter(Boolean).join(" ").trim() ||
      ""
    );
  }, [businessInfo?.fullName, personalInfo, activeUser]);

  const roleBadgeText = useMemo(() => {
    const raw = String(businessInfo?.professionalType || userRole || "").trim();
    if (!raw) return "";
    return raw.replace(/_/g, " ").toUpperCase();
  }, [businessInfo?.professionalType, userRole]);

  const heroBio = useMemo(() => {
    const t =
      businessInfo?.testimonial ||
      businessInfo?.bio ||
      profileQuery.data?.professionalProfile?.bio;
    return typeof t === "string" ? t.trim() : "";
  }, [businessInfo?.testimonial, businessInfo?.bio, profileQuery.data?.professionalProfile?.bio]);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [secondaryQueriesReady, setSecondaryQueriesReady] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [profileImageUrl]);

  useEffect(() => {
    if (!token) {
      setSecondaryQueriesReady(false);
      return;
    }
    const timer = setTimeout(() => setSecondaryQueriesReady(true), 180);
    return () => clearTimeout(timer);
  }, [token]);

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
    enabled: Boolean(token) && secondaryQueriesReady,
    queryFn: () => fetchChatAnalyticsFunnel({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const analyticsTimeseriesQuery = useQuery({
    queryKey: ["dashboard-analytics-timeseries", token, windowDays],
    enabled: Boolean(token) && secondaryQueriesReady,
    queryFn: () => fetchChatAnalyticsTimeseries({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const nurtureLogsChartQuery = useQuery({
    queryKey: ["dashboard-nurture-logs-chart", token, windowDays],
    enabled: Boolean(token) && secondaryQueriesReady,
    queryFn: () => fetchNurtureLogs({ token, page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const leadTrendsQuery = useQuery({
    queryKey: ["dashboard-analytics-lead-trends", token, windowDays, userRole],
    enabled: Boolean(token) && secondaryQueriesReady,
    queryFn: () => fetchChatAnalyticsLeadTrends({ token, days: windowDays }),
    staleTime: 60_000,
  });

  const profilesTopQuery = useQuery({
    queryKey: ["dashboard-top-profiles", token],
    enabled: Boolean(token) && secondaryQueriesReady,
    queryFn: () => fetchLeadProfiles({ token, page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const calendarBookingsQuery = useQuery({
    queryKey: ["calendar-bookings", token],
    enabled: Boolean(token),
    queryFn: () => fetchCalendarBookings({ token }),
    staleTime: 60_000,
  });

  const kpiSummary = useMemo(() => {
    const summary = analyticsSummaryQuery.data?.summary;
    if (!summary) return summary;
    const calendarBooked = Array.isArray(calendarBookingsQuery.data?.bookings)
      ? calendarBookingsQuery.data.bookings.length
      : 0;
    return {
      ...summary,
      totals: {
        ...(summary.totals || {}),
        appointments_booked: calendarBooked,
      },
    };
  }, [analyticsSummaryQuery.data?.summary, calendarBookingsQuery.data?.bookings]);

  const refreshAll = () => {
    leadsQuery.refetch();
    analyticsSummaryQuery.refetch();
    analyticsFunnelQuery.refetch();
    analyticsTimeseriesQuery.refetch();
    nurtureLogsChartQuery.refetch();
    profilesTopQuery.refetch();
    leadTrendsQuery.refetch();
    calendarBookingsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ["calendar-bookings", token] });
  };

  const isRefreshing =
    leadsQuery.isFetching ||
    analyticsSummaryQuery.isFetching ||
    analyticsFunnelQuery.isFetching ||
    analyticsTimeseriesQuery.isFetching ||
    nurtureLogsChartQuery.isFetching ||
    profilesTopQuery.isFetching ||
    leadTrendsQuery.isFetching ||
    calendarBookingsQuery.isFetching;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        const location =
          formatLeadLocationLine(c) ||
          c?.property?.address ||
          c?.address ||
          c?.conversion?.property?.address ||
          "—";
        const propertyType = getLeadPropertyTypeDisplay(c);
        const qualification = c?.qualification || {};
        const lawyerQual = qualification?.lawyer || {};
        const intent = String(meta.intent || "").trim() || "—";
        const grade = meta.leadGrade || "";
        const sortScore = Number.isFinite(score) && !Number.isNaN(score) ? score : -1;
        return {
          id,
          name: meta.name || "Unknown",
          email: meta.email || "",
          propertyType,
          intent,
          transactionStage: qualification?.transaction_stage || lawyerQual?.transaction_stage || "",
          transactionType: qualification?.transaction_type || lawyerQual?.transaction_type || "",
          closingTimeline: qualification?.closing_timeline || lawyerQual?.closing_timeline || "",
          propertyValue: qualification?.property_value || lawyerQual?.property_value || "",
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

  const intentMetric = leadTrendsQuery.data?.intent_metric || "buyer_seller";

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

  const hasCover = Boolean(coverImageUrl);
  const avatarAlt = displayFullName || "Profile";

  return (
    <div className="relative z-[1] min-h-screen bg-white">
      <div className="w-full space-y-8 px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
        {/* Hero — same two-part card as Settings → Personal information (cover strip + white footer row) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm"
        >
          <div className="relative aspect-[16/5] w-full min-h-[10rem] sm:min-h-[11rem] md:min-h-[12rem]">
            {hasCover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  aria-hidden
                />
              </>
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark/95 to-emerald-700/90"
                aria-hidden
              />
            )}
            {!hasCover ? (
              <>
                <div
                  className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-20 left-1/4 h-36 w-36 rounded-full bg-emerald-400/25 blur-3xl motion-safe:animate-[pulse_6s_ease-in-out_infinite_1s]"
                  aria-hidden
                />
              </>
            ) : null}
          </div>

          <div className="relative flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 sm:px-7 sm:pb-6">
            <div className="flex min-w-0 flex-1 items-end gap-4 sm:gap-5">
              <motion.div
                className="relative z-[1] -mt-8 shrink-0 sm:-mt-10"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl border-[3px] border-white bg-slate-50 shadow-md sm:h-[5.25rem] sm:w-[5.25rem] sm:rounded-2xl">
                  {profileImageUrl && !avatarBroken ? (
                    <Image
                      src={profileImageUrl}
                      alt={avatarAlt}
                      width={220}
                      height={220}
                      className="h-full w-full object-cover object-center"
                      sizes="(max-width: 768px) 72px, 84px"
                      priority
                      unoptimized={
                        profileImageUrl.startsWith("data:") || profileImageUrl.startsWith("blob:")
                      }
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-dark select-none sm:text-xl" aria-hidden>
                      {avatarInitials}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                  Active
                </span>
              </motion.div>

              <motion.div
                className="min-w-0 flex-1 pb-0.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight text-text-heading sm:text-lg">
                    {displayFullName || "Your workspace"}
                  </h1>
                  {roleBadgeText ? (
                    <span className="rounded-full border border-border/80 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-heading">
                      {roleBadgeText}
                    </span>
                  ) : null}
                </div>
                {heroBio ? (
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">{heroBio}</p>
                ) : (
                  <p className="mt-1.5 text-sm text-text-muted/80 italic">No bio added yet.</p>
                )}
              </motion.div>
            </div>

            <motion.div
              className="flex w-full shrink-0 sm:w-auto sm:pb-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardCalendlyButton surface="light" className="w-full sm:w-auto" />
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
          summary={kpiSummary}
          isLoading={analyticsSummaryQuery.isLoading}
        />

        <DashboardAnalyticsPanels
          windowDays={analyticsTimeseriesQuery.data?.window_days || windowDays}
          funnel={analyticsFunnelQuery.data?.funnel}
          summary={analyticsSummaryQuery.data?.summary}
          series={chartSeries}
          intentTrend={intentTrend}
          intentMetric={intentMetric}
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
          professionalType={String(businessInfo?.professionalType || userRole || "").trim().toLowerCase()}
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
      </AnimatePresence>
    </div>
  );
}
