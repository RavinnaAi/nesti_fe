"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRecordLeadView } from "@/hooks/useRecordLeadView";
import { useAppSelector } from "@/store";
import {
  fetchReferrals,
  createReferral,
  updateReferral,
  sendNurtureEmail,
  fetchNurtureLogs,
  postNurtureDraft,
  postNurtureRefine,
  runMortgageCalculator,
  runClosingCalculator,
  fetchCalculatorRuns,
} from "@/lib/chatClient";
import {
  fetchLeads,
  fetchLeadById,
  fetchLeadConversation,
  fetchLeadPropertyMatches,
  deleteLeadById,
} from "@/lib/leadsClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import LeadsWorkspaceTabs from "@/components/leads/LeadsWorkspaceTabs";
import LeadsDetailsTab from "@/components/leads/LeadsDetailsTab";
import LeadsConversationTab from "@/components/leads/LeadsConversationTab";
import LeadsProfileTab from "@/components/leads/LeadsProfileTab";
import LeadsActionsTab from "@/components/leads/LeadsActionsTab";
import LeadsNurtureTab from "@/components/leads/LeadsNurtureTab";
import LeadsAiActionsTab from "@/components/leads/LeadsAiActionsTab";
import LeadsPropertyMatchesTab from "@/components/leads/LeadsPropertyMatchesTab";
import { LeadsPageTableSkeleton } from "@/components/ui/ContentSkeletons";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/** Active chat thread id for referrals, nurture, calculators. */
const getActionConversationId = (lead) =>
  lead?.conversation_id || lead?.conversationId || "";

const getLeadMatchId = (lead) =>
  lead?.lead_match_id || lead?.id || "";

const getConversationMeta = (conversation) => {
  // Check for matched status in multiple possible fields
  let isMatched = conversation?.is_matched ?? conversation?.matched ?? null;
  if (isMatched === null) {
    const matchStatus = conversation?.match_status;
    if (matchStatus === "matched" || matchStatus === true) {
      isMatched = true;
    } else {
      isMatched = conversation?.meta?.is_matched ??
        conversation?.meta?.matched ??
        conversation?.metadata?.is_matched ??
        conversation?.metadata?.matched ??
        null;
    }
  }

  return {
    intent:
      conversation?.intent ||
      conversation?.lead_intent ||
      conversation?.intent_label ||
      "Unknown",
    leadScore:
      conversation?.lead_score ??
      conversation?.leadScore ??
      conversation?.score ??
      "—",
    leadGrade:
      conversation?.lead_grade ?? conversation?.leadGrade ?? conversation?.grade ?? "—",
    channel: conversation?.channel || conversation?.source || "web",
    qualified: conversation?.is_qualified ?? conversation?.isQualified ?? false,
    isMatched,
  };
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

const extractMeta = (value) => {
  if (!value) return {};
  return value?.meta || value?.metadata || value?.data?.meta || {};
};

const extractMessageMeta = (message) => {
  if (!message) return {};
  return message?.meta || message?.message_meta || message?.metadata || message?.data?.meta || {};
};

const formatMetaEntries = (meta) => {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta).filter(([, value]) => value !== undefined && value !== null);
};

const formatUpdatedTime = (conversation) => {
  const value =
    conversation?.updated_at ||
    conversation?.updatedAt ||
    conversation?.created_at ||
    conversation?.createdAt ||
    null;
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/[^0-9.-]/g, "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractRangeNumbers = (value) => {
  if (value === null || value === undefined) return null;
  const matches = String(value).match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 2) return null;
  const low = Number(matches[0]);
  const high = Number(matches[1]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return low <= high ? [low, high] : [high, low];
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatBudgetValue = (conversation) => {
  const conversionProperty = conversation?.conversion?.property || {};
  const minCandidate =
    conversionProperty?.min_budget ??
    conversation?.budget_profile?.min_budget ??
    conversation?.property?.min_budget ??
    conversation?.property?.budget_min;
  const maxCandidate =
    conversionProperty?.max_budget ??
    conversation?.budget_profile?.max_budget ??
    conversation?.property?.max_budget ??
    conversation?.property?.budget_max;
  const singleCandidate =
    conversionProperty?.budget ??
    conversionProperty?.price ??
    conversation?.budget ??
    conversation?.property?.budget ??
    conversation?.property?.price ??
    conversation?.price;

  const min = toFiniteNumber(minCandidate);
  const max = toFiniteNumber(maxCandidate);
  if (min !== null && max !== null) return `${formatMoney(min)} - ${formatMoney(max)}`;
  if (min !== null) return formatMoney(min);
  if (max !== null) return formatMoney(max);

  const single = toFiniteNumber(singleCandidate);
  if (single !== null) return formatMoney(single);

  const ranged = extractRangeNumbers(singleCandidate);
  if (ranged) return `${formatMoney(ranged[0])} - ${formatMoney(ranged[1])}`;

  return "N/A";
};

const getStatusLabel = (conversation, meta) => {
  const rawStatus = String(
    conversation?.status ||
      conversation?.lead_status ||
      conversation?.conversion_funnel?.stage ||
      ""
  )
    .trim()
    .toLowerCase();

  if (rawStatus) return rawStatus.replace(/_/g, " ");
  if (meta?.isMatched === true) return "matched";
  if (meta?.isMatched === false) return "mismatched";
  if (meta?.qualified) return "qualified";
  return "new";
};

const getMatchesCount = (conversation) => {
  const candidates = [
    conversation?.stats?.total_matches,
    conversation?.total_matches,
    conversation?.match_count,
    conversation?.property_matches_count,
    conversation?.propertyMatchesCount,
  ];
  for (const value of candidates) {
    const n = toFiniteNumber(value);
    if (n !== null) return n;
  }
  return 0;
};

function LeadsPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const leadFromUrl = String(searchParams.get("lead") || "").trim();
  const pageFromUrl = Number(searchParams.get("page") || "1");
  const [hydrated, setHydrated] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [currentPage, setCurrentPage] = useState(Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [activeTab, setActiveTab] = useState("lead_profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [referralForm, setReferralForm] = useState({
    target_vertical: "realtor",
    target_user_id: "",
    status: "new",
    notes: "",
  });
  const [activeReferralId, setActiveReferralId] = useState("");
  const [referralUpdate, setReferralUpdate] = useState({ status: "", notes: "" });
  const [nurtureForm, setNurtureForm] = useState({
    to_email: "",
    subject: "",
    body: "",
    refine_instruction: "",
    goal: "",
    tone: "",
    include_property_cards: true,
  });
  const [mortgageForm, setMortgageForm] = useState({
    price: "",
    down_payment: "",
    annual_rate: "",
    amort_years: "",
  });
  const [closingForm, setClosingForm] = useState({ price: "" });

  useEffect(() => {
    setActiveTab("lead_profile");
  }, [selectedLeadId]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const incomingPage = Number(searchParams.get("page") || "1");
    if (Number.isFinite(incomingPage) && incomingPage > 0 && incomingPage !== currentPage) {
      setCurrentPage(incomingPage);
    }
  }, [searchParams, currentPage]);

  // Compatibility redirect: old deep links `/leads?lead=<id>` -> `/leads/<id>`.
  useEffect(() => {
    if (!leadFromUrl) return;
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    router.replace(`/leads/${encodeURIComponent(leadFromUrl)}?page=${encodeURIComponent(String(pageNum))}`);
  }, [leadFromUrl, pageFromUrl, router]);

  const leadsQuery = useQuery({
    queryKey: ["leads", token, currentPage],
    enabled: Boolean(token),
    queryFn: () => fetchLeads({ token, page: currentPage, limit: 8 }),
  });

  const leadsPagination = useMemo(() => {
    const p = leadsQuery.data?.pagination || leadsQuery.data?.data?.pagination || {};
    const current = Number(p.current_page || p.page || currentPage || 1);
    const totalPages = Number(p.total_pages || p.totalPages || 1);
    const total = Number(p.total || 0);
    const hasPrev = typeof p.has_prev_page === "boolean" ? p.has_prev_page : current > 1;
    const hasNext =
      typeof p.has_next_page === "boolean"
        ? p.has_next_page
        : (Number.isFinite(totalPages) ? current < totalPages : false);
    return { current, totalPages, total, hasPrev, hasNext };
  }, [leadsQuery.data, currentPage]);

  const leadRows = useMemo(() => {
    const raw = leadsQuery.data?.leads;
    if (Array.isArray(raw)) return raw;
    return normalizeList(leadsQuery.data);
  }, [leadsQuery.data]);

  const conversations = useMemo(
    () => leadRows.map((row) => leadApiRowToConversationShape(row)).filter(Boolean),
    [leadRows]
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const meta = getConversationMeta(conversation);
      const intent = String(meta.intent || "").trim().toLowerCase();
      if (intentFilter && intent !== intentFilter) return false;
      return matchesSearch(conversation, searchTerm);
    });
  }, [conversations, intentFilter, searchTerm]);

  const leadDetailQuery = useQuery({
    queryKey: ["lead-detail", token, selectedLeadId],
    enabled: Boolean(token && selectedLeadId),
    queryFn: () => fetchLeadById({ token, id: selectedLeadId }),
  });

  useRecordLeadView(selectedLeadId, { token, enabled: Boolean(selectedLeadId) });

  const selectedConversation = useMemo(() => {
    const base = conversations.find((c) => String(getLeadMatchId(c)) === String(selectedLeadId));
    const detailLead = leadDetailQuery.data?.lead;
    if (!base && !detailLead) return null;
    const merged = detailLead ? { ...(base || {}), ...detailLead } : base;
    return leadApiRowToConversationShape(merged);
  }, [conversations, selectedLeadId, leadDetailQuery.data]);

  const actionConversationId = getActionConversationId(selectedConversation);

  const messagesQuery = useQuery({
    queryKey: ["lead-conversation", token, selectedLeadId],
    enabled: Boolean(token && selectedLeadId),
    queryFn: () =>
      fetchLeadConversation({ token, leadId: selectedLeadId, page: 1, limit: 200 }),
  });

  const messages = useMemo(() => {
    const raw = messagesQuery.data?.messages;
    if (Array.isArray(raw)) return raw;
    return normalizeList(messagesQuery.data);
  }, [messagesQuery.data]);

  const propertyMatchesQuery = useQuery({
    queryKey: ["lead-property-matches", token, selectedLeadId],
    enabled: Boolean(token && selectedLeadId && activeTab === "property_matches"),
    queryFn: () =>
      fetchLeadPropertyMatches({ token, leadId: selectedLeadId, page: 1, limit: 100 }),
  });

  const propertyMatches = useMemo(() => {
    const d = propertyMatchesQuery.data;
    const raw = d?.property_matches ?? d?.propertyMatches;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(d)) return d;
    return normalizeList(d);
  }, [propertyMatchesQuery.data]);

  const conversationMeta = useMemo(() => extractMeta(selectedConversation), [selectedConversation]);
  const messageMeta = useMemo(() => {
    const latestWithMeta = [...messages].reverse().find((msg) => {
      const meta = extractMessageMeta(msg);
      return Object.keys(meta || {}).length > 0;
    });
    return extractMessageMeta(latestWithMeta);
  }, [messages]);

  const referralsQuery = useQuery({
    queryKey: ["chat-referrals", token],
    enabled: Boolean(token),
    queryFn: () => fetchReferrals({ token }),
  });

  const referrals = useMemo(() => normalizeList(referralsQuery.data), [referralsQuery.data]);
  const conversationReferrals = useMemo(() => {
    if (!actionConversationId) return referrals;
    return referrals.filter(
      (ref) =>
        String(ref?.conversation_id || ref?.conversationId || "") ===
        String(actionConversationId)
    );
  }, [referrals, actionConversationId]);

  const nurtureLogsQuery = useQuery({
    queryKey: ["chat-nurture-logs", token, selectedLeadId],
    enabled: Boolean(token && selectedLeadId),
    queryFn: () => fetchNurtureLogs({ token, leadMatchId: selectedLeadId }),
  });

  const nurtureLogs = useMemo(() => normalizeList(nurtureLogsQuery.data), [nurtureLogsQuery.data]);

  const nurtureSuggestedEmail = useMemo(() => {
    const c = leadDetailQuery.data?.lead?.contact;
    const fromLead =
      c?.email || c?.canonical_email || selectedConversation?.email || selectedConversation?.visitor_email || "";
    return String(fromLead || "").trim();
  }, [leadDetailQuery.data?.lead, selectedConversation]);

  useEffect(() => {
    if (!selectedLeadId) return;
    setNurtureForm((prev) => ({
      ...prev,
      subject: "",
      body: "",
      refine_instruction: "",
      to_email: "",
    }));
  }, [selectedLeadId]);

  useEffect(() => {
    if (!selectedLeadId || !nurtureSuggestedEmail) return;
    setNurtureForm((prev) => {
      if (prev.to_email.trim()) return prev;
      return { ...prev, to_email: nurtureSuggestedEmail };
    });
  }, [selectedLeadId, nurtureSuggestedEmail]);

  const mortgageRunsQuery = useQuery({
    queryKey: ["chat-calculators", token, "mortgage"],
    enabled: Boolean(token),
    queryFn: () => fetchCalculatorRuns({ token, type: "mortgage" }),
  });

  const closingRunsQuery = useQuery({
    queryKey: ["chat-calculators", token, "closing"],
    enabled: Boolean(token),
    queryFn: () => fetchCalculatorRuns({ token, type: "closing" }),
  });

  const mortgageRuns = useMemo(
    () => normalizeList(mortgageRunsQuery.data),
    [mortgageRunsQuery.data]
  );
  const closingRuns = useMemo(() => normalizeList(closingRunsQuery.data), [closingRunsQuery.data]);

  const createReferralMutation = useMutation({
    mutationFn: () =>
      createReferral({
        token,
        payload: {
          ...referralForm,
          conversation_id: actionConversationId || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Referral created");
      setReferralForm((prev) => ({ ...prev, notes: "" }));
      queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to create referral"),
  });

  const updateReferralMutation = useMutation({
    mutationFn: () =>
      updateReferral({
        token,
        id: activeReferralId,
        payload: referralUpdate,
      }),
    onSuccess: () => {
      toast.success("Referral updated");
      setReferralUpdate({ status: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to update referral"),
  });

  const nurtureDraftMutation = useMutation({
    mutationFn: () =>
      postNurtureDraft({
        token,
        payload: {
          lead_match_id: selectedLeadId,
          goal: nurtureForm.goal?.trim() || undefined,
          tone: nurtureForm.tone?.trim() || undefined,
        },
      }),
    onSuccess: (data) => {
      const d = data?.draft;
      if (d) {
        setNurtureForm((prev) => ({
          ...prev,
          subject: d.subject ?? prev.subject,
          body: d.body_text ?? prev.body,
        }));
      }
      toast.success("Draft ready. Review and send.");
    },
    onError: (err) => toast.error(err?.message || "Could not generate draft"),
  });

  const nurtureRefineMutation = useMutation({
    mutationFn: () =>
      postNurtureRefine({
        token,
        payload: {
          lead_match_id: selectedLeadId,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          instruction: nurtureForm.refine_instruction.trim(),
        },
      }),
    onSuccess: (data) => {
      const d = data?.draft;
      if (d) {
        setNurtureForm((prev) => ({
          ...prev,
          subject: d.subject ?? prev.subject,
          body: d.body_text ?? prev.body,
          refine_instruction: "",
        }));
      }
      toast.success("Refined.");
    },
    onError: (err) => toast.error(err?.message || "Could not refine email"),
  });

  const nurtureMutation = useMutation({
    mutationFn: () =>
      sendNurtureEmail({
        token,
        payload: {
          lead_match_id: selectedLeadId,
          conversation_id: actionConversationId || undefined,
          to_email: nurtureForm.to_email?.trim() || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
        },
      }),
    onSuccess: () => {
      toast.success("Nurture email sent");
      setNurtureForm((prev) => ({
        ...prev,
        subject: "",
        body: "",
        refine_instruction: "",
      }));
      queryClient.invalidateQueries({ queryKey: ["chat-nurture-logs", token, selectedLeadId] });
    },
    onError: (err) => toast.error(err?.message || "Failed to send nurture email"),
  });

  const mortgageMutation = useMutation({
    mutationFn: () =>
      runMortgageCalculator({
        token,
        payload: {
          ...mortgageForm,
          conversation_id: actionConversationId || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Mortgage calculator run saved");
      queryClient.invalidateQueries({ queryKey: ["chat-calculators", token, "mortgage"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to run mortgage calculator"),
  });

  const closingMutation = useMutation({
    mutationFn: () =>
      runClosingCalculator({
        token,
        payload: {
          ...closingForm,
          conversation_id: actionConversationId || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Closing cost run saved");
      queryClient.invalidateQueries({ queryKey: ["chat-calculators", token, "closing"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to run closing cost calculator"),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => deleteLeadById({ token, id: selectedLeadId }),
    onSuccess: () => {
      const deletedLeadId = String(selectedLeadId);
      toast.success("Lead deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedLeadId("");
      queryClient.invalidateQueries({ queryKey: ["leads", token] });
      queryClient.removeQueries({ queryKey: ["lead-detail", token, deletedLeadId] });
      queryClient.removeQueries({ queryKey: ["lead-conversation", token, deletedLeadId] });
      queryClient.removeQueries({ queryKey: ["lead-property-matches", token, deletedLeadId] });
    },
    onError: (err) => toast.error(err?.message || "Failed to delete lead"),
  });

  const handleDeleteLead = () => {
    if (!selectedLeadId || deleteLeadMutation.isPending) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteLead = () => {
    if (!selectedLeadId || deleteLeadMutation.isPending) return;
    deleteLeadMutation.mutate();
  };

  // Keep SSR and first client render identical to avoid hydration mismatch on auth-gated pages.
  if (!hydrated) {
    return <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-6 space-y-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-[26px] leading-tight font-bold text-text-heading">Leads</h1>
              <p className="text-sm text-text-muted">
                Manage conversations, referrals, nurtures, and calculators.
              </p>
            </div>
            <div className="w-full max-w-[540px] sm:pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email, phone, city..."
                  className="h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-white px-2.5 text-[13px] leading-none placeholder:text-[12px] placeholder:text-text-muted/80 focus:outline-none"
                />
                <select
                  value={intentFilter}
                  onChange={(event) => setIntentFilter(event.target.value)}
                  className="h-9 w-[96px] rounded-md border border-primary/30 bg-primary/5 px-2 text-[12px] font-medium text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  aria-label="Filter by intent"
                >
                  <option value="">All</option>
                  <option value="buy">Buyer</option>
                  <option value="sell">Seller</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            {leadsQuery.isLoading ? (
              <div className="p-3 sm:p-4">
                <LeadsPageTableSkeleton rows={8} />
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-primary">
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  Loading leads…
                </p>
              </div>
            ) : leadsQuery.isError ? (
              <div className="p-4 text-sm text-red-600">Failed to load leads.</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-sm text-text-muted">No leads found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] table-auto">
                  <thead className="bg-primary/[0.04] border-b border-border">
                    <tr className="text-left text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                      <th className="px-3 py-2">Lead</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Intent</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Budget</th>
                      <th className="px-3 py-2">Matches</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConversations.map((conversation) => {
                      const id = String(getLeadMatchId(conversation));
                      const meta = getConversationMeta(conversation);
                      const contact = conversation?.contact || {};
                      const name =
                        contact?.full_name ||
                        conversation?.name ||
                        conversation?.visitor_name ||
                        conversation?.visitorName ||
                        "Unknown";
                      const email =
                        contact?.email ||
                        conversation?.email ||
                        conversation?.visitor_email ||
                        conversation?.visitorEmail ||
                        "No email";
                      const location =
                        conversation?.location ||
                        conversation?.city ||
                        conversation?.property?.location ||
                        "—";
                      const phone =
                        contact?.phone ||
                        conversation?.phone ||
                        conversation?.visitor_phone ||
                        conversation?.visitorPhone ||
                        "—";
                      const budget = formatBudgetValue(conversation);
                      const statusLabel = getStatusLabel(conversation, meta);
                      const matchesCount = getMatchesCount(conversation);
                      const isActive = selectedLeadId && String(selectedLeadId) === id;

                      return (
                        <tr
                          key={id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            router.push(
                              `/leads/${encodeURIComponent(id)}?page=${encodeURIComponent(String(currentPage))}`
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(
                                `/leads/${encodeURIComponent(id)}?page=${encodeURIComponent(String(currentPage))}`
                              );
                            }
                          }}
                          className={`border-b border-border/70 text-[13px] text-text-body transition cursor-pointer ${
                            isActive ? "bg-primary/[0.08]" : "hover:bg-primary/[0.05]"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-text-heading truncate">{name}</div>
                            <div className="text-[11px] text-primary-dark truncate">{email}</div>
                          </td>
                          <td className="px-3 py-2.5">{phone}</td>
                          <td className="px-3 py-2.5 capitalize">{String(meta.intent || "—")}</td>
                          <td className="px-3 py-2.5">{location}</td>
                          <td className="px-3 py-2.5">{budget === "N/A" ? <span className="inline-flex rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary-dark">N/A</span> : budget}</td>
                          <td className="px-3 py-2.5">{matchesCount}</td>
                          <td className="px-3 py-2.5">{meta.leadScore ?? "—"}</td>
                          <td className="px-3 py-2.5 capitalize">{String(meta.leadGrade || "—").replace(/_/g, " ")}</td>
                          <td className="px-3 py-2.5 capitalize">{statusLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-white p-3 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {leadsQuery.isFetching && !leadsQuery.isLoading ? (
                <span
                  className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                  aria-hidden
                />
              ) : null}
              <span>
                Page {leadsPagination.current} of {leadsPagination.totalPages}
                {Number.isFinite(leadsPagination.total) && leadsPagination.total > 0
                  ? ` · ${leadsPagination.total} total leads`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!leadsPagination.hasPrev || leadsQuery.isFetching}
                onClick={() => {
                  const nextPage = Math.max(1, leadsPagination.current - 1);
                  setCurrentPage(nextPage);
                  router.push(`/leads?page=${encodeURIComponent(String(nextPage))}`);
                }}
                className="h-8 px-3 rounded-md border border-border text-xs font-semibold text-text-heading hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!leadsPagination.hasNext || leadsQuery.isFetching}
                onClick={() => {
                  const nextPage = leadsPagination.current + 1;
                  setCurrentPage(nextPage);
                  router.push(`/leads?page=${encodeURIComponent(String(nextPage))}`);
                }}
                className="h-8 px-3 rounded-md border border-border text-xs font-semibold text-text-heading hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {selectedLeadId ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <LeadsWorkspaceTabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  endSlot={
                    <button
                      type="button"
                      onClick={handleDeleteLead}
                      disabled={deleteLeadMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-md px-2.5 py-1.5 bg-white hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Delete this lead"
                    >
                      <Trash2 size={14} aria-hidden />
                      {deleteLeadMutation.isPending ? "Deleting…" : "Delete"}
                    </button>
                  }
                />
              </div>

              {activeTab === "lead_details" ? (
                <LeadsDetailsTab
                  selectedConversation={selectedConversation}
                  lead={leadDetailQuery.data?.lead || null}
                  messageMeta={messageMeta}
                  getConversationMeta={getConversationMeta}
                  conversationMeta={conversationMeta}
                  formatMetaEntries={formatMetaEntries}
                  onOpenMeta={() => {}}
                />
              ) : null}

              {activeTab === "conversation" ? (
                <LeadsConversationTab
                  selectedConversation={selectedConversation}
                  messageMeta={messageMeta}
                  messagesQuery={messagesQuery}
                  messages={messages}
                  formatMetaEntries={formatMetaEntries}
                  onOpenMeta={() => {}}
                />
              ) : null}

              {activeTab === "actions" ? (
                <LeadsAiActionsTab
                  selectedConversation={selectedConversation}
                  lead={leadDetailQuery.data?.lead || null}
                />
              ) : null}

              {activeTab === "property_matches" ? (
                <LeadsPropertyMatchesTab
                  selectedConversation={selectedConversation}
                  lead={leadDetailQuery.data?.lead || null}
                  propertyMatches={propertyMatches}
                  propertyMatchesQuery={propertyMatchesQuery}
                  propertyMatchesPayload={propertyMatchesQuery.data || null}
                />
              ) : null}

              {activeTab === "lead_profile" ? (
                <LeadsProfileTab
                  selectedConversation={selectedConversation}
                  lead={leadDetailQuery.data?.lead || null}
                />
              ) : null}

              {activeTab === "others" ? (
                <LeadsActionsTab
                  referralForm={referralForm}
                  setReferralForm={setReferralForm}
                  createReferralMutation={createReferralMutation}
                  selectedLeadId={selectedLeadId}
                  actionConversationId={actionConversationId}
                  conversationReferrals={conversationReferrals}
                  activeReferralId={activeReferralId}
                  setActiveReferralId={setActiveReferralId}
                  referralUpdate={referralUpdate}
                  setReferralUpdate={setReferralUpdate}
                  updateReferralMutation={updateReferralMutation}
                  mortgageForm={mortgageForm}
                  setMortgageForm={setMortgageForm}
                  mortgageMutation={mortgageMutation}
                  mortgageRuns={mortgageRuns}
                  closingForm={closingForm}
                  setClosingForm={setClosingForm}
                  closingMutation={closingMutation}
                  closingRuns={closingRuns}
                />
              ) : null}

              {activeTab === "nurture" ? (
                <LeadsNurtureTab
                  nurtureForm={nurtureForm}
                  setNurtureForm={setNurtureForm}
                  nurtureMutation={nurtureMutation}
                  nurtureDraftMutation={nurtureDraftMutation}
                  nurtureRefineMutation={nurtureRefineMutation}
                  selectedLeadId={selectedLeadId}
                  actionConversationId={actionConversationId}
                  nurtureLogs={nurtureLogs}
                  nurtureLogsLoading={nurtureLogsQuery.isLoading}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5">
            <h3 className="text-base font-semibold text-text-heading">Delete lead?</h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              This will delete the lead, related conversation, and associated profile data when applicable.
              This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLeadMutation.isPending}
                className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLead}
                disabled={deleteLeadMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                {deleteLeadMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10" />
      }
    >
      <LeadsPageContent />
    </Suspense>
  );
}
