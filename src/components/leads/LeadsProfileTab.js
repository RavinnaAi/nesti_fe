"use client";

import { getStatusDisplay } from "@/lib/leadPipelineConfig";
import { formatLeadIntakeSlug } from "@/lib/leadsPageUtils";
import LeadPipelineStageControl from "@/components/leads/LeadPipelineStageControl";
import { Info } from "lucide-react";

export default function LeadsProfileTab({
  selectedConversation,
  lead,
  onPatchLead,
  patchLeadPending = false,
  embedded = false,
}) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const profRole = leadData.professional_type;
  const hideBuyerSellerIntent = profRole === "lawyer" || profRole === "mortgage_broker";
  const isLawyerLead = profRole === "lawyer";
  const isMortgageBrokerLead = profRole === "mortgage_broker";
  const isSellerLead =
    String(leadData.intent || "")
      .trim()
      .toLowerCase() === "sell" ||
    /seller$/i.test(String(leadData.lead_type || ""));
  const contact = leadData.contact || {};
  const property = leadData.property || {};
  const qualification = leadData.qualification || {};
  const locationDisplay = property.location || (leadData.intent === "sell" ? property.address : "");

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

  const KeyValue = ({ label, value, noWrap = false }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={`text-xs font-normal text-text-heading mt-0.5 ${noWrap ? "truncate whitespace-nowrap" : "break-words"}`}
        title={noWrap ? formatLeadIntakeSlug(value) || readable(value) : undefined}
      >
        {formatLeadIntakeSlug(value) || readable(value)}
      </div>
    </div>
  );

  const pipelineInfo = getStatusDisplay(leadData.status ?? leadData.match_status);
  const outerClassName = embedded ? "space-y-4" : "rounded-md border border-border bg-white shadow-sm p-5 space-y-4";
  const sectionClassName = embedded ? "space-y-3" : "rounded-md border border-border bg-white p-4 space-y-3";

  return (
    <div className={outerClassName}>
      {selectedConversation ? (
        <>
          <div className={sectionClassName}>
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
              {!isLawyerLead ? (
                <div className="lg:col-span-2">
                  <KeyValue label="Location" value={locationDisplay} />
                </div>
              ) : null}
              {isLawyerLead ? (
                <div className="lg:col-span-2">
                  <KeyValue label="Property address" value={property.address} />
                </div>
              ) : null}
            </div>
          </div>

          {typeof onPatchLead === "function" ? (
            <div className="rounded-md border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-white to-white p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-text-heading">Pipeline management</div>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${pipelineInfo.color}`}>
                      {pipelineInfo.label}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-text-muted">
                    Move this lead through active stages or select a final outcome. Closing opens a role-specific confirmation with reason, note, and value fields.
                  </p>
                </div>
                <LeadPipelineStageControl
                  lead={leadData}
                  onPatchLead={onPatchLead}
                  patchLeadPending={patchLeadPending}
                  title="Stage"
                  unboxed
                  professionalType={profRole}
                />
              </div>
            </div>
          ) : null}

          <div className={embedded ? "space-y-4 border-t border-border/60 pt-4" : "rounded-md border border-border bg-white p-4 space-y-4"}>
            <div>
              <div className="text-sm font-semibold text-text-heading">
                {isLawyerLead ? "Matter summary" : isMortgageBrokerLead ? "Financing summary" : "Lead context"}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                Key information captured from the lead intake.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {hideBuyerSellerIntent ? null : <KeyValue label="Intent" value={leadData.intent} />}
              <KeyValue label="Lead type" value={leadData.lead_type} />
              <KeyValue label="Budget" value={budgetDisplay} />
              <KeyValue
                label={isLawyerLead ? "Closing timeline" : "Timeline"}
                value={isLawyerLead ? qualification.closing_timeline : property.timeline}
              />
              {isLawyerLead ? (
                <>
                  <KeyValue label="Transaction stage" value={qualification.transaction_stage} />
                  <KeyValue label="Transaction type" value={qualification.transaction_type} />
                  <KeyValue label="Property value" value={qualification.property_value} />
                  <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
                  <KeyValue label="Realtor involved" value={qualification.realtor_involved} />
                  <KeyValue label="First-time buyer" value={qualification.first_time_buyer} />
                  <KeyValue label="Legal services" value={qualification.legal_services_needed} />
                </>
              ) : isMortgageBrokerLead ? (
                <>
                  <KeyValue label="Mortgage timeline" value={qualification.mortgage_timeline} />
                  <KeyValue label="Pre-approval" value={qualification.pre_approval_status} />
                  <KeyValue label="Purchase purpose" value={qualification.purchase_purpose} />
                  <KeyValue label="Urgency" value={qualification.urgency_signal} />
                </>
              ) : (
                <>
                  <KeyValue label="Property type" value={property.property_type} />
                  <KeyValue label="Mortgage status" value={qualification.mortgage_status} />
                  <KeyValue label="Realtor status" value={qualification.realtor_status} />
                  {!isSellerLead ? (
                    <KeyValue label="Address" value={qualification.buy_property_location} />
                  ) : null}
                  <KeyValue label="Motivation" value={qualification.motivation_reason} />
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center px-3 py-6">
          <div className="w-full max-w-sm rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center shadow-sm">
            <span className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Info size={16} />
            </span>
            <p className="text-sm font-semibold text-text-heading">Choose a lead to view profile</p>
            <p className="mt-1 text-xs text-text-muted">
              Select a lead from the table to review contact details and context.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
