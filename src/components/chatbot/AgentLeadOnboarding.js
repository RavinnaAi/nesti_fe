"use client";

import { LEAD_STEP_LABELS, PRE_CHAT_STEPS } from "./agentLeadCapture";
import StepSegmentBar from "./StepSegmentBar";

const ONBOARDING_BAR_STEPS = PRE_CHAT_STEPS.map((key) => ({
  key,
  label: LEAD_STEP_LABELS[key],
}));

const inputCls =
  "w-full px-3 py-2 text-xs border border-border rounded-lg bg-white text-text-heading focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelCls = "text-[11px] font-semibold text-text-heading";
const sectionCls = "text-xs font-bold text-primary col-span-2 border-b border-border/80 pb-1 pt-1";

const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"];

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
}) {
  const isBuy = chosenIntent === "buy";
  const rawStepIndex = PRE_CHAT_STEPS.indexOf(step);
  const barStepIndex = rawStepIndex >= 0 ? rawStepIndex : 0;
  const stepNum = rawStepIndex >= 0 ? rawStepIndex + 1 : 1;
  const showBack = step !== "intent";

  const footer = (primaryLabel, primaryAction, primaryIsStart = false) => (
    <div
      className={`flex flex-wrap gap-2 items-center pt-3 mt-auto border-t border-border/60 bg-background-light shrink-0 ${
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
            className="px-4 py-2 text-xs rounded-full border border-border bg-white text-text-heading hover:bg-background-light"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={primaryIsStart ? onStartChat : onForward}
          className="px-5 py-2 text-xs rounded-full bg-primary text-white font-semibold hover:brightness-95"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );

  if (step === "intent") {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-6 bg-gradient-to-b from-indigo-50/80 to-background-light flex flex-col min-h-0">
        <div className="mb-4 shrink-0 w-full">
          <StepSegmentBar steps={ONBOARDING_BAR_STEPS} activeIndex={barStepIndex} />
        </div>
        <p className="text-sm font-bold text-text-heading text-center leading-snug">
          What brings you here today?
        </p>
        <p className="text-[11px] text-text-muted text-center mt-1 mb-5">Step {stepNum} of {PRE_CHAT_STEPS.length} · {LEAD_STEP_LABELS.intent}</p>
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

  const scrollBody = (title, subtitle, children) => (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-background-light flex flex-col min-h-0">
      <div className="mb-4 shrink-0 w-full">
        <StepSegmentBar steps={ONBOARDING_BAR_STEPS} activeIndex={barStepIndex} />
      </div>
      <div className="text-sm font-bold text-text-heading mb-1">
        {title}
        {chosenIntent ? <IntentBadge isBuy={isBuy} /> : null}
      </div>
      <p className="text-[11px] text-text-muted mb-3">
        Step {stepNum} of {PRE_CHAT_STEPS.length} · {subtitle}
      </p>
      <div className="grid grid-cols-2 gap-2.5 text-left flex-1 overflow-y-auto pr-1 min-h-0">{children}</div>
      {validationError ? (
        <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2 shrink-0">
          {validationError}
        </div>
      ) : null}
      {footer(step === "reach" ? "Start chat" : "Continue", step === "reach" ? onStartChat : onForward, step === "reach")}
    </div>
  );

  if (step === "contact") {
    return scrollBody(
      "Personal information",
      LEAD_STEP_LABELS.contact,
      <>
        <div className={sectionCls}>Contact</div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Full name *</label>
          <input
            className={inputCls}
            value={draft.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="John Smith"
            autoComplete="name"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Phone *</label>
          <input
            className={inputCls}
            value={draft.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            placeholder="+1 555 000 0000"
            autoComplete="tel"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Email *</label>
          <input
            type="email"
            className={inputCls}
            value={draft.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </>,
    );
  }

  if (step === "property") {
    return scrollBody(
      isBuy ? "What are you looking for?" : "Your listing",
      LEAD_STEP_LABELS.property,
      isBuy ? (
        <>
          <div className={sectionCls}>Property requirements</div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelCls}>Where are you looking?</label>
            <input
              className={inputCls}
              value={draft.location}
              onChange={(e) => onFieldChange("location", e.target.value)}
              placeholder="City, neighbourhood, zip…"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Budget</label>
            <input
              className={inputCls}
              value={draft.budget}
              onChange={(e) => onFieldChange("budget", e.target.value)}
              placeholder="e.g. $400K – $600K"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Property type</label>
            <select
              className={inputCls}
              value={draft.property_type}
              onChange={(e) => onFieldChange("property_type", e.target.value)}
            >
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Bedrooms</label>
            <select
              className={inputCls}
              value={draft.beds}
              onChange={(e) => onFieldChange("beds", e.target.value)}
            >
              <option value="">Any</option>
              {["1", "2", "3", "4", "5+"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Bathrooms</label>
            <select
              className={inputCls}
              value={draft.baths}
              onChange={(e) => onFieldChange("baths", e.target.value)}
            >
              <option value="">Any</option>
              {["1", "2", "3", "4", "5+"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelCls}>Must-have features</label>
            <input
              className={inputCls}
              value={draft.must_have_features}
              onChange={(e) => onFieldChange("must_have_features", e.target.value)}
              placeholder="e.g. pool, garage"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Parking required?</label>
            <select
              className={inputCls}
              value={draft.parking_required}
              onChange={(e) => onFieldChange("parking_required", e.target.value)}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Backyard needed?</label>
            <select
              className={inputCls}
              value={draft.backyard_needed}
              onChange={(e) => onFieldChange("backyard_needed", e.target.value)}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>School district important?</label>
            <select
              className={inputCls}
              value={draft.school_district_important}
              onChange={(e) => onFieldChange("school_district_important", e.target.value)}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div className={sectionCls}>Property details</div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelCls}>Property address</label>
            <input
              className={inputCls}
              value={draft.address}
              onChange={(e) => onFieldChange("address", e.target.value)}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Expected price</label>
            <input
              className={inputCls}
              value={draft.price}
              onChange={(e) => onFieldChange("price", e.target.value)}
              placeholder="e.g. $550,000"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Property type</label>
            <select
              className={inputCls}
              value={draft.property_type}
              onChange={(e) => onFieldChange("property_type", e.target.value)}
            >
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Bedrooms</label>
            <select
              className={inputCls}
              value={draft.beds}
              onChange={(e) => onFieldChange("beds", e.target.value)}
            >
              <option value="">Select…</option>
              {["1", "2", "3", "4", "5+"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Bathrooms</label>
            <select
              className={inputCls}
              value={draft.baths}
              onChange={(e) => onFieldChange("baths", e.target.value)}
            >
              <option value="">Select…</option>
              {["1", "2", "3", "4", "5+"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelCls}>Key features</label>
            <input
              className={inputCls}
              value={draft.must_have_features}
              onChange={(e) => onFieldChange("must_have_features", e.target.value)}
              placeholder="e.g. garage, pool"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Parking?</label>
            <select
              className={inputCls}
              value={draft.parking_required}
              onChange={(e) => onFieldChange("parking_required", e.target.value)}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className={labelCls}>Backyard?</label>
            <select
              className={inputCls}
              value={draft.backyard_needed}
              onChange={(e) => onFieldChange("backyard_needed", e.target.value)}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </>
      ),
    );
  }

  if (step === "qualify") {
    return scrollBody(
      "A few more questions",
      LEAD_STEP_LABELS.qualify,
      <>
        <div className={sectionCls}>Qualification</div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Timeline</label>
          <select
            className={inputCls}
            value={draft.timeline}
            onChange={(e) => onFieldChange("timeline", e.target.value)}
          >
            <option value="">Not sure yet</option>
            <option value="asap">ASAP / within 1 month</option>
            <option value="1-3 months">1 – 3 months</option>
            <option value="3-6 months">3 – 6 months</option>
            <option value="6-12 months">6 – 12 months</option>
            <option value="browsing">Just browsing</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Mortgage status</label>
          <select
            className={inputCls}
            value={draft.mortgage_status}
            onChange={(e) => onFieldChange("mortgage_status", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="fully_pre_approved">Yes – fully pre-approved</option>
            <option value="paying_cash">Paying cash</option>
            <option value="in_progress">Pre-approval in progress</option>
            <option value="not_yet">Not yet</option>
            <option value="unsure">Unsure</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Working with a realtor?</label>
          <select
            className={inputCls}
            value={draft.realtor_status}
            onChange={(e) => onFieldChange("realtor_status", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="no_agent">No – I need one</option>
            <option value="has_agent_but_open">Yes, but open to others</option>
            <option value="has_exclusive_agent">Yes – exclusively</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>What&apos;s driving your move?</label>
          <select
            className={inputCls}
            value={draft.motivation_reason}
            onChange={(e) => onFieldChange("motivation_reason", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="relocation">Relocation / job move</option>
            <option value="family_change">Growing family</option>
            <option value="divorce">Divorce</option>
            <option value="investment">Investment</option>
            <option value="upgrading">Upgrading to bigger home</option>
            <option value="downsizing">Downsizing</option>
            <option value="just_exploring">Just exploring</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Ready to view properties?</label>
          <select
            className={inputCls}
            value={draft.viewing_readiness}
            onChange={(e) => onFieldChange("viewing_readiness", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="asap">Yes – ASAP</option>
            <option value="few_weeks">Within a few weeks</option>
            <option value="maybe_later">Maybe later</option>
            <option value="just_browsing">Just browsing for now</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Current living situation</label>
          <select
            className={inputCls}
            value={draft.living_situation}
            onChange={(e) => onFieldChange("living_situation", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="renting">Renting</option>
            <option value="own_need_to_sell">Own – need to sell first</option>
            <option value="own_not_selling">Own – not selling</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Ready to make an offer?</label>
          <select
            className={inputCls}
            value={draft.urgency_readiness}
            onChange={(e) => onFieldChange("urgency_readiness", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="yes_immediately">Yes – immediately</option>
            <option value="maybe">Maybe</option>
            <option value="no">No – not yet</option>
          </select>
        </div>
      </>,
    );
  }

  if (step === "reach") {
    return scrollBody(
      "Almost there",
      LEAD_STEP_LABELS.reach,
      <>
        <div className={sectionCls}>Contact preferences</div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Preferred contact method</label>
          <select
            className={inputCls}
            value={draft.preferred_contact_method}
            onChange={(e) => onFieldChange("preferred_contact_method", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="phone">Phone call</option>
            <option value="text">Text / SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="video_call">Video call</option>
            <option value="in_person">In-person</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className={labelCls}>Best time to contact</label>
          <select
            className={inputCls}
            value={draft.best_time_to_contact}
            onChange={(e) => onFieldChange("best_time_to_contact", e.target.value)}
          >
            <option value="">Anytime</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
      </>,
    );
  }

  return null;
}
