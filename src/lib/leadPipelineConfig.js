/** Match backend `match_status` + list filters. */

/** Manual stage picks (excludes automation-only stages below). */
export const LEAD_MATCH_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "nurturing", label: "Nurturing" },
  { value: "converted", label: "Closed — won" },
  { value: "closed_lost", label: "Closed — lost" },
];

/** Labels when lead is already in these stages (e.g. Calendly); not shown as manual dropdown targets. */
export const PIPELINE_AUTOMATION_STATUS_LABELS = {
  consult_booked: "Consult booked",
  showing_booked: "Showing booked",
};

/** Options for agent stage control (e.g. Lead profile). */
export const PIPELINE_AGENT_SELECT_TERMINAL = [
  { value: "new", label: "New (reopen)" },
  { value: "nurturing", label: "Nurturing (reopen)" },
  { value: "converted", label: "Closed — won" },
  { value: "closed_lost", label: "Closed — lost" },
];

/** Sidebar shortcuts: use the main Leads link for an unfiltered list; Recurring Leads covers won + lost. */
export const PIPELINE_SIDEBAR_ITEMS = [
  { key: "active", label: "Active", kind: "pipeline", value: "active" },
  { key: "closed", label: "Recurring Leads", kind: "pipeline", value: "closed" },
  { key: "nurturing", label: "Nurturing", kind: "status", value: "nurturing" },
];

export const PIPELINE_SETTINGS_STORAGE_KEY = "nesti_leads_pipeline_sidebar_visible";
export const PIPELINE_SETTINGS_EVENT = "nesti-leads-pipeline-settings";

export const DEFAULT_VISIBLE_PIPELINE_KEYS = PIPELINE_SIDEBAR_ITEMS.map((i) => i.key);

/** Human label for the current `/leads?status=` / `?pipeline=` filter (sidebar + URL). */
export function getLeadsListFilterLabel({ status, pipeline } = {}) {
  const st = String(status || "").trim();
  const pl = String(pipeline || "").trim();
  if (st) {
    const hit = PIPELINE_SIDEBAR_ITEMS.find((i) => i.kind === "status" && i.value === st);
    if (hit) return hit.label;
    const automationLabel = PIPELINE_AUTOMATION_STATUS_LABELS[st];
    if (automationLabel) return automationLabel;
    const fromEnum = LEAD_MATCH_STATUS_OPTIONS.find((o) => o.value === st);
    if (fromEnum) return fromEnum.label;
    return st.replace(/_/g, " ");
  }
  if (pl) {
    const hit = PIPELINE_SIDEBAR_ITEMS.find((i) => i.kind === "pipeline" && i.value === pl);
    if (hit) return hit.label;
    return pl.replace(/_/g, " ");
  }
  return "";
}

export function readVisiblePipelineKeys() {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_PIPELINE_KEYS;
  try {
    const raw = localStorage.getItem(PIPELINE_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_PIPELINE_KEYS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_VISIBLE_PIPELINE_KEYS;
    const allowed = new Set(PIPELINE_SIDEBAR_ITEMS.map((i) => i.key));
    let filtered = parsed.filter((k) => allowed.has(k));
    if (!filtered.length) return DEFAULT_VISIBLE_PIPELINE_KEYS;
    return filtered;
  } catch {
    return DEFAULT_VISIBLE_PIPELINE_KEYS;
  }
}

export function writeVisiblePipelineKeys(keys) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIPELINE_SETTINGS_STORAGE_KEY, JSON.stringify(keys));
  window.dispatchEvent(new CustomEvent(PIPELINE_SETTINGS_EVENT));
}

export function isTerminalPipelineStatus(s) {
  return s === "converted" || s === "closed_lost";
}

const STATUS_DISPLAY_MAP = {
  new: { label: "New", color: "bg-blue-50 text-blue-700 border-blue-200" },
  nurturing: { label: "Nurturing", color: "bg-amber-50 text-amber-700 border-amber-200" },
  consult_booked: { label: "Consult booked", color: "bg-violet-50 text-violet-700 border-violet-200" },
  showing_booked: { label: "Showing booked", color: "bg-violet-50 text-violet-700 border-violet-200" },
  converted: { label: "Won", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed_lost: { label: "Lost", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

function normalizeProfessionalType(roleRaw) {
  const role = String(roleRaw || "").trim().toLowerCase();
  if (role === "lawyer") return "lawyer";
  if (role === "mortgage_broker") return "mortgage_broker";
  return "agent";
}

export function getStatusDisplay(status, roleRaw = "") {
  const statusNorm = String(status || "").trim().toLowerCase();
  const role = normalizeProfessionalType(roleRaw);
  const base =
    STATUS_DISPLAY_MAP[statusNorm] || {
      label: statusNorm.replace(/_/g, " ") || "—",
      color: "bg-gray-50 text-gray-600 border-gray-200",
    };
  if (statusNorm === "converted") {
    if (role === "agent") return { ...base, label: "Deal successfully closed" };
    if (role === "lawyer") return { ...base, label: "Matter retained" };
    if (role === "mortgage_broker") return { ...base, label: "Funded" };
  }
  if (statusNorm === "closed_lost" && role === "agent") {
    return { ...base, label: "Lead not proceeding" };
  }
  if (statusNorm === "closed_lost" && role === "lawyer") {
    return { ...base, label: "Matter lost" };
  }
  return base;
}

/** Maps `match_status` → chip tone for accepted-referrals table (border/bg classes applied in UI). */
const INBOUND_PIPELINE_TONE_BY_STATUS = {
  nurturing: "nurturing",
  consult_booked: "automation",
  showing_booked: "automation",
  converted: "won",
  closed_lost: "lost",
};

const INBOUND_REFERRAL_CHIP_CLASS = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  won: "border-emerald-200 bg-emerald-50 text-emerald-900",
  nurturing: "border-amber-200 bg-amber-50 text-amber-950",
  lost: "border-slate-200 bg-slate-100 text-slate-800",
  automation: "border-violet-200 bg-violet-50 text-violet-900",
  other: "border-border bg-background-light text-text-heading",
};

/**
 * Leads → Pipeline → Accepted referrals: `viewer_match_status` from recipient lead.
 * Handoff default `new` → label **Accepted**; any other `match_status` uses `getStatusDisplay` + tone map.
 */
export function getInboundAcceptedReferralRowStatus(matchStatus, context = {}) {
  const s = String(matchStatus || "").trim().toLowerCase();
  if (!s || s === "new") {
    return { label: "Accepted", tone: "accepted" };
  }
  // If the recipient LeadMatch was already "nurturing" at the exact moment
  // the referral got accepted, keep showing "Accepted" until a later pipeline edit.
  if (s === "nurturing") {
    const referralUpdatedAtMs = Date.parse(String(context?.referralUpdatedAt || ""));
    const viewerMatchUpdatedAtMs = Date.parse(String(context?.viewerMatchUpdatedAt || ""));
    if (
      Number.isFinite(referralUpdatedAtMs) &&
      Number.isFinite(viewerMatchUpdatedAtMs) &&
      viewerMatchUpdatedAtMs <= referralUpdatedAtMs + 5000
    ) {
      return { label: "Accepted", tone: "accepted" };
    }
  }
  const { label } = getStatusDisplay(s);
  const tone = INBOUND_PIPELINE_TONE_BY_STATUS[s] || "other";
  return { label, tone };
}

export function inboundReferralPipelineChipClass(tone) {
  return INBOUND_REFERRAL_CHIP_CLASS[tone] || INBOUND_REFERRAL_CHIP_CLASS.other;
}
