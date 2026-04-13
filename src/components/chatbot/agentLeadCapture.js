/** Field keys aligned with node-backend/index.html → POST /api/chat formContact */

export const PRE_CHAT_STEPS = ["intent", "contact", "property", "qualify", "reach"];

export const LEAD_STEP_LABELS = {
  intent: "Your goal",
  contact: "Personal info",
  property: "Property",
  qualify: "Qualification",
  reach: "Contact preferences",
};

export const emptyAgentLeadDraft = () => ({
  name: "",
  phone: "",
  email: "",
  location: "",
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
  best_time_to_contact: "",
});

export function buildAgentFormData(intent, draft) {
  const base = {
    intent,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    timeline: draft.timeline,
    mortgage_status: draft.mortgage_status,
    realtor_status: draft.realtor_status,
    motivation_reason: draft.motivation_reason,
    viewing_readiness: draft.viewing_readiness,
    living_situation: draft.living_situation,
    urgency_readiness: draft.urgency_readiness,
    preferred_contact_method: draft.preferred_contact_method,
    best_time_to_contact: draft.best_time_to_contact,
  };

  if (intent === "buy") {
    return {
      ...base,
      location: draft.location.trim(),
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
  };
}

export function buildAgentOpeningMessage(chosenIntent, formData) {
  const parts = [];
  parts.push(`Hi! My name is ${formData.name}.`);
  parts.push(`I am looking to ${chosenIntent === "buy" ? "buy" : "sell"} a property.`);

  if (chosenIntent === "buy") {
    if (formData.location) parts.push(`I'm interested in ${formData.location}.`);
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

export function agentUserSummaryLine(chosenIntent, formData) {
  return chosenIntent === "buy"
    ? `Buyer · ${formData.name} · ${formData.email}`
    : `Seller · ${formData.name} · ${formData.email}`;
}

export function widgetRoleToChatAgentType(widgetRole) {
  if (widgetRole === "mortgage_broker") return "broker";
  if (widgetRole === "lawyer") return "lawyer";
  return "agent";
}
