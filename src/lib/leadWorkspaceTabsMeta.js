/** Single source for workspace tab ids + labels (lead detail /leads/[id]). */

export const LEAD_WORKSPACE_TABS = [
  { id: "lead_profile", label: "Lead Profile" },
  { id: "lead_details", label: "Lead Details" },
  { id: "conversation", label: "Conversation" },
  { id: "actions", label: "Actions" },
  { id: "property_matches", label: "Property Matches" },
  { id: "nurture", label: "Nurture Email" },
  { id: "pipeline", label: "Notes" },
  { id: "others", label: "Others" },
];

export const LEAD_WORKSPACE_TAB_IDS = new Set(LEAD_WORKSPACE_TABS.map((t) => t.id));
