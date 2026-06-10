import { normalizeLeadIntent } from "@/lib/leadsPageUtils";

/**
 * Normalized fields for CRM lead rows shaped by leadApiRowToConversationShape.
 */

export function getLeadMeta(conversation) {
  const leadScore = conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score;
  const leadGrade = conversation?.lead_grade ?? conversation?.leadGrade ?? "";
  const intent = normalizeLeadIntent(
    conversation?.intent || conversation?.lead_intent || conversation?.intent_label,
    conversation?.lead_type,
  );
  const channel = conversation?.channel || conversation?.source || "web";

  const qualified = conversation?.is_qualified ?? conversation?.isQualified ?? null;

  let isMatched = conversation?.is_matched ?? conversation?.matched ?? qualified;
  if (isMatched === null) {
    const matchStatus = conversation?.match_status;
    if (matchStatus === "matched" || matchStatus === true) {
      isMatched = true;
    } else {
      isMatched =
        conversation?.meta?.is_matched ??
        conversation?.meta?.matched ??
        conversation?.metadata?.is_matched ??
        conversation?.metadata?.matched ??
        conversation?.meta?.qualified ??
        null;
    }
  }

  const contact = conversation?.last_message_meta?.contact || conversation?.meta?.contact || {};
  const email =
    conversation?.email || conversation?.visitor_email || conversation?.visitorEmail || contact?.email;
  const nameFromEmail = email
    ? email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)
    : null;

  const name =
    conversation?.name ||
    conversation?.visitor_name ||
    conversation?.visitorName ||
    nameFromEmail ||
    (conversation?.visitor_id || conversation?.visitorId
      ? `Visitor ${String(conversation?.visitor_id || conversation?.visitorId).slice(0, 6)}`
      : "Unknown visitor");

  return { leadScore, leadGrade, intent, channel, isMatched, qualified, name, email };
}

export function buildGradeMix(conversations) {
  const counts = { hot: 0, warm: 0, cold: 0, unknown: 0 };
  conversations.forEach((c) => {
    const grade = String(getLeadMeta(c).leadGrade || "").toLowerCase();
    if (grade === "hot") counts.hot += 1;
    else if (grade === "warm") counts.warm += 1;
    else if (grade === "cold") counts.cold += 1;
    else counts.unknown += 1;
  });
  return [
    { name: "Hot", count: counts.hot },
    { name: "Warm", count: counts.warm },
    { name: "Cold", count: counts.cold },
    { name: "Unscored", count: counts.unknown },
  ];
}

export function buildMatchBreakdown(conversations) {
  const matched = conversations.filter((c) => getLeadMeta(c).isMatched === true).length;
  const mismatched = conversations.filter((c) => getLeadMeta(c).isMatched === false).length;
  const unknown = Math.max(0, conversations.length - matched - mismatched);
  return { matched, mismatched, unknown, total: conversations.length };
}

export function buildPropertyTypeMix(conversations) {
  const counts = new Map();
  conversations.forEach((c) => {
    const typeRaw =
      c?.conversion?.property?.property_type ||
      c?.conversion?.property?.type ||
      c?.property?.property_type ||
      c?.property?.type ||
      "Unknown";
    const key = String(typeRaw || "Unknown").trim().toLowerCase();
    const label = key
      .split("_")
      .join(" ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/** Property type label for tables (conversation shaped by leadApiRowToConversationShape). */
export function getLeadPropertyTypeDisplay(conversation) {
  const raw =
    conversation?.conversion?.property?.property_type ||
    conversation?.conversion?.property?.type ||
    conversation?.property?.property_type ||
    conversation?.property?.type ||
    "";
  const s = String(raw ?? "").trim();
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Single display line for location; de-duplicates city vs location when API repeats the same place. */
export function formatLeadLocationLine(conversation) {
  const seen = new Set();
  const parts = [];
  const push = (v) => {
    const t = String(v ?? "").trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(t);
  };
  push(conversation?.city);
  push(conversation?.location);
  push(conversation?.conversion?.property?.location);
  return parts.join(", ");
}
