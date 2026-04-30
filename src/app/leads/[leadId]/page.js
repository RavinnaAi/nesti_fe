"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
  patchLead,
} from "@/lib/leadsClient";
import { cancelCalendlyAppointment } from "@/lib/calendarClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { getLeadWorkspaceTabsForRole } from "@/components/leads/LeadsWorkspaceTabs";
import { LEAD_WORKSPACE_TAB_IDS, normalizeLeadWorkspaceTabId } from "@/lib/leadWorkspaceTabsMeta";
import LeadsWorkspacePanels from "@/components/leads/LeadsWorkspacePanels";
import DeleteLeadConfirmModal from "@/components/leads/DeleteLeadConfirmModal";
import { LeadDetailPageSkeleton } from "@/components/ui/ContentSkeletons";
import {
  extractMessageMeta,
  getActionConversationId,
  normalizeLeadId,
  normalizeList,
  sanitizeInternalReturnPath,
} from "@/lib/leadsPageUtils";

function LeadWorkspacePageContent() {
  const { isAuthenticated } = useAuthGuard();
  const { token, user: authUser } = useAppSelector((state) => state.auth);
  const userRole = authUser?.role || "agent";
  const roleFilteredTabs = useMemo(() => getLeadWorkspaceTabsForRole(userRole), [userRole]);
  const allowedWorkspaceTabIds = useMemo(
    () => new Set(roleFilteredTabs.map((t) => t.id)),
    [roleFilteredTabs],
  );
  const defaultWorkspaceTab = roleFilteredTabs[0]?.id || "lead_profile";
  const params = useParams();
  const pathname = usePathname() || "";
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
  const listStatusQ = String(searchParams.get("status") || "").trim();
  const listPipelineQ = String(searchParams.get("pipeline") || "").trim();
  const rawTabParam = String(searchParams.get("tab") || "").trim();
  const tabFromUrl = normalizeLeadWorkspaceTabId(rawTabParam);
  const leadsListHref = useMemo(() => {
    const p = new URLSearchParams();
    const pageNum = Number.isFinite(backPage) && backPage > 0 ? backPage : 1;
    p.set("page", String(pageNum));
    if (listStatusQ) p.set("status", listStatusQ);
    if (listPipelineQ) p.set("pipeline", listPipelineQ);
    return `/leads?${p.toString()}`;
  }, [backPage, listStatusQ, listPipelineQ]);
  const returnHref = sanitizeInternalReturnPath(backParamRaw) || leadsListHref;
  const openedFromPipelineFilter = Boolean(listStatusQ || listPipelineQ);
  const backButtonLabel = returnHref.startsWith("/clients/")
    ? "Back to clients"
    : openedFromPipelineFilter
      ? "Back to pipeline list"
      : "Back to leads";

  const [referralForm, setReferralForm] = useState({
    professional_role: "",
    target_user_id: "",
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
    if (tabFromUrl && LEAD_WORKSPACE_TAB_IDS.has(tabFromUrl) && allowedWorkspaceTabIds.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab(defaultWorkspaceTab);
    }
  }, [tabFromUrl, leadId, allowedWorkspaceTabIds, defaultWorkspaceTab]);

  /** Canonicalize e.g. `tab=notes` → `tab=pipeline` without breaking bookmarks. */
  useEffect(() => {
    if (!rawTabParam) return;
    if (!tabFromUrl || !LEAD_WORKSPACE_TAB_IDS.has(tabFromUrl)) return;
    if (rawTabParam === tabFromUrl) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tabFromUrl);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [rawTabParam, tabFromUrl, pathname, router, searchParams]);

  /** Drop `tab` from the URL when it exists globally but is hidden for this role (e.g. lawyer / mortgage broker + property_matches). */
  useEffect(() => {
    if (!rawTabParam) return;
    if (!tabFromUrl || !LEAD_WORKSPACE_TAB_IDS.has(tabFromUrl)) return;
    if (allowedWorkspaceTabIds.has(tabFromUrl)) return;
    const p = new URLSearchParams(searchParams.toString());
    p.delete("tab");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [rawTabParam, tabFromUrl, pathname, router, searchParams, allowedWorkspaceTabIds]);

  useEffect(() => {
    if (!rawLeadIdParam || !leadId) return;
    if (rawLeadIdParam === leadId) return;
    const page = Number.isFinite(backPage) && backPage > 0 ? backPage : 1;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    const safeBack = sanitizeInternalReturnPath(backParamRaw);
    if (safeBack) qs.set("back", safeBack);
    if (listStatusQ) qs.set("status", listStatusQ);
    if (listPipelineQ) qs.set("pipeline", listPipelineQ);
    if (tabFromUrl && LEAD_WORKSPACE_TAB_IDS.has(tabFromUrl) && allowedWorkspaceTabIds.has(tabFromUrl)) {
      qs.set("tab", tabFromUrl);
    }
    router.replace(`/leads/${encodeURIComponent(leadId)}?${qs.toString()}`);
  }, [
    rawLeadIdParam,
    leadId,
    backPage,
    backParamRaw,
    listStatusQ,
    listPipelineQ,
    tabFromUrl,
    allowedWorkspaceTabIds,
    router,
  ]);

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

  const messages = useMemo(() => {
    const raw = messagesQuery.data?.messages;
    if (Array.isArray(raw)) return raw;
    return normalizeList(messagesQuery.data);
  }, [messagesQuery.data]);

  const propertyMatchesQuery = useQuery({
    queryKey: ["lead-property-matches", token, leadId],
    enabled: Boolean(token && leadId && activeTab === "property_matches"),
    queryFn: () => fetchLeadPropertyMatches({ token, leadId, page: 1, limit: 100 }),
  });

  const propertyMatches = useMemo(() => {
    const d = propertyMatchesQuery.data;
    const raw = d?.property_matches ?? d?.propertyMatches;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(d)) return d;
    return normalizeList(d);
  }, [propertyMatchesQuery.data]);

  const leadDetail = leadDetailQuery.data?.lead || null;

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
          target_vertical: referralForm.professional_role,
          target_user_id: referralForm.target_user_id,
          conversation_id: actionConversationId || undefined,
          notes: referralForm.notes || "",
        },
      }),
    onSuccess: () => {
      toast.success("Referral created");
      setReferralForm({
        professional_role: "",
        target_user_id: "",
        notes: "",
      });
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
      queryClient.invalidateQueries({ queryKey: ["lead-detail", token, leadId] });
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

  const cancelCalendlyMutation = useMutation({
    mutationFn: () => cancelCalendlyAppointment({ token, leadMatchId: leadId }),
    onSuccess: () => {
      toast.success("Appointment canceled in Calendly.");
      queryClient.invalidateQueries({ queryKey: ["leads", token], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", token, leadId] });
    },
    onError: (err) => toast.error(err?.message || "Could not cancel appointment"),
  });

  const selectTab = useCallback(
    (tabId) => {
      const next = allowedWorkspaceTabIds.has(tabId) ? tabId : defaultWorkspaceTab;
      setActiveTab(next);
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", next);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, allowedWorkspaceTabIds, defaultWorkspaceTab],
  );

  const patchLeadMutation = useMutation({
    mutationFn: (payload) => patchLead({ token, id: leadId, ...payload }),
    onSuccess: (data) => {
      toast.success("Lead updated");
      if (data?.lead) {
        queryClient.setQueryData(["lead-detail", token, leadId], (prev) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          success: true,
          lead: data.lead,
          conversation_id:
            data.conversation_id != null ? data.conversation_id : prev?.conversation_id ?? null,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ["leads", token], refetchType: "all" });
    },
    onError: (err) => toast.error(err?.message || "Could not update lead"),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => deleteLeadById({ token, id: leadId }),
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["leads", token], refetchType: "all" });
      queryClient.removeQueries({ queryKey: ["lead-detail", token, leadId] });
      queryClient.removeQueries({ queryKey: ["lead-conversation", token, leadId] });
      queryClient.removeQueries({ queryKey: ["lead-property-matches", token, leadId] });
      router.push(returnHref);
    },
    onError: (err) => toast.error(err?.message || "Failed to delete lead"),
  });

  if (!hydrated) return <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-6 space-y-4">
        <button
          type="button"
          onClick={() => router.push(returnHref)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
        >
          <ArrowLeft size={14} />
          {backButtonLabel}
        </button>

        {leadDetailQuery.isLoading ? (
          <LeadDetailPageSkeleton />
        ) : leadDetailQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 shadow-sm">
            {leadDetailQuery.error?.message || "Could not load this lead."}
          </div>
        ) : (
          <LeadsWorkspacePanels
            token={token}
            activeTab={activeTab}
            onActiveTabChange={selectTab}
            roleFilteredTabs={roleFilteredTabs}
            selectedLeadId={leadId}
            selectedConversation={selectedConversation}
            leadDetail={leadDetail}
            messageMeta={messageMeta}
            messages={messages}
            messagesQuery={messagesQuery}
            propertyMatches={propertyMatches}
            propertyMatchesQuery={propertyMatchesQuery}
            cancelCalendlyMutation={cancelCalendlyMutation}
            patchLeadMutation={patchLeadMutation}
            pipelineListFilterHint={
              openedFromPipelineFilter ? (
                <p className="text-xs text-text-muted leading-relaxed">
                  You opened this lead from a filtered pipeline view. Change the stage below.
                </p>
              ) : null
            }
            onConsultationGoToNurture={() => selectTab("nurture")}
            enableProfilePatch={false}
            referralForm={referralForm}
            setReferralForm={setReferralForm}
            createReferralMutation={createReferralMutation}
            activeReferralId={activeReferralId}
            setActiveReferralId={setActiveReferralId}
            referralUpdate={referralUpdate}
            setReferralUpdate={setReferralUpdate}
            updateReferralMutation={updateReferralMutation}
            actionConversationId={actionConversationId}
            conversationReferrals={conversationReferrals}
            mortgageForm={mortgageForm}
            setMortgageForm={setMortgageForm}
            mortgageMutation={mortgageMutation}
            mortgageRuns={mortgageRuns}
            closingForm={closingForm}
            setClosingForm={setClosingForm}
            closingMutation={closingMutation}
            closingRuns={closingRuns}
            nurtureForm={nurtureForm}
            setNurtureForm={setNurtureForm}
            nurtureMutation={nurtureMutation}
            nurtureDraftMutation={nurtureDraftMutation}
            nurtureRefineMutation={nurtureRefineMutation}
            nurtureLogs={nurtureLogs}
            nurtureLogsLoading={nurtureLogsQuery.isLoading}
            deleteLeadMutation={deleteLeadMutation}
            onDeleteClick={() => setShowDeleteConfirm(true)}
          />
        )}
      </div>

      <DeleteLeadConfirmModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (!leadId || deleteLeadMutation.isPending) return;
          deleteLeadMutation.mutate();
        }}
        isPending={deleteLeadMutation.isPending}
        description="This action cannot be undone."
      />
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
