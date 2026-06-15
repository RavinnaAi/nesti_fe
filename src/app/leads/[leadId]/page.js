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
  fetchLeadReferrals,
  createReferral,
  updateReferral,
  sendNurtureEmail,
  fetchNurtureLogs,
  postNurtureDraft,
  postNurtureRefine,
  postNurturePreview,
} from "@/lib/chatClient";
import {
  fetchLeadById,
  fetchLeadInquiredProperty,
  fetchLeadPropertyMatches,
  deleteLeadById,
  patchLead,
} from "@/lib/leadsClient";
import { fetchAllLeadConversationMessages } from "@/lib/leadConversationClient";
import { cancelCalendlyAppointment } from "@/lib/calendarClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { getLeadWorkspaceTabsForRole } from "@/components/leads/LeadsWorkspaceTabs";
import {
  LEAD_WORKSPACE_TAB_IDS,
  normalizeLeadWorkspaceTabId,
  filterLeadWorkspaceTabsForPlan,
} from "@/lib/leadWorkspaceTabsMeta";
import { FEATURES } from "@/constants/features";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import PlanLimitBanner from "@/components/billing/PlanLimitBanner";
import LeadsWorkspacePanels from "@/components/leads/LeadsWorkspacePanels";
import DeleteLeadConfirmModal from "@/components/leads/DeleteLeadConfirmModal";
import { LeadDetailPageSkeleton } from "@/components/ui/ContentSkeletons";
import {
  extractMessageMeta,
  getActionConversationId,
  getPropertyMatchesTabLabel,
  normalizeLeadId,
  isDirectInquiryLead,
  normalizeList,
  sanitizeInternalReturnPath,
} from "@/lib/leadsPageUtils";
import {
  hasInquiredPropertyContext,
  inquiredPropertyFromLead,
  needsInquiredPropertySellerFetch,
} from "@/lib/inquiredPropertyUtils";

const LEAD_WORKSPACE_QUERY_STALE_MS = 15_000;

function stripListingBulletRows(text) {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const isListingBullet = (value) => {
    const s = String(value || "").trim().replace(/^_+/, "").trim();
    if (!/^[-*]\s+/.test(s)) return false;
    const lower = s.toLowerCase();
    return /\$[\d,]/.test(s) || /bed|bath|budget|stretch|area match|property type|match/i.test(lower);
  };
  let i = 0;
  while (i < lines.length) {
    const line = String(lines[i] || "").trim();
    if (/^matched options include\s*:/i.test(line)) {
      i += 1;
      while (i < lines.length && (!String(lines[i] || "").trim() || isListingBullet(lines[i]))) i += 1;
      continue;
    }
    if (isListingBullet(line)) {
      i += 1;
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function LeadWorkspacePageContent() {
  const { isAuthenticated } = useAuthGuard();
  const { token, user: authUser } = useAppSelector((state) => state.auth);
  const userRole = authUser?.role || "agent";
  const { hasFeature } = useFeatureAccess();
  const roleFilteredTabs = useMemo(() => getLeadWorkspaceTabsForRole(userRole), [userRole]);
  const planFilteredTabs = useMemo(
    () => filterLeadWorkspaceTabsForPlan(roleFilteredTabs, hasFeature),
    [roleFilteredTabs, hasFeature],
  );
  const allowedWorkspaceTabIds = useMemo(
    () => new Set(planFilteredTabs.map((t) => t.id)),
    [planFilteredTabs],
  );
  const defaultWorkspaceTab = planFilteredTabs[0]?.id || "lead_profile";
  const canViewConversation = hasFeature(FEATURES.CRM_LEAD_CONVERSATION);
  const canViewPropertyMatches = hasFeature(FEATURES.LEADS_INSIGHTS_ADVANCED);
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
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    enabled: Boolean(
      token && leadId && canViewConversation && activeTab === "conversation",
    ),
    queryFn: () => fetchAllLeadConversationMessages({ token, leadId }),
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const messages = useMemo(() => {
    const raw = messagesQuery.data?.messages;
    if (Array.isArray(raw)) return raw;
    return normalizeList(messagesQuery.data);
  }, [messagesQuery.data]);

  const leadDetail = leadDetailQuery.data?.lead || null;
  const leadDetailLoaded = Boolean(leadDetailQuery.isSuccess && leadDetail);
  const inquiredProperty = inquiredPropertyFromLead(leadDetail);
  const hasInquiredProperty = hasInquiredPropertyContext(leadDetail);
  const needsSellerLeadFetch = needsInquiredPropertySellerFetch(leadDetail);

  const propertyMatchesQuery = useQuery({
    queryKey: ["lead-property-matches", token, leadId],
    enabled: Boolean(
      token &&
        leadId &&
        canViewPropertyMatches &&
        leadDetailLoaded &&
        activeTab === "property_matches" &&
        !hasInquiredProperty,
    ),
    queryFn: () => fetchLeadPropertyMatches({ token, leadId, page: 1, limit: 100 }),
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const inquiredPropertyQuery = useQuery({
    queryKey: ["lead-inquired-property", token, leadId],
    enabled: Boolean(
      token &&
        leadId &&
        canViewPropertyMatches &&
        needsSellerLeadFetch &&
        activeTab === "property_matches",
    ),
    queryFn: () => fetchLeadInquiredProperty({ token, id: leadId }),
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const inquiredSellerLeadDetail = inquiredPropertyQuery.data?.seller_lead || null;
  const inquiredSellerConversation = useMemo(() => {
    if (!inquiredSellerLeadDetail) return null;
    return leadApiRowToConversationShape(inquiredSellerLeadDetail);
  }, [inquiredSellerLeadDetail]);

  const propertyMatches = useMemo(() => {
    const d = propertyMatchesQuery.data;
    const raw = d?.property_matches ?? d?.propertyMatches;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(d)) return d;
    return normalizeList(d);
  }, [propertyMatchesQuery.data]);
  const hideConversationTab = useMemo(() => isDirectInquiryLead(leadDetail), [leadDetail]);
  const visibleWorkspaceTabs = useMemo(() => {
    let tabs = filterLeadWorkspaceTabsForPlan(roleFilteredTabs, hasFeature);
    if (hideConversationTab) {
      tabs = tabs.filter((tab) => tab.id !== "conversation");
    }
    const propertyMatchesLabel = getPropertyMatchesTabLabel(leadDetail);
    return tabs.map((tab) =>
      tab.id === "property_matches" ? { ...tab, label: propertyMatchesLabel } : tab,
    );
  }, [roleFilteredTabs, hideConversationTab, leadDetail, hasFeature]);

  const defaultVisibleTab = visibleWorkspaceTabs[0]?.id || defaultWorkspaceTab;

  useEffect(() => {
    const active = tabFromUrl || activeTab;
    const allowed = new Set(visibleWorkspaceTabs.map((t) => t.id));
    if (!active || allowed.has(active)) return;
    setActiveTab(defaultVisibleTab);
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", defaultVisibleTab);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [
    visibleWorkspaceTabs,
    tabFromUrl,
    activeTab,
    defaultVisibleTab,
    searchParams,
    pathname,
    router,
  ]);

  const messageMeta = useMemo(() => {
    const latestWithMeta = [...messages].reverse().find((msg) => {
      const meta = extractMessageMeta(msg);
      return Object.keys(meta || {}).length > 0;
    });
    return extractMessageMeta(latestWithMeta);
  }, [messages]);

  const referralsQuery = useQuery({
    queryKey: ["lead-referrals", token, leadId],
    // Fix #8 — only fetch when the referrals tab ("others") is active
    enabled: Boolean(token && leadId && activeTab === "others"),
    queryFn: () => fetchLeadReferrals({ token, leadMatchId: leadId }),
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const referrals = useMemo(() => normalizeList(referralsQuery.data), [referralsQuery.data]);
  const conversationReferrals = useMemo(() => referrals, [referrals]);

  const nurtureLogsQuery = useQuery({
    queryKey: ["chat-nurture-logs", token, leadId],
    // Fix #8 — only fetch when the nurture tab is active
    enabled: Boolean(token && leadId && activeTab === "nurture"),
    queryFn: () => fetchNurtureLogs({ token, leadMatchId: leadId }),
    staleTime: LEAD_WORKSPACE_QUERY_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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

  const createReferralMutation = useMutation({
    mutationFn: () =>
      createReferral({
        token,
        payload: {
          target_vertical: referralForm.professional_role,
          target_user_id: referralForm.target_user_id,
          lead_match_id: leadId || undefined,
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
      queryClient.invalidateQueries({ queryKey: ["lead-referrals", token, leadId] });
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
      queryClient.invalidateQueries({ queryKey: ["lead-referrals", token, leadId] });
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
          body: stripListingBulletRows(d.body_text ?? prev.body),
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
          body: stripListingBulletRows(d.body_text ?? prev.body),
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

  const nurturePreviewMutation = useMutation({
    mutationFn: () =>
      postNurturePreview({
        token,
        payload: {
          lead_match_id: leadId,
          conversation_id: actionConversationId || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
        },
      }),
    onError: (err) => toast.error(err?.message || "Failed to build email preview"),
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
    [
      pathname,
      router,
      searchParams,
      allowedWorkspaceTabIds,
      defaultWorkspaceTab,
    ],
  );

  const patchLeadMutation = useMutation({
    mutationFn: (payload) => patchLead({ token, id: leadId, ...payload }),
    onSuccess: (data, variables) => {
      const isNoteOnly =
        variables?.note &&
        !variables?.match_status &&
        !variables?.close_reason &&
        !variables?.agent_closing_checklist &&
        !variables?.lawyer_closing_checklist &&
        !variables?.mortgage_closing_checklist &&
        variables?.closed_value == null;
      toast.success(isNoteOnly ? "Note added" : "Lead updated");
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
      <div className="w-full px-5 md:px-6 py-5 md:py-6 space-y-4">
        <button
          type="button"
          onClick={() => router.push(returnHref)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
        >
          <ArrowLeft size={14} />
          {backButtonLabel}
        </button>

        <PlanLimitBanner />

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
            roleFilteredTabs={visibleWorkspaceTabs}
            selectedLeadId={leadId}
            selectedConversation={selectedConversation}
            leadDetail={leadDetail}
            messageMeta={messageMeta}
            messages={messages}
            messagesQuery={messagesQuery}
            propertyMatches={propertyMatches}
            propertyMatchesQuery={propertyMatchesQuery}
            inquiredSellerLeadDetail={inquiredSellerLeadDetail}
            inquiredSellerConversation={inquiredSellerConversation}
            inquiredSellerLeadQuery={inquiredPropertyQuery}
            cancelCalendlyMutation={cancelCalendlyMutation}
            patchLeadMutation={patchLeadMutation}
            onConsultationGoToNurture={() => selectTab("nurture")}
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
            nurtureForm={nurtureForm}
            setNurtureForm={setNurtureForm}
            nurtureMutation={nurtureMutation}
            nurturePreviewMutation={nurturePreviewMutation}
            nurtureDraftMutation={nurtureDraftMutation}
            nurtureRefineMutation={nurtureRefineMutation}
            nurtureLogs={nurtureLogs}
            nurtureLogsLoading={nurtureLogsQuery.isLoading}
            deleteLeadMutation={deleteLeadMutation}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            inquiredProperty={inquiredProperty}
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
