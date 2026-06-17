/** Lawyer / mortgage-broker pre-chat form → formContact + opening message (node-backend lawyer.html, mortgage-broker.html). */

import { sanitizeEmailInput } from '@/lib/emailUtils';
import { normalizePhoneForStorage } from '@/lib/phoneUtils';

/** 3-step onboarding bar (mirrors agent’s multi-step pattern; agent uses 5). */
export const LAWYER_PREFLIGHT_SEGMENT_STEPS = [
  { key: "contact", label: "Contact" },
  { key: "case", label: "Case" },
  { key: "reach", label: "Reach" },
];

export const MORTGAGE_PREFLIGHT_SEGMENT_STEPS = [
  { key: "contact", label: "Contact" },
  { key: "qualify", label: "Qualify" },
  { key: "reach", label: "Reach" },
];

export const LAWYER_PREFLIGHT_HEADER_LABELS = ["Contact", "Case details", "Preferences"];
export const MORTGAGE_PREFLIGHT_HEADER_LABELS = ["Contact", "Qualification", "Preferences"];

/** Shown under the header during lawyer/mortgage live chat (replaces agent-only Intro→Booking). */
export const ROLE_LIVE_CHAT_PROGRESS_STEPS = [
  { key: "details", label: "Your details" },
  { key: "chat", label: "Live chat" },
  { key: "next", label: "Next steps" },
];

function humanizeEnum(value) {
  if (value == null || value === "") return "";
  const token = String(value).trim().toLowerCase().replace(/\s+/g, "_");
  const mortgageTokenMap = {
    "20_plus": "20%+",
    "10_19": "10-19%",
    "5_9": "5-9%",
    "under_5": "Under 5%",
    "no_savings": "No savings yet",
  };
  if (mortgageTokenMap[token]) return mortgageTokenMap[token];
  return String(value).replace(/_/g, " ").trim();
}

export function emptyLawyerPreflightDraft() {
  return {
    name: "",
    phone: "",
    email: "",
    address: "",
    transaction_stage: "",
    closing_timeline: "",
    transaction_type: "",
    property_value: "",
    mortgage_status: "",
    realtor_involved: "",
    first_time_buyer: "",
    legal_services_needed: "",
    preferred_contact_method: "",
    best_time_to_contact: "anytime",
  };
}

export function emptyMortgagePreflightDraft() {
  return {
    name: "",
    phone: "",
    email: "",
    address: "",
    mortgage_timeline: "",
    pre_approval_status: "",
    credit_score_range: "",
    employment_status: "",
    household_income: "",
    down_payment_readiness: "",
    budget: "",
    property_budget: "",
    purchase_purpose: "",
    urgency_signal: "",
    preferred_contact_method: "",
    best_time_to_contact: "anytime",
  };
}

export function emptyPreflightDraftForRole(role) {
  if (role === "lawyer") return emptyLawyerPreflightDraft();
  if (role === "mortgage_broker") return emptyMortgagePreflightDraft();
  return {};
}

/** @param {ReturnType<typeof emptyLawyerPreflightDraft>} draft */
export function buildLawyerFormData(draft) {
  return {
    intent: "unspecified",
    name: draft.name.trim(),
    phone: normalizePhoneForStorage(draft.phone),
    email: sanitizeEmailInput(draft.email),
    address: draft.address.trim(),
    professionalType: "lawyer",
    transaction_stage: draft.transaction_stage,
    closing_timeline: draft.closing_timeline,
    transaction_type: draft.transaction_type,
    property_value: draft.property_value,
    mortgage_status: draft.mortgage_status,
    realtor_involved: draft.realtor_involved,
    first_time_buyer: draft.first_time_buyer,
    legal_services_needed: draft.legal_services_needed,
    preferred_contact_method: draft.preferred_contact_method,
    best_time_to_contact: draft.best_time_to_contact || "anytime",
  };
}

export function buildLawyerFormContact(draft) {
  const d = buildLawyerFormData(draft);
  return {
    intent: d.intent,
    professionalType: "lawyer",
    name: d.name,
    email: d.email,
    phone: d.phone,
    address: d.address,
    transaction_stage: d.transaction_stage,
    closing_timeline: d.closing_timeline,
    transaction_type: d.transaction_type,
    property_value: d.property_value,
    mortgage_status: d.mortgage_status,
    realtor_involved: d.realtor_involved,
    first_time_buyer: d.first_time_buyer,
    legal_services_needed: d.legal_services_needed,
    preferred_contact_method: d.preferred_contact_method,
    best_time_to_contact: d.best_time_to_contact,
  };
}

/** @param {ReturnType<typeof buildLawyerFormData>} formData */
export function buildLawyerOpeningMessage(formData) {
  const parts = [];
  parts.push(`Hi! My name is ${formData.name}.`);
  parts.push(`I need legal services for a real estate transaction.`);

  if (formData.transaction_stage) parts.push(`Stage: ${humanizeEnum(formData.transaction_stage)}.`);
  if (formData.closing_timeline) parts.push(`Closing: ${humanizeEnum(formData.closing_timeline)}.`);
  if (formData.transaction_type) parts.push(`Transaction type: ${humanizeEnum(formData.transaction_type)}.`);
  if (formData.property_value) parts.push(`Property value: ${humanizeEnum(formData.property_value)}.`);
  if (formData.mortgage_status) parts.push(`Mortgage: ${humanizeEnum(formData.mortgage_status)}.`);
  if (formData.realtor_involved) parts.push(`Realtor: ${formData.realtor_involved}.`);
  if (formData.first_time_buyer) parts.push(`First-time buyer: ${formData.first_time_buyer}.`);
  if (formData.legal_services_needed) parts.push(`Legal services: ${humanizeEnum(formData.legal_services_needed)}.`);
  if (formData.address) parts.push(`Property: ${formData.address}.`);
  parts.push(`My email is ${formData.email} and my phone is ${formData.phone}.`);

  return parts.join(" ");
}

/** @param {ReturnType<typeof emptyMortgagePreflightDraft>} draft */
export function buildMortgageFormData(draft) {
  return {
    intent: "unspecified",
    name: draft.name.trim(),
    phone: normalizePhoneForStorage(draft.phone),
    email: sanitizeEmailInput(draft.email),
    address: draft.address.trim(),
    professionalType: "mortgage_broker",
    mortgage_timeline: draft.mortgage_timeline,
    pre_approval_status: draft.pre_approval_status,
    credit_score_range: draft.credit_score_range,
    employment_status: draft.employment_status,
    household_income: draft.household_income,
    down_payment_readiness: draft.down_payment_readiness,
    budget: draft.budget.trim(),
    property_budget: draft.property_budget,
    purchase_purpose: draft.purchase_purpose,
    urgency_signal: draft.urgency_signal,
    preferred_contact_method: draft.preferred_contact_method,
    best_time_to_contact: draft.best_time_to_contact || "anytime",
  };
}

export function buildMortgageFormContact(draft) {
  const d = buildMortgageFormData(draft);
  return {
    intent: d.intent,
    professionalType: "mortgage_broker",
    name: d.name,
    email: d.email,
    phone: d.phone,
    address: d.address,
    mortgage_timeline: d.mortgage_timeline,
    pre_approval_status: d.pre_approval_status,
    credit_score_range: d.credit_score_range,
    employment_status: d.employment_status,
    household_income: d.household_income,
    down_payment_readiness: d.down_payment_readiness,
    budget: d.budget,
    property_budget: d.property_budget,
    purchase_purpose: d.purchase_purpose,
    urgency_signal: d.urgency_signal,
    preferred_contact_method: d.preferred_contact_method,
    best_time_to_contact: d.best_time_to_contact,
  };
}

/** @param {ReturnType<typeof buildMortgageFormData>} formData */
export function buildMortgageOpeningMessage(formData) {
  const parts = [];
  parts.push(`Hi! My name is ${formData.name}.`);
  parts.push(`I'm looking for mortgage pre-approval.`);

  if (formData.mortgage_timeline) parts.push(`I plan to apply ${humanizeEnum(formData.mortgage_timeline)}.`);
  if (formData.pre_approval_status) parts.push(`Pre-approval status: ${humanizeEnum(formData.pre_approval_status)}.`);
  if (formData.credit_score_range) parts.push(`Credit score: ${humanizeEnum(formData.credit_score_range)}.`);
  if (formData.employment_status) parts.push(`Employment: ${humanizeEnum(formData.employment_status)}.`);
  if (formData.household_income) parts.push(`Household income: ${humanizeEnum(formData.household_income)}.`);
  if (formData.down_payment_readiness) parts.push(`Down payment: ${humanizeEnum(formData.down_payment_readiness)}.`);
  if (formData.budget) parts.push(`Budget: ${formData.budget}.`);
  if (formData.address) parts.push(`Target area: ${formData.address}.`);
  if (formData.purchase_purpose) parts.push(`Purchase purpose: ${humanizeEnum(formData.purchase_purpose)}.`);
  if (formData.urgency_signal) {
    const u = formData.urgency_signal;
    parts.push(
      `If approved tomorrow, I would ${
        u === "yes" ? "start house hunting immediately" : u === "maybe" ? "maybe start" : "not start yet"
      }.`,
    );
  }
  parts.push(`My email is ${formData.email} and my phone is ${formData.phone}.`);

  return parts.join(" ");
}

/** @returns {{ headline: string, paragraphs: string[] }} */
export function buildLawyerLeadProfileNarrative(draft) {
  const d = buildLawyerFormData(draft);
  const headline = "Closing snapshot";
  const paragraphs = [];
  const contactBits = [];
  if (d.name) contactBits.push(`**${d.name}**`);
  if (d.email) contactBits.push(d.email);
  if (d.phone) contactBits.push(d.phone);
  if (contactBits.length) paragraphs.push(contactBits.join(" · "));

  const detailBits = [];
  if (d.address) detailBits.push(`Location: ${d.address}`);
  if (d.mortgage_status) detailBits.push(`Mortgage: ${humanizeEnum(d.mortgage_status)}`);
  if (d.transaction_stage) detailBits.push(`Stage: ${humanizeEnum(d.transaction_stage)}`);
  if (d.closing_timeline) detailBits.push(`Closing: ${humanizeEnum(d.closing_timeline)}`);
  if (d.transaction_type) detailBits.push(`Type: ${humanizeEnum(d.transaction_type)}`);
  if (d.legal_services_needed) detailBits.push(`Services: ${humanizeEnum(d.legal_services_needed)}`);
  if (d.realtor_involved) detailBits.push(`Realtor: ${d.realtor_involved}`);
  if (d.first_time_buyer) detailBits.push(`First-time buyer: ${d.first_time_buyer}`);
  if (d.preferred_contact_method) detailBits.push(`Contact: ${humanizeEnum(d.preferred_contact_method)}`);
  if (d.best_time_to_contact && d.best_time_to_contact !== "anytime") {
    detailBits.push(`Best time: ${humanizeEnum(d.best_time_to_contact)}`);
  }
  if (detailBits.length) paragraphs.push(detailBits.join(" · "));

  return { headline, paragraphs };
}

/** @returns {{ headline: string, paragraphs: string[] }} */
export function buildMortgageLeadProfileNarrative(draft) {
  const d = buildMortgageFormData(draft);
  const headline = "Mortgage pre-approval";
  const paragraphs = [];
  const contactBits = [];
  if (d.name) contactBits.push(`**Name:** ${d.name}`);
  if (d.email) contactBits.push(`**Email:** ${d.email}`);
  if (d.phone) contactBits.push(`**Phone:** ${d.phone}`);
  if (contactBits.length) paragraphs.push(contactBits.join(" · "));

  const lines = [];
  if (d.address) lines.push(`**Target area:** ${d.address}`);
  if (d.mortgage_timeline) lines.push(`**Apply:** ${humanizeEnum(d.mortgage_timeline)}`);
  if (d.pre_approval_status) lines.push(`**Pre-approval:** ${humanizeEnum(d.pre_approval_status)}`);
  if (d.credit_score_range) lines.push(`**Credit:** ${humanizeEnum(d.credit_score_range)}`);
  if (d.employment_status) lines.push(`**Employment:** ${humanizeEnum(d.employment_status)}`);
  if (d.household_income) lines.push(`**Income:** ${humanizeEnum(d.household_income)}`);
  if (d.down_payment_readiness) lines.push(`**Down payment:** ${humanizeEnum(d.down_payment_readiness)}`);
  if (d.budget) lines.push(`**Budget:** ${d.budget}`);
  if (d.property_budget) lines.push(`**Budget clarity:** ${humanizeEnum(d.property_budget)}`);
  if (d.purchase_purpose) lines.push(`**Purpose:** ${humanizeEnum(d.purchase_purpose)}`);
  if (d.urgency_signal) lines.push(`**Ready to hunt:** ${d.urgency_signal}`);
  if (d.preferred_contact_method) lines.push(`**Contact via:** ${humanizeEnum(d.preferred_contact_method)}`);
  if (d.best_time_to_contact && d.best_time_to_contact !== "anytime") {
    lines.push(`**Best time:** ${humanizeEnum(d.best_time_to_contact)}`);
  }
  for (const line of lines) paragraphs.push(line);

  return { headline, paragraphs };
}

export function rolePreflightUserSummaryLine(role, draft) {
  if (role === "lawyer") {
    const d = buildLawyerFormData(draft);
    return ["Legal / closing lead", d.name, [d.email, d.phone].filter(Boolean).join(" · ")].filter(Boolean).join("\n");
  }
  if (role === "mortgage_broker") {
    const d = buildMortgageFormData(draft);
    return ["Mortgage lead", d.name, [d.email, d.phone].filter(Boolean).join(" · ")].filter(Boolean).join("\n");
  }
  return "";
}
