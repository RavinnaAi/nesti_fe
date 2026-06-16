"use client";

export default function LeadsListPagination({
  leadsQuery,
  leadsPagination,
  onPrev,
  onNext,
  resourceLabel = "leads",
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-transparent px-2.5 py-1.5 shadow-none">
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        {leadsQuery.isFetching && !leadsQuery.isLoading ? (
          <span
            className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
            aria-hidden
          />
        ) : null}
        <span>
          Page {leadsPagination.current} of {leadsPagination.totalPages}
          {Number.isFinite(leadsPagination.total) && leadsPagination.total > 0
            ? ` · ${leadsPagination.total} total ${resourceLabel}`
            : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!leadsPagination.hasPrev || leadsQuery.isFetching}
          onClick={onPrev}
          className="h-7 px-2.5 rounded-md border border-border text-[11px] font-semibold text-text-heading hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!leadsPagination.hasNext || leadsQuery.isFetching}
          onClick={onNext}
          className="h-7 px-2.5 rounded-md border border-border text-[11px] font-semibold text-text-heading hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
