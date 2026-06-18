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
  const headingDescription = (() => {
    if (normalizedFilter === "active") return "Track leads ready for timely follow-up.";
    if (normalizedFilter === "nurturing") return "Manage leads that need continued engagement.";
    if (normalizedFilter === "recurring leads") return "Review closed leads and long-term opportunities.";
    return "Review, qualify, and prioritize captured leads.";
  })();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {filterLabel ? (
            <>
              {standaloneFilterLabel ? (
                <div>
                  <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-heading">{filterLabel}</h1>
                  <p className="mt-1 text-[12px] font-medium text-text-muted">{headingDescription}</p>
                </div>
              ) : (
                <>
                  <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-heading">Pipeline</h1>
                  <span className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-primary-dark">{filterLabel}</span>
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
            <div>
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-heading">{pageTitle}</h1>
              <p className="mt-1 text-[12px] font-medium text-text-muted">
                {headingDescription}
              </p>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
