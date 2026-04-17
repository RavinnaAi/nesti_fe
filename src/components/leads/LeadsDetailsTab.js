"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";

export default function LeadsDetailsTab({
  selectedConversation,
  lead,
  messageMeta,
  getConversationMeta,
  conversationMeta,
  formatMetaEntries,
  onOpenMeta,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
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

  const KeyValue = ({ label, value }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-xs font-normal text-text-heading mt-0.5 break-words">{readable(value)}</div>
    </div>
  );


  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {getConversationMeta(selectedConversation).isMatched === true ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-50 text-green-700 border border-green-200 font-semibold shadow-sm">
                <CheckCircle2 size={14} />
                Matched Lead
              </span>
            ) : getConversationMeta(selectedConversation).isMatched === false ? (
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

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">Property</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <KeyValue label="Intent" value={leadData.intent} />
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

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">Conversion & trust</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <KeyValue label="Appointment status" value={appointmentStatus} />
              <KeyValue label="Primary outcome" value={conversion?.outcome?.primary_outcome} />
              <KeyValue label="Alert" value={conversion?.alert?.title} />
            </div>
          </div>

        </>
      ) : (
        <div className="text-sm text-text-muted">Choose a lead to view details.</div>
      )}
    </div>
  );
}
