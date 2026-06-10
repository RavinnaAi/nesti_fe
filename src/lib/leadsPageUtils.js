import { hasInquiredPropertyContext } from "@/lib/inquiredPropertyUtils";

/** Must match backend `fetchLeads` `limit` so pagination totals stay correct. */
export const LEADS_PAGE_SIZE = 10;

export function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

export function normalizeLeadId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const fromQuery = decoded.match(/[?&]lead=([a-fA-F0-9]{24})/);
  if (fromQuery?.[1]) return fromQuery[1];
  const idMatch = decoded.match(/([a-fA-F0-9]{24})/);
  return idMatch?.[1] || "";
}

/** Same-origin path (optional ?query) for router.push; blocks open redirects. */
export function sanitizeInternalReturnPath(raw) {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (!value) return "";
  try {
    value = decodeURIComponent(value);
  } catch {
    return "";
  }
  value = value.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  if (/[\r\n\0]/.test(value)) return "";
  const lower = value.toLowerCase();
  if (lower.startsWith("/\\") || lower.includes("://")) return "";
  const pathOnly = value.split("?")[0] || "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.includes("//")) return "";
  return value;
}

/**
 * Intake enums use underscore slugs (e.g. `700k_1m`, `30_60_days`). Stripping non-digits for
 * currency turns `700k_1m` into `7001` and shows `$7,001`. Only formats known money/timeline bands.
 */
export function formatLeadIntakeSlug(value) {
  if (value == null || value === "") return "";
  let s = String(value).trim().replace(/\s+/g, " ");
  if (!s) return "";

  // "under 400 k" / "under 400k" -> under_400k
  const underK = s.match(/^under\s+(\d+(?:\.\d+)?)\s*k$/i);
  if (underK) s = `under_${underK[1]}k`;

  // Space-separated money bands (stored as free text): "700k 1m", "1.2M 2M"
  if (!s.includes("_")) {
    const kk = s.match(/^(\d+(?:\.\d+)?)\s*k\s+(\d+(?:\.\d+)?)\s*k$/i);
    const km = s.match(/^(\d+(?:\.\d+)?)\s*k\s+(\d+(?:\.\d+)?)\s*m$/i);
    const mm = s.match(/^(\d+(?:\.\d+)?)\s*m\s+(\d+(?:\.\d+)?)\s*m$/i);
    if (kk) s = `${kk[1]}k_${kk[2]}k`;
    else if (km) s = `${km[1]}k_${km[2]}m`;
    else if (mm) s = `${mm[1]}m_${mm[2]}m`;
  }

  if (!s.includes("_")) return "";

  const segments = s.split("_").filter(Boolean);
  if (segments.length < 2) return "";

  const isDayUnitRange =
    segments.length >= 3 &&
    /^\d+$/.test(segments[0]) &&
    /^\d+$/.test(segments[1]) &&
    /^(days|months|weeks)$/i.test(segments[2]);

  if (isDayUnitRange) {
    const u = segments[2].toLowerCase();
    if (u.startsWith("day")) return `${segments[0]}–${segments[1]} days`;
    if (u.startsWith("month")) return `${segments[0]}–${segments[1]} months`;
    if (u.startsWith("week")) return `${segments[0]}–${segments[1]} weeks`;
  }

  const isMoneyBand =
    /\d+k_/i.test(s) || /_\d+m$/i.test(s) || /\d+m_/i.test(s) || /k_\d/i.test(s) || /_\d+k$/i.test(s);

  if (!isMoneyBand) return "";

  if (/^\d+(?:\.\d+)?m_plus$/i.test(s)) {
    const n = Number(String(s).split("_")[0].replace(/m/i, ""));
    if (Number.isFinite(n)) return `$${n}M+`;
  }
  if (/^under_\d+(?:\.\d+)?k$/i.test(s)) {
    const n = String(s).split("_")[1].toUpperCase();
    return `Under $${n}`;
  }

  const formatMoneySegment = (seg) => {
    const t = String(seg).toLowerCase().trim();
    const m = t.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const suf = m[2]?.toLowerCase();
    let amount = null;
    if (suf === "k") amount = n * 1000;
    else if (suf === "m") amount = n * 1_000_000;
    if (amount == null) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const moneyParts = segments.map(formatMoneySegment);
  if (moneyParts.every((p) => p != null)) {
    return moneyParts.join(" – ");
  }

  return "";
}

/** Active chat thread id for referrals, nurture, calculators. */
export function getActionConversationId(lead) {
  return lead?.conversation_id || lead?.conversationId || "";
}

export function getLeadMatchId(lead) {
  return lead?.lead_match_id || lead?.id || "";
}

export function isDirectInquiryLead(lead) {
  if (!lead || typeof lead !== "object") return false;
  if (lead.is_direct_public_inquiry) return true;
  const source = String(lead.source || "").trim().toLowerCase();
  return source === "public_web_form" || source === "public_inquiry";
}

export function normalizeLeadIntent(intent, leadType) {
  const lt = String(leadType || "").toLowerCase();
  if (/seller/i.test(lt)) return "sell";
  if (/(buyer|client)/i.test(lt)) return "buy";

  const raw = String(intent || "").trim().toLowerCase();
  if (raw === "buy" || raw === "sell") return raw;
  if (raw === "buyer") return "buy";
  if (raw === "seller") return "sell";
  return raw;
}

/** Workspace tab label for the property-matches tab (buyer vs seller vs listing inquiry). */
export function getPropertyMatchesTabLabel(lead) {
  const intent = normalizeLeadIntent(lead?.intent, lead?.lead_type);
  if (intent === "sell") return "Buyer Matches";
  if (hasInquiredPropertyContext(lead)) return "Inquired Property";
  return "Property Matches";
}

/** Whether the property-matches tab is showing buyers matched to a seller listing. */
export function isSellerPropertyMatchesContext(lead, payload = null) {
  const ctx = String(payload?.property_matches_context || "").toLowerCase();
  if (ctx === "sell") return true;
  return normalizeLeadIntent(lead?.intent, lead?.lead_type) === "sell";
}

/** Loading, empty, and error copy for the property-matches workspace tab. */
export function getPropertyMatchesCopy(lead, payload = null) {
  if (isSellerPropertyMatchesContext(lead, payload)) {
    return {
      loading: "Loading buyer matches...",
      error: "Failed to load buyer matches.",
      empty: "No buyer matches found for this lead.",
      chooseLead: "Choose a lead to view buyer matches.",
      matchFallback: "Buyer match",
    };
  }
  return {
    loading: "Loading property matches...",
    error: "Failed to load property matches.",
    empty: "No property matches found for this lead.",
    chooseLead: "Choose a lead to view property matches.",
    matchFallback: "Property match",
  };
}

/** Human label for the leads table Intent column. */
export function getLeadIntentDisplay(conversation) {
  const intent = normalizeLeadIntent(
    conversation?.intent || conversation?.lead_intent || conversation?.intent_label,
    conversation?.lead_type,
  );
  if (intent === "sell") return "Seller";
  if (intent === "buy") return "Buyer";
  if (!intent || intent === "unknown") return "—";
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export function getConversationMeta(conversation) {
  let isMatched = conversation?.is_matched ?? conversation?.matched ?? null;
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
        null;
    }
  }

  const intent = normalizeLeadIntent(
    conversation?.intent || conversation?.lead_intent || conversation?.intent_label,
    conversation?.lead_type,
  );

  return {
    intent: intent || "Unknown",
    leadScore:
      conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score ?? "—",
    leadGrade:
      conversation?.lead_grade ?? conversation?.leadGrade ?? conversation?.grade ?? "—",
    channel: conversation?.channel || conversation?.source || "web",
    qualified: conversation?.is_qualified ?? conversation?.isQualified ?? false,
    isMatched,
  };
}

export function matchesSearch(conversation, term) {
  if (!term) return true;
  const needle = term.toLowerCase();
  const contact = conversation?.contact || {};
  const haystack = [
    conversation?.name,
    conversation?.visitor_name,
    conversation?.visitorName,
    contact?.full_name,
    contact?.name,
    conversation?.email,
    conversation?.visitor_email,
    conversation?.visitorEmail,
    contact?.email,
    conversation?.phone,
    conversation?.visitor_phone,
    conversation?.visitorPhone,
    conversation?.city,
    conversation?.location,
    conversation?.address,
    conversation?.property?.location,
    conversation?.property?.address,
    conversation?.conversion?.property?.location,
    conversation?.conversion?.property?.address,
    conversation?.conversion?.property?.property_type,
    conversation?.conversion?.property?.type,
    conversation?.property?.property_type,
    conversation?.property?.type,
    conversation?.visitor_id,
    conversation?.visitorId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function extractMeta(value) {
  if (!value) return {};
  return value?.meta || value?.metadata || value?.data?.meta || {};
}

export function extractMessageMeta(message) {
  if (!message) return {};
  return message?.meta || message?.message_meta || message?.metadata || message?.data?.meta || {};
}

export function formatMetaEntries(meta) {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta).filter(([, value]) => value !== undefined && value !== null);
}

function toFiniteNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/[^0-9.-]/g, "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getMatchesCount(conversation) {
  const candidates = [
    conversation?.stats?.total_matches,
    conversation?.total_matches,
    conversation?.match_count,
    conversation?.property_matches_count,
    conversation?.propertyMatchesCount,
  ];
  for (const value of candidates) {
    const n = toFiniteNumber(value);
    if (n !== null) return n;
  }
  return 0;
}

/** List-row consultation summary: pipeline Status column stays match-only; this is Calendly + nurture. */
export function getConsultationListCell(row) {
  const appt = String(row?.appointment_status ?? "").toLowerCase();
  const nurture = appt === "booked" && Boolean(row?.nurture_consultation_booked);
  if (appt === "canceled") {
    return {
      label: "Canceled",
      title: "Appointment or Calendly event marked as canceled",
      className: "bg-amber-50 text-amber-800 border-amber-200",
    };
  }
  if (appt === "booked" || nurture) {
    const bits = [];
    if (appt === "booked") bits.push("Calendly or resolved booking");
    if (nurture) bits.push("nurture email meeting");
    return {
      label: "Booked",
      title: bits.length ? bits.join(" · ") : "Consultation booked",
      className: "bg-violet-50 text-violet-800 border-violet-200",
    };
  }
  return {
    label: "Not booked",
    title: "No booking signal on this lead row yet",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };
}
