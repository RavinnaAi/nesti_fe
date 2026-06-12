"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, DollarSign, Inbox, Mail, MessageCircle, Scale, Share2, Users, X } from "lucide-react";
import { toast } from "react-toastify";
import LeadActionSection from "@/components/leads/LeadActionSection";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { fetchProfessionals } from "@/lib/professionalsClient";
import { createInviteLink } from "@/lib/inviteClient";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

/** Same role ids + labels as `DashboardProfessionalsTabs` (Agents / Lawyers / Mortgage Brokers). */
const PROFESSIONAL_ROLE_OPTIONS = [
  { value: "agent", label: "Agents", icon: Users },
  { value: "lawyer", label: "Lawyers", icon: Scale },
  { value: "mortgage_broker", label: "Mortgage Brokers", icon: DollarSign },
];

function displayProfessionalName(row) {
  const full = String(row?.full_name || "").trim();
  if (full) return full;
  const joined = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return joined || "Unnamed professional";
}

function initialsForProfessional(row) {
  const name = displayProfessionalName(row);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";
}

/** Maps stored target_vertical (new + legacy) to a short label. */
function formatReferralVerticalLabel(v) {
  const raw = String(v || "").trim().toLowerCase();
  const map = {
    agent: "Agents",
    realtor: "Realtor",
    lawyer: "Lawyers",
    mortgage_broker: "Mortgage brokers",
    mortgage: "Mortgage broker",
  };
  if (map[raw]) return map[raw];
  return raw ? raw.replace(/_/g, " ") : "Referral";
}

export default function LeadsActionsTab({
  token,
  referralForm,
  setReferralForm,
  createReferralMutation,
  selectedLeadId,
  actionConversationId,
  conversationReferrals,
  activeReferralId,
  setActiveReferralId,
}) {
  const { hasFeature } = useFeatureAccess();
  const canUseReferralInviteLinks = hasFeature(FEATURES.REFERRALS_INVITES);
  const [referralsPage, setReferralsPage] = useState(1);
  const [openReferralDetails, setOpenReferralDetails] = useState(null);
  const role = referralForm?.professional_role ?? "";
  const referralsRowsPerPage = 6;
  const [leadInviteShareUrl, setLeadInviteShareUrl] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const professionalsQuery = useQuery({
    queryKey: ["referral-professionals", token, role],
    enabled: Boolean(token && role),
    queryFn: () =>
      fetchProfessionals({
        token,
        role,
        page: 1,
        limit: 100,
      }),
    staleTime: 60_000,
  });
  const createLeadInviteMutation = useMutation({
    mutationFn: () =>
      createInviteLink({
        token,
        payload: {
          source_channel: "lead_referral",
          source_conversation_id: actionConversationId || undefined,
          intended_role: role || undefined,
          intended_audience: "professional",
          metadata: {
            origin: "lead_actions_tab",
            lead_match_id: selectedLeadId || "",
          },
        },
      }),
    onSuccess: (data) => {
      const shareUrl = String(data?.share_url || data?.invite?.share_url || "").trim();
      setLeadInviteShareUrl(shareUrl);
      setShareModalOpen(true);
      toast.success("Referral link generated.");
    },
    onError: (error) => {
      toast.error(error?.message || "Could not create lead invite link.");
    },
  });

  const professionals = useMemo(() => {
    const raw = professionalsQuery.data?.items;
    return Array.isArray(raw) ? raw : [];
  }, [professionalsQuery.data?.items]);
  const selectedProfessionalId = String(referralForm?.target_user_id || "").trim();
  const selectedProfessional = useMemo(
    () => professionals.find((row) => String(row?.id || "") === selectedProfessionalId) || null,
    [professionals, selectedProfessionalId]
  );

  const hasActiveReferralForSelectedProfessional = useMemo(
    () =>
      conversationReferrals.some((r) => {
        const targetId = String(r?.target_user_id || "").trim();
        const s = String(r?.status || "").trim().toLowerCase();
        if (!targetId || targetId !== selectedProfessionalId) return false;
        return s === "pending" || s === "accepted";
      }),
    [conversationReferrals, selectedProfessionalId]
  );

  const canSubmitReferral =
    Boolean(selectedLeadId && String(referralForm?.target_user_id || "").trim()) &&
    !hasActiveReferralForSelectedProfessional &&
    !createReferralMutation.isPending;
  const sortedReferrals = useMemo(() => {
    return [...conversationReferrals].sort((a, b) => {
      const aTs = new Date(a?.updated_at || a?.created_at || 0).getTime();
      const bTs = new Date(b?.updated_at || b?.created_at || 0).getTime();
      return bTs - aTs;
    });
  }, [conversationReferrals]);
  const referralsTotalPages = Math.max(1, Math.ceil(sortedReferrals.length / referralsRowsPerPage));
  const safeReferralsPage = Math.min(referralsPage, referralsTotalPages);
  const paginatedReferrals = useMemo(() => {
    const start = (safeReferralsPage - 1) * referralsRowsPerPage;
    return sortedReferrals.slice(start, start + referralsRowsPerPage);
  }, [safeReferralsPage, sortedReferrals]);
  const referralsEmptyRowCount = Math.max(0, referralsRowsPerPage - paginatedReferrals.length);
  const hasPrevReferralsPage = safeReferralsPage > 1;
  const hasNextReferralsPage = safeReferralsPage < referralsTotalPages;
  const shareText = leadInviteShareUrl
    ? `Join Nesti via this referral link: ${leadInviteShareUrl}`
    : "";
  const shareLinks = {
    email: leadInviteShareUrl
      ? `mailto:?subject=${encodeURIComponent(
          "Join my Nesti referral network"
        )}&body=${encodeURIComponent(shareText)}`
      : "#",
    whatsapp: leadInviteShareUrl
      ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
      : "#",
    sms: leadInviteShareUrl
      ? `sms:?body=${encodeURIComponent(shareText)}`
      : "#",
    social: leadInviteShareUrl
      ? `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`
      : "#",
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
      <LeadActionSection
        title="Referrals"
        subtitle="Connect this lead to another professional."
        className="lg:flex lg:h-[26rem] lg:flex-col"
        headerAction={
          canUseReferralInviteLinks ? (
            <button
              type="button"
              onClick={() => {
                if (leadInviteShareUrl) {
                  setShareModalOpen(true);
                  return;
                }
                createLeadInviteMutation.mutate();
              }}
              disabled={!token || createLeadInviteMutation.isPending}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/25 bg-white text-primary-dark transition hover:bg-primary/[0.08] disabled:opacity-50"
              aria-label="Share referral link"
              title="Share referral link"
            >
              <Share2 size={13} />
            </button>
          ) : null
        }
      >
        <div className="flex h-full min-h-0 flex-col gap-3.5">
          <div className="space-y-3.5">
          <SelectDropdown
            placeholder="Professional type"
            value={role}
            onChange={(value) =>
              setReferralForm((prev) => ({
                ...prev,
                professional_role: value,
                target_user_id: "",
              }))
            }
            options={PROFESSIONAL_ROLE_OPTIONS}
            size="small"
          />

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Refer to (one)
            </p>
            <div className="overflow-hidden rounded-lg border border-border bg-background-light/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
              {!role ? (
                <div className="px-2.5 py-2 text-[11px] leading-snug text-text-muted">
                  Select a professional type above to load colleagues you can refer to.
                </div>
              ) : professionalsQuery.isLoading ? (
                <div className="px-2.5 py-2 text-[11px] text-text-muted">Loading professionals…</div>
              ) : professionalsQuery.isError ? (
                <div className="px-2.5 py-2 text-[11px] text-red-600">
                  {professionalsQuery.error?.message || "Could not load professionals."}
                </div>
              ) : professionals.length === 0 ? (
                <div className="px-2.5 py-3">
                  <div className="rounded-lg border border-border/70 bg-background-light/40 px-3 py-4 text-center">
                    <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Users size={14} />
                    </span>
                    <p className="text-[11px] font-semibold text-text-heading">No professionals found yet</p>
                    <p className="mt-1 text-[10px] leading-snug text-text-muted">
                      Add professionals for this role, then you can send a referral.
                    </p>
                  </div>
                </div>
              ) : selectedProfessional ? (
                <div className="flex items-center gap-1.5 px-1.5 py-1">
                  <input
                    type="radio"
                    name="referral-target-professional"
                    checked
                    onChange={() => {}}
                    aria-label={`Refer lead to ${displayProfessionalName(selectedProfessional)}`}
                    title="Selected recipient"
                    className="h-3.5 w-3.5 shrink-0 cursor-default accent-primary"
                  />
                  <Link
                    href={`/professionals/${encodeURIComponent(String(selectedProfessional.id || ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded py-0.5 text-left text-text-heading outline-none ring-offset-1 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    {selectedProfessional.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs from profile
                      <img
                        src={selectedProfessional.profile_image}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/12">
                        {initialsForProfessional(selectedProfessional)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight underline-offset-2 hover:underline">
                      {displayProfessionalName(selectedProfessional)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReferralForm((prev) => ({ ...prev, target_user_id: "" }))}
                    className="shrink-0 rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-heading"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <ul className="max-h-44 divide-y divide-border/60 overflow-y-auto bg-white/40">
                  {professionals.map((row) => {
                    const id = String(row?.id || "");
                    const labelName = displayProfessionalName(row);
                    const selected = Boolean(id && String(referralForm?.target_user_id || "") === id);
                    return (
                      <li key={id || labelName}>
                        <div className="flex items-center gap-1.5 px-1.5 py-1">
                          <input
                            type="radio"
                            name="referral-target-professional"
                            checked={selected}
                            onChange={() =>
                              setReferralForm((prev) => ({ ...prev, target_user_id: id }))
                            }
                            aria-label={`Refer lead to ${labelName}`}
                            title="Choose recipient"
                            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary"
                          />
                          <Link
                            href={`/professionals/${encodeURIComponent(id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 flex-1 items-center gap-1.5 rounded py-0.5 text-left text-text-heading outline-none ring-offset-1 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            {row.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs from profile
                              <img
                                src={row.profile_image}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                              />
                            ) : (
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/12">
                                {initialsForProfessional(row)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight underline-offset-2 hover:underline">
                              {labelName}
                            </span>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white/70 p-1.5">
            <textarea
              value={referralForm.notes || ""}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Notes (optional)"
              rows={5}
              className="w-full min-w-0 rounded-md border border-transparent bg-white px-2 py-1.5 text-[11px] placeholder:text-text-muted focus:border-border lg:h-[8.75rem] lg:min-h-[8.75rem] lg:max-h-[8.75rem]"
            />
          </div>

          {selectedProfessionalId && hasActiveReferralForSelectedProfessional ? (
            <p className="text-[11px] leading-snug text-amber-800">
              This lead is already referred to this professional (pending or accepted). You can still
              refer this lead to a different professional.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => createReferralMutation.mutate()}
            disabled={!canSubmitReferral}
            className="h-9 w-full shrink-0 rounded-md bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-semibold shadow-sm transition hover:shadow-md disabled:opacity-50"
          >
            {createReferralMutation.isPending ? "Saving..." : "Send referral"}
          </button>

        </div>
        </div>

      </LeadActionSection>

      <LeadActionSection
        title="Previous referrals"
        subtitle="History of referrals for this lead."
        className="lg:flex lg:h-[26rem] lg:flex-col"
      >
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          <div className="h-full overflow-auto">
            <table className="w-full table-auto border-collapse text-left text-[11px]">
              <thead className="sticky top-0 bg-primary/[0.06] text-[10px] uppercase tracking-wide text-text-muted backdrop-blur-sm">
                <tr>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Referred to</th>
                  <th className="px-2 py-2 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedReferrals.length === 0 ? (
                  <tr>
                    <td className="px-2 py-3" colSpan={4}>
                      <div className="mx-auto my-2 max-w-sm rounded-lg border border-border/70 bg-background-light/40 px-4 py-5 text-center">
                        <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Inbox size={14} />
                        </span>
                        <p className="text-xs font-semibold text-text-heading">No referrals yet for this lead</p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          Create a referral from this panel to see history here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReferrals.map((referral) => {
                    const id = String(referral?.id || "");
                    const selected = id && id === String(activeReferralId || "");
                    const referredTo = referral?.target_professional || null;
                    const referredToName = String(
                      referredTo?.full_name ||
                        [referredTo?.first_name, referredTo?.last_name].filter(Boolean).join(" ")
                    ).trim() || "—";
                    const referredToAvatar = String(referredTo?.profile_image || "").trim();
                    const referredToInitials =
                      referredToName === "—"
                        ? "—"
                        : referredToName
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() || "")
                            .join("");
                    const updatedAtRaw = referral?.updated_at || referral?.created_at;
                    const updatedAt = updatedAtRaw
                      ? new Date(updatedAtRaw).toLocaleString()
                      : "—";
                    return (
                      <tr
                        key={id || JSON.stringify(referral)}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setActiveReferralId(id);
                          setOpenReferralDetails(referral);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveReferralId(id);
                            setOpenReferralDetails(referral);
                          }
                        }}
                        className={`cursor-pointer border-t border-border/60 transition-colors ${
                          selected ? "bg-primary/10" : "hover:bg-primary/[0.04]"
                        }`}
                      >
                        <td className="px-2 py-2 font-medium text-text-heading">
                          {formatReferralVerticalLabel(referral?.target_vertical)}
                        </td>
                        <td className="px-2 py-2 text-text-body">{String(referral?.status || "—")}</td>
                        <td className="px-2 py-2 text-text-body">
                          <div className="flex items-center gap-2">
                            {referredToAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element -- remote CDN avatar URL
                              <img
                                src={referredToAvatar}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border/70"
                              />
                            ) : (
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.10] text-[9px] font-bold text-primary-dark ring-1 ring-primary/15">
                                {referredToInitials}
                              </span>
                            )}
                            <span className="truncate">{referredToName}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-text-muted">{updatedAt}</td>
                      </tr>
                    );
                  })
                )}
                {sortedReferrals.length > 0
                  ? Array.from({ length: referralsEmptyRowCount }).map((_, idx) => (
                      <tr key={`referrals-empty-row-${idx}`} className="border-t border-border/70">
                        <td className="px-2 py-2.5">
                          <span className="invisible">—</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="invisible">—</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="invisible">—</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="invisible">—</span>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          {openReferralDetails ? (
            <div className="absolute inset-0 z-10 flex items-start justify-center p-3 sm:p-4">
              <div
                className="w-full max-w-md rounded-xl border border-border bg-white p-4 shadow-xl"
                role="dialog"
                aria-modal="false"
                aria-label="Referral details"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-heading">Referral details</h3>
                  <button
                    type="button"
                    onClick={() => setOpenReferralDetails(null)}
                    className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text-muted hover:text-text-heading"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-md border border-border/70 bg-background-light/40 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-text-muted">Status</div>
                    <div className="mt-0.5 font-semibold text-text-heading capitalize">
                      {String(openReferralDetails?.status || "—")}
                    </div>
                  </div>

                  <div className="rounded-md border border-border/70 bg-background-light/40 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-text-muted">Notes</div>
                    <div className="mt-0.5 whitespace-pre-wrap text-text-body">
                      {String(openReferralDetails?.notes || "").trim() || "No notes added."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {sortedReferrals.length > 0 ? (
          <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-xs">
            <p className="text-text-muted">
              Page <span className="font-semibold text-text-heading">{safeReferralsPage}</span> of{" "}
              <span className="font-semibold text-text-heading">{referralsTotalPages}</span>
              {" · "}
              <span className="font-semibold text-text-heading">{sortedReferrals.length}</span> referrals
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReferralsPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrevReferralsPage}
                className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-primary/[0.06] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setReferralsPage((p) => Math.min(referralsTotalPages, p + 1))}
                disabled={!hasNextReferralsPage}
                className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-text-heading transition hover:bg-primary/[0.06] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </LeadActionSection>

      {canUseReferralInviteLinks && shareModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-heading">Share referral link</h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="rounded-md border border-border p-1.5 text-text-muted hover:text-text-heading"
                aria-label="Close share modal"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mb-3 text-xs text-text-muted">
              Share this lead referral link through your preferred channel.
            </p>

            <input
              type="text"
              readOnly
              value={leadInviteShareUrl}
              className="mb-3 h-10 w-full rounded-md border border-border bg-background-light/40 px-2.5 text-xs text-text-heading"
            />

            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a
                href={shareLinks.email}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold ${
                  leadInviteShareUrl
                    ? "border-border bg-white text-text-heading hover:bg-primary/[0.07]"
                    : "pointer-events-none border-border/60 bg-slate-100 text-text-muted"
                }`}
              >
                <Mail size={12} />
                Email
              </a>
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold ${
                  leadInviteShareUrl
                    ? "border-border bg-white text-text-heading hover:bg-primary/[0.07]"
                    : "pointer-events-none border-border/60 bg-slate-100 text-text-muted"
                }`}
              >
                <MessageCircle size={12} />
                WhatsApp
              </a>
              <a
                href={shareLinks.sms}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold ${
                  leadInviteShareUrl
                    ? "border-border bg-white text-text-heading hover:bg-primary/[0.07]"
                    : "pointer-events-none border-border/60 bg-slate-100 text-text-muted"
                }`}
              >
                <Share2 size={12} />
                SMS
              </a>
              <a
                href={shareLinks.social}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold ${
                  leadInviteShareUrl
                    ? "border-border bg-white text-text-heading hover:bg-primary/[0.07]"
                    : "pointer-events-none border-border/60 bg-slate-100 text-text-muted"
                }`}
              >
                <Share2 size={12} />
                Social
              </a>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(leadInviteShareUrl);
                    toast.success("Referral link copied.");
                  } catch {
                    toast.error("Unable to copy referral link.");
                  }
                }}
                disabled={!leadInviteShareUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-heading hover:bg-primary/[0.07] disabled:opacity-50"
              >
                <Copy size={12} />
                Copy link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
