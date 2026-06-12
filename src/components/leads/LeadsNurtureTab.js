"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/store";
import Link from "next/link";
import { ChevronDown, History, Loader2, Mail, Send, Sparkles, Wand2, X } from "lucide-react";

function statusChip(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "failed") return "bg-red-50 text-red-800 border-red-200";
  return "bg-background-light text-text-muted border-border";
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1"
    >
      {children}
    </label>
  );
}

export default function LeadsNurtureTab({
  nurtureForm,
  setNurtureForm,
  nurtureMutation,
  nurturePreviewMutation,
  nurtureDraftMutation,
  nurtureRefineMutation,
  selectedLeadId,
  leadProfileId,
  nurtureEnabled: nurtureEnabledProp,
  /** When set, logs tab can load even if compose is disabled (e.g. client profile with no leads). */
  logsEnabled: logsEnabledProp,
  actionConversationId,
  nurtureLogs,
  nurtureLogsLoading,
  composeEmptyMessage,
  logsEmptySelectionMessage,
  logsEmptyListMessage,
  headerDescription,
  resolvedWorkspaceLeadHref,
}) {
  const user = useAppSelector((state) => state.auth.user);
  const businessInfo = useAppSelector((state) => state.profile.businessInfo);
  const isAgentProfessional = useMemo(() => {
    const role = String(user?.role || businessInfo?.professionalType || "")
      .trim()
      .toLowerCase();
    return role === "agent";
  }, [user?.role, businessInfo?.professionalType]);

  const [panelTab, setPanelTab] = useState("compose");
  const [selectedLog, setSelectedLog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [lastPreviewKey, setLastPreviewKey] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const previewResetRef = useRef(null);
  const nurtureEnabled =
    typeof nurtureEnabledProp === "boolean"
      ? nurtureEnabledProp
      : Boolean(selectedLeadId || leadProfileId);
  const canAi = nurtureEnabled;
  const canViewLogs =
    typeof logsEnabledProp === "boolean" ? logsEnabledProp : nurtureEnabled;
  const canRefine =
    canAi &&
    nurtureForm.subject?.trim() &&
    nurtureForm.body?.trim() &&
    nurtureForm.refine_instruction?.trim();
  const canSend =
    canAi &&
    nurtureForm.subject?.trim() &&
    nurtureForm.body?.trim() &&
    !nurtureMutation.isPending;
  const canPreview = canAi && nurtureForm.body?.trim();
  const hasAiDraft = draftReady;
  const previewRequestKey = JSON.stringify({
    lead: selectedLeadId || leadProfileId || "",
    subject: String(nurtureForm.subject || "").trim(),
    body: String(nurtureForm.body || "").trim(),
    includeCards: Boolean(nurtureForm.include_property_cards),
  });

  useEffect(() => {
    if (!isAgentProfessional && nurtureForm.include_property_cards) {
      setNurtureForm((prev) => ({ ...prev, include_property_cards: false }));
    }
  }, [isAgentProfessional, nurtureForm.include_property_cards, setNurtureForm]);

  useEffect(() => {
    setDraftReady(false);
    setLastPreviewKey("");
  }, [selectedLeadId]);

  useEffect(() => {
    previewResetRef.current = nurturePreviewMutation?.reset;
  }, [nurturePreviewMutation?.reset]);

  const clearPreviewCache = useCallback(() => {
    setLastPreviewKey("");
    setPreviewHtml("");
    setPreviewOpen(false);
    previewResetRef.current?.();
  }, []);

  useEffect(() => {
    clearPreviewCache();
  }, [nurtureForm.include_property_cards, clearPreviewCache]);

  useEffect(() => {
    if (nurtureDraftMutation?.data?.draft || nurtureRefineMutation?.data?.draft) {
      setDraftReady(true);
    }
  }, [nurtureDraftMutation?.data, nurtureRefineMutation?.data]);

  useEffect(() => {
    const p = nurturePreviewMutation?.data?.preview;
    if (!p?.html || nurturePreviewMutation?.isPending) return;
    setPreviewHtml(String(p.html));
    setPreviewSubject(String(p.subject || nurtureForm.subject || "").trim());
    setLastPreviewKey(previewRequestKey);
    setPreviewOpen(true);
  }, [
    nurturePreviewMutation?.data,
    nurturePreviewMutation?.isPending,
    nurtureForm.subject,
    previewRequestKey,
  ]);

  const handlePreviewClick = () => {
    if (!canPreview) return;
    if (previewHtml && lastPreviewKey && lastPreviewKey === previewRequestKey) {
      setPreviewOpen(true);
      return;
    }
    nurturePreviewMutation?.mutate?.();
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col max-h-[min(82vh,calc(100vh-9rem))]">
      {/* Title bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/80 bg-gradient-to-r from-slate-50/90 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-heading tracking-tight">
              Nurture email
            </h2>
            <p className="text-xs text-text-muted mt-0.5 max-w-xl leading-relaxed">
              {headerDescription ||
                "Draft from lead context, refine, then send. Uses your workspace email configuration."}
            </p>
          </div>
          <div className="w-full sm:w-[220px]">
            <div className="grid grid-cols-2 rounded-lg border border-border bg-white p-1">
              <button
                type="button"
                onClick={() => setPanelTab("compose")}
                className={`h-8 rounded-md text-xs font-semibold transition-colors ${
                  panelTab === "compose"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-slate-100"
                }`}
              >
                Compose
              </button>
              <button
                type="button"
                onClick={() => setPanelTab("logs")}
                className={`h-8 rounded-md text-xs font-semibold transition-colors ${
                  panelTab === "logs"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-slate-100"
                }`}
              >
                Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {panelTab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: nurture draft inputs */}
        <div className="lg:col-span-8 lg:border-r border-border/70 flex flex-col min-h-0 min-w-0">
          {!canAi ? (
            <div className="flex-shrink-0 m-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
              {composeEmptyMessage ||
                "Select a lead in the list to compose a nurture email."}
            </div>
          ) : null}

          {canAi && resolvedWorkspaceLeadHref ? (
            <div className="flex-shrink-0 m-3 rounded-lg border border-primary/15 bg-primary/[0.04] px-3 py-2 text-[11px] text-text-heading">
              Draft and matches use your most recently active lead workspace for this client.{" "}
              <Link
                href={resolvedWorkspaceLeadHref}
                className="font-semibold text-primary hover:underline"
              >
                Open that lead
              </Link>
            </div>
          ) : null}

          <div className="overflow-y-auto overscroll-contain px-4 pt-3 pb-2 space-y-3 max-h-[420px]">
            <div className="space-y-3">
              <div>
                <FieldLabel htmlFor="nurture-to">To</FieldLabel>
                <input
                  id="nurture-to"
                  type="email"
                  value={nurtureForm.to_email}
                  readOnly
                  placeholder="recipient@email.com"
                  disabled={!canAi}
                  aria-readonly="true"
                  className="h-9 w-full rounded-lg border border-border bg-slate-50/80 px-3 text-sm text-text-body shadow-sm placeholder:text-text-muted/60 cursor-default focus:outline-none focus:ring-0 focus:border-border disabled:opacity-50"
                />
              </div>
              <div>
                <FieldLabel htmlFor="nurture-subject">Subject</FieldLabel>
                <input
                  id="nurture-subject"
                  type="text"
                  value={nurtureForm.subject}
                  readOnly
                  placeholder="Subject line"
                  disabled={!canAi}
                  aria-readonly="true"
                  className="h-9 w-full rounded-lg border border-border bg-slate-50/80 px-3 text-sm text-text-body shadow-sm placeholder:text-text-muted/60 cursor-default focus:outline-none focus:ring-0 focus:border-border disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="nurture-body">Message</FieldLabel>
              <textarea
                id="nurture-body"
                rows={7}
                value={nurtureForm.body}
                onChange={(e) =>
                  setNurtureForm((p) => ({ ...p, body: e.target.value }))
                }
                placeholder="Plain text body. Calendly or signature may be added when sending."
                disabled={!canAi}
                className="w-full h-44 rounded-lg border border-border bg-slate-50/50 px-3 py-2.5 text-[13px] leading-relaxed shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50"
              />
            </div>

          </div>
          {/* Pinned actions */}
          <div className="border-t border-border bg-white/95 backdrop-blur-sm px-4 py-3">
            <button
              type="button"
              onClick={() => nurtureMutation.mutate()}
              disabled={!canSend}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/10 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-[opacity,filter]"
            >
              {nurtureMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {nurtureMutation.isPending ? "Sending..." : "Send nurture email"}
            </button>
          </div>
        </div>

        {/* Right: compose tools */}
        <aside className="lg:col-span-4 border-t border-border/70 bg-slate-50/40 lg:border-l border-border/70 lg:border-t-0 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-y-auto overscroll-contain p-3 pr-2 space-y-3 max-h-[520px]">
            <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3 space-y-2">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => nurtureDraftMutation.mutate()}
                  disabled={!canAi || nurtureDraftMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nurtureDraftMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Generate draft
                </button>
                <details className="group rounded-md border border-primary/10 bg-white/80 overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2 text-[11px] font-semibold text-text-heading hover:bg-primary/[0.04] [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-1.5 text-text-muted">
                      <Sparkles size={12} className="text-primary" />
                      Optional hints
                    </span>
                    <ChevronDown
                      size={14}
                      className="text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-2.5 pb-2.5 pt-0 space-y-2 border-t border-primary/5">
                    <p className="text-[10px] text-text-muted pt-2 leading-snug">
                      Goal and tone for the model. Leave blank for a default
                      follow-up.
                    </p>
                    <div className="grid gap-2 grid-cols-1">
                      <input
                        type="text"
                        value={nurtureForm.goal}
                        onChange={(e) =>
                          setNurtureForm((p) => ({ ...p, goal: e.target.value }))
                        }
                        placeholder="Goal (e.g. book a call)"
                        disabled={!canAi}
                        className="h-8 rounded-md border border-border bg-white px-2 text-xs disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={nurtureForm.tone}
                        onChange={(e) =>
                          setNurtureForm((p) => ({ ...p, tone: e.target.value }))
                        }
                        placeholder="Tone (e.g. warm, concise)"
                        disabled={!canAi}
                        className="h-8 rounded-md border border-border bg-white px-2 text-xs disabled:opacity-50"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <details className="group rounded-lg border border-border bg-slate-50/60 overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-text-heading hover:bg-slate-100/80 transition-colors [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <Wand2 size={15} className="text-primary shrink-0" />
                  Refine with AI
                </span>
                <ChevronDown
                  size={16}
                  className="text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/80">
                <textarea
                  rows={2}
                  value={nurtureForm.refine_instruction}
                  onChange={(e) =>
                    setNurtureForm((p) => ({
                      ...p,
                      refine_instruction: e.target.value,
                    }))
                  }
                  placeholder="e.g. Shorten, stronger CTA, more formal..."
                  disabled={!canAi}
                  className="mt-2 w-full rounded-md border border-border bg-white px-2.5 py-2 text-xs disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => nurtureRefineMutation.mutate()}
                  disabled={!canRefine || nurtureRefineMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-text-heading shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nurtureRefineMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  Apply refinement
                </button>
              </div>
            </details>

            {isAgentProfessional ? (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/90 bg-white px-3 py-2.5 text-sm shadow-sm">
                <input
                  type="checkbox"
                  checked={nurtureForm.include_property_cards}
                  onChange={(e) => {
                    setNurtureForm((p) => ({
                      ...p,
                      include_property_cards: e.target.checked,
                    }));
                    clearPreviewCache();
                  }}
                  disabled={!canAi}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="min-w-0">
                  <span className="font-medium text-text-heading text-sm">
                    Include recommended listings table
                  </span>
                  <span className="block text-[11px] text-text-muted mt-0.5 leading-snug">
                    When checked, the email adds the formatted Recommended
                    listings section. When unchecked, only your message is sent.
                  </span>
                </span>
              </label>
            ) : null}
            {hasAiDraft ? (
              <button
                type="button"
                onClick={handlePreviewClick}
                disabled={!canPreview || nurturePreviewMutation?.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white py-2 text-sm font-semibold text-text-heading shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nurturePreviewMutation?.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {nurturePreviewMutation?.isPending ? "Building preview..." : "Preview final email"}
              </button>
            ) : null}

            {!actionConversationId && selectedLeadId && !leadProfileId ? (
              <p className="text-[11px] text-text-muted leading-snug">
                No conversation id on this lead - email still sends; logging may
                omit thread linkage.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 bg-slate-50/40">
          {!canViewLogs ? (
            <p className="text-sm text-text-muted text-center py-8">
              {logsEmptySelectionMessage ||
                "Select a lead to view nurture logs."}
            </p>
          ) : nurtureLogsLoading ? (
            <div className="flex justify-center py-10 text-text-muted">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : !nurtureLogs.length ? (
            <p className="text-sm text-text-muted text-center py-8">
              {logsEmptyListMessage ||
                "No nurture emails logged for this lead yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {nurtureLogs.map((log) => (
                <div
                  key={log.id || `${log.sent_at}-${log.subject}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLog(log)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedLog(log);
                    }
                  }}
                  className="rounded-lg border border-border/70 bg-white px-3 py-2.5 text-sm shadow-sm cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <History size={13} className="text-text-muted shrink-0" />
                      <span className="font-medium text-text-heading line-clamp-2">
                        {log.subject || "-"}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusChip(
                        log.status
                      )}`}
                    >
                      {log.status || "-"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-0.5 min-w-0">
                      <Mail size={11} className="shrink-0 opacity-70" />
                      <span className="truncate max-w-[300px]">{log.to_email || "-"}</span>
                    </span>
                    {log.sent_at || log.created_at ? (
                      <span>
                        {" - "}
                        {new Date(log.sent_at || log.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    ) : null}
                    {log.meeting_booked ? (
                      <span className="text-emerald-700 font-medium">Booked</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedLog ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-white shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/80">
              <div>
                <h3 className="text-base font-semibold text-text-heading">Sent nurture email</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedLog.sent_at || selectedLog.created_at
                    ? new Date(selectedLog.sent_at || selectedLog.created_at).toLocaleString(
                        undefined,
                        { dateStyle: "medium", timeStyle: "short" }
                      )
                    : "Timestamp unavailable"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:text-text-heading hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 overflow-y-auto">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">To</p>
                <p className="text-sm text-text-heading mt-0.5">{selectedLog.to_email || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Subject</p>
                <p className="text-sm text-text-heading mt-0.5">{selectedLog.subject || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Status</p>
                <span
                  className={`mt-1 inline-flex text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusChip(
                    selectedLog.status
                  )}`}
                >
                  {selectedLog.status || "-"}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Email body</p>
                <div className="mt-1 rounded-lg border border-border bg-slate-50/60 p-3">
                  <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-heading font-sans">
                    {selectedLog.body_text || selectedLog.body || "No email body saved for this log."}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm lg:pl-60">
          <div className="w-full max-w-3xl rounded-xl border border-border bg-white shadow-2xl max-h-[78vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-border/80">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-heading">Final email preview</h3>
                <p className="text-[11px] text-text-muted mt-0.5 truncate">
                  {previewSubject || "No subject"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:text-text-heading hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-start justify-center p-3">
              <iframe
                key={previewRequestKey}
                title="Nurture email preview"
                srcDoc={previewHtml}
                className="h-[66vh] w-full max-w-[720px] border border-border/70 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
