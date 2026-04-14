"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import {
  fetchReferrals,
  createReferral,
  updateReferral,
  sendNurtureEmail,
  fetchNurtureLogs,
  runMortgageCalculator,
  runClosingCalculator,
  fetchCalculatorRuns,
} from "@/lib/chatClient";
import { fetchLeads, fetchLeadById, fetchLeadConversation, fetchLeadPropertyMatches } from "@/lib/leadsClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import LeadListItem from "@/components/leads/LeadListItem";
import SelectDropdown from "@/components/ui/SelectDropdown";
import LeadsWorkspaceTabs from "@/components/leads/LeadsWorkspaceTabs";
import LeadsDetailsTab from "@/components/leads/LeadsDetailsTab";
import LeadsConversationTab from "@/components/leads/LeadsConversationTab";
import LeadsProfileTab from "@/components/leads/LeadsProfileTab";
import LeadsActionsTab from "@/components/leads/LeadsActionsTab";
import LeadsNurtureTab from "@/components/leads/LeadsNurtureTab";
import LeadsAiActionsTab from "@/components/leads/LeadsAiActionsTab";
import LeadsPropertyMatchesTab from "@/components/leads/LeadsPropertyMatchesTab";

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

export default function LeadsPage() {
  const { isAuthenticated } = useAuthGuard();
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [matchFilter, setMatchFilter] = useState("");
  const [activeTab, setActiveTab] = useState("lead_profile");

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
    template_key: "",
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

  const leadsQuery = useQuery({
    queryKey: ["leads", token],
    enabled: Boolean(token),
    queryFn: () => fetchLeads({ token, page: 1, limit: 100 }),
  });

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
      if (intentFilter && String(meta.intent) !== intentFilter) return false;
      if (gradeFilter && String(meta.leadGrade) !== gradeFilter) return false;
      if (channelFilter && String(meta.channel) !== channelFilter) return false;
      if (matchFilter === "matched" && meta.isMatched !== true) return false;
      if (matchFilter === "mismatched" && meta.isMatched !== false) return false;
      return matchesSearch(conversation, searchTerm);
    });
  }, [conversations, intentFilter, gradeFilter, channelFilter, matchFilter, searchTerm]);

  const leadDetailQuery = useQuery({
    queryKey: ["lead-detail", token, selectedLeadId],
    enabled: Boolean(token && selectedLeadId),
    queryFn: () => fetchLeadById({ token, id: selectedLeadId }),
  });

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
      fetchLeadPropertyMatches({ token, leadId: selectedLeadId, page: 1, limit: 12 }),
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
    queryKey: ["chat-nurture-logs", token],
    enabled: Boolean(token),
    queryFn: () => fetchNurtureLogs({ token }),
  });

  const nurtureLogs = useMemo(() => normalizeList(nurtureLogsQuery.data), [nurtureLogsQuery.data]);

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

  const nurtureMutation = useMutation({
    mutationFn: () =>
      sendNurtureEmail({
        token,
        payload: {
          ...nurtureForm,
          conversation_id: actionConversationId || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Nurture email sent");
      setNurtureForm({ to_email: "", subject: "", body: "", template_key: "" });
      queryClient.invalidateQueries({ queryKey: ["chat-nurture-logs"] });
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

  const intents = useMemo(() => {
    const values = new Set();
    conversations.forEach((conversation) => values.add(String(getConversationMeta(conversation).intent)));
    return Array.from(values).filter(Boolean);
  }, [conversations]);

  const grades = useMemo(() => {
    const values = new Set();
    conversations.forEach((conversation) => values.add(String(getConversationMeta(conversation).leadGrade)));
    return Array.from(values).filter(Boolean);
  }, [conversations]);

  const channels = useMemo(() => {
    const values = new Set();
    conversations.forEach((conversation) => values.add(String(getConversationMeta(conversation).channel)));
    return Array.from(values).filter(Boolean);
  }, [conversations]);

  // Keep SSR and first client render identical to avoid hydration mismatch on auth-gated pages.
  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-heading">Leads</h1>
            <p className="text-sm text-text-muted">
              Manage conversations, referrals, nurtures, and calculators.
            </p>
          </div>
          <button
            type="button"
            onClick={() => leadsQuery.refetch()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary border border-primary/30 rounded-md px-3 py-2 hover:bg-primary/5 transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-md border border-border bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Filter size={14} />
                Filter leads
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, phone, city..."
                className="w-full h-10 rounded-md border border-border/60 bg-background-light/50 px-3 text-sm focus:outline-none"
              />
              <div className="flex align-middle flex-wrap gap-2">
                <SelectDropdown
                  placeholder="Intent"
                  value={intentFilter}
                  onChange={setIntentFilter}
                  options={[
                    { value: "", label: "All Intents" },
                    ...intents.map((intent) => ({ value: intent, label: intent })),
                  ]}
                  className="!w-auto"
                  size="small"
                />
                <SelectDropdown
                  placeholder="Grade"
                  value={gradeFilter}
                  onChange={setGradeFilter}
                  options={[
                    { value: "", label: "All Grades" },
                    ...grades.map((grade) => ({ value: grade, label: grade })),
                  ]}
                  className="!w-auto"
                  size="small"
                />
                <SelectDropdown
                  placeholder="Channel"
                  value={channelFilter}
                  onChange={setChannelFilter}
                  options={[
                    { value: "", label: "All Channels" },
                    ...channels.map((channel) => ({ value: channel, label: channel })),
                  ]}
                  className="!w-auto"
                  size="small"
                />
                <SelectDropdown
                  placeholder="Match Status"
                  value={matchFilter}
                  onChange={setMatchFilter}
                  options={[
                    { value: "", label: "All Leads" },
                    { value: "matched", label: "Matched" },
                    { value: "mismatched", label: "Mismatched" },
                  ]}
                  className="!w-auto"
                  size="small"
                />
              </div>
            </div>

            <div className="space-y-3">
              {leadsQuery.isLoading ? (
                <div className="rounded-md border border-border bg-white p-4 text-sm text-text-muted">
                  Loading leads...
                </div>
              ) : leadsQuery.isError ? (
                <div className="rounded-md border border-border bg-white p-4 text-sm text-red-600">
                  Failed to load leads.
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="rounded-md border border-border bg-white p-4 text-sm text-text-muted">
                  No leads found.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const id = getLeadMatchId(conversation);
                  return (
                    <LeadListItem
                      key={id}
                      conversation={conversation}
                      active={String(id) === String(selectedLeadId)}
                      onSelect={(newId) => {
                        setSelectedLeadId(newId);
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <LeadsWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

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
                selectedLeadId={selectedLeadId}
                actionConversationId={actionConversationId}
                nurtureLogs={nurtureLogs}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
