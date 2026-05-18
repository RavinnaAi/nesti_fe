/** Map ICP tier to tri-state match badge used by lead list UI. */
export function icpTierToIsMatched(tier) {
  if (tier == null || tier === "") return null;
  if (tier === "low_match") return false;
  return true;
}

/**
 * Adapts GET /api/leads row shape for components that expect "conversation" list items.
 * `id` is the lead match id (used for selection and /api/leads/:id/*).
 */
export function leadApiRowToConversationShape(lead) {
  if (!lead) return null;
  const contact = lead.contact || {};
  const name = contact.full_name || "Unknown visitor";
  const convId = lead.conversation_id ? String(lead.conversation_id) : "";
  return {
    ...lead,
    id: String(lead.id),
    lead_match_id: String(lead.id),
    conversation_id: convId,
    conversationId: convId,
    name,
    visitor_name: name,
    email: contact.email,
    visitor_email: contact.email,
    phone: contact.phone,
    visitor_phone: contact.phone,
    location: lead.property?.location,
    city: lead.property?.location,
    lead_grade: lead.grade,
    lead_score: lead.score,
    is_matched: icpTierToIsMatched(lead.icp_fit?.fit_tier),
  };
}
