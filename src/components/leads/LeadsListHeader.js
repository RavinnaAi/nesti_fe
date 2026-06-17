"use client";

import Link from "next/link";

/**
 * Title row for /leads: Pipeline title + filter when URL has pipeline/status; subtitle only on unfiltered list.
 * @param {string} [props.filterLabel] — from getLeadsListFilterLabel
 * @param {React.ReactNode} [props.children] — search / filters (right side)
 */
export default function LeadsListHeader({ filterLabel = "", children = null, pageTitle = "Leads" }) {
  const normalizedFilter = String(filterLabel || "").trim().toLowerCase();
  const standaloneFilterLabel = new Set(["recurring leads", "active", "nurturing"]).has(normalizedFilter);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {filterLabel ? (
            <>
              {standaloneFilterLabel ? (
                <h1 className="text-[26px] leading-tight font-bold text-primary-dark">{filterLabel}</h1>
              ) : (
                <>
                  <h1 className="text-[26px] leading-tight font-bold text-text-heading">Pipeline</h1>
                  <span className="text-[22px] leading-tight font-bold text-primary-dark">{filterLabel}</span>
                  <Link
                    href="/leads"
                    className="text-[13px] font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    All leads
                  </Link>
                </>
              )}
            </>
          ) : (
            <h1 className="text-[26px] leading-tight font-bold text-text-heading">{pageTitle}</h1>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
