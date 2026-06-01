/**
 * Shared helpers for public-inquiry leads that inquired about a specific listing.
 * Lead detail payloads already include `inquired_property` from GET /api/leads/:id;
 * GET /api/leads/:id/inquired-property is only needed to load the linked seller lead row.
 */

export function inquiredPropertyFromLead(lead) {
  const raw = lead?.inquired_property;
  return raw && typeof raw === "object" ? raw : null;
}

function inquiredPropertyHasDisplayData(property) {
  if (!property || typeof property !== "object") return false;
  if (Array.isArray(property.images) && property.images.length > 0) return true;
  return Boolean(
    String(property.title || "").trim() ||
      String(property.address || "").trim() ||
      String(property.location || "").trim() ||
      String(property.expected_price || "").trim()
  );
}

export function hasInquiredPropertyContext(lead) {
  const property = inquiredPropertyFromLead(lead);
  if (!property) return false;
  const linkedId = String(lead?.linked_seller_lead_match_id || "").trim();
  if (linkedId) return true;
  return inquiredPropertyHasDisplayData(property);
}

/** Seller CRM row is only available via the inquired-property endpoint. */
export function needsInquiredPropertySellerFetch(lead) {
  if (!hasInquiredPropertyContext(lead)) return false;
  const linkedId = String(lead?.linked_seller_lead_match_id || "").trim();
  return Boolean(linkedId);
}

export function inquiredPropertyDisplayAddress(property) {
  if (!property || typeof property !== "object") return "";
  return String(property.address || property.location || "").trim();
}

/** Align public-profile submit payload with backend `normalizeInquiredProperty`. */
export function buildInquiredPropertyPayload(property, profile) {
  if (!property || typeof property !== "object") return null;
  const images = Array.isArray(property.images) ? property.images.filter(Boolean).slice(0, 8) : [];
  const professionalProfile = profile?.professional_profile || {};
  const normalized = {
    id: property.id || null,
    title: property.title || null,
    address: property.address || "",
    location: property.location || property.address || "",
    expected_price: property.expected_price || "",
    property_type: property.property_type || "",
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    square_footage: property.square_footage != null ? String(property.square_footage) : "",
    seller_name: property.seller_name || "",
    seller_email: profile?.email || "",
    seller_phone: professionalProfile?.phone || profile?.phone || "",
    listed_by_name: profile?.professional_name || "",
    images,
  };
  const hasAny = Object.values(normalized).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value != null && String(value).trim() !== "";
  });
  return hasAny ? normalized : null;
}
