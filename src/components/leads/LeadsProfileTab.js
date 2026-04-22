"use client";

import { getStatusDisplay } from "@/lib/leadPipelineConfig";

export default function LeadsProfileTab({
  selectedConversation,
  lead,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const contact = leadData.contact || {};
  const property = leadData.property || {};
  const qualification = leadData.qualification || {};

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const raw = String(value).replace(/_/g, " ").trim();
    if (!raw) return "—";
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

  const KeyValue = ({ label, value, noWrap = false }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={`text-xs font-normal text-text-heading mt-0.5 ${noWrap ? "truncate whitespace-nowrap" : "break-words"}`}
        title={noWrap ? readable(value) : undefined}
      >
        {readable(value)}
      </div>
    </div>
  );

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">User details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="lg:col-span-1">
                <KeyValue label="Full name" value={contact.full_name} />
              </div>
              <div className="lg:col-span-2">
                <KeyValue label="Email" value={contact.email} noWrap />
              </div>
              <div className="lg:col-span-1">
                <KeyValue label="Phone" value={contact.phone} noWrap />
              </div>
              <div className="lg:col-span-1">
                <KeyValue label="Preferred contact" value={contact.preferred_contact_method} />
              </div>
              <div className="lg:col-span-1">
                <KeyValue label="Best time to contact" value={contact.best_time_to_contact} />
              </div>
              <div className="lg:col-span-2">
                <KeyValue label="Location" value={property.location} />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">Lead context</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-text-muted">Pipeline stage</div>
                <div className="mt-1">
                  {(() => {
                    const info = getStatusDisplay(leadData.status ?? leadData.match_status);
                    return (
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${info.color}`}>
                        {info.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <KeyValue label="Intent" value={leadData.intent} />
              <KeyValue label="Lead type" value={leadData.lead_type} />
              <KeyValue label="Budget" value={budgetDisplay} />
              <KeyValue label="Timeline" value={property.timeline} />
              <KeyValue label="Property type" value={property.property_type} />
              <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
              <KeyValue label="Realtor status" value={qualification.realtor_status} />
              <KeyValue label="Motivation" value={qualification.motivation_reason} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-text-muted">Choose a lead to view profile.</div>
      )}
    </div>
  );
}
