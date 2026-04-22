"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import LeadPipelineStageControl from "@/components/leads/LeadPipelineStageControl";

/**
 * Agent notes with pipeline stage. Optional `pipelineListFilterHint` when the lead was opened
 * from a filtered list (`status` / `pipeline` in the URL).
 *
 * Stage + optional note are saved together with one "Save changes" action (not on each dropdown change).
 */
export default function LeadPipelineNotesPanel({
  lead,
  onPatchLead,
  patchLeadPending = false,
  pipelineListFilterHint = null,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const savedStatus = leadData.status ?? leadData.match_status ?? "new";
  const [draftMatchStatus, setDraftMatchStatus] = useState(savedStatus);
  const [noteDraft, setNoteDraft] = useState("");
  const fieldId = String(leadData.id || "lead").replace(/\W/g, "");

  useEffect(() => {
    setDraftMatchStatus(leadData.status ?? leadData.match_status ?? "new");
  }, [leadData.id, leadData.status, leadData.match_status]);

  const hasStatusChange = draftMatchStatus !== savedStatus;
  const hasNote = noteDraft.trim().length > 0;
  const canSave = hasStatusChange || hasNote;

  const handleSaveChanges = async () => {
    if (!onPatchLead || !canSave) return;
    try {
      await onPatchLead({
        ...(hasStatusChange ? { match_status: draftMatchStatus } : {}),
        ...(hasNote ? { note: noteDraft.trim() } : {}),
      });
      setNoteDraft("");
    } catch {
      setDraftMatchStatus(savedStatus);
    }
  };

  const agentNotes = Array.isArray(leadData.agent_notes) ? leadData.agent_notes : [];

  if (typeof onPatchLead !== "function") return null;

  const newNoteCard = (opts = {}) => {
    const { fillColumn = false } = opts;
    return (
      <div
        className={`flex min-h-[240px] flex-col lg:min-h-0 ${fillColumn ? "min-h-0 flex-1" : "flex-1"}`}
      >
        <p className="mb-3 shrink-0 text-xs font-medium text-text-heading">Note (optional)</p>
        <textarea
          id={`lead-agent-note-${fieldId}`}
          value={noteDraft}
          disabled={patchLeadPending}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={4}
          placeholder="Call outcome, objection, next step…"
          className="min-h-[5rem] w-full flex-1 resize-y rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-heading leading-snug placeholder:text-text-muted/60 placeholder:text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-60"
        />
        <div className="mt-3 flex shrink-0 items-center gap-3 justify-start">
          <button
            type="button"
            disabled={patchLeadPending || !canSave}
            onClick={() => void handleSaveChanges()}
            className="h-8 rounded-md bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {patchLeadPending ? "Saving…" : "Save changes"}
          </button>
          {canSave && !patchLeadPending ? (
            <span className="text-[11px] font-medium text-amber-600">Unsaved changes</span>
          ) : null}
        </div>
      </div>
    );
  };

  const commentsColumn = (
    <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <MessageSquareText className="size-3.5 shrink-0 text-text-muted" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
          Previous comments
        </h3>
        {agentNotes.length > 0 ? (
          <span className="text-[11px] font-medium tabular-nums text-text-muted/80">
            ({agentNotes.length})
          </span>
        ) : null}
      </div>

      <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-lg border border-border/60 bg-background-light/25 lg:min-h-0">
        {agentNotes.length > 0 ? (
          <ul className="space-y-2.5 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {agentNotes.map((n) => {
              const when = n.created_at ? new Date(n.created_at) : null;
              const whenLabel =
                when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : "—";
              const who = n.author_label || n.author_user_id || "Agent";
              const isSystem = Boolean(n.system);
              return (
                <li
                  key={n.id || `${who}-${whenLabel}-${String(n.text).slice(0, 24)}`}
                  className={`rounded-md border px-3 py-2.5 shadow-sm ${
                    isSystem
                      ? "border-primary/20 bg-primary/[0.03]"
                      : "border-border/35 bg-white/90"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold text-text-heading">
                      {isSystem ? "System" : who}
                    </span>
                    <time
                      dateTime={n.created_at || undefined}
                      className="text-[11px] tabular-nums text-text-muted"
                    >
                      {whenLabel}
                    </time>
                  </div>
                  <p className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isSystem ? "text-text-muted italic" : "text-text-body"
                  }`}>
                    {n.text}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <MessageSquareText className="size-8 text-border" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-medium text-text-heading">No comments yet</p>
            <p className="max-w-[240px] text-xs leading-relaxed text-text-muted">
              Notes you add here appear for everyone on your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const body = (
    <div className="flex min-h-[300px] flex-col gap-6 rounded-lg border border-border/60 bg-gradient-to-b from-primary/[0.03] to-transparent p-4 sm:p-5 lg:flex-row lg:items-stretch lg:gap-6">
      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col gap-4 lg:border-r lg:border-border/50 lg:pr-6">
        <div className="shrink-0">
          <LeadPipelineStageControl
            lead={lead}
            patchLeadPending={patchLeadPending}
            unboxed
            hint={pipelineListFilterHint}
            submitOnSelect={false}
            draftMatchStatus={draftMatchStatus}
            onDraftMatchStatusChange={setDraftMatchStatus}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{newNoteCard({ fillColumn: true })}</div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col border-t border-border/50 pt-6 lg:border-t-0 lg:pt-0">
        {commentsColumn}
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-xl border border-border/70 bg-white shadow-sm p-4 sm:p-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-muted sm:mb-3">
        Notes
      </h2>
      <p className="mb-4 max-w-xl text-xs leading-relaxed text-text-muted sm:mb-5">
        Choose a pipeline stage, add an optional note, then click{" "}
        <span className="font-medium text-text-heading/90">Save changes</span> to update the lead.
        Reopening or closing a lead asks for confirmation first.
      </p>
      {body}
    </div>
  );
}
