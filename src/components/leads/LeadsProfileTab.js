"use client";


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
    // Keep emails/phone-like values untouched.
    if (raw.includes("@") || /^\+?[\d\s\-()]+$/.test(raw)) return raw;
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
              <KeyValue label="Intent" value={leadData.intent} />
              <KeyValue label="Lead type" value={leadData.lead_type} />
              <KeyValue label="Status" value={leadData.status} />
              <KeyValue label="Budget" value={property.budget ? `$${property.budget}` : property.budget} />
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
