"use client";

import { useEffect, useState } from "react";
import ChatSelect from "./ChatSelect";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import { sanitizeEmailInput } from "@/lib/emailUtils";
import { getBasicContactValidationError } from "@/components/chatbot/widget/roleChatStrategy";
import StepSegmentBar from "./StepSegmentBar";
import {
  LAWYER_PREFLIGHT_SEGMENT_STEPS,
  MORTGAGE_PREFLIGHT_SEGMENT_STEPS,
} from "./rolePreflightCapture";
import { PREFERRED_CONTACT_OPTIONS, SELECT_EMPTY_OPTION } from "./contactMethodOptions";

const BASE_INPUT_CLS =
  "w-full min-w-0 px-3 py-2.5 text-xs border border-border rounded-xl bg-white text-text-heading shadow-sm transition-colors placeholder:text-text-muted/75 focus:outline-none focus:ring-2";
const labelCls = "text-[11px] font-semibold text-text-heading";
const fieldStackCls = "flex flex-col gap-1 min-w-0";
const pairGridCls = "col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5";
const infoSectionStackCls = "col-span-2 grid grid-cols-1 gap-y-2.5";
const lawyerContactStackCls = "col-span-2 flex flex-col gap-y-2.5";
const mortgageContactStackCls = "col-span-2 flex flex-col gap-y-2.5";

const SELECT_EMPTY = SELECT_EMPTY_OPTION;
const BEST_TIME_OPTIONS = [
  { value: "anytime", label: "Anytime" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const LAWYER_TRANSACTION_STAGE = [
  SELECT_EMPTY,
  { value: "offer_accepted", label: "Offer accepted" },
  { value: "actively_submitting", label: "Actively submitting offers" },
  { value: "pre_approval_stage", label: "Pre-approval stage" },
  { value: "just_researching", label: "Just researching" },
];

const LAWYER_CLOSING = [
  SELECT_EMPTY,
  { value: "within_30_days", label: "Within 30 days" },
  { value: "30_60_days", label: "30–60 days" },
  { value: "60_90_days", label: "60–90 days" },
  { value: "unknown", label: "Unknown" },
];

const LAWYER_TX_TYPE = [
  SELECT_EMPTY,
  { value: "home_purchase", label: "Home purchase" },
  { value: "home_sale", label: "Home sale" },
  { value: "refinance", label: "Refinance" },
  { value: "title_transfer", label: "Title transfer" },
];

const LAWYER_PROPERTY_VALUE = [
  SELECT_EMPTY,
  { value: "1m_plus", label: "$1M+" },
  { value: "700k_1m", label: "$700k–$1M" },
  { value: "400k_700k", label: "$400k–$700k" },
  { value: "under_400k", label: "Under $400k" },
];

const LAWYER_MORTGAGE = [
  SELECT_EMPTY,
  { value: "fully_approved", label: "Fully approved" },
  { value: "conditional_approval", label: "Conditional approval" },
  { value: "still_applying", label: "Still applying" },
];

const YES_NO = [
  SELECT_EMPTY,
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const LAWYER_LEGAL = [
  SELECT_EMPTY,
  { value: "full_closing", label: "Full closing services" },
  { value: "title_transfer", label: "Title transfer" },
  { value: "document_review", label: "Document review" },
];

const LAWYER_CONTACT_METHOD = PREFERRED_CONTACT_OPTIONS;

const MORTGAGE_TIMELINE = [
  SELECT_EMPTY,
  { value: "immediately", label: "Immediately" },
  { value: "1_2_months", label: "Within 1–2 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
  { value: "just_researching", label: "Just researching" },
];

const MORTGAGE_PRE_APPROVAL = [
  SELECT_EMPTY,
  { value: "need_now", label: "Need pre-approval now" },
  { value: "expired", label: "Pre-approval expired" },
  { value: "in_progress", label: "Pre-approval in progress" },
  { value: "already_approved", label: "Already approved" },
  { value: "just_researching", label: "Just researching" },
];

const MORTGAGE_CREDIT = [
  SELECT_EMPTY,
  { value: "750_plus", label: "750+" },
  { value: "700_749", label: "700–749" },
  { value: "650_699", label: "650–699" },
  { value: "600_649", label: "600–649" },
  { value: "under_600", label: "Under 600" },
];

const MORTGAGE_EMPLOYMENT = [
  SELECT_EMPTY,
  { value: "full_time", label: "Full-time employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "contract", label: "Contract worker" },
  { value: "new_job", label: "New job (<1 year)" },
  { value: "unemployed", label: "Unemployed" },
];

const MORTGAGE_INCOME = [
  SELECT_EMPTY,
  { value: "200k_plus", label: "$200k+" },
  { value: "150k_200k", label: "$150k–200k" },
  { value: "100k_150k", label: "$100k–150k" },
  { value: "70k_100k", label: "$70k–100k" },
  { value: "under_70k", label: "Under $70k" },
];

const MORTGAGE_DOWN = [
  SELECT_EMPTY,
  { value: "20_plus", label: "20%+" },
  { value: "10_19", label: "10–19%" },
  { value: "5_9", label: "5–9%" },
  { value: "under_5", label: "Under 5%" },
  { value: "no_savings", label: "No savings yet" },
];

const MORTGAGE_BUDGET_RANGE = [
  SELECT_EMPTY,
  { value: "under_400k", label: "Under $400K" },
  { value: "400k_700k", label: "$400K–$700K" },
  { value: "700k_1m", label: "$700K–$1M" },
  { value: "1m_plus", label: "$1M+" },
];

const MORTGAGE_PROPERTY_BUDGET = [
  SELECT_EMPTY,
  { value: "clearly_defined", label: "Clearly defined" },
  { value: "approximate", label: "Approximate range" },
];

const MORTGAGE_PURPOSE = [
  SELECT_EMPTY,
  { value: "primary_residence", label: "Primary residence" },
  { value: "investment", label: "Investment property" },
  { value: "vacation_home", label: "Vacation home" },
  { value: "refinance", label: "Refinance existing mortgage" },
];

const MORTGAGE_URGENCY = [
  SELECT_EMPTY,
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

const MORTGAGE_CONTACT_METHOD = PREFERRED_CONTACT_OPTIONS;

function Field({ label, children, className = "" }) {
  return (
    <div className={`${fieldStackCls} ${className}`.trim()}>
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}

function RequiredLabel({ text }) {
  return (
    <>
      {text} <span className="text-red-500">*</span>
    </>
  );
}

const PREFLIGHT_STEPS_COUNT = 3;

export default function RolePreflightLeadForm({
  role,
  draft,
  onFieldChange,
  onStartChat,
  onStartOver,
  preflightStepIndex,
  onStepBack,
  onStepNext,
  validationError,
  loading,
  embedTokenMissing,
  panelClassName = "",
  roleUi = {},
  startActionLabel = "Start chat →",
}) {
  const isLawyer = role === "lawyer";
  const isMortgageBroker = role === "mortgage_broker";
  const barSteps = isLawyer ? LAWYER_PREFLIGHT_SEGMENT_STEPS : MORTGAGE_PREFLIGHT_SEGMENT_STEPS;
  const [stepError, setStepError] = useState("");

  const ringFocus = roleUi.accentRingFocus || "focus:ring-primary/25 focus:border-primary";
  const inputCls = `${BASE_INPUT_CLS} ${ringFocus}`;
  const selectTriggerCls = `${inputCls} cursor-pointer`;
  const sectionCls = `text-xs font-bold col-span-2 border-b border-border/80 pb-1.5 pt-1 ${roleUi.accentText || "text-primary"}`;
  const selectActiveClass = roleUi.accentSelectActive || undefined;
  const selectHoverClass = roleUi.accentSelectHover || undefined;
  const stepBorderClass = roleUi.accentBorder || "border-slate-200";
  const stepDivideClass = stepBorderClass.startsWith("border-")
    ? stepBorderClass.replace("border-", "divide-")
    : "divide-slate-200";

  useEffect(() => {
    setStepError("");
  }, [preflightStepIndex]);

  const displayError = validationError || stepError;

  const handleNext = () => {
    setStepError("");
    if (preflightStepIndex === 0) {
      const contactError = getBasicContactValidationError(draft, { requireAddress: isLawyer || isMortgageBroker });
      if (contactError) {
        setStepError(contactError);
        return;
      }
    }
    if (isLawyer && preflightStepIndex === 1) {
      const requiredCaseFields = [
        "transaction_stage",
        "closing_timeline",
        "transaction_type",
        "property_value",
        "mortgage_status",
        "realtor_involved",
        "first_time_buyer",
        "legal_services_needed",
      ];
      const missing = requiredCaseFields.filter((key) => {
        const value = draft?.[key];
        return value == null || String(value).trim() === "";
      });
      if (missing.length) {
        setStepError("Please complete all case details to continue.");
        return;
      }
    }
    if (isLawyer && preflightStepIndex === 2) {
      if (!draft.preferred_contact_method?.trim() || !draft.best_time_to_contact?.trim()) {
        setStepError("Please complete all contact preferences to continue.");
        return;
      }
    }
    if (isMortgageBroker && preflightStepIndex === 1) {
      const requiredMortgageFields = [
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
      ];
      const missing = requiredMortgageFields.filter((key) => {
        const value = draft?.[key];
        return value == null || String(value).trim() === "";
      });
      if (missing.length) {
        setStepError("Please complete all mortgage qualification details to continue.");
        return;
      }
    }
    if (isMortgageBroker && preflightStepIndex === 2) {
      if (!draft.preferred_contact_method?.trim() || !draft.best_time_to_contact?.trim()) {
        setStepError("Please complete all contact preferences to continue.");
        return;
      }
    }
    onStepNext();
  };

  /** Mortgage broker: keep the step bar, but remove the extra helper line under it. */
  const stepIntro = isLawyer || isMortgageBroker ? null : (
    <p className="text-[11px] text-text-muted">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mr-1.5 ${roleUi.accentBadge || "bg-primary text-white"}`}
      >
        Step {preflightStepIndex + 1} of {PREFLIGHT_STEPS_COUNT}
      </span>
      A quick snapshot helps your broker prepare the right next steps.
    </p>
  );

  const lawyerStep0 = (
    <div className={lawyerContactStackCls}>
      <div className={sectionCls}>Contact information</div>
      <Field label={<RequiredLabel text="Full name" />}>
        <input
          type="text"
          className={inputCls}
          placeholder="John Smith"
          value={draft.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label={<RequiredLabel text="Phone" />}>
        <PhoneNumberField
          name="phone"
          value={draft.phone}
          onChange={(value) => onFieldChange("phone", value)}
          variant="chat"
          autoComplete="tel"
        />
      </Field>
      <Field label={<RequiredLabel text="Email" />}>
        <input
          type="email"
          className={inputCls}
          placeholder="you@example.com"
          value={draft.email}
          onChange={(e) => onFieldChange("email", sanitizeEmailInput(e.target.value))}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
        />
      </Field>
      <Field label={<RequiredLabel text="Property address / location" />}>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. 123 Main St, DHA Lahore"
          value={draft.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
        />
      </Field>
    </div>
  );

  const lawyerStep1 = (
    <div className={pairGridCls}>
      <div className={sectionCls}>Transaction details</div>
      <Field label={<RequiredLabel text="What stage are you in?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.transaction_stage}
          onChange={(v) => onFieldChange("transaction_stage", v)}
          options={LAWYER_TRANSACTION_STAGE}
        />
      </Field>
      <Field label={<RequiredLabel text="Expected closing date?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.closing_timeline}
          onChange={(v) => onFieldChange("closing_timeline", v)}
          options={LAWYER_CLOSING}
        />
      </Field>
      <Field label={<RequiredLabel text="Transaction type" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.transaction_type}
          onChange={(v) => onFieldChange("transaction_type", v)}
          options={LAWYER_TX_TYPE}
        />
      </Field>
      <Field label={<RequiredLabel text="Approximate property price" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.property_value}
          onChange={(v) => onFieldChange("property_value", v)}
          options={LAWYER_PROPERTY_VALUE}
        />
      </Field>
      <Field label={<RequiredLabel text="Mortgage approved?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.mortgage_status}
          onChange={(v) => onFieldChange("mortgage_status", v)}
          options={LAWYER_MORTGAGE}
        />
      </Field>
      <Field label={<RequiredLabel text="Working with a realtor?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.realtor_involved}
          onChange={(v) => onFieldChange("realtor_involved", v)}
          options={YES_NO}
        />
      </Field>
      <Field label={<RequiredLabel text="First home purchase?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.first_time_buyer}
          onChange={(v) => onFieldChange("first_time_buyer", v)}
          options={YES_NO}
        />
      </Field>
      <Field label={<RequiredLabel text="Legal services needed" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.legal_services_needed}
          onChange={(v) => onFieldChange("legal_services_needed", v)}
          options={LAWYER_LEGAL}
        />
      </Field>
    </div>
  );

  const lawyerStep2 = (
    <div className={pairGridCls}>
      <div className={sectionCls}>Contact preferences</div>
      <Field label={<RequiredLabel text="Preferred contact method" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.preferred_contact_method}
          onChange={(v) => onFieldChange("preferred_contact_method", v)}
          options={LAWYER_CONTACT_METHOD}
        />
      </Field>
      <Field label={<RequiredLabel text="Best time to contact" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.best_time_to_contact}
          onChange={(v) => onFieldChange("best_time_to_contact", v)}
          options={BEST_TIME_OPTIONS}
        />
      </Field>
    </div>
  );

  const mortgageStep0 = (
    <div className={mortgageContactStackCls}>
      <div className={sectionCls}>Contact information</div>
      <Field label={<RequiredLabel text="Full name" />}>
        <input
          type="text"
          className={inputCls}
          placeholder="John Smith"
          value={draft.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label={<RequiredLabel text="Phone" />}>
        <PhoneNumberField
          name="phone"
          value={draft.phone}
          onChange={(value) => onFieldChange("phone", value)}
          variant="chat"
          autoComplete="tel"
        />
      </Field>
      <Field label={<RequiredLabel text="Email" />}>
        <input
          type="email"
          className={inputCls}
          placeholder="you@example.com"
          value={draft.email}
          onChange={(e) => onFieldChange("email", sanitizeEmailInput(e.target.value))}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
        />
      </Field>
      <Field label={<RequiredLabel text="Target area / address" />}>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. DHA Lahore, 123 Main St, or City"
          value={draft.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
        />
      </Field>
    </div>
  );

  const mortgageStep1 = (
    <div className={pairGridCls}>
      <div className={sectionCls}>Mortgage qualification</div>
      <Field label={<RequiredLabel text="When do you plan to apply?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.mortgage_timeline}
          onChange={(v) => onFieldChange("mortgage_timeline", v)}
          options={MORTGAGE_TIMELINE}
        />
      </Field>
      <Field label={<RequiredLabel text="Pre-approval status" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.pre_approval_status}
          onChange={(v) => onFieldChange("pre_approval_status", v)}
          options={MORTGAGE_PRE_APPROVAL}
        />
      </Field>
      <Field label={<RequiredLabel text="Credit score range" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.credit_score_range}
          onChange={(v) => onFieldChange("credit_score_range", v)}
          options={MORTGAGE_CREDIT}
        />
      </Field>
      <Field label={<RequiredLabel text="Employment status" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.employment_status}
          onChange={(v) => onFieldChange("employment_status", v)}
          options={MORTGAGE_EMPLOYMENT}
        />
      </Field>
      <Field label={<RequiredLabel text="Household income" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.household_income}
          onChange={(v) => onFieldChange("household_income", v)}
          options={MORTGAGE_INCOME}
        />
      </Field>
      <Field label={<RequiredLabel text="Down payment readiness" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.down_payment_readiness}
          onChange={(v) => onFieldChange("down_payment_readiness", v)}
          options={MORTGAGE_DOWN}
        />
      </Field>
      <Field label={<RequiredLabel text="Property budget / price range" />} className="sm:col-span-2">
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.budget}
          onChange={(v) => onFieldChange("budget", v)}
          options={MORTGAGE_BUDGET_RANGE}
        />
      </Field>
      <Field label={<RequiredLabel text="Property budget clarity" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.property_budget}
          onChange={(v) => onFieldChange("property_budget", v)}
          options={MORTGAGE_PROPERTY_BUDGET}
        />
      </Field>
      <Field label={<RequiredLabel text="Purchase purpose" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.purchase_purpose}
          onChange={(v) => onFieldChange("purchase_purpose", v)}
          options={MORTGAGE_PURPOSE}
        />
      </Field>
      <Field label={<RequiredLabel text="If approved tomorrow, start house hunting?" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.urgency_signal}
          onChange={(v) => onFieldChange("urgency_signal", v)}
          options={MORTGAGE_URGENCY}
        />
      </Field>
    </div>
  );

  const mortgageStep2 = (
    <div className={pairGridCls}>
      <div className={sectionCls}>Contact preferences</div>
      <Field label={<RequiredLabel text="Preferred contact method" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.preferred_contact_method}
          onChange={(v) => onFieldChange("preferred_contact_method", v)}
          options={MORTGAGE_CONTACT_METHOD}
        />
      </Field>
      <Field label={<RequiredLabel text="Best time to contact" />}>
        <ChatSelect
          triggerClassName={selectTriggerCls}
          activeClass={selectActiveClass}
          hoverClass={selectHoverClass}
          value={draft.best_time_to_contact}
          onChange={(v) => onFieldChange("best_time_to_contact", v)}
          options={BEST_TIME_OPTIONS}
        />
      </Field>
    </div>
  );

  const body =
    preflightStepIndex === 0
      ? isLawyer
        ? lawyerStep0
        : mortgageStep0
      : preflightStepIndex === 1
        ? isLawyer
          ? lawyerStep1
          : mortgageStep1
        : isLawyer
          ? lawyerStep2
          : mortgageStep2;

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 border-t border-border/60 ${panelClassName}`}
    >
      <div className="shrink-0 w-full min-w-0 px-4 py-2 bg-white border-b border-border/50">
        <StepSegmentBar
          steps={barSteps}
          activeIndex={preflightStepIndex}
          activeBgClass={roleUi.accentBgLight}
          activeTextClass={roleUi.accentTextBold}
          borderClass={stepBorderClass}
          divideClass={stepDivideClass}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 scrollbar-hide">
        {stepIntro ? <div className="mb-3">{stepIntro}</div> : null}
        {body}

        {displayError ? (
          <div className="mt-3 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
            {displayError}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStartOver}
          className="text-[11px] font-medium text-text-muted hover:text-text-heading px-2 py-1.5 rounded-lg transition"
        >
          Cancel
        </button>
        <div className="flex flex-wrap gap-2 justify-end">
          {preflightStepIndex > 0 ? (
            <button
              type="button"
              onClick={onStepBack}
              className="px-4 py-2 text-xs rounded-full border border-border bg-white text-text-heading hover:bg-background-light"
            >
              Back
            </button>
          ) : null}
          {preflightStepIndex < PREFLIGHT_STEPS_COUNT - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className={`rounded-full text-white text-xs font-semibold px-5 py-2.5 transition ${roleUi.accentBg || "bg-primary"} ${roleUi.accentBgHover || "hover:brightness-95"}`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartChat}
              disabled={loading || embedTokenMissing}
              className={`rounded-full text-white text-xs font-semibold px-5 py-2.5 transition disabled:opacity-45 disabled:cursor-not-allowed ${roleUi.accentBg || "bg-primary"} ${roleUi.accentBgHover || "hover:brightness-95"}`}
            >
              {loading ? "Starting…" : startActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
