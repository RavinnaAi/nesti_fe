"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
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
import { LeadDetailPageSkeleton } from "@/components/ui/ContentSkeletons";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
};

const getActionConversationId = (lead) =>
  lead?.conversation_id || lead?.conversationId || "";

const getConversationMeta = (conversation) => {
  let isMatched = conversation?.is_matched ?? conversation?.matched ?? null;
  if (isMatched === null) {
    const matchStatus = conversation?.match_status;
    if (matchStatus === "matched" || matchStatus === true) {
      isMatched = true;
    } else {
      isMatched =
        conversation?.meta?.is_matched ??
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

function normalizeLeadId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const fromQuery = decoded.match(/[?&]lead=([a-fA-F0-9]{24})/);
  if (fromQuery?.[1]) return fromQuery[1];
  const idMatch = decoded.match(/([a-fA-F0-9]{24})/);
  return idMatch?.[1] || "";
}

/** Same-origin path (optional ?query) for router.push; blocks open redirects. */
function sanitizeInternalReturnPath(raw) {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (!value) return "";
  try {
    value = decodeURIComponent(value);
  } catch {
    return "";
  }
  value = value.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  if (/[\r\n\0]/.test(value)) return "";
  const lower = value.toLowerCase();
  if (lower.startsWith("/\\") || lower.includes("://")) return "";
  const pathOnly = value.split("?")[0] || "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.includes("//")) return "";
  return value;
}

function LeadWorkspacePageContent() {
  const { isAuthenticated } = useAuthGuard();
  const { token } = useAppSelector((state) => state.auth);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState("lead_profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const rawLeadIdParam = String(params?.leadId || "").trim();
  const leadId = normalizeLeadId(rawLeadIdParam);
  const backPage = Number(searchParams.get("page") || "1");
  const backParamRaw = searchParams.get("back");
  const leadsListHref = `/leads?page=${Number.isFinite(backPage) && backPage > 0 ? backPage : 1}`;
  const returnHref = sanitizeInternalReturnPath(backParamRaw) || leadsListHref;
  const backButtonLabel = returnHref.startsWith("/clients/") ? "Back to clients" : "Back to leads";

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
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!rawLeadIdParam || !leadId) return;
    if (rawLeadIdParam === leadId) return;
    const page = Number.isFinite(backPage) && backPage > 0 ? backPage : 1;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    const safeBack = sanitizeInternalReturnPath(backParamRaw);
    if (safeBack) qs.set("back", safeBack);
    router.replace(`/leads/${encodeURIComponent(leadId)}?${qs.toString()}`);
  }, [rawLeadIdParam, leadId, backPage, backParamRaw, router]);

  const leadDetailQuery = useQuery({
    queryKey: ["lead-detail", token, leadId],
    enabled: Boolean(token && leadId),
    queryFn: () => fetchLeadById({ token, id: leadId }),
  });

  useRecordLeadView(leadId, { token, enabled: Boolean(leadId) });

  const selectedConversation = useMemo(() => {
    const detailLead = leadDetailQuery.data?.lead;
    if (!detailLead) return null;
    return leadApiRowToConversationShape(detailLead);
  }, [leadDetailQuery.data]);

  const actionConversationId = getActionConversationId(selectedConversation);

  const messagesQuery = useQuery({
    queryKey: ["lead-conversation", token, leadId],
    enabled: Boolean(token && leadId),
    queryFn: () => fetchLeadConversation({ token, leadId, page: 1, limit: 200 }),
  });

  const messages = useMemo(() => normalizeList(messagesQuery.data), [messagesQuery.data]);

  const propertyMatchesQuery = useQuery({
    queryKey: ["lead-property-matches", token, leadId],
    enabled: Boolean(token && leadId && activeTab === "property_matches"),
    queryFn: () => fetchLeadPropertyMatches({ token, leadId, page: 1, limit: 100 }),
  });

  const propertyMatches = useMemo(() => {
    const d = propertyMatchesQuery.data;
    const raw = d?.property_matches ?? d?.propertyMatches;
    if (Array.isArray(raw)) return raw;
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
    queryKey: ["chat-nurture-logs", token, leadId],
    enabled: Boolean(token && leadId),
    queryFn: () => fetchNurtureLogs({ token, leadMatchId: leadId }),
  });
  const nurtureLogs = useMemo(() => normalizeList(nurtureLogsQuery.data), [nurtureLogsQuery.data]);

  const nurtureSuggestedEmail = useMemo(() => {
    const c = leadDetailQuery.data?.lead?.contact;
    const fromLead =
      c?.email || c?.canonical_email || selectedConversation?.email || selectedConversation?.visitor_email || "";
    return String(fromLead || "").trim();
  }, [leadDetailQuery.data?.lead, selectedConversation]);

  useEffect(() => {
    if (!leadId || !nurtureSuggestedEmail) return;
    setNurtureForm((prev) => {
      if (prev.to_email.trim()) return prev;
      return { ...prev, to_email: nurtureSuggestedEmail };
    });
  }, [leadId, nurtureSuggestedEmail]);

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
  const mortgageRuns = useMemo(() => normalizeList(mortgageRunsQuery.data), [mortgageRunsQuery.data]);
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
          lead_match_id: leadId,
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
          lead_match_id: leadId,
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
          lead_match_id: leadId,
          conversation_id: actionConversationId || undefined,
          to_email: nurtureForm.to_email?.trim() || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
        },
      }),
    onSuccess: () => {
      toast.success("Nurture email sent");
      queryClient.invalidateQueries({ queryKey: ["chat-nurture-logs", token, leadId] });
    },
    onError: (err) => toast.error(err?.message || "Failed to send nurture email"),
  });

  const mortgageMutation = useMutation({
    mutationFn: () =>
      runMortgageCalculator({
        token,
        payload: { ...mortgageForm, conversation_id: actionConversationId || undefined },
      }),
    onSuccess: () => {
      toast.success("Mortgage calculator run saved");
      queryClient.invalidateQueries({ queryKey: ["chat-calculators", token, "mortgage"] });
    },
  });

  const closingMutation = useMutation({
    mutationFn: () =>
      runClosingCalculator({
        token,
        payload: { ...closingForm, conversation_id: actionConversationId || undefined },
      }),
    onSuccess: () => {
      toast.success("Closing cost run saved");
      queryClient.invalidateQueries({ queryKey: ["chat-calculators", token, "closing"] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => deleteLeadById({ token, id: leadId }),
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      router.push(returnHref);
    },
    onError: (err) => toast.error(err?.message || "Failed to delete lead"),
  });

  if (!hydrated) return <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(returnHref)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
          >
            <ArrowLeft size={14} />
            {backButtonLabel}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <LeadsWorkspaceTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            endSlot={
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteLeadMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-md px-2.5 py-1.5 bg-white hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} aria-hidden />
                {deleteLeadMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            }
          />
        </div>

        {leadDetailQuery.isLoading ? (
          <LeadDetailPageSkeleton />
        ) : leadDetailQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 shadow-sm">
            {leadDetailQuery.error?.message || "Could not load this lead."}
          </div>
        ) : (
          <>
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
                selectedLeadId={leadId}
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
                selectedLeadId={leadId}
                actionConversationId={actionConversationId}
                nurtureLogs={nurtureLogs}
                nurtureLogsLoading={nurtureLogsQuery.isLoading}
              />
            ) : null}
          </>
        )}
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5">
            <h3 className="text-base font-semibold text-text-heading">Delete lead?</h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLeadMutation.isPending}
                className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteLeadMutation.mutate()}
                disabled={deleteLeadMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
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

export default function LeadWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10 px-5 md:px-6 py-6">
          <LeadDetailPageSkeleton />
        </div>
      }
    >
      <LeadWorkspacePageContent />
    </Suspense>
  );
}
