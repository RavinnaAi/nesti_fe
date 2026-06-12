/** Shared display helpers for seller-lead property matches in chat (aligned with leads workspace tab). */

function readable(value) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).replace(/_/g, " ").trim();
  if (!raw) return null;
  if (raw.includes("@") || /^\+?[\d\s\-()]+$/.test(raw)) return raw;
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getChatMatchedLead(item) {
  const ml = item?.matched_lead ?? item?.matchedLead;
  if (!ml || typeof ml !== "object") return null;
  return {
    property_location: ml.property_location ?? ml.propertyLocation ?? null,
    property_budget: ml.property_budget ?? ml.propertyBudget ?? null,
    property_type: ml.property_type ?? ml.propertyType ?? null,
    bedrooms: ml.bedrooms ?? null,
    bathrooms: ml.bathrooms ?? null,
    property_timeline: ml.property_timeline ?? ml.propertyTimeline ?? null,
  };
}

export function getChatMatchPartyName(item) {
  const mc = item?.matched_contact ?? item?.matchedContact;
  const fromContact = mc?.full_name ?? mc?.fullName;
  if (fromContact && String(fromContact).trim()) return String(fromContact).trim();
  const title = String(item?.title || "").trim();
  if (!title) return "Seller listing";
  const parts = title.split("·").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts[0];
  return title;
}

export function getChatMatchLocation(item) {
  const ml = getChatMatchedLead(item);
  const fromMl = String(ml?.property_location || "").trim();
  if (fromMl) return fromMl;
  const loc = item?.location ?? item?.address;
  return loc != null && String(loc).trim() !== "" ? String(loc).trim() : null;
}

export function getChatMatchBudgetLabel(item) {
  const ml = getChatMatchedLead(item);
  const raw = ml?.property_budget;
  if (raw == null || String(raw).trim() === "") {
    if (item?.price != null && Number(item.price) > 0) {
      return formatChatMatchPrice(item.price);
    }
    return null;
  }
  const s = String(raw).trim();
  if (/^\d[\d,]*$/.test(s)) {
    const n = parseInt(s.replace(/,/g, ""), 10);
    if (Number.isFinite(n) && n > 0) return formatChatMatchPrice(n);
  }
  return readable(s) || s;
}

export function formatChatMatchPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `$${n.toLocaleString("en-US")}`;
}

export function getChatMatchType(item) {
  const ml = getChatMatchedLead(item);
  const t = ml?.property_type ?? item?.property_type;
  return t != null && String(t).trim() !== "" ? readable(t) : null;
}

export function getChatMatchBedsBaths(item) {
  const ml = getChatMatchedLead(item);
  const br = ml?.bedrooms ?? item?.bedrooms;
  const ba = ml?.bathrooms ?? item?.bathrooms;
  const parts = [];
  if (br != null && String(br).trim() !== "") parts.push(`${readable(br)} bd`);
  if (ba != null && String(ba).trim() !== "") parts.push(`${readable(ba)} ba`);
  return parts.length ? parts.join(" · ") : null;
}

export function getChatMatchReasons(item) {
  const r = item?.reasons_for_matching ?? item?.reasonsForMatching ?? item?.match_reasons ?? item?.matchReasons;
  return Array.isArray(r) ? r.filter(Boolean) : [];
}

export function getChatMatchHeadline(item) {
  return String(item?.match_headline ?? item?.matchHeadline ?? "").trim() || null;
}

export function getChatMatchScore(item) {
  const score = item?.match_score ?? item?.matchScore ?? item?.score;
  return score != null && Number.isFinite(Number(score)) ? Number(score) : null;
}

export function getChatPropertyMatchesSectionLabel(context, displayMode = "matches") {
  if (context === "sell") return "Comparable properties";
  return displayMode === "options" ? "Available options" : "Matching properties";
}
