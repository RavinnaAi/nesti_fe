"use client";

import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { LeadsPageTableSkeleton } from "@/components/ui/ContentSkeletons";
import { getLeadMeta, getLeadPropertyTypeDisplay } from "@/lib/leadConversationMeta";
import { getStatusDisplay } from "@/lib/leadPipelineConfig";
import {
  getConsultationListCell,
  getConversationMeta,
  getLeadIntentDisplay,
  getLeadMatchId,
  getMatchesCount,
  formatLeadIntakeSlug,
} from "@/lib/leadsPageUtils";

export default function LeadsListTable({
  leadsQuery,
  filteredConversations,
  selectedLeadId,
  toLeadWorkspace,
  leadsPageSize,
  /** Agent-focused property match counts; hidden for lawyers and mortgage brokers (see `roleHidesLeadPropertyMatches`). */
  showPropertyMatchesColumn = true,
  /** Agent-focused Type + Intent columns; hidden for lawyers (see `roleShowsLeadsListAgentColumns`). */
  showAgentLeadColumns = true,
  /** Mortgage broker list Type column (timeline / pre-approval). */
  showMortgageLeadColumns = false,
}) {
  const router = useRouter();
  const visibleRowsTarget = Math.max(1, Number(leadsPageSize) || 10);
  const emptyRowCount = Math.max(0, visibleRowsTarget - filteredConversations.length);
  const isEmpty = !leadsQuery.isLoading && !leadsQuery.isError && filteredConversations.length === 0;
  const tableMinClass = (() => {
    if (showAgentLeadColumns && showPropertyMatchesColumn) return "min-w-[1060px]";
    if (showAgentLeadColumns && !showPropertyMatchesColumn) return "min-w-[980px]";
    if (showMortgageLeadColumns && showPropertyMatchesColumn) return "min-w-[980px]";
    if (showMortgageLeadColumns && !showPropertyMatchesColumn) return "min-w-[900px]";
    if (!showAgentLeadColumns && showPropertyMatchesColumn) return "min-w-[940px]";
    return "min-w-[860px]";
  })();

  const formatLabel = (raw) => {
    const s = String(raw ?? "").trim();
    if (!s) return "—";
    const formatted = formatLeadIntakeSlug(s);
    if (formatted) return formatted;
    return s.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  const mortgageTypeLabel = (conversation) => {
    const q = conversation?.qualification || {};
    // Mortgage brokers: keep this column short; show timeline only.
    const timeline = formatLabel(q.mortgage_timeline || conversation?.property?.timeline || "");
    return timeline !== "—" ? timeline : "—";
  };

  return (
    <div
      className={
        isEmpty
          ? "flex h-full w-full flex-col overflow-hidden"
          : "flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-none"
      }
    >
      {leadsQuery.isLoading ? (
        <div className="p-3 sm:p-4">
          <LeadsPageTableSkeleton
            rows={leadsPageSize}
            showPropertyMatchesColumn={showPropertyMatchesColumn}
            showAgentLeadColumns={showAgentLeadColumns}
            showMortgageLeadColumns={showMortgageLeadColumns}
          />
        </div>
      ) : leadsQuery.isError ? (
        <div className="p-4 text-sm text-red-600">Failed to load leads.</div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex min-h-full flex-1 items-center justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
          <div className="w-full max-w-2xl bg-transparent px-4 py-10 text-center shadow-none sm:px-8 sm:py-12">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Inbox size={20} />
            </span>
            <p className="text-base font-bold text-text-heading">No leads in this pipeline yet</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
              Once new leads match this view, they&apos;ll appear here for review and follow-up.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 overflow-x-auto">
          <table className={`w-full table-auto ${tableMinClass}`}>
            <thead className="bg-primary/[0.04] border-b border-border">
              <tr className="text-left text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                {showAgentLeadColumns || showMortgageLeadColumns ? (
                  <th className="px-3 py-2">
                    {showMortgageLeadColumns && !showAgentLeadColumns ? "Timeline" : "Type"}
                  </th>
                ) : null}
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Consult</th>
                {showAgentLeadColumns ? <th className="px-3 py-2">Intent</th> : null}
                <th className="px-3 py-2">Location</th>
                {showPropertyMatchesColumn ? <th className="px-3 py-2">Matches</th> : null}
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conversation) => {
                const id = String(getLeadMatchId(conversation));
                const meta = getConversationMeta(conversation);
                const contact = conversation?.contact || {};
                const leadMeta = getLeadMeta(conversation);
                const displayName = contact?.full_name || contact?.name || leadMeta.name || "—";
                const displayEmail = contact?.email || leadMeta.email || "";
                const propertyTypeLabel = getLeadPropertyTypeDisplay(conversation);
                const location =
                  conversation?.location ||
                  conversation?.city ||
                  conversation?.address ||
                  conversation?.property?.location ||
                  conversation?.property?.address ||
                  conversation?.conversion?.property?.location ||
                  conversation?.conversion?.property?.address ||
                  "—";
                const isActive = selectedLeadId && String(selectedLeadId) === id;
                const pipeStatus = conversation?.status;
                const statusInfo = getStatusDisplay(
                  pipeStatus,
                  conversation?.professional_type || conversation?.professionalType
                );
                const consultCell = getConsultationListCell(conversation);
                const workspaceHref = toLeadWorkspace(id);

                return (
                  <tr
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(workspaceHref)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(workspaceHref);
                      }
                    }}
                    className={`border-b border-border/70 text-[13px] text-text-body transition cursor-pointer ${
                      isActive ? "bg-primary/[0.08]" : "hover:bg-primary/[0.05]"
                    }`}
                  >
                    {showAgentLeadColumns ? (
                      <td className="px-3 py-2.5 capitalize">
                        <span className="font-medium text-text-heading line-clamp-2">
                          {propertyTypeLabel}
                        </span>
                      </td>
                    ) : showMortgageLeadColumns ? (
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-text-heading line-clamp-2">
                          {mortgageTypeLabel(conversation)}
                        </span>
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5 min-w-[120px]">
                      <span className="line-clamp-2 font-medium text-text-heading">{displayName}</span>
                    </td>
                    <td className="px-3 py-2.5 min-w-[140px]">
                      {displayEmail ? (
                        <span className="block max-w-[200px] truncate" title={displayEmail}>
                          {displayEmail}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-snug whitespace-nowrap ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block max-w-[140px] rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-snug ${consultCell.className}`}
                        title={consultCell.title}
                      >
                        {consultCell.label}
                      </span>
                    </td>
                    {showAgentLeadColumns ? (
                      <td className="px-3 py-2.5">
                        <span className="line-clamp-2 text-text-heading">{getLeadIntentDisplay(conversation)}</span>
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">{location}</td>
                    {showPropertyMatchesColumn ? (
                      <td className="px-3 py-2.5">{getMatchesCount(conversation)}</td>
                    ) : null}
                    <td className="px-3 py-2.5">{meta.leadScore ?? "—"}</td>
                    <td className="px-3 py-2.5 capitalize">
                      {String(meta.leadGrade || "—").replace(/_/g, " ")}
                    </td>
                  </tr>
                );
              })}
              {Array.from({ length: emptyRowCount }).map((_, idx) => (
                <tr
                  key={`leads-empty-row-${idx}`}
                  className="h-11 border-b border-border/70 text-[13px]"
                  aria-hidden
                >
                  {Array.from({
                    length:
                      7 +
                      (showAgentLeadColumns ? 2 : showMortgageLeadColumns ? 1 : 0) +
                      (showPropertyMatchesColumn ? 1 : 0),
                  }).map((__, cellIdx) => (
                    <td key={`leads-empty-cell-${idx}-${cellIdx}`} className="h-11 px-3 py-2.5">
                      <span className="invisible">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
