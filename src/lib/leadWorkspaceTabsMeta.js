import { FEATURES } from "@/constants/features";

/** Single source for workspace tab ids + labels (lead detail /leads/[id]). */

/** Tab id → required feature key. Tabs without an entry are always shown (when role allows). */
export const TAB_FEATURE_MAP = Object.freeze({
  intelligence: FEATURES.LEADS_INSIGHTS_ADVANCED,
  conversation: FEATURES.CRM_LEAD_CONVERSATION,
  property_matches: FEATURES.LEADS_INSIGHTS_ADVANCED,
});

/** URL/query aliases → canonical tab id (keeps old `tab=pipeline` links working). */
const LEAD_WORKSPACE_TAB_ALIASES = { notes: "pipeline" };

export const LEAD_WORKSPACE_TABS = [
  { id: "lead_profile", label: "Lead Profile" },
  { id: "lead_details", label: "Lead Details" },
  { id: "intelligence", label: "AI Insights" },
  { id: "conversation", label: "Conversation" },
  { id: "property_matches", label: "Property Matches" },
  { id: "consultation", label: "Consultation" },
  { id: "nurture", label: "Nurture Email" },
  { id: "pipeline", label: "Notes" },
  { id: "others", label: "Referrals" },
];

export const LEAD_WORKSPACE_TAB_IDS = new Set(LEAD_WORKSPACE_TABS.map((t) => t.id));

/** Resolve `tab=notes` (or other aliases) to the canonical id used in state and UI. */
export function normalizeLeadWorkspaceTabId(tab) {
  if (tab == null || tab === "") return "";
  const s = String(tab).trim();
  return LEAD_WORKSPACE_TAB_ALIASES[s] || s;
}

/**
 * Tab order when property listing matches are not used (lawyers, mortgage brokers).
 * Same sequence as the lawyer workspace without the Property Matches tab.
 */
const WORKSPACE_TAB_ORDER_WITHOUT_PROPERTY_MATCHES = [
  "lead_profile",
  "lead_details",
  "intelligence",
  "conversation",
  "consultation",
  "nurture",
  "pipeline",
  "others",
];

const LAWYER_TAB_LABEL_OVERRIDES = {
  intelligence: "AI Insights",
  lead_profile: "Client & contact",
  lead_details: "Matter overview",
  nurture: "Nurture email",
  others: "Referrals",
};

function normalizedRole(role) {
  return String(role || "").trim().toLowerCase();
}

/** Property-match UI (list column, workspace tab) is for listing agents only. */
export function roleHidesLeadPropertyMatches(role) {
  const r = normalizedRole(role);
  return r === "lawyer" || r === "mortgage_broker";
}

/** List columns Type + Intent (buyer/seller) are agent-focused; hidden for lawyers. */
export function roleShowsLeadsListAgentColumns(role) {
  return normalizedRole(role) === "agent";
}

function tabsForOrderedSubset(order, labelOverrides = {}) {
  const byId = new Map(LEAD_WORKSPACE_TABS.map((t) => [t.id, t]));
  return order
    .map((id) => {
      const base = byId.get(id);
      if (!base) return null;
      const label = labelOverrides[id] || base.label;
      return { id, label };
    })
    .filter(Boolean);
}

/** Return the workspace tabs filtered for the given user role. */
export function getLeadWorkspaceTabsForRole(role) {
  const r = normalizedRole(role);
  if (r === "lawyer") {
    return tabsForOrderedSubset(WORKSPACE_TAB_ORDER_WITHOUT_PROPERTY_MATCHES, LAWYER_TAB_LABEL_OVERRIDES);
  }
  if (r === "mortgage_broker") {
    return tabsForOrderedSubset(WORKSPACE_TAB_ORDER_WITHOUT_PROPERTY_MATCHES, {});
  }
  return LEAD_WORKSPACE_TABS;
}

/** Whether a workspace tab is allowed for the current plan. */
export function canAccessLeadWorkspaceTab(tabId, hasFeatureFn) {
  const required = TAB_FEATURE_MAP[tabId];
  if (!required) return true;
  if (typeof hasFeatureFn !== "function") return true;
  return hasFeatureFn(required);
}

/** Remove plan-gated tabs the user cannot access. */
export function filterLeadWorkspaceTabsForPlan(tabs, hasFeatureFn) {
  if (!Array.isArray(tabs) || typeof hasFeatureFn !== "function") return tabs || [];
  return tabs.filter((tab) => canAccessLeadWorkspaceTab(tab.id, hasFeatureFn));
}
