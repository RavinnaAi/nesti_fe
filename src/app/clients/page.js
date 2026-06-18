"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox, Mail, User } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAppSelector } from "@/store";
import { FEATURES } from "@/constants/features";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";
import { AppointmentStatusChip, LeadsCountChip } from "@/components/clients/AppointmentStatusChip";
import { fetchLeadProfiles } from "@/lib/leadsClient";
import PlanLimitBanner from "@/components/billing/PlanLimitBanner";
import { ClientsTableSkeleton } from "@/components/ui/ContentSkeletons";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";

const th =
  "whitespace-nowrap px-1.5 py-1.5 text-left text-[10px] font-semibold capitalize tracking-wide text-text-muted sm:text-[11px]";
const td = "px-1.5 py-1 align-middle text-[10px] text-text-heading sm:text-[11px]";
const tdMuted =
  "px-1.5 py-1 align-middle text-[10px] capitalize text-text-muted sm:text-[11px]";

function normalizeProfiles(data) {
  if (Array.isArray(data?.lead_profiles)) return data.lead_profiles;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
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
  const e = String(c.email || "").trim();
  return e || null;
}

function contactPhone(profile) {
  const c = profile?.contact || {};
  return String(c.phone || "").trim() || null;
}

function humanize(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

const ICP_TIER_OPTIONS = [
  { value: "", label: "All ICP tiers" },
  { value: "perfect_match", label: "Perfect match" },
  { value: "good_match", label: "Good match" },
  { value: "low_match", label: "Low match" },
];

function IcpTierDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = ICP_TIER_OPTIONS.find((o) => o.value === value) ?? ICP_TIER_OPTIONS[0];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 min-w-[7.5rem] items-center justify-between gap-1 rounded-md border border-border bg-white py-0 pl-2 pr-1 text-left text-[10px] font-medium capitalize text-text-heading shadow-sm transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:min-w-[8.25rem] sm:pl-2.5 sm:pr-1.5 sm:text-[11px]"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          className="absolute right-0 z-50 mt-1 min-w-full overflow-hidden rounded-md border border-border/90 bg-white py-0.5 shadow-md ring-1 ring-primary/[0.08]"
          role="listbox"
        >
          {ICP_TIER_OPTIONS.map((opt) => {
            const active = value === opt.value;
            return (
              <li key={opt.value === "" ? "all" : opt.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-2 py-1 text-left text-[10px] font-medium capitalize transition-colors duration-150 sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                    active
                      ? "bg-primary/[0.14] text-primary-dark"
                      : "text-text-heading hover:bg-primary/[0.10] hover:text-primary-dark"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const { hasFeature } = useFeatureAccess();
  const { token, user: authUser } = useAppSelector((state) => state.auth);
  const canBulkFollowup = hasFeature(FEATURES.LEADS_FOLLOWUP_AUTOMATED);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [icpTier, setIcpTier] = useState("");
  const viewerRole = String(authUser?.role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const isMortgageBrokerViewer = viewerRole === "mortgage_broker";
  const pageSize = useDynamicTablePageSize({
    minRows: 10,
    maxRows: 24,
    rowHeight: 42,
    reserveHeight: 230,
  });
  const effectivePageSize = Math.max(10, pageSize - 2);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [icpTier]);

  const clientsQuery = useQuery({
    queryKey: ["clients", token, page, effectivePageSize, icpTier],
    enabled: Boolean(token),
    queryFn: () =>
      fetchLeadProfiles({
        token,
        page,
        limit: effectivePageSize,
        icp_tier: icpTier || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const profiles = useMemo(() => normalizeProfiles(clientsQuery.data), [clientsQuery.data]);
  const isEmptyState = !clientsQuery.isLoading && profiles.length === 0;
  const tableRows = useMemo(() => {
    if (profiles.length >= effectivePageSize) return profiles;
    return [...profiles, ...Array.from({ length: effectivePageSize - profiles.length }, () => null)];
  }, [profiles, effectivePageSize]);
  const pagination = clientsQuery.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages || 1);
  const total = Number(pagination.total || profiles.length || 0);
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(pagination.has_next_page || currentPage < totalPages);

  if (!hydrated) {
    return (
      <div className="min-h-[40vh] bg-transparent px-2.5 pt-5 sm:px-4 sm:pt-6">
        <div className="w-full">
          <div className="overflow-hidden rounded-md border border-border/90 bg-white p-2 shadow-sm sm:p-3">
            <ClientsTableSkeleton rows={effectivePageSize} showMortgageColumn={!isMortgageBrokerViewer} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col bg-transparent pb-3 font-body text-text-body antialiased sm:pb-4">
      <div className="flex min-h-0 flex-1 w-full flex-col space-y-1.5 px-2.5 pt-5 sm:px-4 sm:pt-6">
        <PlanLimitBanner />
        <div className="flex flex-wrap items-end justify-between gap-1.5">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-heading">
              Clients
            </h1>
            <p className="mt-0.5 text-xs leading-5 text-text-muted">
              Review and manage captured client profiles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canBulkFollowup ? (
              <button
                type="button"
                onClick={() => router.push("/clients/follow-ups")}
                disabled={clientsQuery.isLoading || profiles.length === 0}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail size={13} />
                Follow up clients
              </button>
            ) : null}
            <IcpTierDropdown
              value={icpTier}
              onChange={setIcpTier}
              disabled={clientsQuery.isFetching}
            />
          </div>
        </div>

        <div
          className={
            isEmptyState
              ? "min-h-0 flex-1 overflow-hidden bg-transparent"
              : "min-h-0 flex-1 overflow-hidden rounded-md border border-border/90 bg-white shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.02]"
          }
        >
          {clientsQuery.isLoading ? (
            <div className="p-2 sm:p-3">
              <ClientsTableSkeleton rows={effectivePageSize} showMortgageColumn={!isMortgageBrokerViewer} />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex h-full min-h-[calc(100vh-14rem)] items-center justify-center px-4 pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
              <div className="w-full max-w-xl">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox size={18} />
                </span>
                <p className="text-base font-bold text-text-heading">No clients yet</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
                  {clientsQuery.data?.empty_state?.reason || "Captured lead profiles will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-primary/[0.04]">
                    <th className={`${th} !pr-px`}>Client</th>
                    <th className={`${th} !px-px`}>Email</th>
                    <th className={`${th} !pl-px`}>Phone</th>
                    <th className={th}>Address</th>
                    <th className={th}>Timeline</th>
                    {!isMortgageBrokerViewer ? <th className={`${th} pr-2`}>Mortgage</th> : null}
                    <th className={`${th} pl-0 pr-4 text-right sm:pr-5`}>Budget</th>
                    <th className={`${th} pl-1`}>Appointment</th>
                    <th className={`${th} text-center tabular-nums`}>Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableRows.map((profile, rowIndex) => {
                    if (!profile) {
                      const cells = isMortgageBrokerViewer ? 8 : 9;
                      return (
                        <tr key={`clients-empty-row-${rowIndex}`} className="h-[42px]">
                          {Array.from({ length: cells }).map((_, cellIdx) => (
                            <td key={`clients-empty-cell-${rowIndex}-${cellIdx}`} className={td}>
                              <span className="invisible">—</span>
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    const p = profile?.property || {};
                    const q = profile?.qualification || {};
                    const leadRefs = Array.isArray(profile?.lead_refs) ? profile.lead_refs : [];
                    const leadCount = leadRefs.length;
                    const email = contactEmail(profile);
                    const phone = contactPhone(profile);
                    const displayName = profileDisplayName(profile);
                    const budgetDisplay = getBudgetDisplay(profile);
                    return (
                      <tr
                        key={profile.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open client profile for ${displayName}`}
                        className="cursor-pointer transition-colors duration-150 ease-out hover:bg-primary/[0.10]"
                        onClick={() => router.push(`/clients/${encodeURIComponent(profile.id)}`)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          router.push(`/clients/${encodeURIComponent(profile.id)}`);
                        }}
                      >
                        <td className={`${td} !pr-px`}>
                          <div className="flex min-w-[108px] max-w-[220px] items-center gap-2">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <User size={16} strokeWidth={2.2} />
                            </span>
                            <span
                              className="truncate font-heading text-[12px] font-semibold capitalize leading-tight text-text-heading sm:text-[13px]"
                              title={displayName}
                            >
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className={td}>
                          {email ? (
                            <a
                              href={`mailto:${encodeURIComponent(email)}`}
                              className="block max-w-[160px] truncate text-[10px] font-medium text-primary underline-offset-2 hover:underline sm:max-w-[180px] sm:text-[11px]"
                              title={email}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {email}
                            </a>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className={`${td} !pl-px tabular-nums`}>
                          {phone ? <span title={phone}>{phone}</span> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className={tdMuted}>
                          <span className="line-clamp-2 max-w-[120px]" title={humanize(p.address || p.location)}>
                            {humanize(p.address || p.location)}
                          </span>
                        </td>
                        <td className={tdMuted}>
                          <span className="line-clamp-2 max-w-[100px]" title={humanize(p.timeline)}>
                            {humanize(p.timeline)}
                          </span>
                        </td>
                        {!isMortgageBrokerViewer ? (
                          <td className={`${tdMuted} pr-2`}>
                            <span className="line-clamp-2 max-w-[100px]" title={humanize(q.mortgage_status)}>
                              {humanize(q.mortgage_status)}
                            </span>
                          </td>
                        ) : null}
                        <td className={`${td} whitespace-nowrap pl-0 pr-4 text-right sm:pr-5`}>
                          {budgetDisplay ? (
                            <BudgetCell display={budgetDisplay} />
                          ) : (
                            <span
                              className="inline-flex min-h-[1.25rem] min-w-[2.25rem] items-center justify-end rounded border border-primary/15 bg-primary/[0.06] px-1.5 py-px text-[10px] font-semibold normal-case tabular-nums tracking-wide text-text-muted sm:min-h-[1.375rem] sm:min-w-[2.5rem] sm:px-2 sm:text-[11px]"
                              title="No numeric budget on file"
                            >
                              N/A
                            </span>
                          )}
                        </td>
                        <td className={`${tdMuted} pl-1 align-middle sm:pl-2`}>
                          <AppointmentStatusChip status={profile?.appointment_status || "not_booked"} />
                        </td>
                        <td className={`${td} text-center align-middle tabular-nums`}>
                          <div className="flex justify-center">
                            <LeadsCountChip count={leadCount} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {!clientsQuery.isLoading && profiles.length > 0 ? (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-md border border-border/80 bg-background-light/40 px-3 py-2.5">
            <p className="flex items-center gap-2 text-xs text-text-muted">
              {clientsQuery.isFetching && !clientsQuery.isLoading ? (
                <span
                  className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                  aria-hidden
                />
              ) : null}
              <span>
                Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                <span className="font-semibold text-text-heading">{totalPages}</span>
                {" · "}
                <span className="font-semibold text-text-heading">{total}</span> total
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrev || clientsQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                disabled={!hasNext || clientsQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
