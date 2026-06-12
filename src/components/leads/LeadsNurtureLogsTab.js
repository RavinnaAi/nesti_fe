"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Mail, X } from "lucide-react";
import { NurtureLogsListSkeleton } from "@/components/ui/ContentSkeletons";

function statusChip(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "failed") return "bg-red-50 text-red-800 border-red-200";
  return "bg-background-light text-text-muted border-border";
}

export default function LeadsNurtureLogsTab({
  logs,
  loading,
  rowsPerPage = 10,
  page = 1,
  totalPages = 1,
  total = 0,
  hasPrev = false,
  hasNext = false,
  isFetching = false,
  onPrev,
  onNext,
  paginationOutside = false,
}) {
  const [selectedLog, setSelectedLog] = useState(null);
  const emptyRows = Math.max(0, rowsPerPage - logs.length);
  const paginationStrip = !loading ? (
    <div
      className={`flex-shrink-0 flex items-center justify-between gap-3 border-border/80 bg-background-light/40 px-4 py-3 ${
        paginationOutside ? "rounded-md border" : "border-t"
      }`}
    >
      <p className="flex items-center gap-2 text-xs text-text-muted">
        {isFetching && !loading ? (
          <span
            className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
            aria-hidden
          />
        ) : null}
        <span>
          Page <span className="font-semibold text-text-heading">{page}</span> of{" "}
          <span className="font-semibold text-text-heading">{totalPages}</span>
          {" · "}
          <span className="font-semibold text-text-heading">{total}</span> total
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrev || isFetching}
          onClick={onPrev}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || isFetching}
          onClick={onNext}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/50 bg-white shadow-none">
      <div className="flex-shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold leading-tight text-text-heading">Nurture logs</h2>
            <p className="mt-0.5 text-[10px] leading-snug text-text-muted">
              All nurture email activity for your workspace.
            </p>
          </div>
          <span className="text-xs text-text-muted tabular-nums">{loading ? "..." : logs.length}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-contain bg-slate-50/40">
        {loading ? (
          <div className="p-3">
            <NurtureLogsListSkeleton rows={6} />
          </div>
        ) : !logs.length ? (
          <div className="flex min-h-[250px] items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-border/70 bg-white/80 px-6 py-7 text-center shadow-sm">
              <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail size={18} />
              </span>
              <p className="text-sm font-semibold text-text-heading">No nurture emails logged yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Sent nurture emails will appear here with delivery status and details.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse text-left text-[11px] leading-tight">
            <thead className="border-b border-border bg-primary/[0.04]">
              <tr className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-3 py-2 align-middle">Subject</th>
                <th className="px-3 py-2 align-middle">Recipient</th>
                <th className="px-3 py-2 align-middle">Sent</th>
                <th className="px-3 py-2 align-middle">Lead</th>
                <th className="px-3 py-2 text-right align-middle">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {logs.map((log) => (
                <tr
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
                  className="h-11 cursor-pointer border-b border-border/70 text-[13px] text-text-body transition-colors hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <td className="px-3 py-2.5 text-text-heading">
                    <p className="truncate font-medium">{log.subject || "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">
                    <span className="inline-flex max-w-full items-center gap-1.5">
                      <Mail size={12} className="shrink-0 opacity-70" />
                      <span className="truncate">{log.to_email || "—"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">
                    {log.sent_at || log.created_at
                      ? new Date(log.sent_at || log.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">
                    {(log.lead_match_id || log.lead_profile_id)
                      ? `Lead ${String(log.lead_match_id || log.lead_profile_id).slice(0, 8)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`inline-flex text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusChip(
                        log.status
                      )}`}
                    >
                      {log.status || "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }).map((_, index) => (
                <tr
                  key={`empty-row-${index}`}
                  className="h-11 border-b border-border/70 text-[13px]"
                  aria-hidden="true"
                >
                  <td className="h-11 px-3 py-2.5"><span className="invisible">—</span></td>
                  <td className="h-11 px-3 py-2.5"><span className="invisible">—</span></td>
                  <td className="h-11 px-3 py-2.5"><span className="invisible">—</span></td>
                  <td className="h-11 px-3 py-2.5"><span className="invisible">—</span></td>
                  <td className="h-11 px-3 py-2.5 text-right"><span className="invisible">—</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!paginationOutside ? paginationStrip : null}

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
    {paginationOutside ? <div className="mt-3 flex-shrink-0">{paginationStrip}</div> : null}
    </div>
  );
}
