"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { LEAD_STEP_LABELS, PRE_CHAT_STEPS } from "./agentLeadCapture";
import StepSegmentBar from "./StepSegmentBar";
import ChatSelect from "./ChatSelect";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import { sanitizeEmailInput } from "@/lib/emailUtils";
import { PREFERRED_CONTACT_OPTIONS } from "./contactMethodOptions";

const ONBOARDING_BAR_STEPS = PRE_CHAT_STEPS.map((key) => ({
  key,
  label: LEAD_STEP_LABELS[key],
}));

const inputCls =
  "w-full min-w-0 px-3 py-2.5 text-xs border border-border rounded-xl bg-white text-text-heading shadow-sm transition-colors placeholder:text-text-muted/75 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
const labelCls = "text-[11px] font-semibold text-text-heading";
const sectionCls = "text-xs font-bold text-primary col-span-2 border-b border-border/80 pb-1.5 pt-1";
const pairGridCls = "col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5";
const infoSectionStackCls = "col-span-2 grid grid-cols-1 gap-y-2.5";
const fieldStackCls = "flex flex-col gap-1 min-w-0";

const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"];

const BED_BATH_CHOICES = ["1", "2", "3", "4", "5+"].map((b) => ({ value: b, label: b }));
const SELECT_OPTION = { value: "", label: "Select…" };
const PROPERTY_TYPE_OPTIONS = [SELECT_OPTION, ...PROPERTY_TYPES.map((t) => ({ value: t, label: t }))];
const BED_BATH_SELECT_OPTIONS = [SELECT_OPTION, ...BED_BATH_CHOICES];
const CONTACT_METHOD_OPTIONS = PREFERRED_CONTACT_OPTIONS;
const YES_NO_OPTIONS = [
  SELECT_OPTION,
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const TIMELINE_OPTIONS = [
  SELECT_OPTION,
  { value: "asap", label: "ASAP / within 1 month" },
  { value: "1-3 months", label: "1 – 3 months" },
  { value: "3-6 months", label: "3 – 6 months" },
  { value: "6-12 months", label: "6 – 12 months" },
  { value: "browsing", label: "Just browsing" },
];

const MORTGAGE_OPTIONS = [
  SELECT_OPTION,
  { value: "fully_pre_approved", label: "Yes – fully pre-approved" },
  { value: "paying_cash", label: "Paying cash" },
  { value: "in_progress", label: "Pre-approval in progress" },
  { value: "not_yet", label: "Not yet" },
];

const REALTOR_OPTIONS = [
  SELECT_OPTION,
  { value: "no_agent", label: "No – I need one" },
  { value: "has_agent_but_open", label: "Yes, but open to others" },
  { value: "has_exclusive_agent", label: "Yes – exclusively" },
];

const MOTIVATION_OPTIONS = [
  SELECT_OPTION,
  { value: "relocation", label: "Relocation / job move" },
  { value: "family_change", label: "Growing family" },
  { value: "divorce", label: "Divorce" },
  { value: "investment", label: "Investment" },
  { value: "upgrading", label: "Upgrading to bigger home" },
  { value: "downsizing", label: "Downsizing" },
  { value: "just_exploring", label: "Just exploring" },
];

const VIEWING_OPTIONS = [
  SELECT_OPTION,
  { value: "asap", label: "Yes – ASAP" },
  { value: "few_weeks", label: "Within a few weeks" },
  { value: "maybe_later", label: "Maybe later" },
  { value: "just_browsing", label: "Just browsing for now" },
];

const LIVING_OPTIONS = [
  SELECT_OPTION,
  { value: "renting", label: "Renting" },
  { value: "own_need_to_sell", label: "Own – need to sell first" },
  { value: "own_not_selling", label: "Own – not selling" },
];

const URGENCY_OPTIONS = [
  SELECT_OPTION,
  { value: "yes_immediately", label: "Yes – immediately" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No – not yet" },
];

const BEST_TIME_OPTIONS = [
  { value: "anytime", label: "Anytime" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const BUDGET_OPTIONS = [
  SELECT_OPTION,
  { value: "under_400k", label: "Under $400k" },
  { value: "400k_700k", label: "$400k–$700k" },
  { value: "700k_1m", label: "$700k–$1M" },
  { value: "1m_plus", label: "$1M+" },
];

function RequiredLabel({ children }) {
  return (
    <label className={labelCls}>
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

function IntentBadge({ isBuy }) {
  return (
    <span
      className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
        isBuy ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {isBuy ? "Buyer" : "Seller"}
    </span>
  );
}

export default function AgentLeadOnboarding({
  step,
  chosenIntent,
  onChooseIntent,
  draft,
  onFieldChange,
  onBack,
  onForward,
  onStartChat,
  onStartOver,
  validationError,
  propertyImageFiles = [],
  onPropertyImageFilesChange,
  propertyImagesUploading = false,
  startActionLabel = "Start chat",
  backButtonDisabled = false,
}) {
  const isBuy = chosenIntent === "buy";
  const rawStepIndex = PRE_CHAT_STEPS.indexOf(step);
  const barStepIndex = rawStepIndex >= 0 ? rawStepIndex : 0;
  const showBack = step !== "intent";
  const sellerImageFiles = useMemo(
    () => Array.from(propertyImageFiles || []).slice(0, 8),
    [propertyImageFiles],
  );
  const sellerImagePreviews = useMemo(
    () =>
      sellerImageFiles.map((file) => ({
        name: file?.name || "Property image",
        url: file ? URL.createObjectURL(file) : "",
      })),
    [sellerImageFiles],
  );
  const startLoadingLabel = isBuy ? "Creating inquiry..." : "Uploading listing...";

  useEffect(
    () => () => {
      sellerImagePreviews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    },
    [sellerImagePreviews],
  );

  const footer = (primaryLabel, primaryAction, primaryIsStart = false) => (
    <div
      className={`sticky bottom-0 z-10 flex flex-wrap gap-2 items-center pt-3 pb-1 mt-auto border-t border-border/60 bg-background-light/95 backdrop-blur supports-[backdrop-filter]:bg-background-light/80 shrink-0 ${
        onStartOver ? "justify-between" : "justify-end"
      }`}
    >
      {onStartOver ? (
        <button
          type="button"
          onClick={onStartOver}
          className="text-xs text-text-muted hover:text-text-heading underline-offset-2 hover:underline px-1 py-2"
        >
          Start new request
        </button>
      ) : null}
      <div className="flex gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={backButtonDisabled}
            className="px-4 py-2 text-xs rounded-full border border-border bg-white text-text-heading hover:bg-background-light"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={primaryIsStart ? onStartChat : onForward}
          disabled={propertyImagesUploading}
          className="px-5 py-2 text-xs rounded-full bg-primary text-white font-semibold hover:brightness-95"
        >
          {propertyImagesUploading && primaryIsStart ? startLoadingLabel : primaryLabel}
        </button>
      </div>
    </div>
  );

  if (step === "intent") {
    return (
      <div className="flex-1 px-5 pb-4 pt-2 bg-gradient-to-b from-indigo-50/80 to-background-light flex flex-col min-h-0">
        <div className="mb-3 shrink-0 w-full">
          <StepSegmentBar steps={ONBOARDING_BAR_STEPS} activeIndex={barStepIndex} />
        </div>
        <p className="text-sm font-bold text-text-heading text-center leading-snug">
          What brings you here today?
        </p>
        <div className="mb-5" />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChooseIntent("buy")}
            className={`flex-1 rounded-2xl border-2 p-4 text-center transition ${
              chosenIntent === "buy"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-white hover:border-primary/40"
            }`}
          >
            <div className="text-2xl mb-1" aria-hidden>
              {"\u{1F3E0}"}
            </div>
            <div className="text-sm font-bold text-text-heading">Buy</div>
            <div className="text-[10px] text-text-muted mt-0.5">Find a home</div>
          </button>
          <button
            type="button"
            onClick={() => onChooseIntent("sell")}
            className={`flex-1 rounded-2xl border-2 p-4 text-center transition ${
              chosenIntent === "sell"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-white hover:border-primary/40"
            }`}
          >
            <div className="text-2xl mb-1" aria-hidden>
              {"\u{1F4B0}"}
            </div>
            <div className="text-sm font-bold text-text-heading">Sell</div>
            <div className="text-[10px] text-text-muted mt-0.5">List your property</div>
          </button>
        </div>
        {validationError ? (
          <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-4">
            {validationError}
          </div>
        ) : null}
        {footer("Continue", onForward, false)}
      </div>
    );
  }

  const scrollBody = (title, children) => (
    <div className="flex-1 px-5 pb-4 pt-2 bg-background-light flex flex-col min-h-0">
      <div className="mb-3 shrink-0 w-full">
        <StepSegmentBar steps={ONBOARDING_BAR_STEPS} activeIndex={barStepIndex} />
      </div>
      <div className="text-sm font-bold text-text-heading mb-1">
        {title}
        {chosenIntent ? <IntentBadge isBuy={isBuy} /> : null}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-left">{children}</div>
        {validationError ? (
          <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2 shrink-0">
            {validationError}
          </div>
        ) : null}
      </div>
      {footer(step === "reach" ? startActionLabel : "Continue", step === "reach" ? onStartChat : onForward, step === "reach")}
    </div>
  );

  if (step === "contact") {
    return scrollBody(
      "Personal information",
      <>
        <div className={sectionCls}>Contact</div>
        <div className="col-span-2 space-y-2.5">
          <div className={fieldStackCls}>
            <RequiredLabel>Full name</RequiredLabel>
            <input
              className={inputCls}
              value={draft.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="John Smith"
              autoComplete="name"
            />
          </div>
          <div className={infoSectionStackCls}>
            <div className={fieldStackCls}>
              <RequiredLabel>Phone</RequiredLabel>
              <PhoneNumberField
                name="phone"
                value={draft.phone}
                onChange={(value) => onFieldChange("phone", value)}
                variant="chat"
                autoComplete="tel"
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Email</RequiredLabel>
              <input
                type="email"
                className={inputCls}
                value={draft.email}
                onChange={(e) => onFieldChange("email", sanitizeEmailInput(e.target.value))}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </>,
    );
  }

  if (step === "property") {
    return scrollBody(
      isBuy ? "What are you looking for?" : "Your listing",
      isBuy ? (
        <>
          <div className={sectionCls}>Property requirements</div>
          <div className="col-span-2 flex flex-col gap-1">
            <RequiredLabel>Where are you looking?</RequiredLabel>
            <input
              className={inputCls}
              value={draft.location}
              onChange={(e) => onFieldChange("location", e.target.value)}
              placeholder="City, neighbourhood, zip…"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <RequiredLabel>Where you are looking to find your dream house?</RequiredLabel>
            <input
              className={inputCls}
              value={draft.buy_property_location}
              onChange={(e) => onFieldChange("buy_property_location", e.target.value)}
              placeholder="City, neighbourhood, zip…"
            />
          </div>
          <div className={pairGridCls}>
            <div className={fieldStackCls}>
              <RequiredLabel>Budget</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.budget}
                onChange={(v) => onFieldChange("budget", v)}
                placeholder="Select…"
                options={BUDGET_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Property type</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.property_type}
                onChange={(v) => onFieldChange("property_type", v)}
                placeholder="Select…"
                options={PROPERTY_TYPE_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Bedrooms</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.beds}
                onChange={(v) => onFieldChange("beds", v)}
                placeholder="Select…"
                options={BED_BATH_SELECT_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Bathrooms</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.baths}
                onChange={(v) => onFieldChange("baths", v)}
                placeholder="Select…"
                options={BED_BATH_SELECT_OPTIONS}
              />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <RequiredLabel>Must-have features</RequiredLabel>
            <input
              className={inputCls}
              value={draft.must_have_features}
              onChange={(e) => onFieldChange("must_have_features", e.target.value)}
              placeholder="e.g. pool, garage"
            />
          </div>
          <div className={pairGridCls}>
            <div className={fieldStackCls}>
              <RequiredLabel>Parking required?</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.parking_required}
                onChange={(v) => onFieldChange("parking_required", v)}
                placeholder="Select…"
                options={YES_NO_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Backyard needed?</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.backyard_needed}
                onChange={(v) => onFieldChange("backyard_needed", v)}
                placeholder="Select…"
                options={YES_NO_OPTIONS}
              />
            </div>
            <div className={`${fieldStackCls} sm:col-span-2`}>
              <RequiredLabel>School district important?</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.school_district_important}
                onChange={(v) => onFieldChange("school_district_important", v)}
                placeholder="Select…"
                options={YES_NO_OPTIONS}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={sectionCls}>Property details</div>
          <div className="col-span-2 flex flex-col gap-1">
            <RequiredLabel>Property address</RequiredLabel>
            <input
              className={inputCls}
              value={draft.address}
              onChange={(e) => onFieldChange("address", e.target.value)}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div className={pairGridCls}>
            <div className={fieldStackCls}>
              <RequiredLabel>Expected price</RequiredLabel>
              <input
                className={inputCls}
                value={draft.price}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) =>
                  onFieldChange("price", String(e.target.value || "").replace(/\D/g, ""))
                }
                placeholder="e.g. 550000"
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Property type</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.property_type}
                onChange={(v) => onFieldChange("property_type", v)}
                placeholder="Select…"
                options={PROPERTY_TYPE_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Bedrooms</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.beds}
                onChange={(v) => onFieldChange("beds", v)}
                placeholder="Select…"
                options={BED_BATH_SELECT_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Bathrooms</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.baths}
                onChange={(v) => onFieldChange("baths", v)}
                placeholder="Select…"
                options={BED_BATH_SELECT_OPTIONS}
              />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <RequiredLabel>Key features</RequiredLabel>
            <input
              className={inputCls}
              value={draft.must_have_features}
              onChange={(e) => onFieldChange("must_have_features", e.target.value)}
              placeholder="e.g. garage, pool"
            />
          </div>
          <div className="col-span-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-text-heading">
                  Property photos <span className="text-red-500">*</span>
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Upload at least one image, up to 8. These will appear only on this seller lead.
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-primary">
                {sellerImageFiles.length}/8
              </span>
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-3 py-2 text-[11px] font-semibold text-text-heading hover:border-primary/50">
              Choose images
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={propertyImagesUploading}
                onChange={(e) =>
                  onPropertyImageFilesChange?.(Array.from(e.target.files || []).slice(0, 8))
                }
              />
            </label>
            {sellerImagePreviews.length ? (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {sellerImagePreviews.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="relative overflow-hidden rounded-xl border border-border bg-white">
                    <Image
                      src={item.url}
                      alt={item.name}
                      width={120}
                      height={80}
                      unoptimized
                      className="h-14 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {sellerImageFiles.length ? (
              <button
                type="button"
                onClick={() => onPropertyImageFilesChange?.([])}
                className="mt-2 text-[10px] font-semibold text-text-muted hover:text-text-heading"
              >
                Remove selected images
              </button>
            ) : null}
          </div>
          <div className={pairGridCls}>
            <div className={fieldStackCls}>
              <RequiredLabel>Parking?</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.parking_required}
                onChange={(v) => onFieldChange("parking_required", v)}
                placeholder="Select…"
                options={YES_NO_OPTIONS}
              />
            </div>
            <div className={fieldStackCls}>
              <RequiredLabel>Backyard?</RequiredLabel>
              <ChatSelect
                triggerClassName={`${inputCls} cursor-pointer`}
                value={draft.backyard_needed}
                onChange={(v) => onFieldChange("backyard_needed", v)}
                placeholder="Select…"
                options={YES_NO_OPTIONS}
              />
            </div>
          </div>
        </>
      ),
    );
  }

  if (step === "qualify") {
    return scrollBody(
      "A few more questions",
      <>
        <div className={sectionCls}>Qualification</div>
        <div className={pairGridCls}>
          <div className={fieldStackCls}>
            <RequiredLabel>Timeline</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.timeline}
              onChange={(v) => onFieldChange("timeline", v)}
              placeholder="Select…"
              options={TIMELINE_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>Mortgage status</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.mortgage_status}
              onChange={(v) => onFieldChange("mortgage_status", v)}
              placeholder="Select…"
              options={MORTGAGE_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>Working with a realtor?</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.realtor_status}
              onChange={(v) => onFieldChange("realtor_status", v)}
              placeholder="Select…"
              options={REALTOR_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>What&apos;s driving your move?</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.motivation_reason}
              onChange={(v) => onFieldChange("motivation_reason", v)}
              placeholder="Select…"
              options={MOTIVATION_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>Ready to view properties?</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.viewing_readiness}
              onChange={(v) => onFieldChange("viewing_readiness", v)}
              placeholder="Select…"
              options={VIEWING_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>Current living situation</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.living_situation}
              onChange={(v) => onFieldChange("living_situation", v)}
              placeholder="Select…"
              options={LIVING_OPTIONS}
            />
          </div>
          <div className={`${fieldStackCls} sm:col-span-2`}>
            <RequiredLabel>Ready to make an offer?</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.urgency_readiness}
              onChange={(v) => onFieldChange("urgency_readiness", v)}
              placeholder="Select…"
              options={URGENCY_OPTIONS}
            />
          </div>
        </div>
      </>,
    );
  }

  if (step === "reach") {
    return scrollBody(
      "Almost there",
      <>
        <div className={sectionCls}>Contact preferences</div>
        <div className={pairGridCls}>
          <div className={fieldStackCls}>
            <RequiredLabel>Preferred contact method</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.preferred_contact_method}
              onChange={(v) => onFieldChange("preferred_contact_method", v)}
              placeholder="Select…"
              options={CONTACT_METHOD_OPTIONS}
            />
          </div>
          <div className={fieldStackCls}>
            <RequiredLabel>Best time to contact</RequiredLabel>
            <ChatSelect
              triggerClassName={`${inputCls} cursor-pointer`}
              value={draft.best_time_to_contact}
              onChange={(v) => onFieldChange("best_time_to_contact", v)}
              placeholder="Anytime"
              options={BEST_TIME_OPTIONS}
            />
          </div>
        </div>
      </>,
    );
  }

  return null;
}
