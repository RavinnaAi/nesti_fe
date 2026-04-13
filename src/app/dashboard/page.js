"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Flame,
  Star,
  Clock3,
  Search,
  Filter,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Globe,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { fetchConversations } from "@/lib/chatClient";
import NewLeadPopup from "@/components/leads/NewLeadPopup";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import CalendarSettingsModal from "@/components/dashboard/CalendarSettingsModal";
import LeadDetailsModal from "@/components/dashboard/LeadDetailsModal";

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
  const [leadType, setLeadType] = useState("buyers");
  const [leadStatus, setLeadStatus] = useState("active");
  const [matchFilter, setMatchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [newLeadToNotify, setNewLeadToNotify] = useState(null);
  const [shownLeadIds, setShownLeadIds] = useState(new Set());
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const conversationsQuery = useQuery({
    queryKey: ["dashboard-conversations", token],
    enabled: Boolean(token),
    queryFn: () => fetchConversations({ token }),
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detection logic for new leads (0-5 minutes)
  useEffect(() => {
    if (conversationsQuery.data) {
      const data = conversationsQuery.data;
      const list = Array.isArray(data) ? data : (data?.data || data?.items || []);

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const freshLead = list.find(lead => {
        const createdAt = new Date(lead.created_at);
        const leadId = lead.id || lead.conversation_id;
        return createdAt > fiveMinutesAgo && !shownLeadIds.has(leadId);
      });

      if (freshLead) {
        setNewLeadToNotify(freshLead);
        setShownLeadIds(prev => new Set(prev).add(freshLead.id || freshLead.conversation_id));
      }
    }
  }, [conversationsQuery.data, shownLeadIds]);

  const conversations = useMemo(() => {
    const data = conversationsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }, [conversationsQuery.data]);

  const getLeadMeta = (conversation) => {
    const leadScore = conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score;
    const leadGrade = conversation?.lead_grade ?? conversation?.leadGrade ?? "";
    const intent =
      conversation?.intent ||
      conversation?.lead_intent ||
      conversation?.intent_label ||
      "";
    const channel = conversation?.channel || conversation?.source || "web";

    const qualified = conversation?.is_qualified ?? conversation?.isQualified ?? null;

    // Check for matched status in multiple possible fields
    let isMatched = conversation?.is_matched ?? conversation?.matched ?? qualified;
    if (isMatched === null) {
      const matchStatus = conversation?.match_status;
      if (matchStatus === "matched" || matchStatus === true) {
        isMatched = true;
      } else {
        isMatched = conversation?.meta?.is_matched ??
          conversation?.meta?.matched ??
          conversation?.metadata?.is_matched ??
          conversation?.metadata?.matched ??
          conversation?.meta?.qualified ??
          null;
      }
    }

    const contact = conversation?.last_message_meta?.contact || conversation?.meta?.contact || {};
    const email = conversation?.email || conversation?.visitor_email || conversation?.visitorEmail || contact?.email;
    const nameFromEmail = email ? email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1) : null;

    const name =
      conversation?.name ||
      conversation?.visitor_name ||
      conversation?.visitorName ||
      nameFromEmail ||
      (conversation?.visitor_id || conversation?.visitorId
        ? `Visitor ${String(conversation?.visitor_id || conversation?.visitorId).slice(0, 6)}`
        : "Unknown visitor");

    return { leadScore, leadGrade, intent, channel, isMatched, qualified, name, email };
  };

  const matchesSearch = (conversation, term) => {
    if (!term) return true;
    const needle = term.toLowerCase();
    const haystack = [
      conversation?.name,
      conversation?.visitor_name,
      conversation?.visitorName,
      conversation?.email,
      conversation?.visitor_email,
      conversation?.visitorEmail,
      conversation?.phone,
      conversation?.visitor_phone,
      conversation?.visitorPhone,
      conversation?.city,
      conversation?.location,
      conversation?.visitor_id,
      conversation?.visitorId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  };

  const filteredLeads = useMemo(() => {
    return conversations.filter((conversation) => {
      const { intent, isMatched } = getLeadMeta(conversation);
      const status = conversation?.status || "active";
      const intentLower = String(intent || "").toLowerCase();
      if (leadType === "buyers" && intentLower.includes("sell") && !intentLower.includes("buy")) return false;
      if (leadType === "sellers" && intentLower.includes("buy") && !intentLower.includes("sell")) return false;
      if (leadStatus === "closed" && status !== "closed") return false;
      if (leadStatus === "active" && status === "closed") return false;
      if (matchFilter === "matched" && isMatched !== true) return false;
      if (matchFilter === "mismatched" && isMatched !== false) return false;
      return matchesSearch(conversation, searchTerm);
    });
  }, [conversations, leadType, leadStatus, matchFilter, searchTerm]);

  const selectedLead = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(conversation?.id || conversation?.conversation_id || conversation?.conversationId) ===
          String(selectedLeadId)
      ),
    [conversations, selectedLeadId]
  );

  const stats = useMemo(() => {
    const total = conversations.length;
    const hot = conversations.filter((conversation) => {
      const grade = String(getLeadMeta(conversation).leadGrade || "").toLowerCase();
      return grade === "hot";
    }).length;
    const matched = conversations.filter((conversation) => {
      return getLeadMeta(conversation).isMatched === true;
    }).length;
    const mismatched = conversations.filter((conversation) => {
      return getLeadMeta(conversation).isMatched === false;
    }).length;
    const scores = conversations
      .map((conversation) => Number(getLeadMeta(conversation).leadScore))
      .filter((value) => !Number.isNaN(value));
    const avgScore = scores.length
      ? (scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(1)
      : "0.0";
    const urgent = conversations.filter((conversation) => {
      const score = Number(getLeadMeta(conversation).leadScore);
      return !Number.isNaN(score) && score >= 80;
    }).length;
    return [
      {
        label: "Total Leads",
        value: total,
        icon: Users,
        accent: "bg-primary/10 text-primary",
      },
      {
        label: "Hot Leads",
        value: hot,
        icon: Flame,
        accent: "bg-red-100 text-red-600",
      },
      {
        label: "Matched",
        value: matched,
        icon: CheckCircle2,
        accent: "bg-green-100 text-green-600",
      },
      {
        label: "Mismatched",
        value: mismatched,
        icon: XCircle,
        accent: "bg-red-100 text-red-600",
      },
      {
        label: "Avg Score",
        value: avgScore,
        icon: Star,
        accent: "bg-amber-100 text-amber-600",
      },
      {
        label: "Urgent (0-3m)",
        value: urgent,
        icon: Clock3,
        accent: "bg-orange-100 text-orange-600",
      },
    ];
  }, [conversations]);

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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, accent }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="rounded-md border border-border bg-white shadow-lg shadow-primary/10 p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-2xl font-bold text-text-heading mt-1">
                  {value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-md flex items-center justify-center ${accent}`}
              >
                <Icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md bg-white shadow-sm border border-border/60 overflow-hidden">
            {["buyers", "sellers"].map((type) => (
              <button
                key={type}
                onClick={() => setLeadType(type)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${leadType === type
                  ? "bg-primary-dark text-white"
                  : "text-text-heading hover:bg-background-light"
                  }`}
              >
                {type === "buyers" ? "Buyer Leads" : "Seller Leads"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-md bg-white shadow-sm border border-border/60 overflow-hidden">
            {["active", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setLeadStatus(status)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${leadStatus === status
                  ? "bg-primary-dark text-white"
                  : "text-text-heading hover:bg-background-light"
                  }`}
              >
                {status === "active" ? "Active" : "Closed"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-md bg-white shadow-sm border border-border/60 overflow-hidden">
            {["", "matched", "mismatched"].map((match) => (
              <button
                key={match || "all"}
                onClick={() => setMatchFilter(match)}
                className={`px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${matchFilter === match
                  ? "bg-primary-dark text-white"
                  : "text-text-heading hover:bg-background-light"
                  }`}
              >
                {match === "" ? (
                  "All Leads"
                ) : match === "matched" ? (
                  <>
                    <CheckCircle2 size={14} />
                    Matched
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    Mismatched
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lead panels */}
        <div className="bg-white rounded-md border border-border shadow-lg shadow-primary/10 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, phone, or city..."
                className="w-full h-11 rounded-md border border-border/60 bg-background-light/50 pl-10 pr-3 text-sm focus:ring-0 focus:ring-none focus:outline-none"
              />
            </div>
            <button className="h-11 px-3 inline-flex items-center gap-2 rounded-md border border-border bg-background-light/60 text-sm font-semibold text-text-heading hover:border-primary transition">
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-md border border-border shadow-inner bg-background-light/60 min-h-[14rem] p-4 space-y-3">
              {conversationsQuery.isLoading ? (
                <div className="text-sm text-text-muted">Loading leads...</div>
              ) : conversationsQuery.isError ? (
                <div className="text-sm text-red-600">Failed to load leads.</div>
              ) : filteredLeads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <UserIcon className="text-text-muted/70" size={40} />
                  <p className="mt-3 text-base font-semibold text-text-heading">
                    No Leads Found
                  </p>
                  <p className="text-sm text-text-muted">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                filteredLeads.slice(0, 6).map((lead) => {
                  const id = lead?.id || lead?.conversation_id || lead?.conversationId;
                  const meta = getLeadMeta(lead);
                  const name = meta.name;
                  return (
                    <button
                      key={`lead-${id}`}
                      type="button"
                      onClick={() => setSelectedLeadId(id)}
                      className={`w-full text-left rounded-md border px-3 py-2 transition ${String(id) === String(selectedLeadId)
                        ? "border-primary shadow-sm bg-primary/5"
                        : meta.isMatched === false
                          ? "border-red-200 bg-red-50/50 hover:border-red-300"
                          : "border-border bg-white hover:border-primary/40"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-text-heading">{name}</div>
                          <div className="text-xs font-semibold text-text-heading">
                            {String(meta.intent).charAt(0).toUpperCase() + String(meta.intent).slice(1) || "Unknown intent"} • <span className="text-text-muted font-normal">{meta.channel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {meta.isMatched === true ? (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Matched
                            </span>
                          ) : meta.isMatched === false ? (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-red-200 text-red-700 border border-red-200 flex items-center gap-1">
                              <XCircle size={10} />
                              Mismatched
                            </span>
                          ) : null}
                          {meta.leadGrade ? (
                            <span className={`text-[10px] px-2 py-1 rounded-md ${String(meta.leadGrade).toLowerCase() === 'hot'
                              ? 'bg-red-200 border-red-200 border text-red-700'
                              : String(meta.leadGrade).toLowerCase() === 'warm'
                                ? 'bg-yellow-200 border-yellow-200 border text-yellow-700'
                                : 'bg-blue-200 border-blue-200 border text-blue-700'
                              }`}>
                              {String(meta.leadGrade).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {/* Right Column: Upcoming Meetings */}
            <div className="space-y-4">
              <UpcomingMeetings onOpenSettings={() => setIsCalendarModalOpen(true)} />
            </div>
          </div>
        </div>

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
      <CalendarSettingsModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} />
    </div>
  );
}
