"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchReferrals } from "@/lib/chatClient";
import ReferralsDataTable, {
  defaultReferralsDetailHref,
  normalizeReferralRows,
} from "@/components/referrals/ReferralsDataTable";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";

function referralsListHref(direction, page) {
  const p = new URLSearchParams();
  p.set("direction", direction === "outbound" ? "outbound" : "inbound");
  if (Number.isFinite(page) && page > 1) p.set("page", String(page));
  return `/referrals?${p.toString()}`;
}

function ReferralsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDirection = String(searchParams.get("direction") || "inbound")
    .trim()
    .toLowerCase();
  const direction = rawDirection === "outbound" ? "outbound" : "inbound";

  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const rowsPerPage = useDynamicTablePageSize({
    minRows: 10,
    maxRows: 24,
    rowHeight: 44,
    reserveHeight: 240,
  });
  const effectiveRowsPerPage = Math.max(10, rowsPerPage);

  const rawPage = Number.parseInt(String(searchParams.get("page") || "1"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  useEffect(() => {
    const d = String(searchParams.get("direction") || "").trim().toLowerCase();
    if (!d && typeof window !== "undefined") {
      router.replace("/referrals?direction=inbound", { scroll: false });
    }
    if (d && d !== "inbound" && d !== "outbound") {
      router.replace("/referrals?direction=inbound", { scroll: false });
    }
  }, [router, searchParams]);

  const referralsQuery = useQuery({
    queryKey: ["chat-referrals", token, direction, page, effectiveRowsPerPage, "all"],
    enabled: Boolean(token),
    queryFn: () =>
      fetchReferrals({
        token,
        direction,
        page,
        limit: effectiveRowsPerPage,
      }),
  });

  const rows = useMemo(() => normalizeReferralRows(referralsQuery.data), [referralsQuery.data]);
  const counts = referralsQuery.data?.counts || {};
  const inboundTotal = Number(counts.inbound_total ?? 0);
  const outboundTotal = Number(counts.outbound_total ?? 0);
  const pagination = referralsQuery.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages ?? (rows.length > 0 ? 1 : 0));
  const total = Number(pagination.total ?? rows.length ?? 0);
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(
    pagination.has_next_page || (totalPages > 0 && currentPage < totalPages)
  );

  if (!isAuthenticated) return null;

  const paginationFooter =
    !referralsQuery.isLoading && total > 0 ? (
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-background-light/40 px-3 py-2.5">
        <p className="flex items-center gap-2 text-xs text-text-muted">
          {referralsQuery.isFetching && !referralsQuery.isLoading ? (
            <span
              className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              aria-hidden
            />
          ) : null}
          <span>
            Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
            <span className="font-semibold text-text-heading">{Math.max(totalPages, 1)}</span>
            {" · "}
            <span className="font-semibold text-text-heading">{total}</span> total
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={referralsListHref(direction, Math.max(1, currentPage - 1))}
            scroll={false}
            aria-disabled={!hasPrev || referralsQuery.isFetching}
            className={`h-8 px-3 rounded-md border border-border text-xs font-semibold text-text-heading hover:bg-background-light inline-flex items-center gap-1 ${
              !hasPrev || referralsQuery.isFetching ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </Link>
          <Link
            href={referralsListHref(direction, currentPage + 1)}
            scroll={false}
            aria-disabled={!hasNext || referralsQuery.isFetching}
            className={`h-8 px-3 rounded-md border border-border text-xs font-semibold text-text-heading hover:bg-background-light inline-flex items-center gap-1 ${
              !hasNext || referralsQuery.isFetching ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Next
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    ) : null;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-transparent">
      <div className="flex h-full w-full flex-col px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <div>
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-heading">
                Referrals
              </h1>
              <p className="mt-0.5 text-xs leading-5 text-text-muted">
                {direction === "inbound"
                  ? "Review and manage referrals sent to your workspace."
                  : "Track leads you have shared with other professionals."}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <ReferralsDataTable
            rows={rows}
            isLoading={referralsQuery.isLoading}
            isError={referralsQuery.isError}
            errorMessage={referralsQuery.error?.message}
            direction={direction}
            getDetailHref={defaultReferralsDetailHref}
            heading={direction === "inbound" ? "Inbound referrals" : "Outbound referrals"}
            hint="Click any row to open the referral workspace. Columns follow each row's source lead type (agent vs lawyer vs mortgage broker)."
            emptyMessage={
              direction === "inbound"
                ? "No inbound referrals yet"
                : "No outbound referrals yet"
            }
            footer={paginationFooter}
            rowsPerPage={effectiveRowsPerPage}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  return (
    <Suspense fallback={null}>
      <ReferralsPageContent />
    </Suspense>
  );
}
