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

/** Sidebar shortcuts: use the main Leads link for an unfiltered list; “Closed” covers won + lost. */
export const PIPELINE_SIDEBAR_ITEMS = [
  { key: "active", label: "Active", kind: "pipeline", value: "active" },
  { key: "closed", label: "Closed", kind: "pipeline", value: "closed" },
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
    const filtered = parsed.filter((k) => allowed.has(k));
    return filtered.length ? filtered : DEFAULT_VISIBLE_PIPELINE_KEYS;
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

export function getStatusDisplay(status) {
  return STATUS_DISPLAY_MAP[status] || { label: status?.replace(/_/g, " ") || "—", color: "bg-gray-50 text-gray-600 border-gray-200" };
}
