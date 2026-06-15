"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SelectDropdown from "@/components/ui/SelectDropdown";
import {
  isTerminalPipelineStatus,
  PIPELINE_AUTOMATION_STATUS_LABELS,
} from "@/lib/leadPipelineConfig";

const ACTIVE_PIPELINE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "nurturing", label: "Nurturing" },
];

function getRolePipelineOptions(professionalType) {
  const role = professionalType || "agent";
  const terminalLabels = {
    agent: {
      converted: "Deal successfully closed",
      closed_lost: "Lead not proceeding",
    },
    lawyer: {
      converted: "Matter retained",
      closed_lost: "Matter not proceeding",
    },
    mortgage_broker: {
      converted: "Loan funded / approved",
      closed_lost: "Client not proceeding",
    },
  };
  const labels = terminalLabels[role] || terminalLabels.agent;
  return [
    ...ACTIVE_PIPELINE_OPTIONS,
    { value: "converted", label: labels.converted },
    { value: "closed_lost", label: labels.closed_lost },
  ];
}

const CLOSE_REASONS = {
  agent: {
    converted: [
      { value: "deal_closed", label: "Deal closed" },
      { value: "buyer_found_match", label: "Buyer found match" },
      { value: "seller_accepted_offer", label: "Seller accepted offer" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_with_another_agent", label: "Went with another agent" },
      { value: "changed_mind", label: "Changed mind" },
      { value: "not_ready", label: "Not ready" },
      { value: "unresponsive", label: "Unresponsive" },
      { value: "other", label: "Other" },
    ],
  },
  lawyer: {
    converted: [
      { value: "matter_retained", label: "Matter retained" },
      { value: "case_completed", label: "Case completed" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_elsewhere", label: "Went elsewhere" },
      { value: "declined_service", label: "Declined service" },
      { value: "matter_withdrawn", label: "Matter withdrawn" },
      { value: "other", label: "Other" },
    ],
  },
  mortgage_broker: {
    converted: [
      { value: "loan_funded", label: "Loan funded" },
      { value: "pre_approval_secured", label: "Pre-approval secured" },
      { value: "other", label: "Other" },
    ],
    closed_lost: [
      { value: "went_with_another_lender", label: "Went with another lender" },
      { value: "application_denied", label: "Application denied" },
      { value: "not_qualified", label: "Not qualified" },
      { value: "other", label: "Other" },
    ],
  },
};

const LAWYER_CLOSING_FIELDS = [
  {
    key: "transaction_type",
    label: "Confirm the transaction type (purchase, sale, refinance, etc.)",
    placeholder: "e.g. Purchase transaction",
    maxLength: 200,
    multiline: false,
  },
  {
    key: "property_or_legal_matter",
    label: "Identify the property or legal matter",
    placeholder: "Provide property address or legal matter details",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "closing_date",
    label: "Confirm the closing date",
    placeholder: "e.g. July 30, 2026",
    maxLength: 120,
    multiline: false,
  },
  {
    key: "agreement_and_docs_received",
    label: "Confirm whether the Agreement of Purchase and Sale and required documents have been received",
    placeholder: "e.g. APS received, title search pending",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "outstanding_legal_requirements",
    label: "Identify any outstanding legal requirements",
    placeholder: "List outstanding legal requirements",
    maxLength: 1000,
    multiline: true,
  },
  {
    key: "next_step",
    label: "Confirm the next step (consultation, document review, closing preparation, etc.)",
    placeholder: "Describe the immediate next step",
    maxLength: 1000,
    multiline: true,
  },
];

const MORTGAGE_CLOSING_FIELDS = [
  {
    key: "client_ready_to_move_forward",
    label: "Confirm the client is ready to move forward",
    placeholder: "e.g. Client confirmed readiness",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "property_value_and_mortgage_need",
    label: "Capture the property value and required mortgage amount",
    placeholder: "e.g. Property value 700k, mortgage 520k",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "financing_status",
    label: "Confirm pre-approval or financing status",
    placeholder: "e.g. Pre-approved by lender",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "income_docs_ready",
    label: "Verify income and document readiness",
    placeholder: "e.g. Income docs and IDs received",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "funding_timeline",
    label: "Confirm the expected funding timeline",
    placeholder: "e.g. Funding expected within 30 days",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "next_step",
    label: "Confirm the next step (application, document collection, approval, etc.)",
    placeholder: "Describe the immediate next step",
    maxLength: 1000,
    multiline: true,
  },
];

const AGENT_CLOSING_FIELDS = [
  {
    key: "client_ready_to_proceed",
    label: "Confirm the client is ready to proceed",
    placeholder: "e.g. Client confirmed readiness",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "property_identified",
    label: "Identify the property being purchased or sold",
    placeholder: "e.g. 123 Main St, Lahore",
    maxLength: 300,
    multiline: true,
  },
  {
    key: "price_captured",
    label: "Capture the purchase/sale price",
    placeholder: "e.g. 850000",
    maxLength: 200,
    multiline: false,
  },
  {
    key: "target_closing_date",
    label: "Confirm the target closing date",
    placeholder: "e.g. Aug 15, 2026",
    maxLength: 120,
    multiline: false,
  },
  {
    key: "remaining_conditions",
    label: "Identify any conditions remaining (financing, inspection, etc.)",
    placeholder: "e.g. Financing approval pending",
    maxLength: 500,
    multiline: true,
  },
  {
    key: "next_step",
    label: "Confirm the next step (offer, viewing, negotiation, etc.)",
    placeholder: "Describe the immediate next step",
    maxLength: 1000,
    multiline: true,
  },
];

function createEmptyLawyerClosingChecklist() {
  return {
    transaction_type: "",
    property_or_legal_matter: "",
    closing_date: "",
    agreement_and_docs_received: "",
    outstanding_legal_requirements: "",
    next_step: "",
  };
}

function createEmptyMortgageClosingChecklist() {
  return {
    client_ready_to_move_forward: "",
    property_value_and_mortgage_need: "",
    financing_status: "",
    income_docs_ready: "",
    funding_timeline: "",
    next_step: "",
  };
}

function createEmptyAgentClosingChecklist() {
  return {
    client_ready_to_proceed: "",
    property_identified: "",
    price_captured: "",
    target_closing_date: "",
    remaining_conditions: "",
    next_step: "",
  };
}

function normalizeLawyerClosingChecklist(raw) {
  const base = createEmptyLawyerClosingChecklist();
  if (!raw || typeof raw !== "object") return base;
  return {
    transaction_type: String(raw.transaction_type || "").trim(),
    property_or_legal_matter: String(raw.property_or_legal_matter || "").trim(),
    closing_date: String(raw.closing_date || "").trim(),
    agreement_and_docs_received: String(raw.agreement_and_docs_received || "").trim(),
    outstanding_legal_requirements: String(raw.outstanding_legal_requirements || "").trim(),
    next_step: String(raw.next_step || "").trim(),
  };
}

function normalizeMortgageClosingChecklist(raw) {
  const base = createEmptyMortgageClosingChecklist();
  if (!raw || typeof raw !== "object") return base;
  return {
    client_ready_to_move_forward: String(raw.client_ready_to_move_forward || "").trim(),
    property_value_and_mortgage_need: String(raw.property_value_and_mortgage_need || "").trim(),
    financing_status: String(raw.financing_status || "").trim(),
    income_docs_ready: String(raw.income_docs_ready || "").trim(),
    funding_timeline: String(raw.funding_timeline || "").trim(),
    next_step: String(raw.next_step || "").trim(),
  };
}

function normalizeAgentClosingChecklist(raw) {
  const base = createEmptyAgentClosingChecklist();
  if (!raw || typeof raw !== "object") return base;
  return {
    client_ready_to_proceed: String(raw.client_ready_to_proceed || "").trim(),
    property_identified: String(raw.property_identified || "").trim(),
    price_captured: String(raw.price_captured || "").trim(),
    target_closing_date: String(raw.target_closing_date || "").trim(),
    remaining_conditions: String(raw.remaining_conditions || "").trim(),
    next_step: String(raw.next_step || "").trim(),
  };
}

function getSavedLawyerClosingChecklist(leadData) {
  const raw = leadData?.close_summary?.lawyer_closing_checklist;
  return normalizeLawyerClosingChecklist(raw);
}

function getSavedMortgageClosingChecklist(leadData) {
  const raw = leadData?.close_summary?.mortgage_closing_checklist;
  return normalizeMortgageClosingChecklist(raw);
}

function getSavedAgentClosingChecklist(leadData) {
  const raw = leadData?.close_summary?.agent_closing_checklist;
  return normalizeAgentClosingChecklist(raw);
}

function getRoleCloseConfig(professionalType, closeTarget) {
  const role = professionalType || "agent";
  const isWon = closeTarget === "converted";

  const titles = {
    agent: { converted: "Close deal as won", closed_lost: "Close lead as lost" },
    lawyer: { converted: "Mark matter as retained", closed_lost: "Close matter as lost" },
    mortgage_broker: { converted: "Mark client as funded", closed_lost: "Close client as lost" },
  };
  const descriptions = {
    agent: {
      converted: "This lead will be marked as a closed deal. Calendly and automation will stop updating the pipeline stage.",
      closed_lost: "This lead will be marked as lost. Calendly and automation will stop updating the pipeline stage.",
    },
    lawyer: {
      converted: "This matter will be marked as retained/completed. Pipeline automation will stop.",
      closed_lost: "This matter will be marked as lost. Pipeline automation will stop.",
    },
    mortgage_broker: {
      converted: "This client will be marked as funded/approved. Pipeline automation will stop.",
      closed_lost: "This client will be marked as lost. Pipeline automation will stop.",
    },
  };
  const ctaLabels = {
    agent: { converted: "Mark as won", closed_lost: "Mark as lost" },
    lawyer: { converted: "Mark as retained", closed_lost: "Mark as lost" },
    mortgage_broker: { converted: "Mark as funded", closed_lost: "Mark as lost" },
  };
  const valueLabels = {
    agent: "Deal value",
    lawyer: "Retainer value",
    mortgage_broker: "Loan amount",
  };

  return {
    title: (titles[role] || titles.agent)[closeTarget] || (isWon ? "Close as won" : "Close as lost"),
    description: (descriptions[role] || descriptions.agent)[closeTarget] || "",
    ctaLabel: (ctaLabels[role] || ctaLabels.agent)[closeTarget] || (isWon ? "Confirm" : "Confirm"),
    valueLabel: valueLabels[role] || "Value",
    reasons: (CLOSE_REASONS[role] || CLOSE_REASONS.agent)[closeTarget] || [],
  };
}

function getConversionChecklist(leadData) {
  const raw =
    (leadData && typeof leadData === "object" && (leadData.conversionChecklist || leadData.conversion_checklist)) ||
    null;
  if (!raw || typeof raw !== "object") return null;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      key: item.key || "",
      label: item.label || "",
      isComplete: Boolean(item.isComplete),
    }));
  const missingItems = normalizedItems.filter((item) => !item.isComplete);
  const hasExplicitCanConvert = typeof raw.canConvert === "boolean";
  return {
    role: raw.role || "agent",
    items: normalizedItems,
    canConvert: hasExplicitCanConvert ? Boolean(raw.canConvert) : missingItems.length === 0,
    missingItems,
  };
}

function canLawyerChecklistAnswerSatisfyItem(itemKey) {
  return (
    itemKey === "transaction_type" ||
    itemKey === "property_or_legal_matter" ||
    itemKey === "closing_date" ||
    itemKey === "agreement_and_docs_received" ||
    itemKey === "outstanding_legal_requirements" ||
    itemKey === "next_step"
  );
}

function canMortgageChecklistAnswerSatisfyItem(itemKey) {
  return (
    itemKey === "client_ready_to_move_forward" ||
    itemKey === "property_value_and_mortgage_need" ||
    itemKey === "financing_status" ||
    itemKey === "income_docs_ready" ||
    itemKey === "funding_timeline" ||
    itemKey === "next_step"
  );
}

function canAgentChecklistAnswerSatisfyItem(itemKey) {
  return (
    itemKey === "client_ready_to_proceed" ||
    itemKey === "property_identified" ||
    itemKey === "price_captured" ||
    itemKey === "target_closing_date" ||
    itemKey === "remaining_conditions" ||
    itemKey === "next_step"
  );
}

function parseAmountToken(token) {
  const raw = String(token || "").trim().toLowerCase();
  if (!raw) return null;
  const m = raw.match(/^(\d+(?:\.\d+)?)([km])?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = String(m[2] || "").toLowerCase();
  if (unit === "k") return Math.round(n * 1000);
  if (unit === "m") return Math.round(n * 1000000);
  return Math.round(n);
}

function parseAmountFromValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const txt = String(value).trim().toLowerCase();
  if (!txt) return null;

  if (/^\d+(?:\.\d+)?([km])?_plus$/i.test(txt)) {
    const base = parseAmountToken(txt.replace(/_plus$/i, ""));
    return Number.isFinite(base) ? base : null;
  }
  if (/^under_\d+(?:\.\d+)?([km])?$/i.test(txt)) {
    const base = parseAmountToken(txt.replace(/^under_/i, ""));
    return Number.isFinite(base) ? base : null;
  }
  if (/^\d+(?:\.\d+)?([km])?_\d+(?:\.\d+)?([km])?$/i.test(txt)) {
    const [a, b] = txt.split("_");
    const av = parseAmountToken(a);
    const bv = parseAmountToken(b);
    if (Number.isFinite(av) && Number.isFinite(bv)) return Math.max(av, bv);
  }

  const cleaned = txt.replace(/[$,\s]/g, "");
  const range = cleaned.match(
    /(\d+(?:\.\d+)?(?:[km])?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?(?:[km])?)/i
  );
  if (range) {
    const a = parseAmountToken(range[1]);
    const b = parseAmountToken(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b);
  }
  return parseAmountToken(cleaned);
}

function deriveInitialCloseValue(leadData, professionalType) {
  const role = String(professionalType || leadData?.professional_type || "agent")
    .trim()
    .toLowerCase();
  const shared = [
    leadData?.close_summary?.value,
    leadData?.property?.expected_price,
    leadData?.property?.budget,
  ];
  const roleSpecific =
    role === "mortgage_broker"
      ? [leadData?.qualification?.property_budget]
      : role === "lawyer"
        ? [leadData?.qualification?.property_value]
        : [];
  const candidates = [...shared, ...roleSpecific];
  for (const candidate of candidates) {
    const parsed = parseAmountFromValue(candidate);
    if (Number.isFinite(parsed) && parsed > 0) return String(parsed);
  }
  return "";
}

/**
 * Shared pipeline / match_status editor (Lead Profile + Notes tab).
 * - Default: saves on each selection (`submitOnSelect`).
 * - Notes tab: `submitOnSelect={false}` + `draftMatchStatus` / `onDraftMatchStatusChange` for batched save with notes.
 */
export default function LeadPipelineStageControl({
  lead,
  onPatchLead,
  patchLeadPending = false,
  title = "Pipeline stage",
  hint = null,
  className = "",
  unboxed = false,
  submitOnSelect = true,
  draftMatchStatus,
  onDraftMatchStatusChange,
  onCloseMetadataChange,
  professionalType,
}) {
  const leadData = useMemo(
    () => (lead && typeof lead === "object" ? lead : {}),
    [lead]
  );
  const savedStatus = leadData.status ?? leadData.match_status ?? "new";
  const effectiveValue = submitOnSelect ? savedStatus : (draftMatchStatus ?? savedStatus);
  const profType = professionalType || leadData.professional_type || "agent";

  const [reopenTarget, setReopenTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const [closeReason, setCloseReason] = useState("");
  const [closeValue, setCloseValue] = useState("");
  const [closeAgentChecklist, setCloseAgentChecklist] = useState(createEmptyAgentClosingChecklist);
  const [closeLawyerChecklist, setCloseLawyerChecklist] = useState(createEmptyLawyerClosingChecklist);
  const [closeMortgageChecklist, setCloseMortgageChecklist] = useState(createEmptyMortgageClosingChecklist);
  const [reasonTouched, setReasonTouched] = useState(false);
  const [agentChecklistTouched, setAgentChecklistTouched] = useState(false);
  const [lawyerChecklistTouched, setLawyerChecklistTouched] = useState(false);
  const [mortgageChecklistTouched, setMortgageChecklistTouched] = useState(false);
  const conversionChecklist = useMemo(() => getConversionChecklist(leadData), [leadData]);

  const resetCloseFields = useCallback(() => {
    setCloseReason("");
    setCloseValue("");
    setCloseAgentChecklist(createEmptyAgentClosingChecklist());
    setCloseLawyerChecklist(createEmptyLawyerClosingChecklist());
    setCloseMortgageChecklist(createEmptyMortgageClosingChecklist());
    setReasonTouched(false);
    setAgentChecklistTouched(false);
    setLawyerChecklistTouched(false);
    setMortgageChecklistTouched(false);
  }, []);

  useEffect(() => {
    if (!reopenTarget && !closeTarget) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !reopenSubmitting) {
        setReopenTarget(null);
        setCloseTarget(null);
        resetCloseFields();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reopenTarget, closeTarget, reopenSubmitting, resetCloseFields]);

  const pipelineOptions = useMemo(() => {
    const roleOptions = getRolePipelineOptions(profType);
    const autoLabel = PIPELINE_AUTOMATION_STATUS_LABELS[effectiveValue];
    if (autoLabel) {
      return [
        { value: effectiveValue, label: `${autoLabel} (booking)` },
        ...roleOptions,
      ];
    }
    if (isTerminalPipelineStatus(effectiveValue)) {
      const current = roleOptions.find((option) => option.value === effectiveValue);
      return [
        { value: effectiveValue, label: current?.label || "Closed" },
        { value: "new", label: "Reopen to New" },
        { value: "nurturing", label: "Reopen to Nurturing" },
      ];
    }
    return roleOptions;
  }, [effectiveValue, profType]);

  const handlePipelineSelect = async (next) => {
    if (!next || next === effectiveValue) return;
    const wasTerminal = isTerminalPipelineStatus(savedStatus);
    const isNextTerminal = isTerminalPipelineStatus(next);
    const isReopen = wasTerminal && (next === "new" || next === "nurturing");
    const needsCloseConfirm = isNextTerminal && (next !== savedStatus);

    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") return;
      if (isReopen) { setReopenTarget(next); return; }
      if (needsCloseConfirm) {
        resetCloseFields();
        const role = String(profType || "").trim().toLowerCase();
        if (role === "agent") {
          setCloseAgentChecklist(getSavedAgentClosingChecklist(leadData));
        }
        if (role === "lawyer") {
          setCloseLawyerChecklist(getSavedLawyerClosingChecklist(leadData));
        }
        if (role === "mortgage_broker") {
          setCloseMortgageChecklist(getSavedMortgageClosingChecklist(leadData));
        }
        if (next === "converted") {
          setCloseValue(deriveInitialCloseValue(leadData, profType));
        }
        setCloseTarget(next);
        return;
      }
      try {
        await onPatchLead({ match_status: next });
      } catch { /* toast from parent */ }
      return;
    }

    if (typeof onDraftMatchStatusChange !== "function") return;
    if (isReopen) { setReopenTarget(next); return; }
    if (needsCloseConfirm) {
      resetCloseFields();
      const role = String(profType || "").trim().toLowerCase();
      if (role === "agent") {
        setCloseAgentChecklist(getSavedAgentClosingChecklist(leadData));
      }
      if (role === "lawyer") {
        setCloseLawyerChecklist(getSavedLawyerClosingChecklist(leadData));
      }
      if (role === "mortgage_broker") {
        setCloseMortgageChecklist(getSavedMortgageClosingChecklist(leadData));
      }
      if (next === "converted") {
        setCloseValue(deriveInitialCloseValue(leadData, profType));
      }
      setCloseTarget(next);
      return;
    }
    onDraftMatchStatusChange(next);
  };

  const closeReopenModal = () => {
    if (reopenSubmitting) return;
    setReopenTarget(null);
  };

  const dismissCloseModal = () => {
    if (reopenSubmitting) return;
    setCloseTarget(null);
    resetCloseFields();
  };

  const confirmClose = async () => {
    const isAgentCloseFlow = String(profType || "").trim().toLowerCase() === "agent";
    const isLawyerCloseFlow = String(profType || "").trim().toLowerCase() === "lawyer";
    const isMortgageCloseFlow = String(profType || "").trim().toLowerCase() === "mortgage_broker";
    const normalizedAgentChecklist = normalizeAgentClosingChecklist(closeAgentChecklist);
    const normalizedLawyerChecklist = normalizeLawyerClosingChecklist(closeLawyerChecklist);
    const normalizedMortgageChecklist = normalizeMortgageClosingChecklist(closeMortgageChecklist);
    const missingAgentChecklistKeys = isAgentCloseFlow
      ? AGENT_CLOSING_FIELDS
          .filter((field) => !String(normalizedAgentChecklist[field.key] || "").trim())
          .map((field) => field.key)
      : [];
    const missingLawyerChecklistKeys = isLawyerCloseFlow
      ? LAWYER_CLOSING_FIELDS
          .filter((field) => !String(normalizedLawyerChecklist[field.key] || "").trim())
          .map((field) => field.key)
      : [];
    const missingMortgageChecklistKeys = isMortgageCloseFlow
      ? MORTGAGE_CLOSING_FIELDS
          .filter((field) => !String(normalizedMortgageChecklist[field.key] || "").trim())
          .map((field) => field.key)
      : [];

    setReasonTouched(true);
    if (isAgentCloseFlow) setAgentChecklistTouched(true);
    if (isLawyerCloseFlow) setLawyerChecklistTouched(true);
    if (isMortgageCloseFlow) setMortgageChecklistTouched(true);
    if (!closeReason) return;
    if (missingAgentChecklistKeys.length > 0) return;
    if (missingLawyerChecklistKeys.length > 0) return;
    if (missingMortgageChecklistKeys.length > 0) return;

    const next = closeTarget;
    if (!next) { dismissCloseModal(); return; }

    const metadata = {
      close_reason: closeReason,
      ...(closeValue && Number(closeValue) > 0 ? { closed_value: Number(closeValue) } : {}),
      ...(isAgentCloseFlow ? { agent_closing_checklist: normalizedAgentChecklist } : {}),
      ...(isLawyerCloseFlow ? { lawyer_closing_checklist: normalizedLawyerChecklist } : {}),
      ...(isMortgageCloseFlow ? { mortgage_closing_checklist: normalizedMortgageChecklist } : {}),
    };

    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") { dismissCloseModal(); return; }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next, ...metadata });
        dismissCloseModal();
      } catch { /* toast from parent */ }
      finally { setReopenSubmitting(false); }
      return;
    }

    onDraftMatchStatusChange?.(next);
    onCloseMetadataChange?.(metadata);
    dismissCloseModal();
  };

  const confirmReopen = async () => {
    const next = reopenTarget;
    if (!next) { setReopenTarget(null); return; }
    if (submitOnSelect) {
      if (typeof onPatchLead !== "function") { setReopenTarget(null); return; }
      setReopenSubmitting(true);
      try {
        await onPatchLead({ match_status: next });
        setReopenTarget(null);
      } catch { /* toast from parent */ }
      finally { setReopenSubmitting(false); }
      return;
    }
    onDraftMatchStatusChange?.(next);
    setReopenTarget(null);
  };

  const shell = unboxed
    ? `space-y-3 ${className}`.trim()
    : `rounded-lg border border-border/60 bg-gradient-to-b from-primary/[0.03] to-transparent p-4 sm:p-5 space-y-3 ${className}`.trim();

  const selectDisabled = patchLeadPending || reopenTarget != null || closeTarget != null;

  const closeConfig = closeTarget ? getRoleCloseConfig(profType, closeTarget) : null;
  const swapping = closeTarget && isTerminalPipelineStatus(savedStatus) && isTerminalPipelineStatus(closeTarget);
  const isWon = closeTarget === "converted";
  const isAgentCloseFlow = closeTarget && String(profType || "").trim().toLowerCase() === "agent";
  const isLawyerCloseFlow = closeTarget && String(profType || "").trim().toLowerCase() === "lawyer";
  const isMortgageCloseFlow = closeTarget && String(profType || "").trim().toLowerCase() === "mortgage_broker";
  const hasRoleChecklistCloseFlow = Boolean(isAgentCloseFlow || isLawyerCloseFlow || isMortgageCloseFlow);
  const reasonInvalid = reasonTouched && !closeReason;
  const normalizedCloseAgentChecklist = useMemo(
    () => normalizeAgentClosingChecklist(closeAgentChecklist),
    [closeAgentChecklist]
  );
  const normalizedCloseLawyerChecklist = useMemo(
    () => normalizeLawyerClosingChecklist(closeLawyerChecklist),
    [closeLawyerChecklist]
  );
  const normalizedCloseMortgageChecklist = useMemo(
    () => normalizeMortgageClosingChecklist(closeMortgageChecklist),
    [closeMortgageChecklist]
  );
  const roleCloseFields = isAgentCloseFlow
    ? AGENT_CLOSING_FIELDS
    : isLawyerCloseFlow
      ? LAWYER_CLOSING_FIELDS
      : isMortgageCloseFlow
        ? MORTGAGE_CLOSING_FIELDS
        : [];
  const effectiveChecklistItems = useMemo(() => {
    const baseItems = Array.isArray(conversionChecklist?.items) ? conversionChecklist.items : [];
    return baseItems
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const agentAnswerCanSatisfy =
          isAgentCloseFlow &&
          !item.isComplete &&
          canAgentChecklistAnswerSatisfyItem(item.key) &&
          String(normalizedCloseAgentChecklist[item.key] || "").trim().length > 0;
        const lawyerAnswerCanSatisfy =
          isLawyerCloseFlow &&
          !item.isComplete &&
          canLawyerChecklistAnswerSatisfyItem(item.key) &&
          String(normalizedCloseLawyerChecklist[item.key] || "").trim().length > 0;
        const mortgageAnswerCanSatisfy =
          isMortgageCloseFlow &&
          !item.isComplete &&
          canMortgageChecklistAnswerSatisfyItem(item.key) &&
          String(normalizedCloseMortgageChecklist[item.key] || "").trim().length > 0;
        return {
          ...item,
          isCompleteEffective: Boolean(
            item.isComplete || agentAnswerCanSatisfy || lawyerAnswerCanSatisfy || mortgageAnswerCanSatisfy
          ),
          satisfiedByAgentInput: Boolean(agentAnswerCanSatisfy),
          satisfiedByLawyerInput: Boolean(lawyerAnswerCanSatisfy),
          satisfiedByMortgageInput: Boolean(mortgageAnswerCanSatisfy),
        };
      });
  }, [
    conversionChecklist,
    isAgentCloseFlow,
    isLawyerCloseFlow,
    isMortgageCloseFlow,
    normalizedCloseAgentChecklist,
    normalizedCloseLawyerChecklist,
    normalizedCloseMortgageChecklist,
  ]);
  const effectiveMissingChecklistItems = useMemo(
    () => effectiveChecklistItems.filter((item) => !item.isCompleteEffective),
    [effectiveChecklistItems]
  );
  const shouldBlockWonClose = isWon && effectiveMissingChecklistItems.length > 0;
  const missingRequiredAgentFields = isAgentCloseFlow
    ? AGENT_CLOSING_FIELDS.filter(
        (field) => !String(normalizedCloseAgentChecklist[field.key] || "").trim()
      )
    : [];
  const missingRequiredLawyerFields = isLawyerCloseFlow
    ? LAWYER_CLOSING_FIELDS.filter(
        (field) => !String(normalizedCloseLawyerChecklist[field.key] || "").trim()
      )
    : [];
  const missingRequiredMortgageFields = isMortgageCloseFlow
    ? MORTGAGE_CLOSING_FIELDS.filter(
        (field) => !String(normalizedCloseMortgageChecklist[field.key] || "").trim()
      )
    : [];
  const shouldBlockAgentClose = isAgentCloseFlow && missingRequiredAgentFields.length > 0;
  const shouldBlockLawyerClose = isLawyerCloseFlow && missingRequiredLawyerFields.length > 0;
  const shouldBlockMortgageClose = isMortgageCloseFlow && missingRequiredMortgageFields.length > 0;
  const missingRequiredPatchHandler =
    (submitOnSelect && typeof onPatchLead !== "function") ||
    (!submitOnSelect && typeof onDraftMatchStatusChange !== "function");

  if (missingRequiredPatchHandler) return null;

  return (
    <div className={shell}>
      <div className="text-sm font-semibold text-text-heading">{title}</div>
      {hint}
      <div className={unboxed ? "w-full max-w-none" : "max-w-md"}>
        <SelectDropdown
          size="small"
          placeholder="Select pipeline stage"
          options={pipelineOptions}
          value={effectiveValue}
          disabled={selectDisabled}
          onChange={(val) => void handlePipelineSelect(val)}
        />
      </div>
      {isTerminalPipelineStatus(effectiveValue) ? (
        <p className="text-xs text-text-muted leading-relaxed">
          Closed: Calendly won&apos;t change this stage until you reopen to{" "}
          <span className="font-medium text-text-heading/80">New</span> or{" "}
          <span className="font-medium text-text-heading/80">Nurturing</span>.
        </p>
      ) : null}

      {/* Reopen confirmation modal */}
      {reopenTarget && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget && !reopenSubmitting) setReopenTarget(null); }}
            >
              <div
                className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reopen-lead-title"
              >
                <h3 id="reopen-lead-title" className="text-base font-semibold text-text-heading">
                  Reopen this lead{reopenTarget === "nurturing" ? " for nurturing" : ""}?
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {reopenTarget === "nurturing"
                    ? "The lead will move back into your active nurturing pipeline. Calendly bookings and automation will be allowed to update the stage again."
                    : "The lead will move back to New in your pipeline. Calendly bookings and automation will be allowed to update the stage again."}
                  {!submitOnSelect ? " Click Save changes below to apply." : ""}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeReopenModal}
                    disabled={reopenSubmitting}
                    className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmReopen()}
                    disabled={reopenSubmitting}
                    className="px-3 py-2 text-xs font-semibold text-white bg-primary rounded-md hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {reopenSubmitting ? "Saving…" : submitOnSelect ? "Reopen lead" : "Continue"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Role-aware close modal */}
      {closeTarget && closeConfig && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget && !reopenSubmitting) dismissCloseModal(); }}
            >
              <div
                className={`w-full rounded-xl border border-border bg-white shadow-2xl p-6 max-h-[88vh] overflow-y-auto ${
                  hasRoleChecklistCloseFlow ? "max-w-4xl" : "max-w-lg"
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="close-lead-title"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isWon ? "bg-emerald-50" : "bg-slate-100"}`}>
                    {isWon ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <h3 id="close-lead-title" className="text-base font-semibold text-text-heading">
                    {swapping ? `Change to ${isWon ? "Won" : "Lost"}` : closeConfig.title}
                  </h3>
                </div>

                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {swapping
                    ? isWon
                      ? "This lead will move from Lost to Won. The deal will be counted as converted in your pipeline."
                      : "This lead will move from Won to Lost. It will no longer count as a converted deal."
                    : closeConfig.description}
                  {!swapping ? " You can reopen it later." : ""}
                  {!submitOnSelect ? " Click Save changes below to apply." : ""}
                </p>

                <div className="mt-4 space-y-3">
                  {hasRoleChecklistCloseFlow ? (
                    <div className="rounded-lg border border-border/80 bg-slate-50/60 p-3 md:p-3.5 space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-heading/90">
                        Required before closing
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                        {roleCloseFields.map((field) => {
                          const value = isAgentCloseFlow
                            ? (closeAgentChecklist[field.key] || "")
                            : isLawyerCloseFlow
                            ? (closeLawyerChecklist[field.key] || "")
                            : (closeMortgageChecklist[field.key] || "");
                          const invalid =
                            (isAgentCloseFlow
                              ? agentChecklistTouched
                              : isLawyerCloseFlow
                                ? lawyerChecklistTouched
                                : mortgageChecklistTouched) &&
                            !String(value).trim();
                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="block min-h-[2.25rem] text-[11px] leading-4 font-semibold text-text-heading/90">
                                {field.label} <span className="text-red-500">*</span>
                              </label>
                              {field.multiline ? (
                                <textarea
                                  value={value}
                                  onChange={(e) =>
                                    (isAgentCloseFlow
                                      ? setCloseAgentChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        }))
                                      : isLawyerCloseFlow
                                      ? setCloseLawyerChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        }))
                                      : setCloseMortgageChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        })))
                                  }
                                  rows={1}
                                  placeholder={field.placeholder}
                                  className={`w-full min-h-9 rounded-md border px-3 py-2 text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y ${
                                    invalid ? "border-red-300 bg-red-50/30" : "border-border"
                                  }`}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) =>
                                    (isAgentCloseFlow
                                      ? setCloseAgentChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        }))
                                      : isLawyerCloseFlow
                                      ? setCloseLawyerChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        }))
                                      : setCloseMortgageChecklist((prev) => ({
                                          ...prev,
                                          [field.key]: e.target.value.slice(0, field.maxLength),
                                        })))
                                  }
                                  placeholder={field.placeholder}
                                  className={`w-full h-9 rounded-md border px-3 text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${
                                    invalid ? "border-red-300 bg-red-50/30" : "border-border"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {(isAgentCloseFlow
                        ? (agentChecklistTouched && shouldBlockAgentClose)
                        : isLawyerCloseFlow
                          ? (lawyerChecklistTouched && shouldBlockLawyerClose)
                          : (mortgageChecklistTouched && shouldBlockMortgageClose)) ? (
                        <p className="text-[11px] text-red-600">
                          Please complete all required closing fields.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Reason (required) */}
                  <div>
                    <label className="block text-xs font-medium text-text-heading mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <SelectDropdown
                      size="small"
                      placeholder="Select a reason..."
                      options={closeConfig.reasons}
                      value={closeReason}
                      onChange={(val) => {
                        setCloseReason(val);
                        setReasonTouched(true);
                      }}
                      error={reasonInvalid ? "Please select a reason" : ""}
                    />
                  </div>

                  {/* Value (optional, shown only for won) */}
                  {isWon && (
                    <div>
                      <label className="block text-xs font-medium text-text-heading mb-1">
                        {closeConfig.valueLabel} <span className="text-text-muted font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={closeValue}
                          onChange={(e) => setCloseValue(e.target.value)}
                          placeholder="0"
                          className="w-full h-9 rounded-md border border-border pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={dismissCloseModal}
                    disabled={reopenSubmitting}
                    className="px-3.5 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmClose()}
                    disabled={
                      reopenSubmitting ||
                      !closeReason ||
                      shouldBlockWonClose ||
                      shouldBlockAgentClose ||
                      shouldBlockLawyerClose ||
                      shouldBlockMortgageClose
                    }
                    className={`px-3.5 py-2 text-xs font-semibold text-white rounded-md hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                      isWon ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                  >
                    {reopenSubmitting
                      ? "Saving…"
                      : submitOnSelect
                        ? closeConfig.ctaLabel
                        : "Continue"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
