"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SelectDropdown from "@/components/ui/SelectDropdown";
import {
  isTerminalPipelineStatus,
  PIPELINE_AUTOMATION_STATUS_LABELS,
} from "@/lib/leadPipelineConfig";

const ACTIVE_PIPELINE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "nurturing", label: "Nurturing" },
];

function getRolePipelineOptions(professionalType) {
  const role = professionalType || "agent";
  const terminalLabels = {
    agent: {
      converted: "Deal successfully closed",
      closed_lost: "Lead not proceeding",
    },
    lawyer: {
      converted: "Matter retained",
      closed_lost: "Matter not proceeding",
    },
    mortgage_broker: {
      converted: "Loan funded / approved",
      closed_lost: "Client not proceeding",
    },
  };
  const labels = terminalLabels[role] || terminalLabels.agent;
  return [
    ...ACTIVE_PIPELINE_OPTIONS,
    { value: "converted", label: labels.converted },
    { value: "closed_lost", label: labels.closed_lost },
  ];
}

const CLOSE_REASONS = {
  agent: {
    converted: [
      { value: "deal_closed", label: "Deal closed" },
      { value: "buyer_found_match", label: "Buyer found match" },
      { value: "seller_accepted_offer", label: "Seller accepted offer" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_with_another_agent", label: "Went with another agent" },
      { value: "changed_mind", label: "Changed mind" },
      { value: "not_ready", label: "Not ready" },
      { value: "unresponsive", label: "Unresponsive" },
      { value: "other", label: "Other" },
    ],
  },
  lawyer: {
    converted: [
      { value: "matter_retained", label: "Matter retained" },
      { value: "case_completed", label: "Case completed" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_elsewhere", label: "Went elsewhere" },
      { value: "declined_service", label: "Declined service" },
      { value: "matter_withdrawn", label: "Matter withdrawn" },
      { value: "other", label: "Other" },
    ],
  },
  mortgage_broker: {
    converted: [
      { value: "loan_funded", label: "Loan funded" },
      { value: "pre_approval_secured", label: "Pre-approval secured" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_with_another_lender", label: "Went with another lender" },
      { value: "application_denied", label: "Application denied" },
      { value: "not_qualified", label: "Not qualified" },
      { value: "other", label: "Other" },
    ],
  },
};

function getRoleCloseConfig(professionalType, closeTarget) {
  const role = professionalType || "agent";
  const isWon = closeTarget === "converted";

  const titles = {
    agent: { converted: "Close deal as won", closed_lost: "Close lead as lost" },
    lawyer: { converted: "Mark matter as retained", closed_lost: "Close matter as lost" },
    mortgage_broker: { converted: "Mark client as funded", closed_lost: "Close client as lost" },
  };
  const descriptions = {
    agent: {
      converted: "This lead will be marked as a closed deal. Calendly and automation will stop updating the pipeline stage.",
      closed_lost: "This lead will be marked as lost. Calendly and automation will stop updating the pipeline stage.",
    },
    lawyer: {
      converted: "This matter will be marked as retained/completed. Pipeline automation will stop.",
      closed_lost: "This matter will be marked as lost. Pipeline automation will stop.",
    },
    mortgage_broker: {
      converted: "This client will be marked as funded/approved. Pipeline automation will stop.",
      closed_lost: "This client will be marked as lost. Pipeline automation will stop.",
    },
  };
  const ctaLabels = {
    agent: { converted: "Mark as won", closed_lost: "Mark as lost" },
    lawyer: { converted: "Mark as retained", closed_lost: "Mark as lost" },
    mortgage_broker: { converted: "Mark as funded", closed_lost: "Mark as lost" },
  };
  const valueLabels = {
    agent: "Deal value",
    lawyer: "Retainer value",
    mortgage_broker: "Loan amount",
  };

  return {
    title: (titles[role] || titles.agent)[closeTarget] || (isWon ? "Close as won" : "Close as lost"),
    description: (descriptions[role] || descriptions.agent)[closeTarget] || "",
    ctaLabel: (ctaLabels[role] || ctaLabels.agent)[closeTarget] || (isWon ? "Confirm" : "Confirm"),
    valueLabel: valueLabels[role] || "Value",
    reasons: (CLOSE_REASONS[role] || CLOSE_REASONS.agent)[closeTarget] || [],
  };
}

/**
 * Shared pipeline / match_status editor (Lead Profile + Notes tab).
 * - Default: saves on each selection (`submitOnSelect`).
 * - Notes tab: `submitOnSelect={false}` + `draftMatchStatus` / `onDraftMatchStatusChange` for batched save with notes.
 */
export default function LeadPipelineStageControl({
  lead,
  onPatchLead,
  patchLeadPending = false,
  title = "Pipeline stage",
  hint = null,
  className = "",
  unboxed = false,
  submitOnSelect = true,
  draftMatchStatus,
  onDraftMatchStatusChange,
  onCloseMetadataChange,
  professionalType,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const savedStatus = leadData.status ?? leadData.match_status ?? "new";
  const effectiveValue = submitOnSelect ? savedStatus : (draftMatchStatus ?? savedStatus);
  const profType = professionalType || leadData.professional_type || "agent";

  const [reopenTarget, setReopenTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const [closeReason, setCloseReason] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closeValue, setCloseValue] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);

  const resetCloseFields = useCallback(() => {
    setCloseReason("");
    setCloseNote("");
    setCloseValue("");
    setReasonTouched(false);
  }, []);

  useEffect(() => {
    if (!reopenTarget && !closeTarget) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !reopenSubmitting) {
        setReopenTarget(null);
        setCloseTarget(null);
        resetCloseFields();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reopenTarget, closeTarget, reopenSubmitting, resetCloseFields]);

  const pipelineOptions = useMemo(() => {
    const roleOptions = getRolePipelineOptions(profType);
    const autoLabel = PIPELINE_AUTOMATION_STATUS_LABELS[effectiveValue];
    if (autoLabel) {
      return [
        { value: effectiveValue, label: `${autoLabel} (booking)` },
        ...roleOptions,
      ];
    }
    if (isTerminalPipelineStatus(effectiveValue)) {
      const current = roleOptions.find((option) => option.value === effectiveValue);
      return [
        { value: effectiveValue, label: current?.label || "Closed" },
        { value: "new", label: "Reopen to New" },
        { value: "nurturing", label: "Reopen to Nurturing" },
      ];
    }
    return roleOptions;
  }, [effectiveValue, profType]);

  const handlePipelineSelect = async (next) => {
    if (!next || next === effectiveValue) return;
    const wasTerminal = isTerminalPipelineStatus(savedStatus);
    const isNextTerminal = isTerminalPipelineStatus(next);
    const isReopen = wasTerminal && (next === "new" || next === "nurturing");
    const needsCloseConfirm = isNextTerminal && (next !== savedStatus);

    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") return;
      if (isReopen) { setReopenTarget(next); return; }
      if (needsCloseConfirm) { setCloseTarget(next); return; }
      try {
        await onPatchLead({ match_status: next });
      } catch { /* toast from parent */ }
      return;
    }

    if (typeof onDraftMatchStatusChange !== "function") return;
    if (isReopen) { setReopenTarget(next); return; }
    if (needsCloseConfirm) { setCloseTarget(next); return; }
    onDraftMatchStatusChange(next);
  };

  const closeReopenModal = () => {
    if (reopenSubmitting) return;
    setReopenTarget(null);
  };

  const dismissCloseModal = () => {
    if (reopenSubmitting) return;
    setCloseTarget(null);
    resetCloseFields();
  };

  const confirmClose = async () => {
    setReasonTouched(true);
    if (!closeReason) return;

    const next = closeTarget;
    if (!next) { dismissCloseModal(); return; }

    const metadata = {
      close_reason: closeReason,
      ...(closeNote.trim() ? { close_note: closeNote.trim() } : {}),
      ...(closeValue && Number(closeValue) > 0 ? { closed_value: Number(closeValue) } : {}),
    };

    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") { dismissCloseModal(); return; }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next, ...metadata });
        dismissCloseModal();
      } catch { /* toast from parent */ }
      finally { setReopenSubmitting(false); }
      return;
    }

    onDraftMatchStatusChange?.(next);
    onCloseMetadataChange?.(metadata);
    dismissCloseModal();
  };

  const confirmReopen = async () => {
    const next = reopenTarget;
    if (!next) { setReopenTarget(null); return; }
    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") { setReopenTarget(null); return; }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next });
        setReopenTarget(null);
      } catch { /* toast from parent */ }
      finally { setReopenSubmitting(false); }
      return;
    }
    onDraftMatchStatusChange?.(next);
    setReopenTarget(null);
  };

  if (submitOnSelect && typeof onPatchLead !== "function") return null;
  if (!submitOnSelect && typeof onDraftMatchStatusChange !== "function") return null;

  const shell = unboxed
    ? `space-y-3 ${className}`.trim()
    : `rounded-lg border border-border/60 bg-gradient-to-b from-primary/[0.03] to-transparent p-4 sm:p-5 space-y-3 ${className}`.trim();

  const selectDisabled = patchLeadPending || reopenTarget != null || closeTarget != null;

  const closeConfig = closeTarget ? getRoleCloseConfig(profType, closeTarget) : null;
  const swapping = closeTarget && isTerminalPipelineStatus(savedStatus) && isTerminalPipelineStatus(closeTarget);
  const isWon = closeTarget === "converted";
  const reasonInvalid = reasonTouched && !closeReason;

  return (
    <div className={shell}>
      <div className="text-sm font-semibold text-text-heading">{title}</div>
      {hint}
      <div className={unboxed ? "w-full max-w-none" : "max-w-md"}>
        <SelectDropdown
          size="small"
          placeholder="Select pipeline stage"
          options={pipelineOptions}
          value={effectiveValue}
          disabled={selectDisabled}
          onChange={(val) => void handlePipelineSelect(val)}
        />
      </div>
      {isTerminalPipelineStatus(effectiveValue) ? (
        <p className="text-xs text-text-muted leading-relaxed">
          Closed: Calendly won&apos;t change this stage until you reopen to{" "}
          <span className="font-medium text-text-heading/80">New</span> or{" "}
          <span className="font-medium text-text-heading/80">Nurturing</span>.
        </p>
      ) : null}

      {/* Reopen confirmation modal */}
      {reopenTarget && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget && !reopenSubmitting) setReopenTarget(null); }}
            >
              <div
                className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reopen-lead-title"
              >
                <h3 id="reopen-lead-title" className="text-base font-semibold text-text-heading">
                  Reopen this lead{reopenTarget === "nurturing" ? " for nurturing" : ""}?
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {reopenTarget === "nurturing"
                    ? "The lead will move back into your active nurturing pipeline. Calendly bookings and automation will be allowed to update the stage again."
                    : "The lead will move back to New in your pipeline. Calendly bookings and automation will be allowed to update the stage again."}
                  {!submitOnSelect ? " Click Save changes below to apply." : ""}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeReopenModal}
                    disabled={reopenSubmitting}
                    className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmReopen()}
                    disabled={reopenSubmitting}
                    className="px-3 py-2 text-xs font-semibold text-white bg-primary rounded-md hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {reopenSubmitting ? "Saving…" : submitOnSelect ? "Reopen lead" : "Continue"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Role-aware close modal */}
      {closeTarget && closeConfig && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget && !reopenSubmitting) dismissCloseModal(); }}
            >
              <div
                className="w-full max-w-lg rounded-xl border border-border bg-white shadow-2xl p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="close-lead-title"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isWon ? "bg-emerald-50" : "bg-slate-100"}`}>
                    {isWon ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <h3 id="close-lead-title" className="text-base font-semibold text-text-heading">
                    {swapping ? `Change to ${isWon ? "Won" : "Lost"}` : closeConfig.title}
                  </h3>
                </div>

                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {swapping
                    ? isWon
                      ? "This lead will move from Lost to Won. The deal will be counted as converted in your pipeline."
                      : "This lead will move from Won to Lost. It will no longer count as a converted deal."
                    : closeConfig.description}
                  {!swapping ? " You can reopen it later." : ""}
                  {!submitOnSelect ? " Click Save changes below to apply." : ""}
                </p>

                <div className="mt-4 space-y-3">
                  {/* Reason (required) */}
                  <div>
                    <label className="block text-xs font-medium text-text-heading mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={closeReason}
                      onChange={(e) => { setCloseReason(e.target.value); setReasonTouched(true); }}
                      className={`w-full h-9 rounded-md border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${
                        reasonInvalid ? "border-red-400 ring-1 ring-red-200" : "border-border"
                      }`}
                    >
                      <option value="">Select a reason…</option>
                      {closeConfig.reasons.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {reasonInvalid && (
                      <p className="mt-1 text-[11px] text-red-500">Please select a reason</p>
                    )}
                  </div>

                  {/* Note (optional) */}
                  <div>
                    <label className="block text-xs font-medium text-text-heading mb-1">
                      Note <span className="text-text-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={closeNote}
                      onChange={(e) => setCloseNote(e.target.value.slice(0, 200))}
                      rows={2}
                      placeholder="Any additional context…"
                      className="w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none"
                    />
                    <p className="mt-0.5 text-[10px] text-text-muted text-right">{closeNote.length}/200</p>
                  </div>

                  {/* Value (optional, shown only for won) */}
                  {isWon && (
                    <div>
                      <label className="block text-xs font-medium text-text-heading mb-1">
                        {closeConfig.valueLabel} <span className="text-text-muted font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={closeValue}
                          onChange={(e) => setCloseValue(e.target.value)}
                          placeholder="0"
                          className="w-full h-9 rounded-md border border-border pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={dismissCloseModal}
                    disabled={reopenSubmitting}
                    className="px-3.5 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmClose()}
                    disabled={reopenSubmitting || !closeReason}
                    className={`px-3.5 py-2 text-xs font-semibold text-white rounded-md hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                      isWon ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                  >
                    {reopenSubmitting
                      ? "Saving…"
                      : submitOnSelect
                        ? closeConfig.ctaLabel
                        : "Continue"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
