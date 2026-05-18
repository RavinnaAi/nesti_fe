"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProfessionals } from "@/lib/professionalsClient";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";

const TABS = [
  { id: "agent", label: "Agents" },
  { id: "lawyer", label: "Lawyers" },
  { id: "mortgage_broker", label: "Mortgage Brokers" },
];

function displayName(row) {
  const full = String(row?.full_name || "").trim();
  if (full) return full;
  const joined = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return joined || "Unnamed professional";
}

function initialsFor(row) {
  const name = displayName(row);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

export default function DashboardProfessionalsTabs({
  token,
  initialRole = "agent",
  showTabs = true,
  paginationOutside = false,
}) {
  const router = useRouter();
  const normalizedInitialRole = TABS.some((t) => t.id === initialRole) ? initialRole : "agent";
  const [activeTab, setActiveTab] = useState(normalizedInitialRole);
  const [page, setPage] = useState(1);
  const pageSize = useDynamicTablePageSize({
    minRows: 10,
    maxRows: 24,
    rowHeight: 42,
    reserveHeight: 260,
  });
  const effectivePageSize = Math.max(10, pageSize - 2);

  useEffect(() => {
    setActiveTab(normalizedInitialRole);
  }, [normalizedInitialRole]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);
  const query = useQuery({
    queryKey: ["dashboard-professionals", token, activeTab, page, effectivePageSize],
    enabled: Boolean(token),
    queryFn: () => fetchProfessionals({ token, role: activeTab, page, limit: effectivePageSize }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const items = useMemo(
    () => (Array.isArray(query.data?.items) ? query.data.items : []),
    [query.data?.items],
  );
  const pagination = query.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages || 1);
  const total = Number(pagination.total || items.length || 0);
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(pagination.has_next_page || currentPage < totalPages);
  const tableRows = useMemo(() => {
    if (items.length >= effectivePageSize) return items;
    return [...items, ...Array.from({ length: effectivePageSize - items.length }, () => null)];
  }, [items, effectivePageSize]);

  const paginationStrip = (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-border/80 bg-background-light/40 px-3 py-2.5 ${
        paginationOutside ? "rounded-md border" : "mt-2 border-t"
      }`}
    >
      <p className="text-xs text-text-muted">
        Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
        <span className="font-semibold text-text-heading">{totalPages}</span>
        {" · "}
        <span className="font-semibold text-text-heading">{total}</span> total
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrev || query.isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || query.isFetching}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <section className="min-w-0 rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-text-heading">Professionals</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Browse registered profiles by professional role.
          </p>
        </div>
        {showTabs ? (
          <div className="inline-flex rounded-lg border border-border bg-background-light p-0.5">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    active ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-heading"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-primary/[0.03] text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-2 py-1.5">Profile</th>
              <th className="px-2 py-1.5">Email</th>
              <th className="px-2 py-1.5">Phone</th>
              <th className="px-2 py-1.5">Company</th>
              <th className="px-2 py-1.5">Location</th>
              <th className="px-2 py-1.5">Leads</th>
              <th className="px-2 py-1.5">Deals</th>
              <th className="px-2 py-1.5">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {query.isLoading ? (
              <tr>
                <td className="px-2 py-3 text-xs text-text-muted" colSpan={8}>
                  Loading profiles...
                </td>
              </tr>
            ) : query.isError ? (
              <tr>
                <td className="px-2 py-3 text-xs text-red-600" colSpan={8}>
                  {query.error?.message || "Failed to load professionals."}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-xs text-text-muted" colSpan={8}>
                  No profiles found for this role.
                </td>
              </tr>
            ) : (
              tableRows.map((row, rowIndex) => {
                if (!row) {
                  return (
                    <tr key={`professionals-empty-row-${rowIndex}`} className="h-[42px]" aria-hidden>
                      {Array.from({ length: 8 }).map((_, cellIdx) => (
                        <td
                          key={`professionals-empty-cell-${rowIndex}-${cellIdx}`}
                          className="px-2 py-1.5"
                        >
                          <span className="invisible">—</span>
                        </td>
                      ))}
                    </tr>
                  );
                }
                return (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/professionals/${encodeURIComponent(row.id)}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/professionals/${encodeURIComponent(row.id)}`);
                    }
                  }}
                  className="cursor-pointer text-xs text-text-body transition hover:bg-primary/[0.06]"
                >
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {row.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.profile_image}
                          alt={displayName(row)}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/60"
                        />
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/15">
                          {initialsFor(row)}
                        </span>
                      )}
                      <span className="block max-w-[170px] truncate font-medium text-text-heading" title={displayName(row)}>
                        {displayName(row)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="block max-w-[180px] truncate" title={row.email || ""}>
                      {row.email || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">{row.phone || "—"}</td>
                  <td className="px-2 py-1.5">
                    <span className="block max-w-[140px] truncate" title={row.company_name || ""}>
                      {row.company_name || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="block max-w-[140px] truncate" title={row.location || ""}>
                      {row.location || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 font-semibold tabular-nums">{Number(row.total_leads || 0)}</td>
                  <td className="px-2 py-1.5 font-semibold tabular-nums">{Number(row.total_deals || 0)}</td>
                  <td className="px-2 py-1.5 capitalize">{String(row.professional_type || row.role || "—").replace(/_/g, " ")}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!paginationOutside ? paginationStrip : null}
      </section>
      {paginationOutside ? <div className="mt-3">{paginationStrip}</div> : null}
    </>
  );
}
