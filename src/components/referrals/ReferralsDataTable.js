"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { ReferralsTableSkeleton } from "@/components/ui/ContentSkeletons";

export function normalizeReferralRows(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function nameOf(user, fallback) {
  const full = String(user?.full_name || "").trim();
  if (full) return full;
  return fallback || "Unknown professional";
}

function roleLabel(v) {
  const raw = String(v || "").trim().toLowerCase();
  if (!raw) return "Unknown";
  if (raw === "mortgage_broker") return "Mortgage Broker";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function referringProfessionalRoleLabel(ref, summary) {
  const fromAccount = String(ref?.referrer?.role || "").trim();
  if (fromAccount) return roleLabel(fromAccount);
  const fromLead = String(summary?.source_role || "").trim();
  if (fromLead) return roleLabel(fromLead);
  return "—";
}

function referredToProfessionalRoleLabel(ref) {
  const fromAccount = String(ref?.target_professional?.role || "").trim();
  if (fromAccount) return roleLabel(fromAccount);
  const fromVertical = String(ref?.target_vertical || "").trim();
  if (fromVertical) return roleLabel(fromVertical);
  return "—";
}

function leadDisplayName(ref) {
  const n = String(ref?.lead_contact?.full_name || "").trim();
  if (n) return n;
  const em = String(ref?.lead_contact?.email || "").trim();
  if (em) return em;
  const phone = String(ref?.lead_contact?.phone || "").trim();
  if (phone) return phone;
  const category = String(ref?.lead_summary?.lead_category || "").trim();
  if (category) return category;
  const notes = String(ref?.notes || "").trim();
  if (notes && notes.length <= 40) return notes;
  return "—";
}

function fmtIntent(v) {
  const raw = String(v || "").trim();
  if (!raw) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, " ");
}

function meaningfulIntentText(intent) {
  const s = String(intent ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s || ["unspecified", "unknown", "n/a", "na", "none"].includes(s)) return null;
  return String(intent).trim();
}

function intentCell(summary) {
  const raw = meaningfulIntentText(summary?.intent);
  if (!raw) return <span className="text-text-muted">—</span>;
  return <span className="font-medium leading-tight text-text-heading">{fmtIntent(raw)}</span>;
}

function firstNonEmptyTrimmed(...parts) {
  for (const p of parts) {
    const s = String(p ?? "").trim();
    if (s) return s;
  }
  return "";
}

function professionalFocusCell(summary) {
  const role = String(summary?.source_role || "").trim().toLowerCase();
  if (role === "lawyer") {
    const l = summary?.lawyer || {};
    const text = firstNonEmptyTrimmed(
      l.transaction_stage,
      l.transaction_type,
      l.legal_services_needed,
      l.closing_timeline
    );
    return text ? (
      <span className="line-clamp-2 font-medium leading-snug text-text-heading">{fmtIntent(text)}</span>
    ) : (
      <span className="text-text-muted">—</span>
    );
  }
  if (role === "mortgage_broker") {
    const m = summary?.mortgage || {};
    const text = firstNonEmptyTrimmed(m.mortgage_timeline, m.pre_approval_status);
    return text ? (
      <span className="line-clamp-2 font-medium leading-snug text-text-heading">{fmtIntent(text)}</span>
    ) : (
      <span className="text-text-muted">—</span>
    );
  }
  return <span className="text-text-muted">—</span>;
}

function propertyTypeCell(summary) {
  const role = String(summary?.source_role || "").toLowerCase();
  if (role !== "agent") return <span className="text-text-muted">—</span>;
  const v = String(summary?.property_type || "").trim();
  return v ? (
    <span className="font-medium leading-tight text-text-heading">{v}</span>
  ) : (
    <span className="text-text-muted">—</span>
  );
}

function detailsCell(summary) {
  const role = String(summary?.source_role || "").trim().toLowerCase();
  if (role === "agent") {
    const intent = meaningfulIntentText(summary?.intent);
    const prop = String(summary?.property_type || "").trim();
    const parts = [
      intent ? fmtIntent(intent) : "",
      prop ? String(prop) : "",
    ].filter(Boolean);
    return parts.length ? (
      <span className="line-clamp-2 font-medium leading-snug text-text-heading">
        {parts.join(" · ")}
      </span>
    ) : (
      <span className="text-text-muted">—</span>
    );
  }
  if (role === "lawyer" || role === "mortgage_broker") {
    return professionalFocusCell(summary);
  }
  return <span className="text-text-muted">—</span>;
}

function categoryCell(summary) {
  const v = summary?.lead_category != null ? String(summary.lead_category).trim() : "";
  return v ? (
    <span className="font-medium leading-tight text-text-heading">{fmtIntent(v)}</span>
  ) : (
    <span className="text-text-muted">—</span>
  );
}

const REFERRAL_WORKFLOW_CHIP = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  pending: "border-amber-200 bg-amber-50 text-amber-950",
  rejected: "border-red-200 bg-red-50 text-red-900",
  completed: "border-slate-200 bg-slate-50 text-slate-800",
};

// When a referral is accepted, the recipient may later update their pipeline stage in Notes.
// For list tables, we only surface a small set of "manual pipeline statuses" here; booking-related
// stages are already represented by the Consult column.
const ACCEPTED_PIPELINE_STATUS_OVERRIDE = {
  nurturing: { chipClass: "border-amber-200 bg-amber-50 text-amber-950" },
  converted: { chipClass: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  closed_lost: { chipClass: "border-slate-200 bg-slate-100 text-slate-800" },
};

const CHIP_WRAP =
  "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none";

function StatusChipSpan({ label, chipClass, title }) {
  return (
    <span className={`${CHIP_WRAP} ${chipClass}`} title={title}>
      <span className="truncate">{label}</span>
    </span>
  );
}

function ReferralStatusChip({ status }) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!raw) {
    return <span className="text-text-muted">—</span>;
  }
  const label = fmtIntent(raw.replace(/_/g, " "));
  const chipClass = REFERRAL_WORKFLOW_CHIP[raw] || "border-border bg-background-light text-text-heading";
  return <StatusChipSpan label={label} chipClass={chipClass} title={label} />;
}

function roleAwarePipelineStatusLabel(status, roleRaw) {
  const statusNorm = String(status || "").trim().toLowerCase();
  if (!statusNorm) return "";
  if (statusNorm === "nurturing") return "Nurturing";
  if (statusNorm === "closed_lost") return "Lost";
  if (statusNorm !== "converted") return fmtIntent(statusNorm.replace(/_/g, " "));
  const role = String(roleRaw || "").trim().toLowerCase();
  if (role === "lawyer") return "Retained";
  if (role === "mortgage_broker") return "Funded";
  return "Won";
}

function ReferralWorkflowOrPipelineStatusChip({ row, direction }) {
  const refStatus = String(row?.status || "").trim().toLowerCase();
  if (refStatus !== "accepted") return <ReferralStatusChip status={row?.status} />;

  const pipelineStatus =
    String(
      direction === "outbound"
        ? row?.viewer_match_status ?? row?.target_match_status ?? ""
        : row?.target_match_status ?? row?.viewer_match_status ?? ""
    )
      .trim()
      .toLowerCase();
  const override = ACCEPTED_PIPELINE_STATUS_OVERRIDE[pipelineStatus];
  if (!override) return <ReferralStatusChip status={row?.status} />;

  const statusRoleRaw =
    direction === "outbound"
      ? row?.referrer?.role || row?.lead_summary?.source_role || ""
      : row?.target_professional?.role || row?.target_vertical || row?.lead_summary?.source_role || "";
  const statusLabel = roleAwarePipelineStatusLabel(pipelineStatus, statusRoleRaw) || "Accepted";

  const referralUpdatedAtMs = Date.parse(String(row?.updated_at || ""));
  const matchUpdatedAtMs = Date.parse(
    String(row?.viewer_match_updated_at || row?.target_match_updated_at || "")
  );
  const hasFreshMatchUpdate =
    Number.isFinite(referralUpdatedAtMs) &&
    Number.isFinite(matchUpdatedAtMs) &&
    matchUpdatedAtMs > referralUpdatedAtMs + 5000;
  if (!hasFreshMatchUpdate) return <ReferralStatusChip status={row?.status} />;

  return (
    <StatusChipSpan
      label={statusLabel}
      chipClass={override.chipClass}
      title="Updated in Notes (pipeline stage)"
    />
  );
}

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function ProfessionalCell({ user, fallbackName }) {
  if (!user || (!String(user?.id || "").trim() && !String(user?.full_name || "").trim())) {
    return <span className="text-text-muted">{fallbackName}</span>;
  }
  const label = String(nameOf(user, fallbackName)).trim() || fallbackName || "—";
  const avatarUrl = String(user?.profile_image || "").trim();

  const avatarInner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote URLs
    <img
      src={avatarUrl}
      alt=""
      className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border/80"
      loading="lazy"
    />
  ) : (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[9px] font-bold text-primary-dark ring-1 ring-primary/25"
      aria-hidden
    >
      {initialsFromName(label) || "?"}
    </div>
  );

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {avatarInner}
      <span className="truncate text-[11px] font-medium leading-tight text-text-heading" title={label}>
        {label}
      </span>
    </div>
  );
}

function consultCell(row, direction) {
  const appt = String(row?.appointment_status ?? "").trim().toLowerCase();
  const nurture = Boolean(row?.nurture_consultation_booked);
  const pipeBooked =
    direction === "outbound"
      ? Boolean(
          row?.viewer_has_upcoming_pipeline_booking ??
            row?.target_has_upcoming_pipeline_booking
        )
      : Boolean(
          row?.target_has_upcoming_pipeline_booking ??
            row?.viewer_has_upcoming_pipeline_booking
        );

  if (appt === "canceled") {
    return {
      label: "Canceled",
      className: "border-amber-200 bg-amber-50 text-amber-800",
      title: "Appointment or Calendly event marked as canceled",
    };
  }
  if (appt === "booked" || nurture || pipeBooked) {
    const bits = [];
    if (pipeBooked) bits.push("pipeline consult/showing");
    if (appt === "booked") bits.push("Calendly or resolved booking");
    if (nurture) bits.push("nurture email meeting");
    return {
      label: "Booked",
      className: "border-violet-200 bg-violet-50 text-violet-800",
      title: bits.length ? bits.join(" · ") : "Consultation booked",
    };
  }
  return {
    label: "Not booked",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    title: "No booking signal on this referral row yet",
  };
}

/**
 * Shared referrals table — same columns as Referrals → Inbound/Outbound.
 * Row navigates to `getDetailHref(id, direction)` (e.g. `/referrals/…` or `/leads/referrals/…`).
 */
export default function ReferralsDataTable({
  rows,
  isLoading,
  isError,
  errorMessage,
  direction,
  getDetailHref,
  heading,
  hint,
  emptyMessage,
  footer = null,
  rowsPerPage = 10,
  /** When set, highlights the matching row (e.g. selected `referral` on `/leads`). */
  selectedReferralId = "",
}) {
  const router = useRouter();
  const dir = direction === "outbound" ? "outbound" : "inbound";
  const counterpartyLabel = dir === "outbound" ? "Referred to" : "Referred by";
  const counterpartyRoleLabel = dir === "outbound" ? "Referred to role" : "Referrer role";

  const navigateToRow = (id) => {
    const clean = String(id || "").trim();
    if (!clean) return;
    router.push(getDetailHref(clean, dir));
  };

  const getHref = typeof getDetailHref === "function" ? getDetailHref : () => "";
  const selectedId = String(selectedReferralId || "").trim();
  const showConsultColumn = dir !== "outbound";
  const normalizedRowsPerPage = Math.max(1, Number(rowsPerPage) || 10);
  const emptyRowCount = Math.max(0, normalizedRowsPerPage - rows.length);
  const isEmptyState = !isLoading && !isError && rows.length === 0;

  return (
    <section
      className={
        isEmptyState
          ? "flex h-full w-full max-w-none flex-col overflow-hidden bg-transparent"
          : "flex h-full w-full max-w-none flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-none"
      }
    >
      {!isEmptyState ? (
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold leading-tight text-text-heading">{heading}</h2>
          {hint ? (
            <p className="mt-0.5 text-[10px] leading-snug text-text-muted">{hint}</p>
          ) : null}
        </div>
      ) : null}
      {isLoading ? (
        <div className="px-2 py-2 sm:px-3 sm:py-3">
          <ReferralsTableSkeleton rows={normalizedRowsPerPage} showConsultColumn={showConsultColumn} />
        </div>
      ) : isError ? (
        <div className="px-3 py-4 text-xs text-red-700">{errorMessage || "Could not load referrals."}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
          <div className="w-full max-w-xl">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UserRound size={18} />
            </span>
            <p className="text-base font-bold text-text-heading">{emptyMessage}</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
              Referral activity will appear here once matching records are created.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 overflow-x-auto">
          <table className="w-full max-w-full table-auto border-collapse text-left text-[11px] leading-tight">
            <thead className="border-b border-border bg-primary/[0.04]">
              <tr className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <th className="min-w-[9rem] px-2 py-1.5 text-left align-middle">Lead</th>
                <th
                  className="whitespace-nowrap px-2 py-1.5 text-left align-middle"
                  title="Source lead context on the referring professional's side (e.g. lawyer pipeline vs agent listing)."
                >
                  Lead type
                </th>
                <th
                  className="min-w-[10rem] px-2 py-1.5 text-left align-middle"
                  title="Agent rows show intent + property type; lawyer/broker rows show their qualification snapshot."
                >
                  Details
                </th>
                <th className="min-w-[6rem] px-2 py-1.5 text-left align-middle">Lead category</th>
                <th className="whitespace-nowrap px-2 py-1.5 text-left align-middle">Status</th>
                {showConsultColumn ? (
                  <th className="whitespace-nowrap px-2 py-1.5 text-left align-middle">Consult</th>
                ) : null}
                <th className="min-w-[7rem] px-2 py-1.5 text-left align-middle">
                  {counterpartyLabel}
                </th>
                <th
                  className="whitespace-nowrap px-2 py-1.5 text-left align-middle"
                  title={
                    dir === "outbound"
                      ? "Professional role of the colleague you referred this lead to (e.g. lawyer, agent)."
                      : "Professional role of the colleague who referred this lead (e.g. lawyer, agent)."
                  }
                >
                  {counterpartyRoleLabel}
                </th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {rows.map((ref) => {
                const id = String(ref?.id || "").trim();
                const referrer = ref?.referrer || null;
                const targetProfessional = ref?.target_professional || null;
                const counterparty = dir === "outbound" ? targetProfessional : referrer;
                const summary = ref?.lead_summary || null;
                const leadTypeLabel = summary?.source_role ? roleLabel(summary.source_role) : "—";
                const leadName = leadDisplayName(ref);
                const href = id ? getHref(id, dir) : "#";
                const rowSelected = Boolean(selectedId && id && selectedId === id);
                const consult = consultCell(ref, dir);
                const roleText =
                  dir === "outbound"
                    ? referredToProfessionalRoleLabel(ref)
                    : referringProfessionalRoleLabel(ref, summary);

                return (
                  <tr
                    key={id || JSON.stringify(ref)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open referral for ${leadName}`}
                    aria-current={rowSelected ? "page" : undefined}
                    className={`cursor-pointer border-b border-border/50 align-middle transition-colors hover:bg-primary/[0.05] focus-visible:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${
                      rowSelected ? "bg-primary/[0.08] ring-1 ring-inset ring-primary/15" : ""
                    }`}
                    onClick={() => navigateToRow(id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigateToRow(id);
                      }
                    }}
                  >
                    <td className="px-2 py-1.5 align-middle">
                      <div className="flex items-center gap-1.5">
                        <UserRound size={12} className="shrink-0 text-text-muted" aria-hidden />
                        <div className="min-w-0">
                          <div className="line-clamp-2 font-semibold text-primary">{leadName}</div>
                          {ref?.lead_contact?.email && ref?.lead_contact?.full_name ? (
                            <div className="mt-px line-clamp-1 font-mono text-[9px] leading-none text-text-muted">
                              {ref.lead_contact.email}
                            </div>
                          ) : null}
                          <span className="sr-only">{href}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <span className="font-medium text-text-heading">{leadTypeLabel}</span>
                    </td>
                    <td className="px-2 py-1.5 align-middle">{detailsCell(summary)}</td>
                    <td className="px-2 py-1.5 align-middle leading-snug">{categoryCell(summary)}</td>
                    <td className="px-2 py-1.5 align-middle">
                      <ReferralWorkflowOrPipelineStatusChip row={ref} direction={dir} />
                    </td>
                    {showConsultColumn ? (
                      <td className="px-2 py-1.5 align-middle">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-snug ${consult.className}`}
                          title={consult.title}
                        >
                          {consult.label}
                        </span>
                      </td>
                    ) : null}
                    <td className="px-2 py-1.5 align-middle">
                      <ProfessionalCell user={counterparty} fallbackName="—" />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <span className="font-medium text-text-heading">
                        {roleText}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {Array.from({ length: emptyRowCount }).map((_, idx) => (
                <tr
                  key={`referrals-empty-row-${idx}`}
                  className="h-11 border-b border-border/60 align-middle"
                  aria-hidden
                >
                  {Array.from({
                    length:
                      6 + (showConsultColumn ? 1 : 0),
                  }).map((__, cellIdx) => (
                    <td
                      key={`referrals-empty-cell-${idx}-${cellIdx}`}
                      className="h-11 px-2 py-1.5 align-middle"
                    >
                      <span className="invisible">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </section>
  );
}

/** Detail URL used on Referrals inbox page */
export function defaultReferralsDetailHref(referralId, direction = "inbound") {
  const d = direction === "outbound" ? "outbound" : "inbound";
  return `/referrals/${encodeURIComponent(referralId)}?direction=${encodeURIComponent(d)}`;
}

/** Leads → Pipeline → Referrals row: dedicated `/leads/referrals/…` page (not `/referrals` inbox). */
export function leadsPipelineReferralDetailHref(referralId, listPage = 1) {
  const p = Math.max(1, Number(listPage) || 1);
  if (p > 1) {
    return `/leads/referrals/${encodeURIComponent(referralId)}?page=${encodeURIComponent(String(p))}`;
  }
  return `/leads/referrals/${encodeURIComponent(referralId)}`;
}
