"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, RefreshCw, CheckCircle2, XCircle, Users, DollarSign, Scale } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import {
  fetchConversations,
  fetchConversationMessages,
  fetchReferrals,
  createReferral,
  updateReferral,
  sendNurtureEmail,
  fetchNurtureLogs,
  runMortgageCalculator,
  runClosingCalculator,
  fetchCalculatorRuns,
} from "@/lib/chatClient";
import LeadListItem from "@/components/leads/LeadListItem";
import MessageBubble from "@/components/leads/MessageBubble";
import LeadActionSection from "@/components/leads/LeadActionSection";
import LeadScoreCard from "@/components/leads/LeadScoreCard";
import SelectDropdown from "@/components/ui/SelectDropdown";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getConversationId = (conversation) =>
  conversation?.id || conversation?.conversation_id || conversation?.conversationId;

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
    leadScore: conversation?.lead_score ?? conversation?.leadScore ?? "—",
    leadGrade: conversation?.lead_grade ?? conversation?.leadGrade ?? "—",
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
  const [selectedId, setSelectedId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [matchFilter, setMatchFilter] = useState("");

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

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations", token],
    enabled: Boolean(token),
    queryFn: () => fetchConversations({ token }),
  });

  const conversations = useMemo(
    () => normalizeList(conversationsQuery.data),
    [conversationsQuery.data]
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

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => getConversationId(conversation) === selectedId),
    [conversations, selectedId]
  );

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", token, selectedId],
    enabled: Boolean(token && selectedId),
    queryFn: () => fetchConversationMessages({ token, conversationId: selectedId }),
  });

  const messages = useMemo(() => normalizeList(messagesQuery.data), [messagesQuery.data]);

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
    if (!selectedId) return referrals;
    return referrals.filter(
      (ref) => String(ref?.conversation_id || ref?.conversationId || "") === String(selectedId)
    );
  }, [referrals, selectedId]);

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
          conversation_id: selectedId || undefined,
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
          conversation_id: selectedId || undefined,
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
          conversation_id: selectedId || undefined,
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
          conversation_id: selectedId || undefined,
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
            onClick={() => conversationsQuery.refetch()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Filter size={14} />
                Filter leads
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, phone, city..."
                className="w-full h-10 rounded-xl border border-border/60 bg-background-light/50 px-3 text-sm focus:outline-none"
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
              {conversationsQuery.isLoading ? (
                <div className="rounded-2xl border border-border bg-white p-4 text-sm text-text-muted">
                  Loading conversations...
                </div>
              ) : conversationsQuery.isError ? (
                <div className="rounded-2xl border border-border bg-white p-4 text-sm text-red-600">
                  Failed to load conversations.
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-4 text-sm text-text-muted">
                  No conversations found.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const id = getConversationId(conversation);
                  return (
                    <LeadListItem
                      key={id}
                      conversation={conversation}
                      active={id === selectedId}
                      onSelect={setSelectedId}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-text-heading">Conversation</div>
                <p className="text-xs text-text-muted">
                  {selectedConversation ? "Latest messages and lead metadata" : "Select a lead to view messages"}
                </p>
              </div>

              {selectedConversation && (
                <LeadScoreCard
                  score={getConversationMeta(selectedConversation).leadScore}
                  grade={getConversationMeta(selectedConversation).leadGrade}
                  breakdown={{
                    timeline: extractMeta(selectedConversation).timeline_score || 0,
                    budget: extractMeta(selectedConversation).budget_score || 0,
                    engagement: extractMeta(selectedConversation).engagement_score || 0
                  }}
                  reasons={extractMeta(selectedConversation).lead_reasons || []}
                />
              )}

              {selectedConversation ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {getConversationMeta(selectedConversation).isMatched === true ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                        <CheckCircle2 size={14} />
                        Matched Lead
                      </span>
                    ) : getConversationMeta(selectedConversation).isMatched === false ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                        <XCircle size={14} />
                        Mismatched Lead
                      </span>
                    ) : null}
                    {Object.entries(getConversationMeta(selectedConversation))
                      .filter(([key]) => key !== "isMatched")
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded-full bg-background-light border border-border/60 text-text-muted"
                        >
                          {String(key).charAt(0).toUpperCase() + String(key).slice(1)}: {String(value)}
                        </span>
                      ))}
                  </div>
                  {formatMetaEntries(conversationMeta).length > 0 ? (
                    <div>
                      <div className="text-xs font-semibold text-text-heading mb-1">
                        Conversation meta
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        {formatMetaEntries(conversationMeta).map(([key, value]) => (
                          <span
                            key={`meta-${key}`}
                            className="px-2 py-1 rounded-full bg-white border border-border"
                          >
                            {String(key)}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {formatMetaEntries(messageMeta).length > 0 ? (
                    <div>
                      <div className="text-xs font-semibold text-text-heading mb-1">
                        Latest message meta
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        {formatMetaEntries(messageMeta).map(([key, value]) => (
                          <span
                            key={`message-meta-${key}`}
                            className="px-2 py-1 rounded-full bg-white border border-border"
                          >
                            {String(key)}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="h-[360px] overflow-y-auto rounded-xl border border-border/60 bg-background-light/40 p-4 space-y-3">
                    {messagesQuery.isLoading ? (
                      <div className="text-sm text-text-muted">Loading messages...</div>
                    ) : messagesQuery.isError ? (
                      <div className="text-sm text-red-600">Failed to load messages.</div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-text-muted">No messages yet.</div>
                    ) : (
                      messages.map((message, index) => (
                        <MessageBubble key={`${index}-${message?.id || "msg"}`} message={message} />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-text-muted">Choose a lead to load the conversation.</div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LeadActionSection
                title="Referrals"
                subtitle="Connect this lead to another professional."
              >
                <div className="grid grid-cols-2 gap-2">
                  <SelectDropdown
                    placeholder="Select vertical"
                    value={referralForm.target_vertical}
                    onChange={(value) =>
                      setReferralForm((prev) => ({ ...prev, target_vertical: value }))
                    }
                    options={[
                      { value: "realtor", label: "Realtor", icon: Users },
                      { value: "mortgage", label: "Mortgage Broker", icon: DollarSign },
                      { value: "lawyer", label: "Real Estate Lawyer", icon: Scale },
                    ]}
                    size="small"
                  />
                  <input
                    type="text"
                    value={referralForm.target_user_id}
                    onChange={(event) =>
                      setReferralForm((prev) => ({ ...prev, target_user_id: event.target.value }))
                    }
                    placeholder="Target user id"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                  <input
                    type="text"
                    value={referralForm.status}
                    onChange={(event) =>
                      setReferralForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                    placeholder="Status"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                  <input
                    type="text"
                    value={referralForm.notes}
                    onChange={(event) =>
                      setReferralForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder="Notes"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => createReferralMutation.mutate()}
                  disabled={!selectedId || createReferralMutation.isLoading}
                  className="w-full h-9 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                >
                  {createReferralMutation.isLoading ? "Saving..." : "Create referral"}
                </button>
                <div className="space-y-2 text-xs">
                  {conversationReferrals.length === 0 ? (
                    <div className="text-text-muted">No referrals yet.</div>
                  ) : (
                    conversationReferrals.map((referral) => (
                      <button
                        key={referral?.id}
                        type="button"
                        onClick={() => setActiveReferralId(String(referral?.id))}
                        className={`w-full text-left rounded-xl border px-3 py-2 ${String(referral?.id) === String(activeReferralId)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                          }`}
                      >
                        <div className="font-semibold text-text-heading">
                          {referral?.target_vertical || "Referral"}
                        </div>
                        <div className="text-text-muted">
                          Status: {referral?.status || "—"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {activeReferralId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={referralUpdate.status}
                      onChange={(event) =>
                        setReferralUpdate((prev) => ({ ...prev, status: event.target.value }))
                      }
                      placeholder="Update status"
                      className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                    />
                    <input
                      type="text"
                      value={referralUpdate.notes}
                      onChange={(event) =>
                        setReferralUpdate((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Update notes"
                      className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                    />
                    <button
                      type="button"
                      onClick={() => updateReferralMutation.mutate()}
                      disabled={updateReferralMutation.isLoading}
                      className="w-full h-9 rounded-lg border border-primary text-primary text-xs font-semibold disabled:opacity-50"
                    >
                      {updateReferralMutation.isLoading ? "Updating..." : "Update referral"}
                    </button>
                  </div>
                ) : null}
              </LeadActionSection>

              <LeadActionSection
                title="Nurture email"
                subtitle="Send a nurture message and log it for this conversation."
              >
                <div className="space-y-2">
                  <input
                    type="email"
                    value={nurtureForm.to_email}
                    onChange={(event) =>
                      setNurtureForm((prev) => ({ ...prev, to_email: event.target.value }))
                    }
                    placeholder="Recipient email"
                    className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                  />
                  <input
                    type="text"
                    value={nurtureForm.subject}
                    onChange={(event) =>
                      setNurtureForm((prev) => ({ ...prev, subject: event.target.value }))
                    }
                    placeholder="Subject"
                    className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                  />
                  <textarea
                    rows={3}
                    value={nurtureForm.body}
                    onChange={(event) =>
                      setNurtureForm((prev) => ({ ...prev, body: event.target.value }))
                    }
                    placeholder="Message body"
                    className="rounded-lg border border-border px-2 py-2 text-xs w-full"
                  />
                  <input
                    type="text"
                    value={nurtureForm.template_key}
                    onChange={(event) =>
                      setNurtureForm((prev) => ({ ...prev, template_key: event.target.value }))
                    }
                    placeholder="Template key (optional)"
                    className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                  />
                  <button
                    type="button"
                    onClick={() => nurtureMutation.mutate()}
                    disabled={!selectedId || nurtureMutation.isLoading}
                    className="w-full h-9 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {nurtureMutation.isLoading ? "Sending..." : "Send nurture"}
                  </button>
                  <div className="text-xs text-text-muted">
                    {nurtureLogs.length ? `Logs: ${nurtureLogs.length}` : "No nurture logs yet."}
                  </div>
                </div>
              </LeadActionSection>

              <LeadActionSection title="Mortgage calculator" subtitle="Log a mortgage estimate.">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={mortgageForm.price}
                    onChange={(event) =>
                      setMortgageForm((prev) => ({ ...prev, price: event.target.value }))
                    }
                    placeholder="Price"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                  <input
                    type="number"
                    value={mortgageForm.down_payment}
                    onChange={(event) =>
                      setMortgageForm((prev) => ({ ...prev, down_payment: event.target.value }))
                    }
                    placeholder="Down payment"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                  <input
                    type="number"
                    value={mortgageForm.annual_rate}
                    onChange={(event) =>
                      setMortgageForm((prev) => ({ ...prev, annual_rate: event.target.value }))
                    }
                    placeholder="Annual rate %"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                  <input
                    type="number"
                    value={mortgageForm.amort_years}
                    onChange={(event) =>
                      setMortgageForm((prev) => ({ ...prev, amort_years: event.target.value }))
                    }
                    placeholder="Amort years"
                    className="h-9 rounded-lg border border-border px-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => mortgageMutation.mutate()}
                  disabled={!selectedId || mortgageMutation.isLoading}
                  className="w-full h-9 rounded-lg border border-primary text-primary text-xs font-semibold disabled:opacity-50"
                >
                  {mortgageMutation.isLoading ? "Running..." : "Run mortgage"}
                </button>
                <div className="text-xs text-text-muted">
                  {mortgageRuns.length ? `Runs: ${mortgageRuns.length}` : "No mortgage runs yet."}
                </div>
              </LeadActionSection>

              <LeadActionSection title="Closing cost" subtitle="Log a closing cost estimate.">
                <div className="space-y-2">
                  <input
                    type="number"
                    value={closingForm.price}
                    onChange={(event) =>
                      setClosingForm((prev) => ({ ...prev, price: event.target.value }))
                    }
                    placeholder="Price"
                    className="h-9 rounded-lg border border-border px-2 text-xs w-full"
                  />
                  <button
                    type="button"
                    onClick={() => closingMutation.mutate()}
                    disabled={!selectedId || closingMutation.isLoading}
                    className="w-full h-9 rounded-lg border border-primary text-primary text-xs font-semibold disabled:opacity-50"
                  >
                    {closingMutation.isLoading ? "Running..." : "Run closing cost"}
                  </button>
                  <div className="text-xs text-text-muted">
                    {closingRuns.length ? `Runs: ${closingRuns.length}` : "No closing runs yet."}
                  </div>
                </div>
              </LeadActionSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
