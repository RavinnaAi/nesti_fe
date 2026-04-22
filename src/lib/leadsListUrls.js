import { LEAD_WORKSPACE_TAB_IDS } from "@/lib/leadWorkspaceTabsMeta";

/** Build `/leads?page=&status=&pipeline=` for list + pagination. */
export function buildLeadsListHref({ page = 1, status = "", pipeline = "" } = {}) {
  const p = new URLSearchParams();
  const pg = Math.max(1, Number(page) || 1);
  if (pg > 1) p.set("page", String(pg));
  const st = String(status || "").trim();
  const pl = String(pipeline || "").trim();
  if (st) p.set("status", st);
  if (pl) p.set("pipeline", pl);
  const q = p.toString();
  return q ? `/leads?${q}` : "/leads";
}

/**
 * Build `/leads/:id?page=&status=&pipeline=&tab=` preserving list context.
 * Default tab for list → detail flow: lead_profile (stage).
 */
export function buildLeadWorkspaceHref(
  leadId,
  { page = 1, status = "", pipeline = "", tab = "lead_profile" } = {}
) {
  const id = encodeURIComponent(String(leadId || "").trim());
  if (!id) return "/leads";
  const p = new URLSearchParams();
  p.set("page", String(Math.max(1, Number(page) || 1)));
  const st = String(status || "").trim();
  const pl = String(pipeline || "").trim();
  if (st) p.set("status", st);
  if (pl) p.set("pipeline", pl);
  const t = String(tab || "").trim();
  if (t && LEAD_WORKSPACE_TAB_IDS.has(t)) p.set("tab", t);
  return `/leads/${id}?${p.toString()}`;
}
