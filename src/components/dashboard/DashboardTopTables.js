"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";

const th =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:text-[11px]";
const td = "px-2 py-2 align-middle text-xs text-text-heading sm:text-sm";
const tdMuted = "px-2 py-2 align-middle text-xs text-text-muted sm:text-sm";

function humanize(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
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

export default function DashboardTopTables({
  topLeads = [],
  topProfiles = [],
  leadsLoading,
  profilesLoading,
  leadsError,
  profilesError,
  onSelectLead,
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section className="min-w-0 rounded-xl border border-border bg-white p-3 sm:p-4 shadow-sm">
        <h2 className="text-sm font-bold text-text-heading">Top 5 leads</h2>
        <p className="text-xs text-text-muted mt-0.5 mb-3">Highest lead score in your workspace (same list as charts).</p>
        {leadsLoading ? (
          <p className="text-sm text-text-muted py-6">Loading leads…</p>
        ) : leadsError ? (
          <p className="text-sm text-red-600 py-4">Could not load leads.</p>
        ) : topLeads.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No leads to show yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[440px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-primary/[0.04]">
                  <th className={th}>#</th>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Intent</th>
                  <th className={th}>Grade</th>
                  <th className={`${th} tabular-nums`}>Score</th>
                  <th className={th}>Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topLeads.map((row, idx) => (
                  <tr key={row.id}>
                    <td className={`${td} tabular-nums text-text-muted`}>{idx + 1}</td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => onSelectLead?.(row.id)}
                        className="font-semibold text-primary hover:underline text-left"
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className={tdMuted}>
                      {row.email ? (
                        <span className="block max-w-[140px] truncate" title={row.email}>
                          {row.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={tdMuted}>{humanize(row.intent)}</td>
                    <td className={tdMuted}>{row.grade ? String(row.grade).toUpperCase() : "—"}</td>
                    <td className={`${td} tabular-nums font-medium`}>{row.scoreLabel}</td>
                    <td className={tdMuted}>
                      <span className="line-clamp-1 max-w-[120px]" title={row.location || ""}>
                        {row.location || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-white p-3 sm:p-4 shadow-sm">
        <h2 className="text-sm font-bold text-text-heading">Top 5 client profiles</h2>
        <p className="text-xs text-text-muted mt-0.5 mb-3">Profiles with the most linked leads (from your client list).</p>
        {profilesLoading ? (
          <p className="text-sm text-text-muted py-6">Loading profiles…</p>
        ) : profilesError ? (
          <p className="text-sm text-red-600 py-4">Could not load profiles.</p>
        ) : topProfiles.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No client profiles yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-primary/[0.04]">
                  <th className={th}>#</th>
                  <th className={th}>Client</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Location</th>
                  <th className={`${th} text-right`}>Budget</th>
                  <th className={`${th} text-center tabular-nums`}>Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topProfiles.map((profile, idx) => {
                  const pid = profile?.id || profile?._id;
                  const displayName = profileDisplayName(profile);
                  const email = contactEmail(profile);
                  const phone = contactPhone(profile);
                  const p = profile?.property || {};
                  const budgetDisplay = getBudgetDisplay(profile);
                  const leadRefs = Array.isArray(profile?.lead_refs) ? profile.lead_refs : [];
                  return (
                    <tr key={String(pid)} className="transition-colors hover:bg-primary/[0.06]">
                      <td className={`${td} tabular-nums text-text-muted`}>{idx + 1}</td>
                      <td className={td}>
                        {pid ? (
                          <Link
                            href={`/clients/${encodeURIComponent(pid)}`}
                            className="inline-flex min-w-0 items-center gap-2 font-semibold text-primary hover:underline"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <User size={14} strokeWidth={2.2} />
                            </span>
                            <span className="truncate capitalize">{displayName}</span>
                          </Link>
                        ) : (
                          <span className="font-semibold capitalize truncate">{displayName}</span>
                        )}
                      </td>
                      <td className={tdMuted}>
                        {email ? (
                          <a
                            href={`mailto:${encodeURIComponent(email)}`}
                            className="block max-w-[140px] truncate text-primary hover:underline"
                            title={email}
                          >
                            {email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={tdMuted}>{phone || "—"}</td>
                      <td className={tdMuted}>
                        <span className="line-clamp-1 max-w-[120px]" title={humanize(p.location)}>
                          {humanize(p.location)}
                        </span>
                      </td>
                      <td className={`${td} text-right`}>
                        {budgetDisplay ? (
                          <BudgetCell display={budgetDisplay} />
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className={`${td} text-center font-semibold tabular-nums text-primary`}>{leadRefs.length}</td>
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
