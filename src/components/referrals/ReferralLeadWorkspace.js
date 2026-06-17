"use client";

import { Children, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Inbox } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNurtureLogs,
  fetchReferralLeadDetails,
  postNurtureDraft,
  postNurturePreview,
  postNurtureRefine,
  processReferralRequest,
  sendNurtureEmail,
  updateReferral,
} from "@/lib/chatClient";
import { toast } from "react-toastify";
import LeadsNurtureTab from "@/components/leads/LeadsNurtureTab";
import LeadPipelineNotesPanel from "@/components/leads/LeadPipelineNotesPanel";
import LeadPipelineStageControl from "@/components/leads/LeadPipelineStageControl";
import { fetchLeadById, patchLead } from "@/lib/leadsClient";
import { formatLeadIntakeSlug } from "@/lib/leadsPageUtils";
import {
  hasInquiredPropertyContext,
  inquiredPropertyFromLead,
} from "@/lib/inquiredPropertyUtils";
import InquiredPropertyOverview from "@/components/leads/InquiredPropertyOverview";

function roleLabel(v) {
  const raw = String(v || "").trim().toLowerCase();
  if (!raw) return "Unknown";
  if (raw === "mortgage_broker") return "Mortgage Broker";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function referrerInitials(fullName) {
  return String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

/** Top-right header slot next to title; name opens `/professionals/[id]` in a new tab. */
function ReferrerHeaderCompact({ professional }) {
  const p = professional && typeof professional === "object" ? professional : {};
  const id = String(p.id || "").trim();
  const name = String(p.full_name || "").trim() || "—";
  const profileHref = id ? `/professionals/${encodeURIComponent(id)}` : null;
  const avatarUrl = String(p.profile_image || "").trim();
  const emailRaw = String(p.email || "").trim();
  const roleText = roleLabel(p.role);
  const showRoleBadge = Boolean(roleText && roleText !== "Unknown");

  return (
    <div className="flex max-w-[min(100vw-2rem,17rem)] shrink-0 flex-col items-start gap-1.5 pl-2 text-left sm:max-w-[19rem]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">Referred by</p>
      <div className="flex min-w-0 max-w-full items-center justify-start gap-2.5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote profile URLs
          <img
            src={avatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/18 to-primary/6 text-xs font-bold text-primary-dark shadow-inner ring-2 ring-white"
            aria-hidden
          >
            {referrerInitials(name)}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
          {profileHref ? (
            <Link
              href={profileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-full items-center gap-1 text-sm font-semibold leading-snug text-text-heading outline-none transition-colors hover:text-primary-dark focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
            >
              <span className="truncate underline-offset-[3px] transition group-hover:underline">{name}</span>
              <ExternalLink
                className="size-3.5 shrink-0 text-text-muted/80 transition group-hover:text-primary-dark"
                aria-hidden
              />
              <span className="sr-only">(opens profile in new tab)</span>
            </Link>
          ) : (
            <div className="text-sm font-semibold text-text-heading">{name}</div>
          )}
          {emailRaw ? (
            <a
              href={`mailto:${encodeURIComponent(emailRaw)}`}
              className="block max-w-full break-all text-[11px] text-primary transition hover:text-primary-dark hover:underline sm:break-words"
              title={emailRaw}
            >
              {emailRaw}
            </a>
          ) : (
            <span className="text-[11px] text-text-muted">—</span>
          )}
          {showRoleBadge ? (
            <span className="mt-1 inline-flex shrink-0 self-start rounded-full border border-primary/22 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark shadow-sm">
              {roleText}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="min-w-0 rounded border border-border/45 bg-background-light/35 px-2 py-1.5">
      <div className="text-[9px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-px text-[11px] font-normal leading-snug text-text-heading break-words">
        {value || "—"}
      </div>
    </div>
  );
}

/** `mapLeadProfileForApi` emits flat `qualification` keys; older UI expected `qualification.lawyer.*`. */
function lawyerQualificationSlice(qual) {
  const q = qual && typeof qual === "object" ? qual : {};
  const nested = q.lawyer && typeof q.lawyer === "object" ? q.lawyer : {};
  return {
    transaction_stage: q.transaction_stage ?? nested.transaction_stage ?? null,
    closing_timeline: q.closing_timeline ?? nested.closing_timeline ?? null,
    transaction_type: q.transaction_type ?? nested.transaction_type ?? null,
    property_value: q.property_value ?? nested.property_value ?? null,
    mortgage_status: q.mortgage_status ?? nested.mortgage_status ?? null,
    realtor_involved: q.realtor_involved ?? nested.realtor_involved ?? null,
    first_time_buyer: q.first_time_buyer ?? nested.first_time_buyer ?? null,
    legal_services_needed: q.legal_services_needed ?? nested.legal_services_needed ?? null,
  };
}

function mortgageQualificationSlice(qual) {
  const q = qual && typeof qual === "object" ? qual : {};
  const nested = q.mortgage_broker && typeof q.mortgage_broker === "object" ? q.mortgage_broker : {};
  return {
    mortgage_timeline: q.mortgage_timeline ?? nested.mortgage_timeline ?? null,
    pre_approval_status:
      q.pre_approval_status ?? nested.pre_approval_status ?? nested.mortgage_status ?? null,
    credit_score_range: q.credit_score_range ?? nested.credit_score_range ?? null,
    employment_status: q.employment_status ?? nested.employment_status ?? null,
    household_income: q.household_income ?? nested.household_income ?? null,
    down_payment_readiness: q.down_payment_readiness ?? nested.down_payment_readiness ?? null,
    purchase_purpose: q.purchase_purpose ?? nested.purchase_purpose ?? null,
    urgency_signal: q.urgency_signal ?? nested.urgency_signal ?? null,
  };
}

/** Readable labels for slug-like lead fields (matches leads profile tab behavior). */
function humanizeLeadDetail(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  const token = s.toLowerCase().replace(/\s+/g, "_");
  const mortgageTokenMap = {
    "20_plus": "20%+",
    "10_19": "10-19%",
    "5_9": "5-9%",
    "under_5": "Under 5%",
    "no_savings": "No savings yet",
  };
  if (mortgageTokenMap[token]) return mortgageTokenMap[token];
  if (s.includes("@") || /^\+?[\d\s\-().]+$/.test(s)) return s;
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function intentDisplayValue(intent) {
  const s = String(intent ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s || ["unspecified", "unknown", "n/a", "na", "none"].includes(s)) return "";
  return String(intent).trim();
}

/** Normalize to display text; empty string means omit the row (no captured value). */
function detailText(value, mode = "raw") {
  if (mode === "intent") return intentDisplayValue(value);
  if (mode === "intake") {
    const slug = formatLeadIntakeSlug(value);
    if (slug) return slug;
    if (value === null || value === undefined) return "";
    const s = String(value).trim();
    if (!s) return "";
    const h = humanizeLeadDetail(s);
    return h || s;
  }
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const s = String(value).trim();
  if (!s) return "";
  if (mode === "humanize") {
    const h = humanizeLeadDetail(s);
    return h || s;
  }
  return s;
}

function DetailRow({ label, value, mode = "raw" }) {
  const text = detailText(value, mode);
  if (!text) return null;
  return <InfoRow label={label} value={text} />;
}

function DetailFieldsSection({ title, children, maxCols }) {
  const nodes = Children.toArray(children).filter(Boolean);
  if (!nodes.length) return null;
  const gridClass =
    maxCols === 2
      ? "grid grid-cols-2 gap-1.5"
      : "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4";
  return (
    <div className="space-y-1.5 border-t border-border/45 pt-3 first:border-t-0 first:pt-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{title}</div>
      <div className={gridClass}>{nodes}</div>
    </div>
  );
}

export default function ReferralLeadWorkspace({
  token,
  referralId,
  meId,
  fromPipelineReferrals = false,
  listPage = 1,
  referralDirection = "inbound",
}) {
  const queryClient = useQueryClient();
  const [detailTab, setDetailTab] = useState("details");
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [nurtureForm, setNurtureForm] = useState({
    to_email: "",
    subject: "",
    body: "",
    refine_instruction: "",
    goal: "",
    tone: "",
    include_property_cards: true,
  });

  const detailQuery = useQuery({
    queryKey: ["referral-lead-details", token, referralId],
    enabled: Boolean(token && referralId),
    queryFn: () => fetchReferralLeadDetails({ token, id: referralId }),
    retry: false,
  });

  const lead = detailQuery.data?.lead || null;
  const context = detailQuery.data?.context || {};

  const referralDraftContext = useMemo(() => {
    const sourceProfessional =
      context?.source_professional && typeof context.source_professional === "object"
        ? context.source_professional
        : {};
    const sourceName = String(sourceProfessional?.full_name || "").trim();
    const sourceRole = String(context?.source_role || "").trim();
    const targetRole = String(context?.target_role || "").trim();
    const actionRole = String(context?.action_role || "").trim();
    const referralNotes = String(detailQuery.data?.referral?.notes || "").trim();
    return {
      source_professional_name: sourceName || undefined,
      source_professional_role: sourceRole || undefined,
      target_professional_role: targetRole || undefined,
      action_professional_role: actionRole || undefined,
      referral_notes: referralNotes || undefined,
    };
  }, [
    context?.source_professional,
    context?.source_role,
    context?.target_role,
    context?.action_role,
    detailQuery.data?.referral?.notes,
  ]);

  const referralForTargetCheck = detailQuery.data?.referral || {};
  const normalizedTargetUserId = String(
    referralForTargetCheck.target_user_id || referralForTargetCheck.target_professional?.id || ""
  ).trim();
  const normalizedViewerId = String(meId || "").trim();
  const isTarget =
    Boolean(normalizedTargetUserId && normalizedViewerId) &&
    normalizedTargetUserId === normalizedViewerId;
  const referralStatusForFetch = String(referralForTargetCheck.status || "")
    .trim()
    .toLowerCase();
  const viewerOwnsLeadMatch = !isTarget || referralStatusForFetch === "accepted";

  const activeLeadMatchId = String(lead?.lead_match_id || "").trim();
  const activeConversationId = String(lead?.conversation_id || "").trim();

  const leadDetailQuery = useQuery({
    queryKey: ["referral-lead-detail-full", token, activeLeadMatchId, isTarget],
    enabled: Boolean(token && activeLeadMatchId && viewerOwnsLeadMatch),
    queryFn: () => fetchLeadById({ token, id: activeLeadMatchId }),
    retry: false,
  });
  const fullLead = leadDetailQuery.data?.lead || null;

  const nurtureSuggestedEmail = useMemo(() => {
    const c = fullLead?.contact || lead?.contact;
    const fromLead = c?.email || c?.canonical_email || "";
    return String(fromLead || "").trim();
  }, [fullLead?.contact, lead?.contact]);

  useEffect(() => {
    if (!activeLeadMatchId || !nurtureSuggestedEmail) return;
    setNurtureForm((prev) => {
      if (prev.to_email.trim()) return prev;
      return { ...prev, to_email: nurtureSuggestedEmail };
    });
  }, [activeLeadMatchId, nurtureSuggestedEmail]);

  const processMutation = useMutation({
    mutationFn: () => processReferralRequest({ token, id: referralId }),
    onSuccess: (data) => {
      toast.success(data?.message || "Referral processed.");
      setProcessModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["referral-lead-details", token, referralId] });
      queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to process referral"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => updateReferral({ token, id: referralId, payload: { status: "rejected" } }),
    onSuccess: () => {
      toast.success("Referral rejected.");
      setProcessModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["referral-lead-details", token, referralId] });
      queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
    },
    onError: (err) => toast.error(err?.message || "Could not reject referral"),
  });

  const patchLeadMutation = useMutation({
    mutationFn: (payload) => patchLead({ token, id: activeLeadMatchId, ...payload }),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["referral-lead-detail-full", token, activeLeadMatchId] });
    },
    onError: (err) => toast.error(err?.message || "Could not update lead"),
  });

  const nurtureLogsQuery = useQuery({
    queryKey: ["referrals-nurture-logs", token, activeLeadMatchId],
    enabled: Boolean(token && activeLeadMatchId),
    queryFn: () => fetchNurtureLogs({ token, leadMatchId: activeLeadMatchId }),
  });

  const nurtureDraftMutation = useMutation({
    mutationFn: () =>
      postNurtureDraft({
        token,
        payload: {
          lead_match_id: activeLeadMatchId,
          goal: nurtureForm.goal?.trim() || undefined,
          tone: nurtureForm.tone?.trim() || undefined,
          referral_context: referralDraftContext,
        },
      }),
    onSuccess: (data) => {
      const d = data?.draft;
      if (d) {
        setNurtureForm((prev) => ({
          ...prev,
          subject: d.subject ?? prev.subject,
          body: d.body_text ?? prev.body,
        }));
      }
      toast.success("Draft ready. Review and send.");
    },
    onError: (err) => toast.error(err?.message || "Could not generate draft"),
  });

  const nurtureRefineMutation = useMutation({
    mutationFn: () =>
      postNurtureRefine({
        token,
        payload: {
          lead_match_id: activeLeadMatchId,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          instruction: nurtureForm.refine_instruction.trim(),
          referral_context: referralDraftContext,
        },
      }),
    onSuccess: (data) => {
      const d = data?.draft;
      if (d) {
        setNurtureForm((prev) => ({
          ...prev,
          subject: d.subject ?? prev.subject,
          body: d.body_text ?? prev.body,
          refine_instruction: "",
        }));
      }
      toast.success("Refined.");
    },
    onError: (err) => toast.error(err?.message || "Could not refine email"),
  });

  const nurtureMutation = useMutation({
    mutationFn: () =>
      sendNurtureEmail({
        token,
        payload: {
          lead_match_id: activeLeadMatchId,
          conversation_id: activeConversationId || undefined,
          to_email: nurtureForm.to_email?.trim() || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
          referral_context: referralDraftContext,
        },
      }),
    onSuccess: () => {
      toast.success("Nurture email sent");
      queryClient.invalidateQueries({ queryKey: ["referrals-nurture-logs", token, activeLeadMatchId] });
    },
    onError: (err) => toast.error(err?.message || "Failed to send nurture email"),
  });

  const nurturePreviewMutation = useMutation({
    mutationFn: () =>
      postNurturePreview({
        token,
        payload: {
          lead_match_id: activeLeadMatchId,
          conversation_id: activeConversationId || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
          referral_context: referralDraftContext,
        },
      }),
    onError: (err) => toast.error(err?.message || "Failed to build email preview"),
  });

  const sourceRole = String(context?.source_role || "").toLowerCase();

  if (detailQuery.isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-sm text-text-muted shadow-sm">
        Loading referral lead…
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-800 shadow-sm">
        {detailQuery.error?.message || "Could not load this referral."}
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-border/70 bg-background-light/35 px-6 py-8 text-center">
          <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Inbox size={18} />
          </span>
          <p className="text-sm font-semibold text-text-heading">No lead data for this referral</p>
          <p className="mt-1 text-xs text-text-muted">
            This referral does not have a linked lead record yet, or it was removed.
          </p>
        </div>
      </div>
    );
  }

  const inquiredProperty = inquiredPropertyFromLead(lead);
  const showInquiredProperty = hasInquiredPropertyContext(lead);
  const lawyerQual = lawyerQualificationSlice(lead.qualification);
  const mortgageQual = mortgageQualificationSlice(lead.qualification);
  const contact = lead.contact && typeof lead.contact === "object" ? lead.contact : {};
  const prop = lead.property && typeof lead.property === "object" ? lead.property : {};
  const agentQual = lead.qualification && typeof lead.qualification === "object" ? lead.qualification : {};

  const referralRecord = detailQuery.data?.referral || {};
  const referralStatusRaw = String(referralRecord.status || "").trim().toLowerCase();
  const referralAccepted = referralStatusRaw === "accepted";
  const referralRejected = referralStatusRaw === "rejected";
  const referralCompleted = referralStatusRaw === "completed";
  const referralPending = referralStatusRaw === "pending" || referralStatusRaw === "";
  const referrerNotesDisplay = String(referralRecord.notes ?? "").trim();
  const dirQ = referralDirection === "outbound" ? "outbound" : "inbound";
  /** Sender’s list: no workspace tabs (nurture/notes/actions)—read-only snapshot. */
  const isOutboundReferral = dirQ === "outbound";
  const pipelineListPage = Math.max(1, Number(listPage) || 1);
  const pipelineWorkspaceHref =
    referralId &&
    (dirQ === "outbound"
      ? `/referrals/${encodeURIComponent(referralId)}?direction=outbound&from=pipeline`
      : `/leads/referrals/${encodeURIComponent(referralId)}${
          pipelineListPage > 1 ? `?page=${encodeURIComponent(String(pipelineListPage))}` : ""
        }`);

  const leadDetailsCard = (
    <div className="rounded-lg border border-border/70 bg-white px-3 py-3 text-xs">
      <div className="mb-2 text-[13px] font-semibold tracking-tight text-text-heading">Lead details</div>

      <DetailFieldsSection title="Overview">
        <DetailRow label="Intent" value={lead.intent} mode="intent" />
        <DetailRow label="Lead type" value={lead.lead_type} mode="humanize" />
        <DetailRow label="Score" value={lead.score} />
        <DetailRow label="Grade" value={lead.grade} />
        <DetailRow label="Pipeline status" value={lead.status} mode="humanize" />
        <DetailRow label="Qualified" value={lead.is_qualified} />
        <DetailRow label="Appointment" value={lead.appointment_status} mode="humanize" />
      </DetailFieldsSection>

      <DetailFieldsSection title="Contact" maxCols={2}>
        <DetailRow label="Name" value={contact.full_name} />
        <DetailRow label="Email" value={contact.canonical_email || contact.email} />
        <DetailRow label="Phone" value={contact.phone} />
        <DetailRow label="Preferred contact" value={contact.preferred_contact_method} mode="humanize" />
        <DetailRow label="Best time to contact" value={contact.best_time_to_contact} mode="humanize" />
        {(() => {
          const ph = String(contact.phone || "").replace(/\D/g, "");
          const cph = String(contact.canonical_phone || "").replace(/\D/g, "");
          return ph && cph && ph !== cph ? (
            <DetailRow label="Canonical phone" value={contact.canonical_phone} />
          ) : null;
        })()}
      </DetailFieldsSection>

      {showInquiredProperty ? (
        <div className="border-t border-border/45 pt-3">
          <InquiredPropertyOverview property={inquiredProperty} />
        </div>
      ) : null}

      {sourceRole === "agent" ? (
        <>
          <DetailFieldsSection title="Property preferences">
            <DetailRow label="Location" value={prop.location} mode="humanize" />
            <DetailRow label="Budget" value={prop.budget} mode="intake" />
            <DetailRow label="Timeline" value={prop.timeline} mode="intake" />
            <DetailRow label="Property type" value={prop.property_type} mode="humanize" />
            <DetailRow label="Bedrooms" value={prop.bedrooms} />
            <DetailRow label="Bathrooms" value={prop.bathrooms} />
            <DetailRow label="Must-have features" value={prop.must_have_features} />
            <DetailRow label="Parking required" value={prop.parking_required} mode="humanize" />
            <DetailRow label="Backyard needed" value={prop.backyard_needed} mode="humanize" />
            <DetailRow label="School district important" value={prop.school_district_important} mode="humanize" />
          </DetailFieldsSection>

          <DetailFieldsSection title="Buyer qualification">
            <DetailRow label="Mortgage status" value={agentQual.mortgage_status} mode="humanize" />
            <DetailRow label="Realtor status" value={agentQual.realtor_status} mode="humanize" />
            <DetailRow label="Motivation" value={agentQual.motivation_reason} mode="humanize" />
            <DetailRow label="Viewing readiness" value={agentQual.viewing_readiness} mode="humanize" />
            <DetailRow label="Living situation" value={agentQual.living_situation} mode="humanize" />
            <DetailRow label="Urgency / readiness" value={agentQual.urgency_readiness} mode="humanize" />
          </DetailFieldsSection>
        </>
      ) : null}

      {sourceRole === "lawyer" ? (
        <>
          <DetailFieldsSection title="Property & location">
            <DetailRow label="Location / area" value={prop.location} mode="humanize" />
            <DetailRow label="Budget / value band" value={prop.budget} mode="intake" />
            <DetailRow label="Timeline" value={prop.timeline} mode="intake" />
          </DetailFieldsSection>

          <DetailFieldsSection title="Legal intake">
            <DetailRow label="Transaction stage" value={lawyerQual.transaction_stage} mode="humanize" />
            <DetailRow label="Closing timeline" value={lawyerQual.closing_timeline} mode="humanize" />
            <DetailRow label="Transaction type" value={lawyerQual.transaction_type} mode="humanize" />
            <DetailRow label="Property value" value={lawyerQual.property_value} mode="intake" />
            <DetailRow label="Mortgage status" value={lawyerQual.mortgage_status} mode="humanize" />
            <DetailRow label="Realtor involved" value={lawyerQual.realtor_involved} mode="humanize" />
            <DetailRow label="First-time buyer" value={lawyerQual.first_time_buyer} mode="humanize" />
            <DetailRow label="Legal services needed" value={lawyerQual.legal_services_needed} />
          </DetailFieldsSection>
        </>
      ) : null}

      {sourceRole === "mortgage_broker" ? (
        <>
          <DetailFieldsSection title="Property & financing context">
            <DetailRow label="Location / area" value={prop.location} mode="humanize" />
            <DetailRow label="Budget" value={prop.budget} mode="intake" />
            <DetailRow label="Purchase timeline" value={prop.timeline} mode="intake" />
          </DetailFieldsSection>

          <DetailFieldsSection title="Mortgage qualification">
            <DetailRow label="Mortgage timeline" value={mortgageQual.mortgage_timeline} mode="humanize" />
            <DetailRow label="Pre-approval" value={mortgageQual.pre_approval_status} mode="humanize" />
            <DetailRow label="Credit score range" value={mortgageQual.credit_score_range} mode="humanize" />
            <DetailRow label="Employment status" value={mortgageQual.employment_status} mode="humanize" />
            <DetailRow label="Household income" value={mortgageQual.household_income} mode="humanize" />
            <DetailRow
              label="Down payment readiness"
              value={mortgageQual.down_payment_readiness}
              mode="humanize"
            />
            <DetailRow label="Purchase purpose" value={mortgageQual.purchase_purpose} mode="humanize" />
            <DetailRow label="Urgency signal" value={mortgageQual.urgency_signal} mode="humanize" />
          </DetailFieldsSection>
        </>
      ) : null}
    </div>
  );

  const nurturePanel = (
    <LeadsNurtureTab
      nurtureForm={nurtureForm}
      setNurtureForm={setNurtureForm}
      nurtureMutation={nurtureMutation}
      nurturePreviewMutation={nurturePreviewMutation}
      nurtureDraftMutation={nurtureDraftMutation}
      nurtureRefineMutation={nurtureRefineMutation}
      selectedLeadId={activeLeadMatchId}
      actionConversationId={activeConversationId}
      nurtureLogs={Array.isArray(nurtureLogsQuery.data?.items) ? nurtureLogsQuery.data.items : []}
      nurtureLogsLoading={nurtureLogsQuery.isLoading}
    />
  );

  const notesPanel = (
    <LeadPipelineNotesPanel
      lead={fullLead || {}}
      onPatchLead={(payload) => patchLeadMutation.mutateAsync(payload)}
      patchLeadPending={patchLeadMutation.isPending}
    />
  );

  const referralPipelineManagementPanel = (
    <div className="rounded-lg border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-white to-white p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <div className="text-sm font-semibold text-text-heading">Pipeline management</div>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            Move this referred lead through active stages or select a final outcome with role-based close flow.
          </p>
        </div>
        <LeadPipelineStageControl
          lead={fullLead || lead || {}}
          onPatchLead={(payload) => patchLeadMutation.mutateAsync(payload)}
          patchLeadPending={patchLeadMutation.isPending}
          title="Stage"
          unboxed
          professionalType={
            String(context?.target_role || fullLead?.professional_type || lead?.professional_type || "")
              .trim()
              .toLowerCase() || undefined
          }
        />
      </div>
    </div>
  );

  const toolkitTabStrip = (
    <div className="inline-flex rounded-lg border border-border bg-background-light/40 p-1">
      {[
        { id: "details", label: "Details" },
        { id: "nurture", label: "Nurture Email" },
        { id: "notes", label: "Notes" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setDetailTab(tab.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            detailTab === tab.id ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-heading"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const statusChipClass =
    referralAccepted
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : referralRejected
        ? "border-red-200 bg-red-50 text-red-900"
        : referralCompleted
          ? "border-slate-200 bg-slate-100 text-slate-800"
          : referralPending
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-border bg-background-light text-text-heading";
  const statusChipLabel = referralStatusRaw ? referralStatusRaw.replace(/_/g, " ") : "pending";

  return (
    <section className="space-y-4 rounded-xl border border-border/80 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] sm:p-6">
      <div className="space-y-4 border-b border-border/60 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-text-heading">Referred lead</h2>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusChipClass}`}
              >
                {statusChipLabel}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background-light/60 px-2.5 py-1 text-[11px] font-medium text-text-heading shadow-sm">
                <span className="text-[10px] uppercase tracking-wide text-text-muted">Source</span>
                {roleLabel(context?.source_role)}
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-text-muted opacity-70" aria-hidden />
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background-light/60 px-2.5 py-1 text-[11px] font-medium text-text-heading shadow-sm">
                <span className="text-[10px] uppercase tracking-wide text-text-muted">Target</span>
                {roleLabel(context?.target_role)}
              </span>
            </div>
          </div>
          <ReferrerHeaderCompact professional={context?.source_professional} />
        </div>
      </div>

      {referralPending ? (
        <div className="rounded-lg border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900/90">Action needed</p>
              <p className="mt-1 text-sm leading-snug text-text-body">
                {isTarget
                  ? "Review the referrer’s notes, then accept (adds the lead to your workspace) or reject."
                  : "Only the assigned recipient can accept or reject this referral."}
              </p>
            </div>
            {isTarget ? (
              <button
                type="button"
                onClick={() => setProcessModalOpen(true)}
                disabled={processMutation.isPending || rejectMutation.isPending}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-50"
              >
                Review and process
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {referralRejected ? (
        <div className="space-y-4">
          {leadDetailsCard}
          <p className="rounded-lg border border-border/60 bg-background-light/40 px-3 py-2.5 text-sm text-text-muted leading-relaxed">
            This referral was rejected. The information above is for reference only.
          </p>
        </div>
      ) : referralCompleted ? (
        <div className="space-y-4">
          {leadDetailsCard}
          <p className="rounded-lg border border-border/60 bg-background-light/40 px-3 py-2.5 text-sm text-text-muted leading-relaxed">
            This referral is marked completed.
          </p>
        </div>
      ) : referralAccepted ? (
        isOutboundReferral ? (
          <div className="space-y-4">
            {leadDetailsCard}
            <p className="rounded-lg border border-border/60 bg-background-light/40 px-3 py-2.5 text-sm text-text-muted leading-relaxed">
              Outbound referral — view only. The recipient manages actions, nurture email, and notes in their
              workspace after they accept.
            </p>
          </div>
        ) : fromPipelineReferrals ? (
          <div className="space-y-4">
            {toolkitTabStrip}
            {referralPipelineManagementPanel}
            {detailTab === "details" ? leadDetailsCard : null}
            {detailTab === "nurture" ? nurturePanel : null}
            {detailTab === "notes" ? notesPanel : null}
          </div>
        ) : (
          <div className="space-y-4">
            {leadDetailsCard}
            <div className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-text-body">
                For this accepted referral: use the workspace for nurture email and pipeline notes.
              </p>
              {pipelineWorkspaceHref ? (
                <Link
                  href={pipelineWorkspaceHref}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:min-w-[12rem]"
                >
                  Open workspace · Notes
                </Link>
              ) : null}
            </div>
            <p className="text-xs leading-relaxed text-text-muted">
              Or go to{" "}
              <Link
                href="/leads?pipeline=referrals"
                className="font-semibold text-primary hover:text-primary-dark hover:underline"
              >
                Leads → Pipeline → Referrals
              </Link>{" "}
              and click this referral&apos;s row to reopen this page; then switch to the{" "}
              <span className="font-medium text-text-heading">Notes</span> tab.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {leadDetailsCard}
          {isTarget ? (
            <p className="rounded-lg border border-border/60 bg-background-light/40 px-3 py-2.5 text-sm text-text-muted leading-relaxed">
              Use <span className="font-semibold text-text-heading">Review and process</span> above to open the decision
              dialog (notes, accept, or reject).
            </p>
          ) : (
            <p className="rounded-lg border border-border/60 bg-background-light/40 px-3 py-2.5 text-sm text-text-muted leading-relaxed">
              This referral is waiting on the recipient. They will use <span className="font-semibold text-text-heading">Review and process</span> on their inbound view.
            </p>
          )}
        </div>
      )}

      {processModalOpen && referralPending && isTarget ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-process-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProcessModalOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="referral-process-title" className="text-lg font-semibold text-text-heading">
              Process this referral
            </h3>
            <p className="mt-1 text-sm text-text-muted leading-relaxed">
              Read the notes from the referrer, then accept the lead into your account or reject the referral.
            </p>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Notes from referrer</p>
              <div className="mt-1.5 min-h-[4rem] rounded-lg border border-border/70 bg-background-light/50 px-3 py-2.5 text-sm leading-relaxed text-text-heading whitespace-pre-wrap">
                {referrerNotesDisplay || "No notes were added when this referral was sent."}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                disabled={processMutation.isPending || rejectMutation.isPending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-heading transition hover:bg-background-light disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate()}
                disabled={processMutation.isPending || rejectMutation.isPending}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </button>
              <button
                type="button"
                onClick={() => processMutation.mutate()}
                disabled={processMutation.isPending || rejectMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50"
              >
                {processMutation.isPending ? "Accepting…" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
