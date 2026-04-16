"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, User } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchLeadProfileById, fetchLeadsByProfileId } from "@/lib/leadsClient";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";

const PAGE_SIZE = 15;

function humanize(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

export default function ClientProfileLeadsPage() {
  const params = useParams();
  const profileId = String(params?.profileId || "").trim();
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => setHydrated(true), []);
  useEffect(() => setPage(1), [profileId]);

  const profileQuery = useQuery({
    queryKey: ["lead-profile", profileId, token],
    enabled: Boolean(token && profileId),
    queryFn: () => fetchLeadProfileById({ token, profileId }),
  });

  const leadsQuery = useQuery({
    queryKey: ["lead-profile-leads", profileId, page, PAGE_SIZE, token],
    enabled: Boolean(token && profileId),
    queryFn: () =>
      fetchLeadsByProfileId({
        token,
        profileId,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (p) => p,
  });

  const profile = profileQuery.data?.lead_profile;
  const leads = useMemo(() => {
    const raw = leadsQuery.data?.leads;
    return Array.isArray(raw) ? raw : [];
  }, [leadsQuery.data]);

  const pagination = leadsQuery.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages || 1);
  const total = Number(pagination.total || leads.length || 0);
  const refLeadCount = Array.isArray(profile?.lead_refs) ? profile.lead_refs.length : 0;
  const linkedCountLabel = leadsQuery.data?.pagination != null ? total : refLeadCount;
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(pagination.has_next_page || currentPage < totalPages);

  const displayName = useMemo(() => {
    const c = profile?.contact || {};
    return (
      String(c.full_name || c.name || "").trim() ||
      String(c.email || "").trim() ||
      "Client profile"
    );
  }, [profile]);

  const budgetDisplay = profile ? getBudgetDisplay(profile) : null;

  if (!hydrated) {
    return <div className="min-h-[30vh] bg-gradient-to-br from-primary/5 via-white to-primary/[0.04]" />;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-2.5 pb-3 pt-5 font-body antialiased sm:px-4 sm:pb-4 sm:pt-6">
      <div className="mx-auto w-full max-w-5xl shrink-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
          >
            <ArrowLeft size={14} />
            Back to clients
          </Link>
        </div>

        {profileQuery.isLoading ? (
          <div className="flex justify-center py-16 text-text-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : profileQuery.isError ? (
          <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-text-muted">
            {profileQuery.error?.message || "Could not load this profile."}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-heading text-lg font-bold capitalize text-text-heading sm:text-xl">
                      {displayName}
                    </h1>
                    <p className="mt-1 text-[11px] text-text-muted sm:text-xs">
                      Profile ID: <span className="font-mono text-text-heading">{profileId}</span>
                    </p>
                    {profile?.contact?.email ? (
                      <a
                        href={`mailto:${encodeURIComponent(profile.contact.email)}`}
                        className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                      >
                        {profile.contact.email}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Budget</p>
                  <div className="mt-0.5">
                    {budgetDisplay ? (
                      <BudgetCell display={budgetDisplay} />
                    ) : (
                      <span className="text-sm font-semibold text-text-muted">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-[11px] sm:grid-cols-3 sm:text-xs">
                <div>
                  <dt className="text-text-muted">Intent</dt>
                  <dd className="mt-0.5 font-medium capitalize text-text-heading">{humanize(profile?.intent)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Location</dt>
                  <dd className="mt-0.5 font-medium capitalize text-text-heading">
                    {humanize(profile?.property?.location)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Timeline</dt>
                  <dd className="mt-0.5 font-medium capitalize text-text-heading">
                    {humanize(profile?.property?.timeline)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Appointment</dt>
                  <dd className="mt-0.5 font-medium capitalize text-text-heading">
                    {humanize(profile?.appointment_status)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Leads linked</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-text-heading">{linkedCountLabel}</dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/90 bg-white shadow-sm">
              <div className="border-b border-border bg-primary/[0.04] px-3 py-2">
                <h2 className="font-heading text-sm font-semibold text-text-heading">Leads for this profile</h2>
                <p className="text-[10px] text-text-muted sm:text-[11px]">
                  Open a lead in the workspace to view conversation, nurture, and matches.
                </p>
              </div>

              {leadsQuery.isLoading && !leadsQuery.data ? (
                <div className="flex justify-center py-12 text-text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-text-muted">
                  {leadsQuery.data?.empty_state?.reason || "No leads linked to this profile yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold capitalize tracking-wide text-text-muted sm:text-[11px]">
                        <th className="min-w-[8rem] px-2 py-2">Lead ID</th>
                        <th className="px-2 py-2">Grade</th>
                        <th className="px-2 py-2 text-center">Score</th>
                        <th className="px-2 py-2">ICP</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Updated</th>
                        <th className="px-2 py-2 text-right">Workspace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {leads.map((lead) => {
                        const updated =
                          lead.updated_at || lead.updatedAt || lead.created_at || lead.createdAt;
                        const updatedLabel = updated
                          ? new Date(updated).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—";
                        const icpTier = lead.icp_fit?.fit_tier || lead.icp_fit?.tier || "—";
                        return (
                          <tr key={lead.id} className="hover:bg-primary/[0.06]">
                            <td className="max-w-[10rem] px-2 py-2 sm:max-w-[14rem]">
                              <span
                                className="break-all font-mono text-[9px] leading-snug text-text-heading sm:text-[10px]"
                                title={lead.id}
                              >
                                {lead.id}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-[11px] font-medium capitalize text-text-heading sm:text-xs">
                              {humanize(lead.grade)}
                            </td>
                            <td className="px-2 py-2 text-center text-[11px] tabular-nums text-text-heading sm:text-xs">
                              {lead.score ?? "—"}
                            </td>
                            <td className="px-2 py-2 text-[11px] capitalize text-text-muted sm:text-xs">
                              {humanize(icpTier)}
                            </td>
                            <td className="px-2 py-2 text-[11px] capitalize text-text-muted sm:text-xs">
                              {humanize(lead.status)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-[10px] tabular-nums text-text-muted sm:text-[11px]">
                              {updatedLabel}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <Link
                                href={`/leads?lead=${encodeURIComponent(lead.id)}`}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline sm:text-[11px]"
                              >
                                Open
                                <ExternalLink size={12} className="opacity-70" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {leads.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-primary/[0.03] px-2 py-2">
                  <p className="text-[10px] text-text-muted">
                    Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                    <span className="font-semibold text-text-heading">{totalPages}</span>
                    {" · "}
                    <span className="font-semibold text-text-heading">{total}</span> leads
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={!hasPrev || leadsQuery.isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-primary bg-primary px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!hasNext || leadsQuery.isFetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded border border-primary bg-primary px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
