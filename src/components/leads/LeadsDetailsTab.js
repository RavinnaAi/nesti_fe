"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, XCircle } from "lucide-react";
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
}) {
  const [showCalendlyCancelModal, setShowCalendlyCancelModal] = useState(false);
  const [calendlyCancelSubmitting, setCalendlyCancelSubmitting] = useState(false);

  useEffect(() => {
    if (!showCalendlyCancelModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showCalendlyCancelModal]);

  useEffect(() => {
    if (!showCalendlyCancelModal) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !calendlyCancelSubmitting && !cancelCalendlyPending) {
        setShowCalendlyCancelModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCalendlyCancelModal, calendlyCancelSubmitting, cancelCalendlyPending]);

  const leadData = lead && typeof lead === "object" ? lead : {};
  const profRole = leadData.professional_type;
  const hideBuyerSellerIntent = profRole === "lawyer" || profRole === "mortgage_broker";
  const isLawyerLead = profRole === "lawyer";
  const isMortgageBrokerLead = profRole === "mortgage_broker";
  const property = leadData.property || {};
  const qualification = leadData.qualification || {};
  const conversion = leadData.conversion || {};

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
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

  const displayField = (v) => formatLeadIntakeSlug(v) || readable(v);

  const KeyValue = ({ label, value }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-xs font-normal text-text-heading mt-0.5 break-words">{displayField(value)}</div>
    </div>
  );


  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {!isLawyerLead && !isMortgageBrokerLead && getConversationMeta(selectedConversation).isMatched === true ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-50 text-green-700 border border-green-200 font-semibold shadow-sm">
                <CheckCircle2 size={14} />
                Matched Lead
              </span>
            ) : !isLawyerLead &&
              !isMortgageBrokerLead &&
              getConversationMeta(selectedConversation).isMatched === false ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-200 text-red-700 border border-red-200 font-semibold shadow-sm">
                <XCircle size={14} />
                Mismatched Lead
              </span>
            ) : null}
          </div>

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
              <div className="rounded-md border border-border bg-white p-4 space-y-3">
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

              <div className="rounded-md border border-border bg-white p-4 space-y-3">
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
              <div className="rounded-md border border-border bg-white p-4 space-y-3">
                <div className="text-sm font-semibold text-text-heading">Property & goals</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Location / area" value={property.location} />
                  <KeyValue label="Address" value={property.address} />
                  <KeyValue label="Budget" value={budgetDisplay} />
                  <KeyValue label="Timeline" value={property.timeline} />
                  <KeyValue label="Lead type" value={leadData.lead_type} />
                </div>
              </div>

              <div className="rounded-md border border-border bg-white p-4 space-y-3">
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
              <div className="rounded-md border border-border bg-white p-4 space-y-3">
                <div className="text-sm font-semibold text-text-heading">Property</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {hideBuyerSellerIntent ? null : <KeyValue label="Intent" value={leadData.intent} />}
                  <KeyValue label="Location" value={property.location} />
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

              <div className="rounded-md border border-border bg-white p-4 space-y-3">
                <div className="text-sm font-semibold text-text-heading">Qualification</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
                  <KeyValue label="Realtor status" value={qualification.realtor_status} />
                  <KeyValue label="Motivation" value={qualification.motivation_reason} />
                  <KeyValue label="Viewing readiness" value={qualification.viewing_readiness} />
                  <KeyValue label="Living situation" value={qualification.living_situation} />
                  <KeyValue label="Urgency readiness" value={qualification.urgency_readiness} />
                  <KeyValue label="Lead type" value={leadData.lead_type} />
                </div>
              </div>
            </>
          )}

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">
              {isLawyerLead || isMortgageBrokerLead ? "Booking & follow-up" : "Conversion & trust"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <KeyValue label="Appointment status" value={appointmentStatus} />
              <KeyValue label="Primary outcome" value={conversion?.outcome?.primary_outcome} />
              <KeyValue label="Alert" value={conversion?.alert?.title} />
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

        </>
      ) : (
        <div className="text-sm text-text-muted">Choose a lead to view details.</div>
      )}

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
