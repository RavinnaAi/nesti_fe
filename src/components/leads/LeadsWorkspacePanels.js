"use client";

import { Trash2 } from "lucide-react";
import LeadsWorkspaceTabs from "@/components/leads/LeadsWorkspaceTabs";
import LeadPipelineNotesPanel from "@/components/leads/LeadPipelineNotesPanel";
import LeadsDetailsTab from "@/components/leads/LeadsDetailsTab";
import LeadsConversationTab from "@/components/leads/LeadsConversationTab";
import LeadsProfileTab from "@/components/leads/LeadsProfileTab";
import LeadsActionsTab from "@/components/leads/LeadsActionsTab";
import LeadsNurtureTab from "@/components/leads/LeadsNurtureTab";
import LeadsConsultationTab from "@/components/leads/LeadsConsultationTab";
import LeadsIntelligenceTab from "@/components/leads/LeadsIntelligenceTab";
import LeadsPropertyMatchesTab from "@/components/leads/LeadsPropertyMatchesTab";
import { extractMeta, formatMetaEntries, getConversationMeta } from "@/lib/leadsPageUtils";

export default function LeadsWorkspacePanels({
  activeTab,
  onActiveTabChange,
  roleFilteredTabs,
  selectedLeadId,
  selectedConversation,
  leadDetail,
  messageMeta,
  messages,
  messagesQuery,
  propertyMatches,
  propertyMatchesQuery,
  cancelCalendlyMutation,
  patchLeadMutation,
  /** When set, consultation tab uses this instead of `onActiveTabChange("nurture")` (e.g. URL-synced tab on lead detail). */
  onConsultationGoToNurture,
  /** When false, Lead Profile does not wire patch (detail route uses pipeline tab for edits). */
  enableProfilePatch = true,
  referralForm,
  setReferralForm,
  createReferralMutation,
  activeReferralId,
  setActiveReferralId,
  referralUpdate,
  setReferralUpdate,
  updateReferralMutation,
  actionConversationId,
  conversationReferrals,
  nurtureForm,
  setNurtureForm,
  nurtureMutation,
  nurturePreviewMutation,
  nurtureDraftMutation,
  nurtureRefineMutation,
  nurtureLogs,
  nurtureLogsLoading,
  deleteLeadMutation,
  onDeleteClick,
  token,
  inquiredProperty = null,
  inquiredSellerLeadDetail = null,
  inquiredSellerConversation = null,
  inquiredSellerLeadQuery = null,
}) {
  const conversationMeta = extractMeta(selectedConversation);
  const goToNurture =
    typeof onConsultationGoToNurture === "function"
      ? onConsultationGoToNurture
      : () => onActiveTabChange("nurture");
  const profileOnPatchLead =
    enableProfilePatch && selectedLeadId ? (body) => patchLeadMutation.mutateAsync(body) : undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <LeadsWorkspaceTabs
          activeTab={activeTab}
          onChange={onActiveTabChange}
          tabs={roleFilteredTabs}
          endSlot={
            <button
              type="button"
              onClick={onDeleteClick}
              disabled={deleteLeadMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-md px-2.5 py-1.5 bg-white hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              title="Delete this lead"
            >
              <Trash2 size={14} aria-hidden />
              {deleteLeadMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          }
        />
      </div>

      {activeTab === "lead_details" ? (
        <LeadsDetailsTab
          selectedConversation={selectedConversation}
          lead={leadDetail}
          messageMeta={messageMeta}
          getConversationMeta={getConversationMeta}
          conversationMeta={conversationMeta}
          formatMetaEntries={formatMetaEntries}
          onOpenMeta={() => {}}
          onCancelCalendlyAppointment={() => cancelCalendlyMutation.mutateAsync()}
          cancelCalendlyPending={cancelCalendlyMutation.isPending}
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

      {activeTab === "intelligence" ? (
        <LeadsIntelligenceTab
          token={token}
          leadId={selectedLeadId}
          lead={leadDetail}
        />
      ) : null}

      {activeTab === "property_matches" ? (
        <LeadsPropertyMatchesTab
          selectedConversation={selectedConversation}
          lead={leadDetail}
          propertyMatches={propertyMatches}
          propertyMatchesQuery={propertyMatchesQuery}
          propertyMatchesPayload={propertyMatchesQuery.data || null}
          inquiredProperty={inquiredProperty}
          inquiredSellerLeadDetail={inquiredSellerLeadDetail}
          inquiredSellerConversation={inquiredSellerConversation}
          inquiredSellerLeadQuery={inquiredSellerLeadQuery}
        />
      ) : null}

      {activeTab === "consultation" ? (
        <LeadsConsultationTab
          lead={leadDetail}
          onCancelCalendlyAppointment={() => cancelCalendlyMutation.mutateAsync()}
          cancelCalendlyPending={cancelCalendlyMutation.isPending}
          onGoToNurture={goToNurture}
        />
      ) : null}

      {activeTab === "lead_profile" ? (
        <LeadsProfileTab
          selectedConversation={selectedConversation}
          lead={leadDetail}
          {...(typeof profileOnPatchLead === "function"
            ? { onPatchLead: profileOnPatchLead, patchLeadPending: patchLeadMutation.isPending }
            : {})}
        />
      ) : null}

      {activeTab === "pipeline" ? (
        <LeadPipelineNotesPanel
          lead={leadDetail}
          onPatchLead={(body) => patchLeadMutation.mutateAsync(body)}
          patchLeadPending={patchLeadMutation.isPending}
        />
      ) : null}

      {activeTab === "others" ? (
        <LeadsActionsTab
          token={token}
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
        />
      ) : null}

      {activeTab === "nurture" ? (
        <LeadsNurtureTab
          nurtureForm={nurtureForm}
          setNurtureForm={setNurtureForm}
          nurtureMutation={nurtureMutation}
          nurturePreviewMutation={nurturePreviewMutation}
          nurtureDraftMutation={nurtureDraftMutation}
          nurtureRefineMutation={nurtureRefineMutation}
          selectedLeadId={selectedLeadId}
          actionConversationId={actionConversationId}
          nurtureLogs={nurtureLogs}
          nurtureLogsLoading={nurtureLogsLoading}
        />
      ) : null}
    </div>
  );
}
