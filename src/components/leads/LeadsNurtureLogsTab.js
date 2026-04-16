"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, History, Loader2, Mail, X } from "lucide-react";

function statusChip(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "failed") return "bg-red-50 text-red-800 border-red-200";
  return "bg-background-light text-text-muted border-border";
}

export default function LeadsNurtureLogsTab({
  logs,
  loading,
  page = 1,
  totalPages = 1,
  total = 0,
  hasPrev = false,
  hasNext = false,
  isFetching = false,
  onPrev,
  onNext,
}) {
  const [selectedLog, setSelectedLog] = useState(null);

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col max-h-[min(82vh,calc(100vh-9rem))]">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/80 bg-gradient-to-r from-slate-50/90 to-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-text-heading tracking-tight">Nurture logs</h2>
            <p className="text-xs text-text-muted mt-0.5 max-w-xl leading-relaxed">
              All nurture email activity for your workspace.
            </p>
          </div>
          <span className="text-xs text-text-muted tabular-nums">{loading ? "..." : logs.length}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 bg-slate-50/40">
        {loading ? (
          <div className="flex justify-center py-10 text-text-muted">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : !logs.length ? (
          <p className="text-sm text-text-muted text-center py-8">No nurture emails logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id || `${log.sent_at || log.created_at}-${log.subject || "no-subject"}`}
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
                  <div className="min-w-0">
                    <p className="font-medium text-text-heading line-clamp-2">{log.subject || "—"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-0.5 min-w-0">
                        <Mail size={11} className="shrink-0 opacity-70" />
                        <span className="truncate max-w-[320px]">{log.to_email || "—"}</span>
                      </span>
                      {log.sent_at || log.created_at ? (
                        <span>
                          ·{" "}
                          {new Date(log.sent_at || log.created_at).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      ) : null}
                      {log.lead_match_id || log.lead_profile_id ? (
                        <span>· Lead {String(log.lead_match_id || log.lead_profile_id).slice(0, 8)}</span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusChip(
                      log.status
                    )}`}
                  >
                    {log.status || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!loading ? (
        <div className="flex-shrink-0 border-t border-border/80 bg-background-light/40 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Page <span className="font-semibold text-text-heading">{page}</span> of{" "}
            <span className="font-semibold text-text-heading">{totalPages}</span>
            {" · "}
            <span className="font-semibold text-text-heading">{total}</span> total
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrev || isFetching}
              onClick={onPrev}
              className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNext || isFetching}
              onClick={onNext}
              className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {selectedLog ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-white shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/80">
              <div>
                <h3 className="text-base font-semibold text-text-heading">Nurture email log</h3>
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
                <p className="text-sm text-text-heading mt-0.5">{selectedLog.to_email || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Subject</p>
                <p className="text-sm text-text-heading mt-0.5">{selectedLog.subject || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Status</p>
                <span
                  className={`mt-1 inline-flex text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusChip(
                    selectedLog.status
                  )}`}
                >
                  {selectedLog.status || "—"}
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
    </div>
  );
}
