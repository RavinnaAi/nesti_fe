/** Single source for workspace tab ids + labels (lead detail /leads/[id]). */

/** URL/query aliases → canonical tab id (keeps old `tab=pipeline` links working). */
const LEAD_WORKSPACE_TAB_ALIASES = { notes: "pipeline" };

export const LEAD_WORKSPACE_TABS = [
  { id: "lead_profile", label: "Lead Profile" },
  { id: "lead_details", label: "Lead Details" },
  { id: "conversation", label: "Conversation" },
  { id: "actions", label: "Actions" },
  { id: "property_matches", label: "Property Matches" },
  { id: "consultation", label: "Consultation" },
  { id: "nurture", label: "Nurture Email" },
  { id: "pipeline", label: "Notes" },
  { id: "others", label: "Others" },
];

export const LEAD_WORKSPACE_TAB_IDS = new Set(LEAD_WORKSPACE_TABS.map((t) => t.id));

/** Resolve `tab=notes` (or other aliases) to the canonical id used in state and UI. */
export function normalizeLeadWorkspaceTabId(tab) {
  if (tab == null || tab === "") return "";
  const s = String(tab).trim();
  return LEAD_WORKSPACE_TAB_ALIASES[s] || s;
}
