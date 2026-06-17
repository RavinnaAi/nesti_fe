"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Mail, User } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchLeadProfileById, fetchLeadsByProfileId } from "@/lib/leadsClient";
import { formatLeadIntakeSlug } from "@/lib/leadsPageUtils";
import {
  postNurtureDraft,
  postNurturePreview,
  postNurtureRefine,
  sendNurtureEmail,
} from "@/lib/chatClient";
import { BudgetCell, getBudgetDisplay } from "@/components/clients/clientProfileBudget";
import { AppointmentStatusChip } from "@/components/clients/AppointmentStatusChip";
import { ClientProfileCardSkeleton, ProfileLeadsTableSkeleton } from "@/components/ui/ContentSkeletons";
import LeadsNurtureTab from "@/components/leads/LeadsNurtureTab";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

function humanize(value) {
  if (value == null || value === "") return "—";
  const raw = String(value).trim();
  const token = raw.toLowerCase().replace(/\s+/g, "_");
  const mortgageTokenMap = {
    "20_plus": "20%+",
    "10_19": "10-19%",
    "5_9": "5-9%",
    "under_5": "Under 5%",
    "no_savings": "No savings yet",
  };
  if (mortgageTokenMap[token]) return mortgageTokenMap[token];
  if (/^\d+_\d+$/.test(raw)) {
    const [a, b] = raw.split("_");
    return `${a}–${b}`;
  }
  const slug = formatLeadIntakeSlug(value);
  if (slug) return slug;
  return String(value).replace(/_/g, " ");
}

function formatBudgetValue(value) {
  if (value == null || value === "") return "N/A";
  const raw = String(value).trim();
  const token = raw.toLowerCase().replace(/\s+/g, "_");
  const tokenMap = {
    under_400k: "Under $400K",
    "400k_700k": "$400K-$700K",
    "700k_1m": "$700K-$1M",
    "1m_plus": "$1M+",
  };
  if (tokenMap[token]) return tokenMap[token];
  if (/[a-z]/i.test(raw) && !/^\$?\d[\d,]*(\.\d+)?$/.test(raw)) {
    return humanize(raw);
  }
  const num = Number(raw.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(num)) return raw;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ClientProfileLeadsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = String(params?.profileId || "").trim();
  const clientProfilePath = profileId ? `/clients/${encodeURIComponent(profileId)}` : "/clients";
  const leadWorkspaceHref = (leadId) =>
    `/leads/${encodeURIComponent(leadId)}?back=${encodeURIComponent(clientProfilePath)}`;
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [nurtureForm, setNurtureForm] = useState({
    to_email: "",
    subject: "",
    body: "",
    refine_instruction: "",
    goal: "",
    tone: "",
    include_property_cards: true,
  });
  const [resolvedLeadMatchId, setResolvedLeadMatchId] = useState(null);
  const pageSize = useDynamicTablePageSize({
    minRows: 10,
    maxRows: 24,
    rowHeight: 42,
    reserveHeight: 250,
  });
  /** 'leads' | 'nurture' — nurture opens the email composer in its own tab. */
  const [clientWorkspaceTab, setClientWorkspaceTab] = useState("leads");

  useEffect(() => setHydrated(true), []);
  useEffect(() => setPage(1), [profileId]);
  useEffect(() => setClientWorkspaceTab("leads"), [profileId]);

  const profileQuery = useQuery({
    queryKey: ["lead-profile", profileId, pageSize, token],
    enabled: Boolean(token && profileId),
    queryFn: () =>
      fetchLeadProfileById({
        token,
        profileId,
        include: "leads,nurture_logs",
        page: 1,
        limit: pageSize,
      }),
  });

  const leadsQuery = useQuery({
    queryKey: ["lead-profile-leads", profileId, page, pageSize, token],
    enabled: Boolean(token && profileId && page > 1),
    queryFn: () =>
      fetchLeadsByProfileId({
        token,
        profileId,
        page,
        limit: pageSize,
      }),
    placeholderData: (p) => p,
  });

  const profile = profileQuery.data?.lead_profile;
  const leadsSource = page === 1 ? profileQuery.data : leadsQuery.data;
  const profileProfessionalType = String(
    profile?.professional_type || profile?.ownership?.professional_type || "",
  )
    .trim()
    .toLowerCase();
  const isLawyerProfile = profileProfessionalType === "lawyer";
  const isMortgageBrokerProfile = profileProfessionalType === "mortgage_broker";
  const leads = useMemo(() => {
    const raw = leadsSource?.leads;
    return Array.isArray(raw) ? raw : [];
  }, [leadsSource]);
  const tableRows = useMemo(() => {
    if (leads.length >= pageSize) return leads;
    return [...leads, ...Array.from({ length: pageSize - leads.length }, () => null)];
  }, [leads, pageSize]);

  const pagination = leadsSource?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages || 1);
  const total = Number(pagination.total || leads.length || 0);
  const linkedCountLabel = total;
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(pagination.has_next_page || currentPage < totalPages);
  const leadsFetching = page === 1 ? profileQuery.isFetching : leadsQuery.isFetching;

  const displayName = useMemo(() => {
    const c = profile?.contact || {};
    return (
      String(c.full_name || c.name || "").trim() ||
      String(c.email || "").trim() ||
      "Client profile"
    );
  }, [profile]);

  const budgetDisplay = profile ? getBudgetDisplay(profile) : null;

  const hasLinkedLeads = useMemo(() => {
    if (!profile) return false;
    const t = Number(pagination.total || 0);
    if (Number.isFinite(t) && t > 0) return true;
    if (leads.length > 0) return true;
    const refs = Array.isArray(profile.lead_refs) ? profile.lead_refs.length : 0;
    return refs > 0;
  }, [profile, pagination.total, leads.length]);

  useEffect(() => {
    setNurtureForm({
      to_email: "",
      subject: "",
      body: "",
      refine_instruction: "",
      goal: "",
      tone: "",
      include_property_cards: true,
    });
    setResolvedLeadMatchId(null);
  }, [profileId]);

  const nurtureSuggestedEmail = useMemo(() => {
    const c = profile?.contact || {};
    const raw = c?.email || c?.canonical_email || "";
    return String(raw || "").trim();
  }, [profile]);

  useEffect(() => {
    if (!profileId || !nurtureSuggestedEmail) return;
    setNurtureForm((prev) => {
      if (prev.to_email.trim()) return prev;
      return { ...prev, to_email: nurtureSuggestedEmail };
    });
  }, [profileId, nurtureSuggestedEmail]);

  const nurtureLogsQuery = useQuery({
    queryKey: ["chat-nurture-logs", token, "profile", profileId],
    enabled: Boolean(token && profileId && profileQuery.isSuccess),
    queryFn: () => fetchNurtureLogs({ token, leadProfileId: profileId }),
  });

  const nurtureLogs = useMemo(() => normalizeList(nurtureLogsQuery.data), [nurtureLogsQuery.data]);

  const nurtureLogsInvalidateKey = useMemo(
    () => ["chat-nurture-logs", token, "profile", profileId],
    [token, profileId],
  );

  const nurtureDraftMutation = useMutation({
    mutationFn: () =>
      postNurtureDraft({
        token,
        payload: {
          lead_profile_id: profileId,
          goal: nurtureForm.goal?.trim() || undefined,
          tone: nurtureForm.tone?.trim() || undefined,
        },
      }),
    onSuccess: (data) => {
      const mid = data?.lead_match_id;
      if (mid) setResolvedLeadMatchId(String(mid));
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
          lead_profile_id: profileId,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          instruction: nurtureForm.refine_instruction.trim(),
        },
      }),
    onSuccess: (data) => {
      const mid = data?.lead_match_id;
      if (mid) setResolvedLeadMatchId(String(mid));
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
          lead_profile_id: profileId,
          to_email: nurtureForm.to_email?.trim() || undefined,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
        },
      }),
    onSuccess: (data) => {
      const mid = data?.lead_match_id;
      if (mid) setResolvedLeadMatchId(String(mid));
      toast.success("Nurture email sent");
      queryClient.invalidateQueries({ queryKey: nurtureLogsInvalidateKey });
    },
    onError: (err) => toast.error(err?.message || "Failed to send nurture email"),
  });

  const nurturePreviewMutation = useMutation({
    mutationFn: () =>
      postNurturePreview({
        token,
        payload: {
          lead_profile_id: profileId,
          subject: nurtureForm.subject,
          body: nurtureForm.body,
          include_property_cards: nurtureForm.include_property_cards,
        },
      }),
    onSuccess: (data) => {
      const mid = data?.lead_match_id;
      if (mid) setResolvedLeadMatchId(String(mid));
    },
    onError: (err) => toast.error(err?.message || "Failed to build email preview"),
  });

  const resolvedWorkspaceLeadHref =
    resolvedLeadMatchId && profileId ? leadWorkspaceHref(resolvedLeadMatchId) : null;

  if (!hydrated) {
    return (
      <div className="min-h-[40vh] bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-2 pb-3 pt-4 sm:px-3 sm:pb-4 sm:pt-5">
        <div className="w-full space-y-3">
          <ClientProfileCardSkeleton />
          <p className="text-center text-[11px] font-medium text-primary">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-2 pb-3 pt-4 font-body antialiased sm:px-3 sm:pb-4 sm:pt-5">
      <div className="w-full shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
          >
            <ArrowLeft size={14} />
            Back to clients
          </Link>
        </div>

        {profileQuery.isLoading ? (
          <ClientProfileCardSkeleton />
        ) : profileQuery.isError ? (
          <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-text-muted">
            {profileQuery.error?.message || "Could not load this profile."}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-heading text-base font-bold capitalize text-text-heading sm:text-lg">
                      {displayName}
                    </h1>
                    <p className="mt-1 text-[11px] text-text-muted sm:text-xs">
                      Profile ID: <span className="font-mono text-text-heading">{profileId}</span>
                    </p>
                    {profile?.contact?.email ? (
                      <a
                        href={`mailto:${encodeURIComponent(profile.contact.email)}`}
                        className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                      >
                        {profile.contact.email}
                      </a>
                    ) : null}
                    {profile?.contact?.phone ? (
                      <p className="mt-0.5 text-xs font-medium text-text-muted">{profile.contact.phone}</p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Budget</p>
                  <div className="mt-0.5">
                    {budgetDisplay ? (
                      <BudgetCell display={budgetDisplay} />
                    ) : (
                      <span className="text-sm font-semibold text-text-muted">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-border/70 pt-2">
                <table className="w-full border-collapse">
                  <tbody>
                    {isMortgageBrokerProfile ? (
                      <>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Timeline</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              profile?.qualification?.mortgage_timeline || profile?.property?.timeline,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Pre-approval
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.pre_approval_status)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Credit range
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium tabular-nums text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.credit_score_range)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Employment
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.employment_status)}
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Income</th>
                          <td className="px-2 py-1 text-[10px] font-medium tabular-nums text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.household_income)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Down payment
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.down_payment_readiness)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Purpose</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.purchase_purpose)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Urgency</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.qualification?.urgency_signal)}
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Location</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.property?.location)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Address</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.property?.address)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Preferred
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.contact?.preferred_contact_method)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Best time
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.contact?.best_time_to_contact)}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Leads linked
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium tabular-nums text-text-body sm:text-[11px]">
                            {linkedCountLabel}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            Appointment
                          </th>
                          <td className="px-2 py-1 align-middle sm:text-[11px]">
                            <AppointmentStatusChip status={profile?.appointment_status || "not_booked"} />
                          </td>
                          <td className="px-2 py-1" colSpan={4} />
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Transaction stage" : "Intent"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.transaction_stage
                                : profile?.intent,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Location</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.property?.location)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Closing timeline" : "Timeline"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.closing_timeline
                                : profile?.property?.timeline,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Appointment</th>
                          <td className="px-2 py-1 align-middle sm:text-[11px]">
                            <AppointmentStatusChip status={profile?.appointment_status || "not_booked"} />
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Leads linked</th>
                          <td className="px-2 py-1 text-[10px] font-medium tabular-nums text-text-body sm:text-[11px]">
                            {linkedCountLabel}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Address</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.property?.address)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Transaction type" : "Type"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.transaction_type
                                : profile?.property?.property_type,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Preferred</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.contact?.preferred_contact_method)}
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">Best time</th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(profile?.contact?.best_time_to_contact)}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Property value" : "Mortgage"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.property_value
                                : profile?.qualification?.mortgage_status,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Legal services" : "Realtor"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.legal_services_needed
                                : profile?.qualification?.realtor_status,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "First-time buyer" : "Viewing"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.first_time_buyer
                                : profile?.qualification?.viewing_readiness,
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Realtor involved" : "Motivation"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.realtor_involved
                                : profile?.qualification?.motivation_reason,
                            )}
                          </td>
                          <th className="px-2 py-1 text-left text-[10px] font-medium text-text-muted">
                            {isLawyerProfile ? "Mortgage status" : "Urgency"}
                          </th>
                          <td className="px-2 py-1 text-[10px] font-medium capitalize text-text-body sm:text-[11px]">
                            {humanize(
                              isLawyerProfile
                                ? profile?.qualification?.mortgage_status
                                : profile?.qualification?.urgency_readiness,
                            )}
                          </td>
                          <td className="px-2 py-1" colSpan={4} />
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 rounded-lg border border-border/90 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setClientWorkspaceTab("leads")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:flex-none sm:justify-start sm:px-4 ${
                  clientWorkspaceTab === "leads"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-slate-100"
                }`}
              >
                Leads
              </button>
              <button
                type="button"
                onClick={() => setClientWorkspaceTab("nurture")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:flex-none sm:justify-start sm:px-4 ${
                  clientWorkspaceTab === "nurture"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-slate-100"
                }`}
              >
                <Mail size={14} className="shrink-0 opacity-90" aria-hidden />
                Nurture email
              </button>
            </div>

            {clientWorkspaceTab === "nurture" ? (
              <div className="overflow-hidden rounded-lg border border-border/90 bg-white shadow-sm p-2 sm:p-3">
                <LeadsNurtureTab
                  nurtureForm={nurtureForm}
                  setNurtureForm={setNurtureForm}
                  nurtureMutation={nurtureMutation}
                  nurtureDraftMutation={nurtureDraftMutation}
                  nurturePreviewMutation={nurturePreviewMutation}
                  nurtureRefineMutation={nurtureRefineMutation}
                  selectedLeadId={null}
                  leadProfileId={profileId}
                  nurtureEnabled={hasLinkedLeads}
                  logsEnabled
                  actionConversationId=""
                  nurtureLogs={nurtureLogs}
                  nurtureLogsLoading={profileQuery.isLoading}
                  composeEmptyMessage="No lead workspace linked to this client yet. Add or open a lead from the Leads tab before composing a nurture email."
                  logsEmptyListMessage="No nurture emails logged for this client yet."
                  headerDescription="Send from this client profile: draft uses your most recently active lead workspace for context and listing cards, then refine and send with your workspace email configuration."
                  resolvedWorkspaceLeadHref={resolvedWorkspaceLeadHref || undefined}
                />
              </div>
            ) : null}

            {clientWorkspaceTab === "leads" ? (
            <div className="overflow-hidden rounded-lg border border-border/90 bg-white shadow-sm">
              <div className="border-b border-border bg-primary/[0.04] px-2.5 py-1.5">
                <h2 className="font-heading text-sm font-semibold text-text-heading">Leads for this profile</h2>
                <p className="text-[10px] text-text-muted sm:text-[11px]">
                  Open a lead in the workspace for conversation and property matches, or switch to the Nurture
                  email tab to compose from this client.
                </p>
              </div>

              {(page === 1 ? profileQuery.isLoading : leadsQuery.isLoading && !leadsQuery.data) ? (
                <div className="px-2 py-4 sm:px-3">
                  <ProfileLeadsTableSkeleton
                    rows={pageSize}
                    variant={
                      isMortgageBrokerProfile ? "mortgage_broker" : isLawyerProfile ? "lawyer" : "agent"
                    }
                  />
                  <p className="mt-3 flex items-center gap-2 text-[10px] font-medium text-primary sm:text-[11px]">
                    <span
                      className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                      aria-hidden
                    />
                    Loading leads for this profile…
                  </p>
                </div>
              ) : leads.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-text-muted">
                  {leadsSource?.empty_state?.reason || "No leads linked to this profile yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold capitalize tracking-wide text-text-muted">
                        {!isMortgageBrokerProfile ? (
                          <>
                            <th className="px-2 py-1.5">{isLawyerProfile ? "Stage" : "Intent"}</th>
                            <th className="px-2 py-1.5">{isLawyerProfile ? "Transaction" : "Type"}</th>
                          </>
                        ) : null}
                        <th className="px-2 py-1.5">Location</th>
                        <th className="px-2 py-1.5">
                          {isLawyerProfile ? "Closing" : "Timeline"}
                        </th>
                        <th className="px-2 py-1.5 pr-3 text-right">
                          {isLawyerProfile ? "Value" : "Budget"}
                        </th>
                        {isMortgageBrokerProfile ? (
                          <>
                            <th className="px-2 py-1.5">Pre-approval</th>
                            <th className="px-2 py-1.5">Credit</th>
                          </>
                        ) : null}
                        <th className="px-2 py-1.5 pl-3">Grade</th>
                        <th className="px-2 py-1.5 text-center">Score</th>
                        <th className="px-2 py-1.5">Preferred</th>
                        <th className="px-2 py-1.5">Best time</th>
                        <th className="px-2 py-1.5">Appointment</th>
                        <th className="px-2 py-1.5 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {tableRows.map((lead, rowIndex) => {
                        if (!lead) {
                          return (
                            <tr key={`client-leads-empty-row-${rowIndex}`}>
                              {Array.from({ length: 11 }).map((_, cellIdx) => (
                                <td
                                  key={`client-leads-empty-cell-${rowIndex}-${cellIdx}`}
                                  className="px-2 py-1.5"
                                >
                                  <span className="invisible">—</span>
                                </td>
                              ))}
                            </tr>
                          );
                        }
                        const prop = lead.property || {};
                        const qual = lead.qualification || {};
                        const conversionProp = lead.conversion?.property || {};
                        const rowPropertyType =
                          conversionProp.property_type || conversionProp.type || prop.property_type || prop.type;
                        const rowLocation = conversionProp.location || conversionProp.area || prop.location;
                        const rowTimeline = conversionProp.timeline || prop.timeline;
                        const rowTransactionStage = qual.transaction_stage;
                        const rowTransactionType = qual.transaction_type;
                        const rowClosingTimeline = qual.closing_timeline || rowTimeline;
                        const rowPropertyValue = qual.property_value;
                        const rowBudget =
                          conversionProp.budget ||
                          conversionProp.property_budget ||
                          prop.budget ||
                          prop.expected_price;
                        const rowMortgageTimeline = qual.mortgage_timeline || rowTimeline;
                        const rowPreApproval = qual.pre_approval_status;
                        const rowCredit = qual.credit_score_range;
                        return (
                          <tr
                            key={lead.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(leadWorkspaceHref(lead.id))}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                router.push(leadWorkspaceHref(lead.id));
                              }
                            }}
                            className="hover:bg-primary/[0.06] cursor-pointer"
                          >
                            {!isMortgageBrokerProfile ? (
                              <>
                                <td className="px-2 py-1.5 text-[10px] font-medium capitalize text-text-heading sm:text-[11px]">
                                  {isLawyerProfile
                                    ? humanize(rowTransactionStage)
                                    : lead.intent && lead.intent !== "unspecified"
                                      ? humanize(lead.intent)
                                      : "—"}
                                </td>
                                <td className="px-2 py-1.5 text-[10px] capitalize text-text-heading sm:text-[11px]">
                                  {isLawyerProfile ? humanize(rowTransactionType) : humanize(rowPropertyType)}
                                </td>
                              </>
                            ) : null}
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(rowLocation)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {isLawyerProfile
                                ? humanize(rowClosingTimeline)
                                : isMortgageBrokerProfile
                                  ? humanize(rowMortgageTimeline)
                                  : humanize(rowTimeline)}
                            </td>
                            <td className="px-2 py-1.5 pr-3 text-right text-[10px] font-medium tabular-nums text-text-heading sm:text-[11px]">
                              {isLawyerProfile
                                ? humanize(rowPropertyValue)
                                : formatBudgetValue(rowBudget)}
                            </td>
                            {isMortgageBrokerProfile ? (
                              <>
                                <td className="px-2 py-1.5 text-[10px] font-medium capitalize text-text-heading sm:text-[11px]">
                                  {humanize(rowPreApproval)}
                                </td>
                                <td className="px-2 py-1.5 text-[10px] font-medium tabular-nums text-text-heading sm:text-[11px]">
                                  {humanize(rowCredit)}
                                </td>
                              </>
                            ) : null}
                            <td className="px-2 py-1.5 pl-3 text-[10px] font-medium capitalize text-text-heading sm:text-[11px]">
                              {humanize(lead.grade)}
                            </td>
                            <td className="px-2 py-1.5 text-center text-[10px] tabular-nums text-text-heading sm:text-[11px]">
                              {lead.score ?? "—"}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(lead?.contact?.preferred_contact_method)}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] capitalize text-text-muted sm:text-[11px]">
                              {humanize(lead?.contact?.best_time_to_contact)}
                            </td>
                            <td className="px-2 py-1.5 align-middle sm:text-[11px]">
                              <AppointmentStatusChip status={lead?.appointment_status || "not_booked"} />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Link
                                href={leadWorkspaceHref(lead.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline sm:text-[11px]"
                              >
                                Open
                                <ExternalLink size={12} className="opacity-70" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {leads.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-background-light/40 px-3 py-2.5">
                  <p className="text-xs text-text-muted">
                    Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                    <span className="font-semibold text-text-heading">{totalPages}</span>
                    {" · "}
                    <span className="font-semibold text-text-heading">{total}</span> leads
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasPrev || leadsFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!hasNext || leadsFetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
