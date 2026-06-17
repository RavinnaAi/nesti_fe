"use client";

import {
  agentUserSummaryLine,
  buildAgentFormContactOverride,
  buildAgentFormData,
  buildAgentOpeningMessage,
  buildLeadProfileNarrative,
  LEAD_STEP_LABELS,
  PRE_CHAT_STEPS,
} from "@/components/chatbot/agentLeadCapture";
import {
  buildLawyerFormContact,
  buildLawyerFormData,
  buildLawyerLeadProfileNarrative,
  buildLawyerOpeningMessage,
  buildMortgageFormContact,
  buildMortgageFormData,
  buildMortgageLeadProfileNarrative,
  buildMortgageOpeningMessage,
  LAWYER_PREFLIGHT_HEADER_LABELS,
  MORTGAGE_PREFLIGHT_HEADER_LABELS,
  rolePreflightUserSummaryLine,
} from "@/components/chatbot/rolePreflightCapture";
import { validateEmailRequired } from "@/lib/emailUtils";
import { validatePhoneRequired } from "@/lib/phoneUtils";

const AGENT_FINAL_REQUIRED = {
  buy: [
    "location",
    "buy_property_location",
    "budget",
    "property_type",
    "beds",
    "baths",
    "must_have_features",
    "parking_required",
    "backyard_needed",
    "school_district_important",
    "timeline",
    "mortgage_status",
    "realtor_status",
    "motivation_reason",
    "viewing_readiness",
    "living_situation",
    "urgency_readiness",
    "preferred_contact_method",
    "best_time_to_contact",
  ],
  sell: [
    "address",
    "price",
    "property_type",
    "beds",
    "baths",
    "must_have_features",
    "parking_required",
    "backyard_needed",
    "timeline",
    "mortgage_status",
    "realtor_status",
    "motivation_reason",
    "viewing_readiness",
    "living_situation",
    "urgency_readiness",
    "preferred_contact_method",
    "best_time_to_contact",
  ],
};

export const AGENT_PROPERTY_STEP_REQUIRED = {
  buy: [
    "location",
    "buy_property_location",
    "budget",
    "property_type",
    "beds",
    "baths",
    "must_have_features",
    "parking_required",
    "backyard_needed",
    "school_district_important",
  ],
  sell: [
    "address",
    "price",
    "property_type",
    "beds",
    "baths",
    "must_have_features",
    "parking_required",
    "backyard_needed",
  ],
};

export const AGENT_QUALIFY_STEP_REQUIRED = [
  "timeline",
  "mortgage_status",
  "realtor_status",
  "motivation_reason",
  "viewing_readiness",
  "living_situation",
  "urgency_readiness",
];

export const AGENT_REACH_STEP_REQUIRED = ["preferred_contact_method", "best_time_to_contact"];

export const LAWYER_PREFLIGHT_REQUIRED_FIELDS = [
  "address",
  "transaction_stage",
  "closing_timeline",
  "transaction_type",
  "property_value",
  "mortgage_status",
  "realtor_involved",
  "first_time_buyer",
  "legal_services_needed",
  "preferred_contact_method",
  "best_time_to_contact",
];

export const MORTGAGE_PREFLIGHT_REQUIRED_FIELDS = [
  "address",
  "mortgage_timeline",
  "pre_approval_status",
  "credit_score_range",
  "employment_status",
  "household_income",
  "down_payment_readiness",
  "budget",
  "property_budget",
  "purchase_purpose",
  "urgency_signal",
  "preferred_contact_method",
  "best_time_to_contact",
];

export function missingDraftFields(draft, fields) {
  return (fields || []).filter((key) => {
    if (key === "best_time_to_contact") {
      const normalized = String(draft?.best_time_to_contact || "").trim().toLowerCase();
      if (!normalized || normalized === "anytime" || normalized === "any time") return false;
    }
    const value = draft?.[key];
    return value == null || String(value).trim() === "";
  });
}

export function getBasicContactValidationErrors(draft, { requireAddress = false } = {}) {
  const errors = [];
  const name = String(draft?.name || "").trim();
  if (!name) errors.push("Please enter your full name.");

  const phoneError = validatePhoneRequired(draft?.phone, { lenient: true });
  if (phoneError) errors.push(phoneError);

  const emailError = validateEmailRequired(draft?.email);
  if (emailError) errors.push(emailError);

  if (requireAddress && !String(draft?.address || "").trim()) {
    errors.push("Please enter the property address or location.");
  }

  return errors;
}

export function getBasicContactValidationError(draft, options) {
  const errors = getBasicContactValidationErrors(draft, options);
  return errors.join(" ");
}

export function hasBasicContact(draft, options) {
  return !getBasicContactValidationError(draft, options);
}

export function getAgentStartPayload(chosenIntent, leadDraft) {
  const formData = buildAgentFormData(chosenIntent, leadDraft);
  return {
    formContact: buildAgentFormContactOverride(formData),
    opening: buildAgentOpeningMessage(chosenIntent, formData),
    summary: agentUserSummaryLine(chosenIntent, formData),
    leadProfilePreview: buildLeadProfileNarrative(chosenIntent, formData),
  };
}

export function getRolePreflightStartPayload(role, rolePreflightDraft) {
  if (role === "lawyer") {
    const formData = buildLawyerFormData(rolePreflightDraft);
    return {
      formContact: buildLawyerFormContact(rolePreflightDraft),
      opening: buildLawyerOpeningMessage(formData),
      summary: rolePreflightUserSummaryLine(role, rolePreflightDraft),
      leadProfilePreview: buildLawyerLeadProfileNarrative(rolePreflightDraft),
      professionalType: "lawyer",
    };
  }
  const formData = buildMortgageFormData(rolePreflightDraft);
  return {
    formContact: buildMortgageFormContact(rolePreflightDraft),
    opening: buildMortgageOpeningMessage(formData),
    summary: rolePreflightUserSummaryLine(role, rolePreflightDraft),
    leadProfilePreview: buildMortgageLeadProfileNarrative(rolePreflightDraft),
    professionalType: "mortgage_broker",
  };
}

export function rolePreflightHeaderSubtitle(role, stepIndex) {
  if (role === "mortgage_broker") return "";
  const labels = role === "lawyer" ? LAWYER_PREFLIGHT_HEADER_LABELS : MORTGAGE_PREFLIGHT_HEADER_LABELS;
  const label = labels[stepIndex] || "";
  return `Step ${stepIndex + 1} of 3 · ${label}`;
}

export function agentHeaderSubtitle(leadFlowStep) {
  const i = PRE_CHAT_STEPS.indexOf(leadFlowStep);
  const n = i >= 0 ? i + 1 : 1;
  const label = LEAD_STEP_LABELS[leadFlowStep] || "";
  return `Step ${n} of ${PRE_CHAT_STEPS.length} · ${label}`;
}

export function agentFinalRequiredFields(intent) {
  return AGENT_FINAL_REQUIRED[intent === "sell" ? "sell" : "buy"];
}
