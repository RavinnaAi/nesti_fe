"use client";

export default function LeadsAiActionsTab({ selectedConversation, lead }) {
  const leadData = lead && typeof lead === "object" ? lead : {};
  const prof = leadData.professional_type;
  const isLawyerOrBroker = prof === "lawyer" || prof === "mortgage_broker";
  const conversion = leadData.conversion || {};
  const decision = leadData.decision_support || {};
  const funnel = leadData.conversion_funnel || {};

  const primaryAction =
    conversion.primary_action ||
    decision.do_this_now ||
    {};

  const secondaryActions = Array.isArray(conversion.secondary_actions)
    ? conversion.secondary_actions
    : [];

  const signals = Array.isArray(conversion.signals) ? conversion.signals : [];
  const outcome = conversion.outcome && typeof conversion.outcome === "object" ? conversion.outcome : {};
  const alert = conversion.alert && typeof conversion.alert === "object" ? conversion.alert : {};

  const speed = conversion.speed || {};
  const urgencyLevel = conversion.alert?.level || speed.urgency || funnel?.urgency || null;

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return String(value)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const titleCase = (value) => {
    const text = readable(value);
    if (text === "—") return text;
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const urgencyTone = (() => {
    const level = String(urgencyLevel || "").toLowerCase();
    if (level === "critical" || level === "immediate") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (level === "high" || level === "same day") {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  })();

  const priorityTone = (priority) => {
    const p = String(priority || "").toLowerCase();
    if (p === "critical") return "bg-red-50 text-red-700 border-red-200";
    if (p === "high") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const KeyValue = ({ label, value, prose = false }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`mt-0.5 break-words ${prose ? "text-xs text-text-body leading-relaxed" : "text-xs font-normal text-text-heading"}`}>
        {readable(value)}
      </div>
    </div>
  );

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          {isLawyerOrBroker && (conversion.headline || conversion.why_one_liner) ? (
            <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
              {conversion.headline ? (
                <div className="text-sm font-semibold text-indigo-950">{conversion.headline}</div>
              ) : null}
              {conversion.why_one_liner ? (
                <p className="text-xs text-indigo-900/85 leading-relaxed">{conversion.why_one_liner}</p>
              ) : null}
            </div>
          ) : null}

          {isLawyerOrBroker && signals.length > 0 ? (
            <div className="rounded-md border border-border bg-white p-4 space-y-2">
              <div className="text-sm font-semibold text-text-heading">Signals from chat</div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-text-body leading-relaxed">
                {signals.map((s, i) => (
                  <li key={i}>{String(s)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {isLawyerOrBroker && (outcome.headline || outcome.booking_cta) ? (
            <div className="rounded-md border border-border bg-background-light/50 p-4 space-y-2">
              <div className="text-sm font-semibold text-text-heading">Focus</div>
              {outcome.headline ? <p className="text-xs text-text-body leading-relaxed">{outcome.headline}</p> : null}
              {outcome.booking_cta ? (
                <p className="text-xs font-medium text-text-heading leading-relaxed">{outcome.booking_cta}</p>
              ) : null}
            </div>
          ) : null}

          {isLawyerOrBroker && alert?.surface && (alert.title || alert.reason) ? (
            <div
              className={`rounded-md border p-3 text-xs ${
                String(alert.level || "").toLowerCase() === "critical"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {alert.title ? <div className="font-semibold">{alert.title}</div> : null}
              {alert.reason ? <p className="mt-1 leading-relaxed opacity-90">{alert.reason}</p> : null}
            </div>
          ) : null}

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-text-heading">
                {isLawyerOrBroker ? "Recommended next step" : "Primary action"}
              </div>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${urgencyTone}`}>
                {titleCase(urgencyLevel || "standard")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <KeyValue label="Action" value={primaryAction.title || primaryAction.id} />
              <KeyValue label="Channel" value={titleCase(primaryAction.channel)} />
            </div>
            <KeyValue label="Follow-up template" value={primaryAction.follow_up_template} prose />
          </div>

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-text-heading">
              {isLawyerOrBroker ? "Also consider" : "Secondary actions"}
            </div>
            {secondaryActions.length === 0 ? (
              <div className="text-xs text-text-muted">No secondary actions.</div>
            ) : (
              <div className="space-y-2">
                {secondaryActions.map((item, idx) => (
                  <div key={`${item?.id || "secondary"}-${idx}`} className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-text-heading">{titleCase(item?.title || item?.id)}</div>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${priorityTone(item?.priority)}`}>
                        {titleCase(item?.priority || "normal")}
                      </span>
                    </div>
                    {item?.follow_up_template ? (
                      <p className="mt-1.5 text-xs text-text-body leading-relaxed">{item.follow_up_template}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

        </>
      ) : (
        <div className="text-sm text-text-muted">Choose a lead to view actions.</div>
      )}
    </div>
  );
}
