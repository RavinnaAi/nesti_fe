"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChatAnalyticsFunnel, fetchChatAnalyticsTimeseries, fetchNurtureLogs } from "@/lib/chatClient";
import { fetchLeads, fetchLeadProfiles } from "@/lib/leadsClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { formatLeadLocationLine, getLeadMeta } from "@/lib/leadConversationMeta";
import NewLeadPopup from "@/components/leads/NewLeadPopup";
import LeadDetailsModal from "@/components/dashboard/LeadDetailsModal";
import DashboardAnalyticsPanels from "@/components/dashboard/DashboardAnalyticsPanels";
import DashboardTopTables from "@/components/dashboard/DashboardTopTables";

const ANALYTICS_WINDOW_DAYS = 30;

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

  const leadsQuery = useQuery({
    queryKey: ["dashboard-leads", token],
    enabled: Boolean(token),
    queryFn: () => fetchLeads({ token, page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const analyticsFunnelQuery = useQuery({
    queryKey: ["dashboard-analytics-funnel", token, ANALYTICS_WINDOW_DAYS],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsFunnel({ token, days: ANALYTICS_WINDOW_DAYS }),
    staleTime: 60_000,
  });

  const analyticsTimeseriesQuery = useQuery({
    queryKey: ["dashboard-analytics-timeseries", token, ANALYTICS_WINDOW_DAYS],
    enabled: Boolean(token),
    queryFn: () => fetchChatAnalyticsTimeseries({ token, days: ANALYTICS_WINDOW_DAYS }),
    staleTime: 60_000,
  });

  const nurtureLogsChartQuery = useQuery({
    queryKey: ["dashboard-nurture-logs-chart", token, ANALYTICS_WINDOW_DAYS],
    enabled: Boolean(token),
    queryFn: () => fetchNurtureLogs({ token, page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const profilesTopQuery = useQuery({
    queryKey: ["dashboard-top-profiles", token],
    enabled: Boolean(token),
    queryFn: () => fetchLeadProfiles({ token, page: 1, limit: 50 }),
    staleTime: 60_000,
  });

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

  const parseBudgetNumber = (conversation) => {
    const raw =
      conversation?.conversion?.property?.budget ??
      conversation?.conversion?.property?.price ??
      conversation?.property?.budget ??
      conversation?.property?.price ??
      conversation?.budget ??
      null;
    if (raw == null) return null;
    const nums = String(raw).match(/\d+(?:\.\d+)?/g);
    if (!nums?.length) return null;
    const parsed = nums.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    if (!parsed.length) return null;
    const avg = parsed.reduce((sum, n) => sum + n, 0) / parsed.length;
    return Number.isFinite(avg) ? avg : null;
  };

  const selectedLead = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(conversation?.id || conversation?.conversation_id || conversation?.conversationId) ===
          String(selectedLeadId)
      ),
    [conversations, selectedLeadId]
  );

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
        const intent = String(meta.intent || "").trim() || "—";
        const grade = meta.leadGrade || "";
        const sortScore = Number.isFinite(score) && !Number.isNaN(score) ? score : -1;
        return {
          id,
          name: meta.name || "Unknown",
          email: meta.email || "",
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

  const intentTrend = useMemo(() => {
    const days = ANALYTICS_WINDOW_DAYS;
    const byDay = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      const dt = new Date();
      dt.setUTCHours(0, 0, 0, 0);
      dt.setUTCDate(dt.getUTCDate() - i);
      const key = dt.toISOString().slice(0, 10);
      byDay.set(key, {
        date: key,
        label: `${String(dt.getUTCMonth() + 1).padStart(2, "0")}/${String(dt.getUTCDate()).padStart(2, "0")}`,
        buyers: 0,
        sellers: 0,
      });
    }

    conversations.forEach((c) => {
      const rawDate = c?.created_at || c?.createdAt || c?.updated_at || c?.updatedAt;
      if (!rawDate) return;
      const dt = new Date(rawDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
        .toISOString()
        .slice(0, 10);
      const row = byDay.get(key);
      if (!row) return;
      const intent = String(getLeadMeta(c).intent || "").toLowerCase();
      if (intent.includes("buy")) row.buyers += 1;
      else if (intent.includes("sell")) row.sellers += 1;
    });

    return [...byDay.values()];
  }, [conversations]);

  const budgetTrend = useMemo(() => {
    const days = ANALYTICS_WINDOW_DAYS;
    const byDay = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      const dt = new Date();
      dt.setUTCHours(0, 0, 0, 0);
      dt.setUTCDate(dt.getUTCDate() - i);
      const key = dt.toISOString().slice(0, 10);
      byDay.set(key, {
        date: key,
        label: `${String(dt.getUTCMonth() + 1).padStart(2, "0")}/${String(dt.getUTCDate()).padStart(2, "0")}`,
        budget_avg: 0,
        _sum: 0,
        _count: 0,
      });
    }

    conversations.forEach((c) => {
      const budget = parseBudgetNumber(c);
      if (budget == null) return;
      const rawDate = c?.created_at || c?.createdAt || c?.updated_at || c?.updatedAt;
      if (!rawDate) return;
      const dt = new Date(rawDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
        .toISOString()
        .slice(0, 10);
      const row = byDay.get(key);
      if (!row) return;
      row._sum += budget;
      row._count += 1;
    });

    return [...byDay.values()].map((row) => ({
      date: row.date,
      label: row.label,
      budget_avg: row._count > 0 ? Math.round(row._sum / row._count) : 0,
    }));
  }, [conversations]);

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
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`relative flex items-center gap-4 overflow-hidden rounded-md ${coverImage ? "text-white" : "bg-gradient-to-br from-primary/60 via-primary-dark/30 to-primary/20 text-white"
            } shadow-xl p-6 md:p-8`}
          style={heroStyle}
        >
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-white shadow-md shadow-border/20 border border-border/20 overflow-hidden flex items-center justify-center text-lg md:text-xl font-bold text-primary-dark">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarInitials
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center text-text-heading gap-2 rounded-md bg-white/80 px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={14} />
                Secure workspace
              </div>
              <h1 className="text-3xl text-white/80 font-bold">
                Welcome back
                {welcomeFirstName ? `, ${welcomeFirstName}` : "!"}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                Track your pipeline, nurture hot leads, and close faster.
              </p>
            </div>
          </div>
        </motion.div>

        <DashboardAnalyticsPanels
          windowDays={analyticsTimeseriesQuery.data?.window_days || ANALYTICS_WINDOW_DAYS}
          funnel={analyticsFunnelQuery.data?.funnel}
          series={chartSeries}
          intentTrend={intentTrend}
          budgetTrend={budgetTrend}
          isLoading={
            leadsQuery.isLoading ||
            analyticsFunnelQuery.isLoading ||
            analyticsTimeseriesQuery.isLoading
          }
          isError={
            leadsQuery.isError || analyticsFunnelQuery.isError || analyticsTimeseriesQuery.isError
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
