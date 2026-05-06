"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  patchLead,
} from "@/lib/leadsClient";
import { cancelCalendlyAppointment } from "@/lib/calendarClient";
import { leadApiRowToConversationShape } from "@/lib/leadAdapters";
import { getLeadWorkspaceTabsForRole } from "@/components/leads/LeadsWorkspaceTabs";
import {
  roleHidesLeadPropertyMatches,
  roleShowsLeadsListAgentColumns,
} from "@/lib/leadWorkspaceTabsMeta";
import LeadsListHeader from "@/components/leads/LeadsListHeader";
import LeadsListFiltersBar from "@/components/leads/LeadsListFiltersBar";
import LeadsListTable from "@/components/leads/LeadsListTable";
import LeadsListPagination from "@/components/leads/LeadsListPagination";
import ReferralsDataTable, {
  leadsPipelineReferralDetailHref,
  normalizeReferralRows,
} from "@/components/referrals/ReferralsDataTable";
import LeadsWorkspacePanels from "@/components/leads/LeadsWorkspacePanels";
import DeleteLeadConfirmModal from "@/components/leads/DeleteLeadConfirmModal";
import { useLeadsListFilters } from "@/hooks/useLeadsListFilters";
import {
  extractMessageMeta,
  getActionConversationId,
  getConversationMeta,
  getLeadMatchId,
  LEADS_PAGE_SIZE,
  matchesSearch,
  normalizeList,
} from "@/lib/leadsPageUtils";

function LeadsPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { token, user: authUser } = useAppSelector((state) => state.auth);
  const userRole = authUser?.role || "agent";
  const roleFilteredTabs = useMemo(() => getLeadWorkspaceTabsForRole(userRole), [userRole]);
  const showPropertyMatchesColumn = !roleHidesLeadPropertyMatches(userRole);
  const showAgentLeadColumns = roleShowsLeadsListAgentColumns(userRole);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const leadFromUrl = String(searchParams.get("lead") || "").trim();
  const pageFromUrl = Number(searchParams.get("page") || "1");
  const [hydrated, setHydrated] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [currentPage, setCurrentPage] = useState(Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("all");
  const appointmentFilterBoot = useRef(true);
  const {
    status: statusFromUrl,
    pipeline: pipelineFromUrl,
    referral: pipelineReferralIdFromUrl,
    filterLabel,
    toLeadWorkspace,
    toListPage,
  } = useLeadsListFilters();
  const isReferralsPipeline = pipelineFromUrl === "referrals";
  const REFERRALS_PIPELINE_PAGE_SIZE = 10;
  const [activeTab, setActiveTab] = useState("lead_profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  /** Legacy `/leads?pipeline=referrals&referral=` bookmarks → dedicated referral page. */
  useEffect(() => {
    if (!isReferralsPipeline) return;
    const rid = String(pipelineReferralIdFromUrl || "").trim();
    if (!rid) return;
    router.replace(leadsPipelineReferralDetailHref(rid, currentPage));
  }, [isReferralsPipeline, pipelineReferralIdFromUrl, currentPage, router]);

  useEffect(() => {
    setActiveTab("lead_profile");
  }, [selectedLeadId]);

  useEffect(() => {
    if (isReferralsPipeline) setSelectedLeadId("");
  }, [isReferralsPipeline]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const incomingPage = Number(searchParams.get("page") || "1");
    if (Number.isFinite(incomingPage) && incomingPage > 0 && incomingPage !== currentPage) {
      setCurrentPage(incomingPage);
    }
  }, [searchParams, currentPage]);

  useEffect(() => {
    if (!leadFromUrl) return;
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    const qs = new URLSearchParams();
    qs.set("page", String(pageNum));
    const st = String(searchParams.get("status") || "").trim();
    const pl = String(searchParams.get("pipeline") || "").trim();
    if (st) qs.set("status", st);
    if (pl) qs.set("pipeline", pl);
    router.replace(`/leads/${encodeURIComponent(leadFromUrl)}?${qs.toString()}`);
  }, [leadFromUrl, pageFromUrl, router, searchParams]);

  useEffect(() => {
    if (appointmentFilterBoot.current) {
      appointmentFilterBoot.current = false;
      return;
    }
    setCurrentPage(1);
  }, [appointmentFilter]);

  const leadsQuery = useQuery({
    queryKey: ["leads", token, currentPage, appointmentFilter, statusFromUrl, pipelineFromUrl],
    enabled: Boolean(token) && !isReferralsPipeline,
    queryFn: () =>
      fetchLeads({
        token,
        page: currentPage,
        limit: LEADS_PAGE_SIZE,
        ...(appointmentFilter && appointmentFilter !== "all" ? { appointment: appointmentFilter } : {}),
        ...(statusFromUrl ? { status: statusFromUrl } : {}),
        ...(!statusFromUrl && pipelineFromUrl ? { pipeline: pipelineFromUrl } : {}),
      }),
  });

  const referralsPipelineQuery = useQuery({
    queryKey: ["leads-pipeline-referrals", token, currentPage],
    enabled: Boolean(token && isReferralsPipeline),
    queryFn: () =>
      fetchReferrals({
        token,
        direction: "inbound",
        page: currentPage,
        limit: REFERRALS_PIPELINE_PAGE_SIZE,
        status: "accepted",
      }),
  });

  const referralPipelineRows = useMemo(() => {
    if (!isReferralsPipeline) return [];
    return normalizeReferralRows(referralsPipelineQuery.data);
  }, [isReferralsPipeline, referralsPipelineQuery.data]);

  const referralsPipelinePagination = useMemo(() => {
    const p = referralsPipelineQuery.data?.pagination || {};
    const current = Number(p.current_page || p.page || currentPage || 1);
    const totalPages = Number(p.total_pages || p.totalPages || 1);
    const total = Number(p.total || 0);
    const hasPrev = typeof p.has_prev_page === "boolean" ? p.has_prev_page : current > 1;
    const hasNext =
      typeof p.has_next_page === "boolean" ? p.has_next_page : Number.isFinite(totalPages) && current < totalPages;
    return { current, totalPages, total, hasPrev, hasNext };
  }, [referralsPipelineQuery.data, currentPage]);

  const leadsPagination = useMemo(() => {
    const p = leadsQuery.data?.pagination || leadsQuery.data?.data?.pagination || {};
    const current = Number(p.current_page || p.page || currentPage || 1);
    const totalPages = Number(p.total_pages || p.totalPages || 1);
    const total = Number(p.total || 0);
    const hasPrev = typeof p.has_prev_page === "boolean" ? p.has_prev_page : current > 1;
    const hasNext =
      typeof p.has_next_page === "boolean"
        ? p.has_next_page
        : Number.isFinite(totalPages)
          ? current < totalPages
          : false;
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
      if (showAgentLeadColumns && intentFilter && intent !== intentFilter) return false;
      return matchesSearch(conversation, searchTerm);
    });
  }, [conversations, intentFilter, searchTerm, showAgentLeadColumns]);

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
  const leadDetail = leadDetailQuery.data?.lead || null;

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
      queryClient.invalidateQueries({ queryKey: ["lead-detail", token, selectedLeadId] });
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

  const cancelCalendlyMutation = useMutation({
    mutationFn: () => cancelCalendlyAppointment({ token, leadMatchId: selectedLeadId }),
    onSuccess: () => {
      toast.success("Appointment canceled in Calendly.");
      queryClient.invalidateQueries({ queryKey: ["leads", token], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", token, selectedLeadId] });
    },
    onError: (err) => toast.error(err?.message || "Could not cancel appointment"),
  });

  const patchLeadMutation = useMutation({
    mutationFn: (payload) => patchLead({ token, id: selectedLeadId, ...payload }),
    onSuccess: (data) => {
      toast.success("Lead updated");
      const id = selectedLeadId;
      if (id && data?.lead) {
        queryClient.setQueryData(["lead-detail", token, id], (prev) => ({
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
    mutationFn: () => deleteLeadById({ token, id: selectedLeadId }),
    onSuccess: () => {
      const deletedLeadId = String(selectedLeadId);
      toast.success("Lead deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedLeadId("");
      queryClient.invalidateQueries({ queryKey: ["leads", token], refetchType: "all" });
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

  const goPrevPage = () => {
    const source = isReferralsPipeline ? referralsPipelinePagination : leadsPagination;
    const nextPage = Math.max(1, source.current - 1);
    setCurrentPage(nextPage);
    const opts = { page: nextPage };
    router.push(toListPage(opts));
  };

  const goNextPage = () => {
    const source = isReferralsPipeline ? referralsPipelinePagination : leadsPagination;
    const nextPage = source.current + 1;
    setCurrentPage(nextPage);
    const opts = { page: nextPage };
    router.push(toListPage(opts));
  };

  if (!hydrated) {
    return <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-6 space-y-5">
        <LeadsListHeader filterLabel={filterLabel}>
          {!isReferralsPipeline ? (
            <LeadsListFiltersBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              intentFilter={intentFilter}
              onIntentFilterChange={setIntentFilter}
              appointmentFilter={appointmentFilter}
              onAppointmentFilterChange={setAppointmentFilter}
              showIntentFilter={showAgentLeadColumns}
              searchPlaceholder={
                showAgentLeadColumns
                  ? "Search by property type, name, phone, city..."
                  : "Search by name, phone, city, email..."
              }
            />
          ) : null}
        </LeadsListHeader>

        <div className="space-y-4">
          {isReferralsPipeline ? (
            <>
              <ReferralsDataTable
                rows={referralPipelineRows}
                isLoading={referralsPipelineQuery.isLoading}
                isError={referralsPipelineQuery.isError}
                errorMessage={referralsPipelineQuery.error?.message}
                direction="inbound"
                getDetailHref={(id) => leadsPipelineReferralDetailHref(id, currentPage)}
                heading="Accepted referrals"
                hint="Opens `/leads/referrals/…` (under Leads, not the Referrals inbox). Use back there to return to this list."
                emptyMessage="No accepted referrals in your pipeline yet."
              />
              <LeadsListPagination
                leadsQuery={referralsPipelineQuery}
                leadsPagination={referralsPipelinePagination}
                onPrev={goPrevPage}
                onNext={goNextPage}
                resourceLabel="referrals"
              />
            </>
          ) : (
            <>
              <LeadsListTable
                leadsQuery={leadsQuery}
                filteredConversations={filteredConversations}
                selectedLeadId={selectedLeadId}
                toLeadWorkspace={toLeadWorkspace}
                leadsPageSize={LEADS_PAGE_SIZE}
                showPropertyMatchesColumn={showPropertyMatchesColumn}
                showAgentLeadColumns={showAgentLeadColumns}
              />

              <LeadsListPagination
                leadsQuery={leadsQuery}
                leadsPagination={leadsPagination}
                onPrev={goPrevPage}
                onNext={goNextPage}
              />
            </>
          )}

          {selectedLeadId && !isReferralsPipeline ? (
            <LeadsWorkspacePanels
              token={token}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              roleFilteredTabs={roleFilteredTabs}
              selectedLeadId={selectedLeadId}
              selectedConversation={selectedConversation}
              leadDetail={leadDetail}
              messageMeta={messageMeta}
              messages={messages}
              messagesQuery={messagesQuery}
              propertyMatches={propertyMatches}
              propertyMatchesQuery={propertyMatchesQuery}
              cancelCalendlyMutation={cancelCalendlyMutation}
              patchLeadMutation={patchLeadMutation}
              statusFromUrl={statusFromUrl}
              pipelineFromUrl={pipelineFromUrl}
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
              onDeleteClick={handleDeleteLead}
            />
          ) : null}
        </div>
      </div>

      <DeleteLeadConfirmModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteLead}
        isPending={deleteLeadMutation.isPending}
      />
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
