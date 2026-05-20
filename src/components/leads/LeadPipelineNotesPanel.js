"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, X } from "lucide-react";

/** Max rows in "Previous comments" (newest first). */
const PREVIOUS_NOTES_SHOWN = 4;

/**
 * Agent notes and history. Pipeline close/reopen now lives in Lead Profile so the
 * close flow is tied to the lead context instead of hidden inside comments.
 */
export default function LeadPipelineNotesPanel({
  lead,
  onPatchLead,
  patchLeadPending = false,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const [noteDraft, setNoteDraft] = useState("");
  const [activeNote, setActiveNote] = useState(null);
  const fieldId = String(leadData.id || "lead").replace(/\W/g, "");

  const hasNote = noteDraft.trim().length > 0;
  const canSave = hasNote;

  const handleSaveChanges = async () => {
    if (!onPatchLead || !canSave) return;
    try {
      await onPatchLead({ note: noteDraft.trim() });
      setNoteDraft("");
    } catch {
      /* toast from parent */
    }
  };

  const agentNotesAll = Array.isArray(leadData.agent_notes) ? leadData.agent_notes : [];
  const agentNotes = [...agentNotesAll]
    .sort((a, b) => {
      const ta = new Date(a?.created_at || 0).getTime();
      const tb = new Date(b?.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, PREVIOUS_NOTES_SHOWN);

  useEffect(() => {
    if (!activeNote) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setActiveNote(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeNote]);

  if (typeof onPatchLead !== "function") return null;

  const newNoteCard = (opts = {}) => {
    return (
      <div className="flex flex-col">
        <p className="mb-3 shrink-0 text-xs font-medium text-text-heading">Note (optional)</p>
        <textarea
          id={`lead-agent-note-${fieldId}`}
          value={noteDraft}
          disabled={patchLeadPending}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={4}
          placeholder="Call outcome, objection, next step…"
          className="h-36 min-h-36 w-full resize-y rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-heading leading-snug placeholder:text-text-muted/60 placeholder:text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-60"
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
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <MessageSquareText className="size-3.5 shrink-0 text-text-muted" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
          Previous comments
        </h3>
        {agentNotesAll.length > 0 ? (
          <span className="text-[11px] font-medium tabular-nums text-text-muted/80">
            {agentNotesAll.length > PREVIOUS_NOTES_SHOWN
              ? `(${PREVIOUS_NOTES_SHOWN} of ${agentNotesAll.length})`
              : `(${agentNotesAll.length})`}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-[220px] flex-col overflow-hidden rounded-lg border border-border/60 bg-background-light/25">
        {agentNotesAll.length > 0 ? (
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveNote({ ...n, whenLabel, who, isSystem })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveNote({ ...n, whenLabel, who, isSystem });
                    }
                  }}
                  className={`cursor-pointer rounded-md border px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isSystem
                      ? "border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06]"
                      : "border-border/35 bg-white/90 hover:bg-white"
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
                    {String(n.text).length > 180 ? `${String(n.text).slice(0, 180)}...` : n.text}
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
    <div className="grid grid-cols-1 gap-5 rounded-lg border border-border/60 bg-gradient-to-b from-primary/[0.03] to-transparent p-4 sm:p-5 xl:grid-cols-2 xl:items-start xl:gap-6">
      <div className="min-w-0 xl:border-r xl:border-border/50 xl:pr-6">
        {newNoteCard()}
      </div>
      <div className="min-w-0 border-t border-border/50 pt-5 xl:border-t-0 xl:pt-0">
        {commentsColumn}
      </div>
    </div>
  );

  return (
    <div className="relative w-full rounded-xl border border-border/70 bg-white shadow-sm p-4 sm:p-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-muted sm:mb-3">
        Notes
      </h2>
      <p className="mb-4 max-w-xl text-xs leading-relaxed text-text-muted sm:mb-5">
        Add call outcomes, objections, and next-step context here. Use the Lead Profile tab to change pipeline stage or close the lead.
      </p>
      {body}
      {activeNote ? (
        <div
          className="absolute inset-0 z-30 grid place-items-center bg-black/5 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveNote(null);
          }}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-note-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div>
                <h3 id="lead-note-modal-title" className="text-sm font-semibold text-text-heading">
                  {activeNote.isSystem ? "System note" : "Lead note"}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  {activeNote.isSystem ? "System" : activeNote.who || "Agent"} · {activeNote.whenLabel || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNote(null)}
                className="rounded-md border border-border p-1.5 text-text-muted transition hover:bg-background-light hover:text-text-heading"
                aria-label="Close note"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                activeNote.isSystem ? "text-text-muted italic" : "text-text-body"
              }`}>
                {activeNote.text}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
