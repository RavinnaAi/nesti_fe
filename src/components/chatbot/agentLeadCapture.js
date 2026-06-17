/** Field keys aligned with node-backend/index.html → POST /api/chat formContact */

import { sanitizeEmailInput } from '@/lib/emailUtils';
import { normalizePhoneForStorage } from '@/lib/phoneUtils';

export const PRE_CHAT_STEPS = ["intent", "contact", "property", "qualify", "reach"];

export const LEAD_STEP_LABELS = {
  intent: "Intent",
  contact: "Info",
  property: "Property",
  qualify: "Qualify",
  reach: "Contact",
};

export const emptyAgentLeadDraft = () => ({
  name: "",
  phone: "",
  email: "",
  location: "",
  buy_property_location: "",
  budget: "",
  property_type: "",
  beds: "",
  baths: "",
  must_have_features: "",
  parking_required: "",
  backyard_needed: "",
  school_district_important: "",
  address: "",
  price: "",
  timeline: "",
  mortgage_status: "",
  realtor_status: "",
  motivation_reason: "",
  viewing_readiness: "",
  living_situation: "",
  urgency_readiness: "",
  preferred_contact_method: "",
  best_time_to_contact: "anytime",
  property_images: [],
});

export function buildAgentFormData(intent, draft) {
  const base = {
    intent,
    name: draft.name.trim(),
    phone: normalizePhoneForStorage(draft.phone),
    email: sanitizeEmailInput(draft.email),
    timeline: draft.timeline,
    mortgage_status: draft.mortgage_status,
    realtor_status: draft.realtor_status,
    motivation_reason: draft.motivation_reason,
    viewing_readiness: draft.viewing_readiness,
    living_situation: draft.living_situation,
    urgency_readiness: draft.urgency_readiness,
    preferred_contact_method: draft.preferred_contact_method,
    best_time_to_contact: draft.best_time_to_contact || "anytime",
  };

  if (intent === "buy") {
    return {
      ...base,
      location: draft.location.trim(),
      buy_property_location: draft.buy_property_location.trim(),
      budget: draft.budget.trim(),
      property_type: draft.property_type,
      beds: draft.beds,
      baths: draft.baths,
      must_have_features: draft.must_have_features.trim(),
      parking_required: draft.parking_required,
      backyard_needed: draft.backyard_needed,
      school_district_important: draft.school_district_important,
    };
  }

  return {
    ...base,
    address: draft.address.trim(),
    price: draft.price.trim(),
    property_type: draft.property_type,
    beds: draft.beds,
    baths: draft.baths,
    must_have_features: draft.must_have_features.trim(),
    parking_required: draft.parking_required,
    backyard_needed: draft.backyard_needed,
    property_images: Array.isArray(draft.property_images) ? draft.property_images : [],
  };
}

export function buildAgentFormContactOverride(formData) {
  return {
    intent: formData.intent,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    timeline: formData.timeline,
    location: formData.location,
    buy_property_location: formData.buy_property_location,
    budget: formData.budget,
    beds: formData.beds,
    baths: formData.baths,
    address: formData.address,
    price: formData.price,
    property_type: formData.property_type,
    must_have_features: formData.must_have_features,
    parking_required: formData.parking_required,
    backyard_needed: formData.backyard_needed,
    school_district_important: formData.school_district_important,
    mortgage_status: formData.mortgage_status,
    realtor_status: formData.realtor_status,
    motivation_reason: formData.motivation_reason,
    viewing_readiness: formData.viewing_readiness,
    living_situation: formData.living_situation,
    urgency_readiness: formData.urgency_readiness,
    preferred_contact_method: formData.preferred_contact_method,
    best_time_to_contact: formData.best_time_to_contact,
    ...(formData.intent === "sell" && Array.isArray(formData.property_images)
      ? { property_images: formData.property_images }
      : {}),
  };
}

export function buildAgentOpeningMessage(chosenIntent, formData) {
  const parts = [];
  parts.push(`Hi! My name is ${formData.name}.`);
  parts.push(`I am looking to ${chosenIntent === "buy" ? "buy" : "sell"} a property.`);

  if (chosenIntent === "buy") {
    if (formData.location) parts.push(`I'm interested in ${formData.location}.`);
    if (formData.buy_property_location) {
      parts.push(`Specifically looking to buy in ${formData.buy_property_location}.`);
    }
    if (formData.budget) parts.push(`My budget is around ${formData.budget}.`);
    if (formData.property_type) parts.push(`I'm looking for a ${formData.property_type}.`);
    if (formData.beds) parts.push(`I need ${formData.beds} bedroom(s).`);
    if (formData.baths) parts.push(`I prefer ${formData.baths} bathroom(s).`);
    if (formData.must_have_features) parts.push(`Must-haves: ${formData.must_have_features}.`);
  } else {
    if (formData.address) parts.push(`The property is at ${formData.address}.`);
    if (formData.price) parts.push(`I'm expecting around ${formData.price}.`);
    if (formData.property_type) parts.push(`It is a ${formData.property_type}.`);
  }

  if (formData.timeline) parts.push(`My timeline is ${formData.timeline}.`);
  if (formData.mortgage_status) {
    parts.push(`Mortgage status: ${formData.mortgage_status.replace(/_/g, " ")}.`);
  }
  if (formData.realtor_status) {
    parts.push(`Realtor: ${formData.realtor_status.replace(/_/g, " ")}.`);
  }
  if (formData.motivation_reason) {
    parts.push(`Reason for move: ${formData.motivation_reason.replace(/_/g, " ")}.`);
  }
  if (formData.viewing_readiness) {
    parts.push(`Ready to view: ${formData.viewing_readiness.replace(/_/g, " ")}.`);
  }
  if (formData.living_situation) {
    parts.push(`Living situation: ${formData.living_situation.replace(/_/g, " ")}.`);
  }
  if (formData.urgency_readiness) {
    parts.push(`Ready to make offer: ${formData.urgency_readiness.replace(/_/g, " ")}.`);
  }
  parts.push(`My email is ${formData.email} and my phone is ${formData.phone}.`);

  return parts.join(" ");
}

function humanizeEnum(value) {
  if (value == null || value === "") return "";
  return String(value).replace(/_/g, " ").trim();
}

function displayField(value) {
  if (value == null || value === "") return "";
  const s = typeof value === "string" ? value.trim() : String(value).trim();
  if (!s) return "";
  return s.replace(/_/g, " ");
}

/**
 * Short paragraph copy for the first user bubble — essentials only (`**Label:**` markdown for bold).
 * @returns {{ headline: string, paragraphs: string[] }}
 */
export function buildLeadProfileNarrative(chosenIntent, formData) {
  const headline =
    chosenIntent === "buy" ? "Looking to buy a home" : "Planning to sell a property";
  /** @type {string[]} */
  const paragraphs = [];

  const name = displayField(formData.name);
  const email = displayField(formData.email);
  const phone = displayField(formData.phone);
  const contactBits = [];
  if (name) contactBits.push(`**Name:** ${name}`);
  if (email) contactBits.push(`**Email:** ${email}`);
  if (phone) contactBits.push(`**Phone:** ${phone}`);
  if (contactBits.length) paragraphs.push(contactBits.join(" · "));

  if (chosenIntent === "buy") {
    const bits = [];
    const loc = displayField(formData.location);
    const buyLoc = displayField(formData.buy_property_location);
    const budget = displayField(formData.budget);
    if (loc) bits.push(`**Location:** ${loc}`);
    if (buyLoc) bits.push(`**Buy area:** ${buyLoc}`);
    if (budget) bits.push(`**Budget:** ${budget}`);
    const ptype = displayField(formData.property_type);
    const beds = displayField(formData.beds);
    const baths = displayField(formData.baths);
    const homeParts = [];
    if (ptype) homeParts.push(ptype);
    if (beds && baths) homeParts.push(`${beds} bed / ${baths} bath`);
    else if (beds) homeParts.push(`${beds} bed`);
    else if (baths) homeParts.push(`${baths} bath`);
    if (homeParts.length) bits.push(`**Property:** ${homeParts.join(" · ")}`);
    if (bits.length) paragraphs.push(bits.join(" · "));
  } else {
    const bits = [];
    const addr = displayField(formData.address);
    const price = displayField(formData.price);
    if (addr) bits.push(`**Address:** ${addr}`);
    if (price) bits.push(`**Target price:** ${price}`);
    const ptype = displayField(formData.property_type);
    const beds = displayField(formData.beds);
    const baths = displayField(formData.baths);
    const homeParts = [];
    if (ptype) homeParts.push(ptype);
    if (beds && baths) homeParts.push(`${beds} bed / ${baths} bath`);
    else if (beds) homeParts.push(`${beds} bed`);
    else if (baths) homeParts.push(`${baths} bath`);
    if (homeParts.length) bits.push(`**Property:** ${homeParts.join(" · ")}`);
    if (bits.length) paragraphs.push(bits.join(" · "));
  }

  const timeline = displayField(formData.timeline);
  if (timeline) paragraphs.push(`**Timeline:** ${timeline}`);

  return { headline, paragraphs };
}

/**
 * Short multi-line summary shown as the first user bubble after onboarding
 * (the full narrative is sent separately as `buildAgentOpeningMessage`).
 */
export function agentUserSummaryLine(chosenIntent, formData) {
  const name = String(formData.name || "").trim() || "—";
  const headline =
    chosenIntent === "buy" ? "Looking to buy a home" : "Planning to sell a property";

  const lines = [headline, name];

  const email = String(formData.email || "").trim();
  const phone = String(formData.phone || "").trim();
  const contactLine = [email, phone].filter(Boolean).join(" · ");
  if (contactLine) lines.push(contactLine);

  if (chosenIntent === "buy") {
    const bits = [];
    const loc = String(formData.location || "").trim();
    if (loc) bits.push(loc);
    const buyLoc = String(formData.buy_property_location || "").trim();
    if (buyLoc) bits.push(`Buy area ${buyLoc}`);
    const budget = String(formData.budget || "").trim();
    if (budget) bits.push(`Budget ${budget}`);
    const beds = formData.beds != null && String(formData.beds).trim() ? String(formData.beds).trim() : "";
    const baths = formData.baths != null && String(formData.baths).trim() ? String(formData.baths).trim() : "";
    if (beds || baths) {
      const bb = [beds ? `${beds} bed` : null, baths ? `${baths} bath` : null].filter(Boolean).join(" · ");
      if (bb) bits.push(bb);
    }
    const ptype = String(formData.property_type || "").trim();
    if (ptype) bits.push(ptype);
    if (bits.length) lines.push(bits.join(" · "));
  } else {
    const bits = [];
    const addr = String(formData.address || "").trim();
    if (addr) bits.push(addr);
    const price = String(formData.price || "").trim();
    if (price) bits.push(`Target ${price}`);
    const beds = formData.beds != null && String(formData.beds).trim() ? String(formData.beds).trim() : "";
    const baths = formData.baths != null && String(formData.baths).trim() ? String(formData.baths).trim() : "";
    if (beds || baths) {
      const bb = [beds ? `${beds} bed` : null, baths ? `${baths} bath` : null].filter(Boolean).join(" · ");
      if (bb) bits.push(bb);
    }
    const ptype = String(formData.property_type || "").trim();
    if (ptype) bits.push(ptype);
    if (bits.length) lines.push(bits.join(" · "));
  }

  const timeline = humanizeEnum(formData.timeline);
  if (timeline) lines.push(`Timeline: ${timeline}`);

  return lines.join("\n");
}

export function widgetRoleToChatAgentType(widgetRole) {
  if (widgetRole === "mortgage_broker") return "broker";
  if (widgetRole === "lawyer") return "lawyer";
  return "agent";
}
