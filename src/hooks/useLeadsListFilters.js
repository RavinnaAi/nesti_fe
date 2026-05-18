"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getLeadsListFilterLabel } from "@/lib/leadPipelineConfig";
import { buildLeadWorkspaceHref, buildLeadsListHref } from "@/lib/leadsListUrls";

export function useLeadsListFilters() {
  const searchParams = useSearchParams();
  const status = String(searchParams.get("status") || "").trim();
  const pipeline = String(searchParams.get("pipeline") || "").trim();
  const referral = String(searchParams.get("referral") || "").trim();
  const page = useMemo(() => {
    const n = Number(searchParams.get("page") || "1");
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const filterLabel = useMemo(
    () => getLeadsListFilterLabel({ status, pipeline }),
    [status, pipeline]
  );

  const listContext = useMemo(() => ({ page, status, pipeline, referral }), [page, status, pipeline, referral]);

  const toLeadWorkspace = (leadId, options = {}) =>
    buildLeadWorkspaceHref(leadId, {
      ...listContext,
      tab: options.tab ?? "lead_profile",
    });

  const toListPage = (overrides = {}) => buildLeadsListHref({ ...listContext, ...overrides });

  return {
    status,
    pipeline,
    referral,
    page,
    filterLabel,
    hasPipelineFilter: Boolean(filterLabel),
    toLeadWorkspace,
    toListPage,
  };
}
