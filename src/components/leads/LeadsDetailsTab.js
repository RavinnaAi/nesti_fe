"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Info, X, XCircle } from "lucide-react";
import { formatLeadIntakeSlug } from "@/lib/leadsPageUtils";

export default function LeadsDetailsTab({
  selectedConversation,
  lead,
  messageMeta,
  getConversationMeta,
  conversationMeta,
  formatMetaEntries,
  onOpenMeta,
  onCancelCalendlyAppointment,
  cancelCalendlyPending = false,
  inquiredPropertyAddress = "",
  embedded = false,
}) {
  const [showCalendlyCancelModal, setShowCalendlyCancelModal] = useState(false);
  const [calendlyCancelSubmitting, setCalendlyCancelSubmitting] = useState(false);

  const leadData = lead && typeof lead === "object" ? lead : {};
  const profRole = leadData.professional_type;
  const hideBuyerSellerIntent = profRole === "lawyer" || profRole === "mortgage_broker";
  const isLawyerLead = profRole === "lawyer";
  const isMortgageBrokerLead = profRole === "mortgage_broker";
  const property = leadData.property || {};
  const propertyImages = Array.isArray(property.images)
    ? property.images.filter((img) => img?.secure_url || img?.url)
    : [];
  const qualification = leadData.qualification || {};
  const conversionFunnel = leadData.conversion_funnel || {};
  const decisionSupport = leadData.decision_support || {};
  const trust = leadData.trust || {};
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const previewImage =
    previewImageIndex != null && propertyImages[previewImageIndex]
      ? propertyImages[previewImageIndex]
      : null;
  const isAgentSellerLead =
    !isLawyerLead &&
    !isMortgageBrokerLead &&
    (String(leadData.intent || "").toLowerCase() === "sell" ||
      /seller|sell/.test(String(leadData.lead_type || "").toLowerCase()));
  const isInquiredPropertyInlineView = Boolean(inquiredPropertyAddress);
  const outerClassName = embedded ? "space-y-4" : "rounded-md border border-border bg-white shadow-sm p-5 space-y-4";
  const sectionClassName = embedded ? "space-y-3 border-t border-border/60 pt-4" : "rounded-md border border-border bg-white p-4 space-y-3";
  const roleClosedLabels = {
    converted: isLawyerLead ? "Matter retained" : isMortgageBrokerLead ? "Funded" : "Closed — won",
    closed_lost: isLawyerLead ? "Matter lost" : "Closed — lost",
  };

  const closePreview = useCallback(() => setPreviewImageIndex(null), []);
  const goPreviewPrev = useCallback(() =>
    setPreviewImageIndex((idx) => {
      if (idx == null || propertyImages.length < 2) return idx;
      return (idx - 1 + propertyImages.length) % propertyImages.length;
    }), [propertyImages.length]);
  const goPreviewNext = useCallback(() =>
    setPreviewImageIndex((idx) => {
      if (idx == null || propertyImages.length < 2) return idx;
      return (idx + 1) % propertyImages.length;
    }), [propertyImages.length]);
  const triggerImageDownload = (url, filename = "property-image") => {
    const link = String(url || "").trim();
    if (!/^https?:\/\//i.test(link)) return;
    const a = document.createElement("a");
    a.href = link.includes("/image/upload/")
      ? link.replace("/image/upload/", "/image/upload/fl_attachment/")
      : link;
    a.download = filename || "property-image";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    if (!showCalendlyCancelModal && !previewImage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showCalendlyCancelModal, previewImage]);

  useEffect(() => {
    if (!showCalendlyCancelModal && !previewImage) return;
    const onKey = (e) => {
      if (e.key === "Escape" && previewImage) {
        closePreview();
        return;
      }
      if (e.key === "ArrowLeft" && previewImage) goPreviewPrev();
      if (e.key === "ArrowRight" && previewImage) goPreviewNext();
      if (e.key === "Escape" && !calendlyCancelSubmitting && !cancelCalendlyPending) {
        setShowCalendlyCancelModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    showCalendlyCancelModal,
    previewImage,
    goPreviewPrev,
    goPreviewNext,
    closePreview,
    calendlyCancelSubmitting,
    cancelCalendlyPending,
  ]);

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const token = String(value).trim().toLowerCase().replace(/\s+/g, "_");
    const mortgageTokenMap = {
      "20_plus": "20%+",
      "10_19": "10-19%",
      "5_9": "5-9%",
      "under_5": "Under 5%",
      "no_savings": "No savings yet",
    };
    if (mortgageTokenMap[token]) return mortgageTokenMap[token];
    const raw = String(value).replace(/_/g, " ").trim();
    if (!raw) return "—";
    // Keep email/phone/number-like values as-is.
    if (raw.includes("@") || /^\+?[\d\s\-()]+$/.test(raw)) return raw;
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const toFiniteNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const raw = String(value).replace(/[^0-9.-]/g, "").trim();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const extractRangeNumbers = (value) => {
    if (value === null || value === undefined) return null;
    const matches = String(value).match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) return null;
    const low = Number(matches[0]);
    const high = Number(matches[1]);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
    return low <= high ? [low, high] : [high, low];
  };

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const budgetDisplay = (() => {
    const conversionProperty = leadData?.conversion?.property || {};
    const min =
      toFiniteNumber(conversionProperty?.min_budget) ??
      toFiniteNumber(leadData?.budget_profile?.min_budget) ??
      toFiniteNumber(property?.min_budget) ??
      toFiniteNumber(property?.budget_min);
    const max =
      toFiniteNumber(conversionProperty?.max_budget) ??
      toFiniteNumber(leadData?.budget_profile?.max_budget) ??
      toFiniteNumber(property?.max_budget) ??
      toFiniteNumber(property?.budget_max);
    if (min !== null && max !== null) return `${formatMoney(min)} - ${formatMoney(max)}`;
    if (min !== null) return formatMoney(min);
    if (max !== null) return formatMoney(max);
    const slugTry =
      formatLeadIntakeSlug(property?.budget) ||
      formatLeadIntakeSlug(property?.price) ||
      formatLeadIntakeSlug(conversionProperty?.budget) ||
      formatLeadIntakeSlug(conversionProperty?.price) ||
      formatLeadIntakeSlug(leadData?.budget) ||
      formatLeadIntakeSlug(leadData?.price);
    if (slugTry) return slugTry;
    const single =
      toFiniteNumber(conversionProperty?.budget) ??
      toFiniteNumber(conversionProperty?.price) ??
      toFiniteNumber(property?.budget) ??
      toFiniteNumber(property?.price) ??
      toFiniteNumber(leadData?.budget) ??
      toFiniteNumber(leadData?.price);
    if (single !== null) return formatMoney(single);
    const range = extractRangeNumbers(
      conversionProperty?.budget ??
        conversionProperty?.price ??
        property?.budget ??
        property?.price ??
        leadData?.budget ??
        leadData?.price
    );
    return range ? `${formatMoney(range[0])} - ${formatMoney(range[1])}` : "—";
  })();

  const appointmentStatus = leadData.appointment_status || "—";
  const responseWindowText = conversionFunnel.response_window_minutes
    ? `${conversionFunnel.response_window_minutes} minutes`
    : "";
  const primaryOutcome =
    conversionFunnel.stage ||
    leadData.conversion?.outcome?.primary_outcome ||
    "—";
  const conversionAlert = conversionFunnel.sla_at_risk
    ? `SLA at risk - respond within ${responseWindowText || "the recommended window"}`
    : conversionFunnel.urgency
      ? `${conversionFunnel.urgency}${responseWindowText ? ` - respond within ${responseWindowText}` : ""}`
      : leadData.conversion?.alert?.title || "—";
  const hasPrimaryOutcome = String(primaryOutcome || "").trim() && String(primaryOutcome).trim() !== "—";
  const hasConversionAlert = String(conversionAlert || "").trim() && String(conversionAlert).trim() !== "—";
  const showOutcomeAlertForRole = !isLawyerLead && !isMortgageBrokerLead;

  const displayField = (v) => formatLeadIntakeSlug(v) || readable(v);

  const KeyValue = ({ label, value }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-xs font-normal text-text-heading mt-0.5 break-words">{displayField(value)}</div>
    </div>
  );


  const closeSummary = leadData.close_summary;
  const lawyerCloseChecklistLabels = {
    transaction_type: "Transaction type",
    property_or_legal_matter: "Property or legal matter",
    closing_date: "Closing date",
    agreement_and_docs_received: "Agreement and required docs",
    outstanding_legal_requirements: "Outstanding legal requirements",
    next_step: "Next step",
  };
  const mortgageCloseChecklistLabels = {
    client_ready_to_move_forward: "Client ready to move forward",
    property_value_and_mortgage_need: "Property value and mortgage amount",
    financing_status: "Pre-approval / financing status",
    income_docs_ready: "Income and document readiness",
    funding_timeline: "Expected funding timeline",
    next_step: "Next step",
  };
  const agentCloseChecklistLabels = {
    client_ready_to_proceed: "Client ready to proceed",
    property_identified: "Property identified",
    price_captured: "Purchase/sale price",
    target_closing_date: "Target closing date",
    remaining_conditions: "Remaining conditions",
    next_step: "Next step",
  };
  const roleCloseChecklistLabels = isLawyerLead
    ? lawyerCloseChecklistLabels
    : isMortgageBrokerLead
      ? mortgageCloseChecklistLabels
      : agentCloseChecklistLabels;
  const roleCloseChecklistRaw = isLawyerLead
    ? closeSummary?.lawyer_closing_checklist
    : isMortgageBrokerLead
      ? closeSummary?.mortgage_closing_checklist
      : closeSummary?.agent_closing_checklist;
  const roleCloseChecklistEntries =
    roleCloseChecklistRaw && typeof roleCloseChecklistRaw === "object"
      ? Object.entries(roleCloseChecklistRaw)
          .filter(([key, value]) => roleCloseChecklistLabels[key] && String(value || "").trim())
          .map(([key, value]) => ({
            key,
            label: roleCloseChecklistLabels[key],
            value: String(value || "").trim(),
          }))
      : [];

  const closeSummaryBanner = (() => {
    if (!closeSummary) return null;
    const isWon = closeSummary.status === "converted";
    const closedLabel = roleClosedLabels[closeSummary.status] || (isWon ? "Closed — won" : "Closed — lost");
    const reopened = Boolean(closeSummary.reopened_at);
    const reasonLabel = closeSummary.reason
      ? String(closeSummary.reason).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : null;
    const closedDate = closeSummary.closed_at
      ? new Date(closeSummary.closed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null;
    const valueDisplay = closeSummary.value != null && Number(closeSummary.value) > 0
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(closeSummary.value)
      : null;

    return (
      <div className={`rounded-lg border p-3.5 ${
        reopened
          ? "border-border/60 bg-slate-50/50"
          : isWon
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50/60"
      }`}>
        <div className="flex items-center gap-2">
          {isWon ? (
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${reopened ? "text-slate-400" : "text-emerald-600"}`} />
          ) : (
            <XCircle className={`w-4 h-4 shrink-0 ${reopened ? "text-slate-400" : "text-slate-600"}`} />
          )}
          <span className={`text-sm font-semibold ${reopened ? "text-text-muted line-through" : "text-text-heading"}`}>
            {closedLabel}
          </span>
          {reopened && (
            <span className="ml-1 text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Reopened
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
          {reasonLabel && <span>Reason: <span className="font-medium text-text-heading">{reasonLabel}</span></span>}
          {valueDisplay && <span>Value: <span className="font-medium text-text-heading">{valueDisplay}</span></span>}
          {closeSummary.closed_by_label && closedDate && (
            <span>By {closeSummary.closed_by_label} on {closedDate}</span>
          )}
        </div>
        {roleCloseChecklistEntries.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {roleCloseChecklistEntries.map((entry) => (
              <div key={entry.key} className="rounded-md border border-border/60 bg-white/70 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wide text-text-muted">{entry.label}</div>
                <div className="mt-0.5 text-xs text-text-heading leading-relaxed break-words">{entry.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  })();

  const qualificationSection = (
    <div className={sectionClassName}>
      <div className="text-sm font-semibold text-text-heading">Qualification</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
        <KeyValue label="Realtor status" value={qualification.realtor_status} />
        <KeyValue label="Motivation" value={qualification.motivation_reason} />
        <KeyValue label="Viewing readiness" value={qualification.viewing_readiness} />
        <KeyValue label="Living situation" value={qualification.living_situation} />
        <KeyValue label="Urgency readiness" value={qualification.urgency_readiness} />
        <KeyValue label="Address" value={qualification.buy_property_location} />
        <KeyValue label="Lead type" value={leadData.lead_type} />
      </div>
    </div>
  );

  const conversionTrustSection = (
    <div className={sectionClassName}>
      <div className="text-sm font-semibold text-text-heading">
        {isLawyerLead || isMortgageBrokerLead ? "Booking & follow-up" : "Conversion & trust"}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <KeyValue label="Appointment status" value={appointmentStatus} />
        {showOutcomeAlertForRole || hasPrimaryOutcome ? (
          <KeyValue label="Primary outcome" value={primaryOutcome} />
        ) : null}
        {showOutcomeAlertForRole || hasConversionAlert ? (
          <KeyValue label="Alert" value={conversionAlert} />
        ) : null}
      </div>
      {String(appointmentStatus).toLowerCase() === "booked" &&
      typeof onCancelCalendlyAppointment === "function" ? (
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          <button
            type="button"
            disabled={cancelCalendlyPending || calendlyCancelSubmitting}
            onClick={() => setShowCalendlyCancelModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelCalendlyPending || calendlyCancelSubmitting
              ? "Canceling…"
              : "Cancel Calendly appointment"}
          </button>
          <p className="text-[11px] text-text-muted leading-snug">
            Cancels the scheduled event via Calendly (1:1 events). Some group-style events may
            need to be managed in Calendly.
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={outerClassName}>
      {closeSummaryBanner}
      {selectedConversation ? (
        <>
          {formatMetaEntries(conversationMeta).length > 0 ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/10">
              <div className="text-xs font-bold text-text-heading flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Conversation Metadata
              </div>
              <button
                onClick={() => onOpenMeta("Conversation Metadata", conversationMeta)}
                className="p-1.5 rounded-md bg-white border border-primary/20 text-primary hover:bg-primary/5 transition-colors shadow-sm"
              >
                <Info size={14} />
              </button>
            </div>
          ) : null}

          {formatMetaEntries(messageMeta).length > 0 ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-indigo-50 border border-indigo-100/50">
              <div className="text-xs font-bold text-indigo-700/80 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Latest AI Message Insights
              </div>
              <button
                onClick={() => onOpenMeta("Latest AI Message Insights", messageMeta)}
                className="p-1.5 rounded-md bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <Info size={14} />
              </button>
            </div>
          ) : null}

          {isLawyerLead ? (
            <>
              <div className={sectionClassName}>
                <div className="text-sm font-semibold text-text-heading">Property & timing</div>
                <p className="text-[11px] text-text-muted leading-snug">
                  From the chat intake — use with the legal qualification below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Property address" value={property.address} />
                  <KeyValue
                    label="Budget (reference)"
                    value={budgetDisplay !== "—" ? budgetDisplay : readable(property.budget)}
                  />
                  <KeyValue label="Closing timeline" value={qualification.closing_timeline} />
                  <KeyValue label="Lead type" value={leadData.lead_type} />
                </div>
              </div>

              <div className={sectionClassName}>
                <div className="text-sm font-semibold text-text-heading">Legal intake</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Transaction stage" value={qualification.transaction_stage} />
                  <KeyValue label="Transaction type" value={qualification.transaction_type} />
                  <KeyValue label="Property value" value={qualification.property_value} />
                  <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
                  <KeyValue label="Realtor involved" value={qualification.realtor_involved} />
                  <KeyValue label="First-time buyer" value={qualification.first_time_buyer} />
                  <KeyValue label="Legal services" value={qualification.legal_services_needed} />
                </div>
              </div>
            </>
          ) : isMortgageBrokerLead ? (
            <>
              <div className={sectionClassName}>
                <div className="text-sm font-semibold text-text-heading">Property & goals</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Location / area" value={property.location} />
                  <KeyValue label="Address" value={property.address} />
                  <KeyValue label="Budget" value={budgetDisplay} />
                  <KeyValue label="Timeline" value={property.timeline} />
                  <KeyValue label="Lead type" value={leadData.lead_type} />
                </div>
              </div>

              <div className={sectionClassName}>
                <div className="text-sm font-semibold text-text-heading">Mortgage qualification</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Mortgage timeline" value={qualification.mortgage_timeline} />
                  <KeyValue label="Pre-approval" value={qualification.pre_approval_status} />
                  <KeyValue label="Credit range" value={qualification.credit_score_range} />
                  <KeyValue label="Employment" value={qualification.employment_status} />
                  <KeyValue label="Household income" value={qualification.household_income} />
                  <KeyValue label="Down payment" value={qualification.down_payment_readiness} />
                  <KeyValue label="Purchase purpose" value={qualification.purchase_purpose} />
                  <KeyValue label="Urgency" value={qualification.urgency_signal} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={sectionClassName}>
                <div className="text-sm font-semibold text-text-heading">Property</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {isInquiredPropertyInlineView ? (
                    <KeyValue label="Address" value={inquiredPropertyAddress} />
                  ) : (
                    <>
                      {hideBuyerSellerIntent ? null : <KeyValue label="Intent" value={leadData.intent} />}
                      <KeyValue label="Location" value={property.location} />
                    </>
                  )}
                  <KeyValue label="Budget" value={budgetDisplay} />
                  <KeyValue label="Timeline" value={property.timeline} />
                  <KeyValue label="Type" value={property.property_type} />
                  <KeyValue label="Bedrooms" value={property.bedrooms} />
                  <KeyValue label="Bathrooms" value={property.bathrooms} />
                  <KeyValue label="Parking required" value={property.parking_required} />
                  <KeyValue label="Backyard needed" value={property.backyard_needed} />
                  <KeyValue label="Must-have features" value={property.must_have_features} />
                </div>
              </div>

              {isInquiredPropertyInlineView ? qualificationSection : null}

              {isAgentSellerLead && propertyImages.length ? (
                <div className={sectionClassName}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-text-heading">Property photos</div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Uploaded by the seller during lead intake.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      {propertyImages.length} image{propertyImages.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {propertyImages.map((img, index) => {
                      const src = img.secure_url || img.url;
                      return (
                        <button
                          type="button"
                          key={`${img.public_id || src}-${index}`}
                          onClick={() => setPreviewImageIndex(index)}
                          className="group overflow-hidden rounded-xl border border-border bg-background-light"
                        >
                          <Image
                            src={src}
                            alt={img.original_filename || `Seller property image ${index + 1}`}
                            width={320}
                            height={180}
                            className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!isInquiredPropertyInlineView ? qualificationSection : null}
            </>
          )}

          {!isInquiredPropertyInlineView ? conversionTrustSection : null}

        </>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center px-3 py-6">
          <div className="w-full max-w-sm rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center shadow-sm">
            <span className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Info size={16} />
            </span>
            <p className="text-sm font-semibold text-text-heading">Choose a lead to view details</p>
            <p className="mt-1 text-xs text-text-muted">
              Pick a lead to see qualification, property context, and conversion signals.
            </p>
          </div>
        </div>
      )}

      {previewImage && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-y-0 left-0 right-0 z-[135] flex items-center justify-center bg-background-light/80 p-3 backdrop-blur-[1px] sm:p-6 lg:left-60"
              role="dialog"
              aria-modal="true"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closePreview();
              }}
            >
              <div
                className="mx-auto flex h-[78vh] min-h-[420px] max-h-[760px] w-[min(1120px,96vw)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.20)]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
                  <div className="min-w-0 truncate text-xs font-semibold text-text-heading sm:text-sm">
                    {previewImage.original_filename || `Property image ${previewImageIndex + 1}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        triggerImageDownload(
                          previewImage.secure_url || previewImage.url,
                          previewImage.original_filename || "property-image"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-text-heading transition hover:bg-background-light"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={closePreview}
                      className="inline-flex rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold text-text-muted transition hover:bg-background-light hover:text-text-heading"
                      aria-label="Close image preview"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="relative flex min-h-0 flex-1 items-center justify-center bg-background-light/70 p-2 sm:p-4">
                  {propertyImages.length > 1 ? (
                    <button
                      type="button"
                      onClick={goPreviewPrev}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-white/95 p-2 text-text-heading shadow transition hover:bg-background-light"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  ) : null}
                  <Image
                    src={previewImage.secure_url || previewImage.url}
                    alt={previewImage.original_filename || "Property image preview"}
                    width={1280}
                    height={820}
                    className="h-full w-full object-contain"
                  />
                  {propertyImages.length > 1 ? (
                    <button
                      type="button"
                      onClick={goPreviewNext}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-white/95 p-2 text-text-heading shadow transition hover:bg-background-light"
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  ) : null}
                  {propertyImages.length > 1 ? (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-white/95 px-2 py-1 text-[10px] font-semibold text-text-heading shadow-sm">
                      {previewImageIndex + 1} / {propertyImages.length}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {showCalendlyCancelModal &&
      typeof document !== "undefined" &&
      typeof onCancelCalendlyAppointment === "function"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !calendlyCancelSubmitting && !cancelCalendlyPending) {
                  setShowCalendlyCancelModal(false);
                }
              }}
            >
              <div
                className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-xl"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="lead-calendly-cancel-title"
                aria-describedby="lead-calendly-cancel-desc"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 id="lead-calendly-cancel-title" className="text-sm font-bold text-text-heading">
                  Cancel this meeting?
                </h3>
                <p id="lead-calendly-cancel-desc" className="mt-2 text-sm leading-relaxed text-text-body">
                  This removes the event in Calendly. The invitee is notified according to your Calendly
                  settings, and the lead is updated in Nesti.
                </p>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={calendlyCancelSubmitting || cancelCalendlyPending}
                    onClick={() => setShowCalendlyCancelModal(false)}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading transition hover:bg-background-light disabled:opacity-60"
                  >
                    Go back
                  </button>
                  <button
                    type="button"
                    disabled={calendlyCancelSubmitting || cancelCalendlyPending}
                    onClick={async () => {
                      setCalendlyCancelSubmitting(true);
                      try {
                        await onCancelCalendlyAppointment();
                        setShowCalendlyCancelModal(false);
                      } catch {
                        /* toast from parent mutation */
                      } finally {
                        setCalendlyCancelSubmitting(false);
                      }
                    }}
                    className="rounded-lg border border-red-200 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {calendlyCancelSubmitting || cancelCalendlyPending
                      ? "Canceling…"
                      : "Yes, cancel in Calendly"}
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
