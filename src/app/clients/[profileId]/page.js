"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchLeadProfileById, fetchLeadsByProfileId } from "@/lib/leadsClient";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";
import { ClientProfileCardSkeleton, ProfileLeadsTableSkeleton } from "@/components/ui/ContentSkeletons";

const PAGE_SIZE = 15;

function humanize(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

function formatBudgetValue(value) {
  if (value == null || value === "") return "N/A";
  const num = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ClientProfileLeadsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = String(params?.profileId || "").trim();
  const clientProfilePath = profileId ? `/clients/${encodeURIComponent(profileId)}` : "/clients";
  const leadWorkspaceHref = (leadId) =>
    `/leads/${encodeURIComponent(leadId)}?back=${encodeURIComponent(clientProfilePath)}`;
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
    return (
      <div className="min-h-[40vh] bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-2 pb-3 pt-4 sm:px-3 sm:pb-4 sm:pt-5">
        <div className="mx-auto w-full max-w-5xl space-y-3">
          <ClientProfileCardSkeleton />
          <p className="text-center text-[11px] font-medium text-primary">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-2 pb-3 pt-4 font-body antialiased sm:px-3 sm:pb-4 sm:pt-5">
      <div className="mx-auto w-full max-w-5xl shrink-0 space-y-3">
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
          <ClientProfileCardSkeleton />
        ) : profileQuery.isError ? (
          <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-text-muted">
            {profileQuery.error?.message || "Could not load this profile."}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-heading text-base font-bold capitalize text-text-heading sm:text-lg">
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
                    {profile?.contact?.phone ? (
                      <p className="mt-0.5 text-xs font-medium text-text-muted">{profile.contact.phone}</p>
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
              <div className="mt-3 border-t border-border/70 pt-2">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-border/50">
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Intent</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.intent)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Location</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.property?.location)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Timeline</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.property?.timeline)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Appointment</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.appointment_status)}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Leads linked</th>
                      <td className="px-2 py-1 text-[10px] font-medium tabular-nums text-text-body sm:text-[11px]">
                        {linkedCountLabel}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Address</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.property?.address)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Type</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.property?.property_type)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Preferred</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.contact?.preferred_contact_method)}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Best time</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.contact?.best_time_to_contact)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Mortgage</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.qualification?.mortgage_status)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Realtor</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.qualification?.realtor_status)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Viewing</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.qualification?.viewing_readiness)}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Motivation</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.qualification?.motivation_reason)}
                      </td>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Urgency</th>
                      <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                        {humanize(profile?.qualification?.urgency_readiness)}
                      </td>
                      <td className="px-2 py-1" colSpan={4} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/90 bg-white shadow-sm">
              <div className="border-b border-border bg-primary/[0.04] px-2.5 py-1.5">
                <h2 className="font-heading text-sm font-semibold text-text-heading">Leads for this profile</h2>
                <p className="text-[10px] text-text-muted sm:text-[11px]">
                  Open a lead in the workspace to view conversation, nurture, and matches.
                </p>
              </div>

              {leadsQuery.isLoading && !leadsQuery.data ? (
                <div className="px-2 py-4 sm:px-3">
                  <ProfileLeadsTableSkeleton rows={6} />
                  <p className="mt-3 flex items-center gap-2 text-[10px] font-medium text-primary sm:text-[11px]">
                    <span
                      className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                      aria-hidden
                    />
                    Loading leads for this profile…
                  </p>
                </div>
              ) : leads.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-text-muted">
                  {leadsQuery.data?.empty_state?.reason || "No leads linked to this profile yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold capitalize tracking-wide text-text-muted">
                        <th className="px-2 py-1.5">Intent</th>
                        <th className="px-2 py-1.5">Type</th>
                        <th className="px-2 py-1.5">Location</th>
                        <th className="px-2 py-1.5">Timeline</th>
                        <th className="px-2 py-1.5 pr-3 text-right">Budget</th>
                        <th className="px-2 py-1.5 pl-3">Grade</th>
                        <th className="px-2 py-1.5 text-center">Score</th>
                        <th className="px-2 py-1.5">Preferred</th>
                        <th className="px-2 py-1.5">Best time</th>
                        <th className="px-2 py-1.5">Appt</th>
                        <th className="px-2 py-1.5 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {leads.map((lead) => {
                        const prop = lead.property || {};
                        const conversionProp = lead.conversion?.property || {};
                        const rowPropertyType =
                          conversionProp.property_type || conversionProp.type || prop.property_type || prop.type;
                        const rowLocation = conversionProp.location || conversionProp.area || prop.location;
                        const rowTimeline = conversionProp.timeline || prop.timeline;
                        const rowBudget =
                          conversionProp.budget ||
                          conversionProp.property_budget ||
                          prop.budget ||
                          prop.expected_price;
                        return (
                          <tr
                            key={lead.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(leadWorkspaceHref(lead.id))}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                router.push(leadWorkspaceHref(lead.id));
                              }
                            }}
                            className="hover:bg-primary/[0.06] cursor-pointer"
                          >
                            <td className="px-2 py-1.5 text-[10px] font-medium capitalize text-text-heading sm:text-[11px]">
                              {humanize(lead.intent)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-heading sm:text-[11px]">
                              {humanize(rowPropertyType)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(rowLocation)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(rowTimeline)}
                            </td>
                            <td className="px-2 py-1.5 pr-3 text-right text-[10px] font-medium tabular-nums text-text-heading sm:text-[11px]">
                              {formatBudgetValue(rowBudget)}
                            </td>
                            <td className="px-2 py-1.5 pl-3 text-[10px] font-medium capitalize text-text-heading sm:text-[11px]">
                              {humanize(lead.grade)}
                            </td>
                            <td className="px-2 py-1.5 text-center text-[10px] tabular-nums text-text-heading sm:text-[11px]">
                              {lead.score ?? "—"}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(lead?.contact?.preferred_contact_method)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(lead?.contact?.best_time_to_contact)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(lead?.appointment_status)}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Link
                                href={leadWorkspaceHref(lead.id)}
                                onClick={(event) => event.stopPropagation()}
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
