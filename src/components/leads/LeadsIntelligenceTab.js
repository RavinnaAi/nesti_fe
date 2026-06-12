"use client";

import { useQuery } from "@tanstack/react-query";
import { FEATURES } from "@/constants/features";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { analyzeLeadInsights } from "@/lib/leadsClient";
import { Info } from "lucide-react";

function readable(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value) {
  const text = readable(value);
  if (text === "—") return text;
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function PanelSection({ title, children }) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-text-heading">{title}</h3>
      {children}
    </section>
  );
}

function KeyValue({ label, value, prose = false, accent = false }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${accent ? "border-emerald-100 bg-emerald-50" : "border-border/60 bg-background-light/50"}`}>
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <p className={`mt-0.5 break-words ${prose ? "text-xs text-text-body leading-relaxed" : "text-xs font-normal text-text-heading"}`}>
        {readable(value)}
      </p>
    </div>
  );
}

function severityClass(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high" || s === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (s === "medium") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <div className="h-5 w-56 animate-pulse rounded bg-emerald-100" />
        <div className="mt-3 space-y-2.5">
          <div className="h-3.5 w-full animate-pulse rounded bg-emerald-100/80" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-emerald-100/70" />
        </div>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
              <div className="h-2.5 w-20 animate-pulse rounded bg-emerald-100" />
              <div className="mt-2 h-3.5 w-24 animate-pulse rounded bg-emerald-100" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-2 rounded-lg border border-border/60 bg-background-light/50 px-3 py-2">
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="h-16 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[0, 1].map((card) => (
          <section key={`middle-${card}`} className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              ))}
            </div>
            <div className="h-14 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[0, 1].map((card) => (
          <section key={`bottom-${card}`} className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="space-y-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-10 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function LeadsIntelligenceTab({ token, leadId, lead }) {
  const { hasFeature } = useFeatureAccess();
  const resolvedLeadId = leadId || lead?.lead_match_id || lead?.id || "";
  const canViewInsights = hasFeature(FEATURES.LEADS_INSIGHTS_ADVANCED);
  const insightsQuery = useQuery({
    queryKey: ["lead-ai-insights", token, resolvedLeadId],
    enabled: Boolean(token && resolvedLeadId && canViewInsights),
    queryFn: () => analyzeLeadInsights({ token, leadId: resolvedLeadId }),
    staleTime: 5 * 60 * 1000,
  });
  const intelligence = insightsQuery.data?.intelligence || null;

  if (!lead) {
    return (
      <div className="rounded-md border border-border bg-white shadow-sm p-5">
        <div className="mx-auto flex min-h-[220px] max-w-sm flex-col items-center justify-center rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center">
          <span className="mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Info size={16} />
          </span>
          <p className="text-sm font-semibold text-text-heading">Choose a lead to view AI intelligence</p>
          <p className="mt-1 text-xs text-text-muted">
            Select a lead to load insight summary, risks, and conversion guidance.
          </p>
        </div>
      </div>
    );
  }
  if (insightsQuery.isLoading || insightsQuery.isFetching) {
    return <LoadingSkeleton />;
  }
  if (insightsQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
        {insightsQuery.error?.message || "Could not analyze this lead right now."}
      </div>
    );
  }
  if (!intelligence) {
    return (
      <div className="rounded-md border border-border bg-white shadow-sm p-5">
        <div className="mx-auto flex min-h-[220px] max-w-sm flex-col items-center justify-center rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center">
          <span className="mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Info size={16} />
          </span>
          <p className="text-sm font-semibold text-text-heading">No AI insights yet for this lead</p>
          <p className="mt-1 text-xs text-text-muted">
            Insights will appear after enough conversation and lead data is available.
          </p>
        </div>
      </div>
    );
  }

  const overview = intelligence.overview || {};
  const personality = intelligence.personality || {};
  const readiness = intelligence.readiness || {};
  const conversionGuidance = intelligence.conversion_guidance || {};
  const conversionSteps = Array.isArray(conversionGuidance.next_steps) ? conversionGuidance.next_steps : [];
  const hasConversionGuidance =
    conversionSteps.length > 0 ||
    Boolean(conversionGuidance.conversion_strategy || conversionGuidance.suggested_message);
  const risks = Array.isArray(intelligence.risk_flags) ? intelligence.risk_flags : [];
  const timeline = Array.isArray(intelligence.activity_timeline) ? intelligence.activity_timeline : [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-text-heading">Lead intelligence summary</h2>
        {overview.summary ? <p className="mt-2 text-sm text-text-body leading-relaxed">{overview.summary}</p> : null}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <KeyValue label="Lead type" value={titleCase(overview.lead_type)} accent />
          <KeyValue label="Score" value={overview.lead_score != null ? `${overview.lead_score}/100` : "—"} accent />
          <KeyValue label="Timeline" value={titleCase(overview.timeline)} accent />
          <KeyValue label="Temperature" value={overview.temperature_label} accent />
        </div>
      </section>

      {risks.length > 0 ? (
        <PanelSection title="Risk flags">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {risks.map((flag, i) => (
              <div key={`${flag.type}-${i}`} className={`rounded-lg border px-3 py-2.5 text-xs ${severityClass(flag.severity)}`}>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide">{titleCase(flag.severity || "risk")}</div>
                <p className="leading-relaxed">{flag.label}</p>
              </div>
            ))}
          </div>
        </PanelSection>
      ) : null}

      {hasConversionGuidance ? (
        <PanelSection title="Conversion guidance">
          {conversionGuidance.conversion_strategy ? (
            <KeyValue label="Strategy" value={conversionGuidance.conversion_strategy} prose />
          ) : null}
          {conversionSteps.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted mb-2">Next steps to convert</p>
              <ol className="space-y-2">
                {conversionSteps.map((step, idx) => (
                  <li key={`${idx}-${step}`} className="flex gap-2 rounded-lg border border-border/60 bg-background-light/50 px-3 py-2 text-xs text-text-body">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {conversionGuidance.suggested_message ? (
            <KeyValue label="Suggested message" value={conversionGuidance.suggested_message} prose />
          ) : null}
        </PanelSection>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PanelSection title="Readiness and conversion">
          <div className="grid grid-cols-2 gap-2">
            <KeyValue label="Conversion likelihood" value={titleCase(readiness.conversion_likelihood)} />
            <KeyValue label="Engagement" value={titleCase(readiness.engagement_level)} />
            <KeyValue label="Stage" value={titleCase(readiness.readiness_stage)} />
            <KeyValue label="Follow-up urgency" value={titleCase(readiness.follow_up_urgency)} />
          </div>
          {readiness.insight ? <KeyValue label="Insight" value={readiness.insight} prose /> : null}
          {readiness.needs_before_next_step ? <KeyValue label="Before next step" value={readiness.needs_before_next_step} prose /> : null}
        </PanelSection>

        <PanelSection title="Communication profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <KeyValue label="Communication style" value={titleCase(personality.communication_style)} />
            <KeyValue label="Decision style" value={titleCase(personality.decision_making_style)} />
            <KeyValue label="Confidence" value={titleCase(personality.confidence_level)} />
            <KeyValue label="Engagement" value={titleCase(personality.engagement_behaviour)} />
          </div>
          {Array.isArray(personality.emotional_concerns) && personality.emotional_concerns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {personality.emotional_concerns.map((c) => (
                <span key={c} className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-900">
                  {titleCase(c)}
                </span>
              ))}
            </div>
          ) : null}
          {Array.isArray(personality.best_way_to_communicate) && personality.best_way_to_communicate.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Best way to communicate</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-text-body leading-relaxed">
                {personality.best_way_to_communicate.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </PanelSection>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PanelSection title="Lead context">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <KeyValue label="Budget" value={overview.budget_range} />
            <KeyValue label="Location" value={overview.location_preference} />
            <KeyValue label="Appointment" value={titleCase(overview.appointment_status)} />
          </div>
        </PanelSection>

        <PanelSection title="Recent activity">
          {timeline.length === 0 ? (
            <p className="text-xs text-text-muted">No activity recorded yet.</p>
          ) : (
            <ol className="relative border-l border-border/80 ml-2 space-y-2 pl-4">
              {[...timeline].reverse().slice(0, 4).map((ev) => (
                <li key={ev.id || ev.occurred_at} className="text-xs">
                  <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-semibold text-text-heading">{ev.label || titleCase(ev.event_type)}</p>
                  <p className="text-text-muted text-[11px]">{ev.occurred_at ? new Date(ev.occurred_at).toLocaleString() : "—"}</p>
                </li>
              ))}
            </ol>
          )}
        </PanelSection>
      </div>
    </div>
  );
}
