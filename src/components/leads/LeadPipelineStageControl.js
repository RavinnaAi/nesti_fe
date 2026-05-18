"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SelectDropdown from "@/components/ui/SelectDropdown";
import {
  isTerminalPipelineStatus,
  LEAD_MATCH_STATUS_OPTIONS,
  PIPELINE_AGENT_SELECT_TERMINAL,
  PIPELINE_AUTOMATION_STATUS_LABELS,
} from "@/lib/leadPipelineConfig";

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
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const savedStatus = leadData.status ?? leadData.match_status ?? "new";
  const effectiveValue = submitOnSelect ? savedStatus : (draftMatchStatus ?? savedStatus);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  useEffect(() => {
    if (!reopenTarget && !closeTarget) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !reopenSubmitting) {
        setReopenTarget(null);
        setCloseTarget(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reopenTarget, closeTarget, reopenSubmitting]);

  const pipelineOptions = (() => {
    if (isTerminalPipelineStatus(effectiveValue)) return PIPELINE_AGENT_SELECT_TERMINAL;
    const autoLabel = PIPELINE_AUTOMATION_STATUS_LABELS[effectiveValue];
    if (autoLabel) {
      return [
        { value: effectiveValue, label: `${autoLabel} (booking)` },
        ...LEAD_MATCH_STATUS_OPTIONS,
      ];
    }
    return LEAD_MATCH_STATUS_OPTIONS;
  })();

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
      } catch {
        /* toast from parent */
      }
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

  const closeCloseModal = () => {
    if (reopenSubmitting) return;
    setCloseTarget(null);
  };

  const confirmClose = async () => {
    const next = closeTarget;
    if (!next) { setCloseTarget(null); return; }
    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") { setCloseTarget(null); return; }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next });
        setCloseTarget(null);
      } catch {
        /* toast from parent */
      } finally {
        setReopenSubmitting(false);
      }
      return;
    }
    onDraftMatchStatusChange?.(next);
    setCloseTarget(null);
  };

  const confirmReopen = async () => {
    const next = reopenTarget;
    if (!next) {
      setReopenTarget(null);
      return;
    }
    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") {
        setReopenTarget(null);
        return;
      }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next });
        setReopenTarget(null);
      } catch {
        /* toast from parent */
      } finally {
        setReopenSubmitting(false);
      }
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

  return (
    <div className={shell}>
      <div className="text-sm font-semibold text-text-heading">{title}</div>
      {hint}
      <div className={unboxed ? "w-full max-w-none" : "max-w-md"}>
        <SelectDropdown
          size="small"
          placeholder="Select stage"
          options={pipelineOptions}
          value={effectiveValue}
          disabled={selectDisabled}
          onChange={(val) => void handlePipelineSelect(val)}
        />
      </div>
      {isTerminalPipelineStatus(effectiveValue) ? (
        <p className="text-xs text-text-muted leading-relaxed">
          Closed: Calendly won’t change this stage until you reopen to{" "}
          <span className="font-medium text-text-heading/80">New</span> or{" "}
          <span className="font-medium text-text-heading/80">Nurturing</span>.
        </p>
      ) : null}

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

      {closeTarget && typeof document !== "undefined"
        ? (() => {
            const swapping = isTerminalPipelineStatus(savedStatus) && isTerminalPipelineStatus(closeTarget);
            const wonTarget = closeTarget === "converted";
            const title = swapping
              ? `Change to ${wonTarget ? "Closed — won" : "Closed — lost"}?`
              : `Close this lead as ${wonTarget ? "won" : "lost"}?`;
            const description = swapping
              ? wonTarget
                ? "This lead will move from Lost to Won. The deal will be counted as converted in your pipeline."
                : "This lead will move from Won to Lost. It will no longer count as a converted deal."
              : wonTarget
                ? "This lead will be marked as a closed deal. Calendly and automation will stop updating the pipeline stage."
                : "This lead will be marked as lost. Calendly and automation will stop updating the pipeline stage.";
            const cta = reopenSubmitting
              ? "Saving…"
              : submitOnSelect
                ? wonTarget ? "Mark as won" : "Mark as lost"
                : "Continue";
            return createPortal(
              <div
                className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget && !reopenSubmitting) setCloseTarget(null); }}
              >
                <div
                  className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="close-lead-title"
                >
                  <h3 id="close-lead-title" className="text-base font-semibold text-text-heading">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    {description}
                    {!swapping ? " You can reopen it later." : ""}
                    {!submitOnSelect ? " Click Save changes below to apply." : ""}
                  </p>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeCloseModal}
                      disabled={reopenSubmitting}
                      className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmClose()}
                      disabled={reopenSubmitting}
                      className={`px-3 py-2 text-xs font-semibold text-white rounded-md hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                        closeTarget === "closed_lost" ? "bg-slate-700" : "bg-emerald-600"
                      }`}
                    >
                      {cta}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            );
          })()
        : null}
    </div>
  );
}
