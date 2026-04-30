"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";
import { SkeletonBlock } from "@/components/ui/ContentSkeletons";
import { formatLeadIntakeSlug } from "@/lib/leadsPageUtils";

const theadRow = "border-b border-border bg-background-lighter/90";
const th =
  "whitespace-nowrap px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-text-muted sm:px-2.5 sm:text-[10px]";
const td = "px-2 py-1.5 align-middle text-[11px] text-text-body sm:px-2.5 sm:text-xs";
const tdStrong = "px-2 py-1.5 align-middle text-[11px] font-semibold text-text-heading sm:px-2.5 sm:text-xs";
const tdMuted = "px-2 py-1.5 align-middle text-[11px] text-text-muted sm:px-2.5 sm:text-xs";
const trRow = "border-b border-border/50 transition-colors last:border-b-0 hover:bg-primary/[0.04]";

function humanize(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

function formatLawyerValue(value) {
  if (value == null || value === "") return "—";
  const token = String(value).trim().toLowerCase();
  const tokenMap = {
    "1m_plus": "$1M+",
    "700k_1m": "$700K-$1M",
    "400k_700k": "$400K-$700K",
    "under_400k": "Under $400K",
  };
  if (tokenMap[token]) return tokenMap[token];
  const slug = formatLeadIntakeSlug(value);
  if (slug) return slug;
  return humanize(value);
}

function profileDisplayName(profile) {
  const c = profile?.contact || {};
  return (
    String(c.full_name || c.name || "").trim() ||
    String(c.email || "").trim() ||
    "Unnamed client"
  );
}

function contactEmail(profile) {
  const c = profile?.contact || {};
  return String(c.email || "").trim() || null;
}

function contactPhone(profile) {
  const c = profile?.contact || {};
  return String(c.phone || "").trim() || null;
}

function TopLeadsTableSkeleton() {
  const widths = ["w-24", "w-28", "w-24", "w-28", "w-14", "w-10", "w-20"];
  return (
    <div className="overflow-x-auto -mx-1" aria-hidden>
      <table className="w-full min-w-[640px] border-collapse overflow-hidden rounded-lg text-left ring-1 ring-border/60">
        <thead>
          <tr className={theadRow}>
            <th className={th}>Type</th>
            <th className={th}>Name</th>
            <th className={th}>Email</th>
            <th className={th}>Intent</th>
            <th className={th}>Grade</th>
            <th className={`${th} tabular-nums`}>Score</th>
            <th className={th}>Address</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r} className={trRow}>
              {widths.map((w, c) => (
                <td key={c} className={tdMuted}>
                  <SkeletonBlock className={`h-3.5 ${w}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopProfilesTableSkeleton() {
  const widths = ["w-32", "w-28", "w-16", "w-20", "w-14", "w-8"];
  return (
    <div className="overflow-x-auto -mx-1" aria-hidden>
      <table className="w-full min-w-[520px] border-collapse overflow-hidden rounded-lg text-left ring-1 ring-border/60">
        <thead>
          <tr className={theadRow}>
            <th className={th}>Client</th>
            <th className={th}>Email</th>
            <th className={th}>Phone</th>
            <th className={th}>Address</th>
            <th className={`${th} text-right`}>Budget</th>
            <th className={`${th} text-center tabular-nums`}>Leads</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r} className={trRow}>
              {widths.map((w, c) => (
                <td key={c} className={tdMuted}>
                  <SkeletonBlock className={`h-3.5 ${w}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardTopTables({
  topLeads = [],
  topProfiles = [],
  leadsLoading,
  profilesLoading,
  leadsError,
  profilesError,
  onSelectLead,
  professionalType = "agent",
}) {
  const isLawyer = String(professionalType || "").toLowerCase() === "lawyer";
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section className="min-w-0 rounded-xl border border-border bg-white p-2.5 sm:p-3 shadow-sm">
        <h2 className="text-[13px] font-semibold text-text-heading">Top 5 leads</h2>
        <p className="mt-0.5 mb-2.5 text-[11px] leading-snug text-text-muted">
          Highest lead score in your workspace (same list as charts).
        </p>
        {leadsLoading ? (
          <TopLeadsTableSkeleton />
        ) : leadsError ? (
          <p className="text-sm text-red-600 py-4">Could not load leads.</p>
        ) : topLeads.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No leads to show yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] border-collapse overflow-hidden rounded-lg text-left ring-1 ring-border/60">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>{isLawyer ? "Stage" : "Type"}</th>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>{isLawyer ? "Transaction" : "Intent"}</th>
                  {isLawyer ? <th className={th}>Closing</th> : null}
                  {isLawyer ? <th className={th}>Value</th> : null}
                  <th className={th}>Grade</th>
                  <th className={`${th} tabular-nums`}>Score</th>
                  <th className={th}>Address</th>
                </tr>
              </thead>
              <tbody>
                {topLeads.map((row) => (
                  <tr key={row.id} className={trRow}>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => onSelectLead?.(row.id)}
                        className="max-w-[132px] truncate text-left text-[11px] font-semibold capitalize text-text-heading transition hover:text-primary sm:text-xs"
                        title={String(isLawyer ? row.transactionStage : row.propertyType || "")}
                      >
                        {isLawyer ? humanize(row.transactionStage) : row.propertyType || "—"}
                      </button>
                    </td>
                    <td className={tdStrong}>
                      <span className="block max-w-[120px] truncate whitespace-nowrap" title={row.name || ""}>
                        {row.name || "—"}
                      </span>
                    </td>
                    <td className={td}>
                      {row.email ? (
                        <span className="block max-w-[140px] truncate text-text-body" title={row.email}>
                          {row.email}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className={td}>{humanize(isLawyer ? row.transactionType : row.intent)}</td>
                    {isLawyer ? <td className={td}>{humanize(row.closingTimeline)}</td> : null}
                    {isLawyer ? <td className={td}>{formatLawyerValue(row.propertyValue)}</td> : null}
                    <td className={`${td} font-semibold`}>{row.grade ? String(row.grade).toUpperCase() : "—"}</td>
                    <td className={`${tdStrong} tabular-nums`}>{row.scoreLabel}</td>
                    <td className={td}>
                      <span
                        className="line-clamp-1 max-w-[110px]"
                        title={row.location || row.address || row.property?.location || row.property?.address || ""}
                      >
                        {row.location || row.address || row.property?.location || row.property?.address || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-white p-2.5 sm:p-3 shadow-sm">
        <h2 className="text-[13px] font-semibold text-text-heading">Top 5 client profiles</h2>
        <p className="mt-0.5 mb-2.5 text-[11px] leading-snug text-text-muted">
          Profiles with the most linked leads (from your client list).
        </p>
        {profilesLoading ? (
          <TopProfilesTableSkeleton />
        ) : profilesError ? (
          <p className="text-sm text-red-600 py-4">Could not load profiles.</p>
        ) : topProfiles.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No client profiles yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[560px] border-collapse overflow-hidden rounded-lg text-left ring-1 ring-border/60">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Client</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Address</th>
                  <th className={`${th} text-right`}>Budget</th>
                  <th className={`${th} text-center tabular-nums`}>Leads</th>
                </tr>
              </thead>
              <tbody>
                {topProfiles.map((profile) => {
                  const pid = profile?.id || profile?._id;
                  const displayName = profileDisplayName(profile);
                  const email = contactEmail(profile);
                  const phone = contactPhone(profile);
                  const p = profile?.property || {};
                  const budgetDisplay = getBudgetDisplay(profile);
                  const leadRefs = Array.isArray(profile?.lead_refs) ? profile.lead_refs : [];
                  return (
                    <tr key={String(pid)} className={trRow}>
                      <td className={tdStrong}>
                        {pid ? (
                          <Link
                            href={`/clients/${encodeURIComponent(pid)}`}
                            className="inline-flex min-w-0 items-center gap-2 font-medium text-text-heading transition hover:text-primary"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary-dark ring-1 ring-primary/10">
                              <User size={13} strokeWidth={2.2} />
                            </span>
                            <span className="max-w-[140px] truncate capitalize text-[11px] sm:text-xs">{displayName}</span>
                          </Link>
                        ) : (
                          <span className="truncate capitalize text-[11px] font-medium sm:text-xs">{displayName}</span>
                        )}
                      </td>
                      <td className={td}>
                        {email ? (
                          <a
                            href={`mailto:${encodeURIComponent(email)}`}
                            className="block max-w-[120px] truncate text-text-body transition hover:text-primary"
                            title={email}
                          >
                            {email}
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className={td}>{phone || <span className="text-text-muted">—</span>}</td>
                      <td className={td}>
                        <span
                          className="line-clamp-1 max-w-[120px]"
                          title={humanize(p.location || p.address)}
                        >
                          {humanize(p.location || p.address)}
                        </span>
                      </td>
                      <td className={`${td} text-right`}>
                        {budgetDisplay ? (
                          <BudgetCell display={budgetDisplay} />
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className={`${tdStrong} text-center tabular-nums`}>{leadRefs.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
