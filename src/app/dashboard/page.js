"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Copy, Link2, Mail, MessageCircle, MessageSquare, RefreshCw, Share2, Sparkles, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
import DashboardKpiStrip from "@/components/dashboard/DashboardKpiStrip";
import DashboardTopTables from "@/components/dashboard/DashboardTopTables";
import DashboardCalendlyButton from "@/components/dashboard/DashboardCalendlyButton";
import {
  createInviteLink,
} from "@/lib/inviteClient";

const DashboardAnalyticsPanels = dynamic(
  () => import("@/components/dashboard/DashboardAnalyticsPanels"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-sm text-text-muted">Loading charts…</p>
      </div>
    ),
  }
);

const LeadDetailsModal = dynamic(
  () => import("@/components/dashboard/LeadDetailsModal"),
  { ssr: false }
);
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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteModalLink, setInviteModalLink] = useState("");

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

  const handleGenerateInvite = async () => {
    if (!token) return;
    try {
      const created = await createInviteLink({
        token,
        payload: { source_channel: "dashboard", intended_audience: "any" },
      });
      const url = created?.share_url || created?.invite?.share_url || "";
      setInviteModalLink(url);
      if (url && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        toast.success("Invite link generated.");
      } else {
        toast.success("Invite link generated.");
      }
    } catch (error) {
      toast.error(error?.message || "Unable to create invite link.");
    }
  };

  const handleCopyInviteFromModal = async () => {
    const url = String(inviteModalLink || "").trim();
    if (!url) {
      toast.info("Generate or paste an invite link first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy invite link.");
    }
  };

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
        const mortgageQual = qualification?.mortgage_broker || {};
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
          mortgageTimeline:
            qualification?.mortgage_timeline ||
            mortgageQual?.mortgage_timeline ||
            c?.property?.timeline ||
            "",
          preApprovalStatus:
            qualification?.pre_approval_status ||
            mortgageQual?.pre_approval_status ||
            mortgageQual?.mortgage_status ||
            "",
          creditScoreRange: qualification?.credit_score_range || mortgageQual?.credit_score_range || "",
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
                <div className="relative h-[5rem] w-[5rem] overflow-hidden rounded-xl border-[3px] border-white bg-slate-50 shadow-md sm:h-[6rem] sm:w-[6rem] sm:rounded-2xl">
                  {profileImageUrl && !avatarBroken ? (
                    <Image
                      src={profileImageUrl}
                      alt={avatarAlt}
                      width={240}
                      height={240}
                      className="h-full w-full object-cover object-center"
                      sizes="(max-width: 768px) 80px, 96px"
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
            <button
              type="button"
              onClick={() => {
                setInviteModalOpen(true);
                if (!inviteModalLink) void handleGenerateInvite();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/[0.08] px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.14]"
            >
              <Sparkles size={13} />
              Invite
            </button>
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
        {inviteModalOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-transparent p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInviteModalOpen(false)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg rounded-xl border border-border bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-heading">Invite link</h3>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-md border border-border p-1.5 text-text-muted hover:text-text-heading"
                  aria-label="Close invite modal"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mb-3 text-xs text-text-muted">
                You can paste an existing invite link or generate a new one.
              </p>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Invite URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2
                      size={14}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="text"
                      value={inviteModalLink}
                      onChange={(event) => setInviteModalLink(event.target.value)}
                      placeholder="Paste invite link here"
                      className="h-10 w-full rounded-md border border-border bg-white pl-8 pr-2 text-xs text-text-heading"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteFromModal}
                    className="inline-flex h-10 items-center gap-1 rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-heading hover:bg-primary/5"
                  >
                    <Copy size={13} />
                    Copy
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-border/70 bg-primary/[0.02] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Share
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => {
                    const url = String(inviteModalLink || "").trim();
                    const disabled = !url;
                    const btnBase =
                      "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition";
                    const enabledCls =
                      "border-border bg-white text-text-heading hover:bg-primary/5";
                    const disabledCls =
                      "pointer-events-none border-border/60 bg-slate-100 text-text-muted";
                    const cls = `${btnBase} ${disabled ? disabledCls : enabledCls}`;
                    const subject = "Join my Nesti network";
                    const emailHref = url
                      ? `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(url)}`
                      : "#";
                    const whatsappHref = url
                      ? `https://wa.me/?text=${encodeURIComponent(`Join my Nesti network: ${url}`)}`
                      : "#";
                    const smsHref = url
                      ? `sms:?body=${encodeURIComponent(`Join my Nesti network: ${url}`)}`
                      : "#";
                    const socialHref = url
                      ? `https://x.com/intent/tweet?text=${encodeURIComponent(`Join my Nesti network ${url}`)}`
                      : "#";
                    return (
                      <>
                        <a href={emailHref} className={cls} target="_blank" rel="noreferrer">
                          <Mail size={14} />
                          Email
                        </a>
                        <a href={whatsappHref} className={cls} target="_blank" rel="noreferrer">
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                        <a href={smsHref} className={cls}>
                          <MessageSquare size={14} />
                          SMS
                        </a>
                        <a href={socialHref} className={cls} target="_blank" rel="noreferrer">
                          <Share2 size={14} />
                          Social
                        </a>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  <Sparkles size={13} />
                  Generate new invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
