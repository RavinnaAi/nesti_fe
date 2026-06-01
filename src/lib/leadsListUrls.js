import { LEAD_WORKSPACE_TAB_IDS, normalizeLeadWorkspaceTabId } from "@/lib/leadWorkspaceTabsMeta";
import { normalizeLeadId } from "@/lib/leadsPageUtils";

/** Build `/leads?page=&status=&pipeline=&referral=` for list + pagination. */
export function buildLeadsListHref({ page = 1, status = "", pipeline = "", referral = "" } = {}) {
  const p = new URLSearchParams();
  const pg = Math.max(1, Number(page) || 1);
  if (pg > 1) p.set("page", String(pg));
  const st = String(status || "").trim();
  const pl = String(pipeline || "").trim();
  const ref = String(referral || "").trim();
  if (st) p.set("status", st);
  if (pl) p.set("pipeline", pl);
  if (ref) p.set("referral", ref);
  const q = p.toString();
  return q ? `/leads?${q}` : "/leads";
}

/**
 * Build `/leads/:id?page=&status=&pipeline=&tab=` preserving list context.
 * Default tab for list → detail flow: lead_profile (stage).
 */
export function buildLeadWorkspaceHref(
  leadId,
  { page = 1, status = "", pipeline = "", referral = "", tab = "lead_profile" } = {}
) {
  const canonicalId = normalizeLeadId(leadId) || String(leadId || "").trim();
  const id = encodeURIComponent(canonicalId);
  if (!id) return "/leads";
  const p = new URLSearchParams();
  p.set("page", String(Math.max(1, Number(page) || 1)));
  const st = String(status || "").trim();
  const pl = String(pipeline || "").trim();
  const ref = String(referral || "").trim();
  if (st) p.set("status", st);
  if (pl) p.set("pipeline", pl);
  if (ref) p.set("referral", ref);
  const t = normalizeLeadWorkspaceTabId(String(tab || "").trim());
  if (t && LEAD_WORKSPACE_TAB_IDS.has(t)) p.set("tab", t);
  return `/leads/${id}?${p.toString()}`;
}
