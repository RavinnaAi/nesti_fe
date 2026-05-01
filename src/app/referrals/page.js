"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Handshake, UserRound } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchReferrals } from "@/lib/chatClient";

function normalizeList(data) {
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

function leadDisplayName(ref) {
  const n = String(ref?.lead_contact?.full_name || "").trim();
  if (n) return n;
  const em = String(ref?.lead_contact?.email || "").trim();
  if (em) return em;
  return "—";
}

function detailHref(refId, direction) {
  return `/referrals/${encodeURIComponent(refId)}?direction=${encodeURIComponent(direction === "outbound" ? "outbound" : "inbound")}`;
}

const REFERRALS_PAGE_SIZE = 10;

function referralsListHref(direction, page) {
  const p = new URLSearchParams();
  p.set("direction", direction === "outbound" ? "outbound" : "inbound");
  if (Number.isFinite(page) && page > 1) p.set("page", String(page));
  return `/referrals?${p.toString()}`;
}

function fmtIntent(v) {
  const raw = String(v || "").trim();
  if (!raw) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, " ");
}

/** Conversation intent is often unset or placeholder; don't print noise in the table. */
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

/** Lawyer / mortgage snapshot fields from API (`lead_summary`) — shown when agent intent columns are hidden. */
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

function categoryCell(summary) {
  const v = summary?.lead_category != null ? String(summary.lead_category).trim() : "";
  return v ? (
    <span className="font-medium leading-tight text-text-heading">{fmtIntent(v)}</span>
  ) : (
    <span className="text-text-muted">—</span>
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
  const chip =
    raw === "accepted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : raw === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : raw === "rejected"
          ? "border-red-200 bg-red-50 text-red-900"
          : raw === "completed"
            ? "border-slate-200 bg-slate-50 text-slate-800"
            : "border-border bg-background-light text-text-heading";
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${chip}`}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
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
    // eslint-disable-next-line @next/next/no-img-element
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

function ScoreCell({ summary }) {
  const hasScore =
    summary?.lead_score != null &&
    summary.lead_score !== "" &&
    !Number.isNaN(Number(summary.lead_score));
  if (!hasScore) return <span className="text-text-muted">—</span>;
  return (
    <span className="text-[11px] font-semibold tabular-nums text-text-heading">
      {Number(summary.lead_score)}
    </span>
  );
}

export default function ReferralsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDirection = String(searchParams.get("direction") || "inbound")
    .trim()
    .toLowerCase();
  const direction = rawDirection === "outbound" ? "outbound" : "inbound";

  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);

  const rawPage = Number.parseInt(String(searchParams.get("page") || "1"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  useEffect(() => {
    const d = String(searchParams.get("direction") || "").trim().toLowerCase();
    if (!d && typeof window !== "undefined") {
      router.replace("/referrals?direction=inbound", { scroll: false });
    }
    if (d && d !== "inbound" && d !== "outbound") {
      router.replace("/referrals?direction=inbound", { scroll: false });
    }
  }, [router, searchParams]);

  const referralsQuery = useQuery({
    queryKey: ["chat-referrals", token, direction, page, REFERRALS_PAGE_SIZE],
    enabled: Boolean(token),
    queryFn: () =>
      fetchReferrals({
        token,
        direction,
        page,
        limit: REFERRALS_PAGE_SIZE,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const rows = useMemo(() => normalizeList(referralsQuery.data), [referralsQuery.data]);
  const counts = referralsQuery.data?.counts || {};
  const inboundTotal = Number(counts.inbound_total ?? 0);
  const outboundTotal = Number(counts.outbound_total ?? 0);
  const pagination = referralsQuery.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages ?? (rows.length > 0 ? 1 : 0));
  const total = Number(pagination.total ?? rows.length ?? 0);
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(
    pagination.has_next_page || (totalPages > 0 && currentPage < totalPages)
  );

  /** Intent + property type come from agent buyer/listing flows; hide when no agent-sourced referrals on this page. */
  const showAgentReferralColumns = useMemo(
    () =>
      rows.some((r) => String(r?.lead_summary?.source_role || "").trim().toLowerCase() === "agent"),
    [rows]
  );

  /** Lawyer / mortgage rows: qualification snapshot column (agent rows show — here; they use Intent / Property instead). */
  const showProfessionalFocusColumn = useMemo(
    () =>
      rows.some((r) => {
        const role = String(r?.lead_summary?.source_role || "").trim().toLowerCase();
        return role === "lawyer" || role === "mortgage_broker";
      }),
    [rows]
  );

  if (!isAuthenticated) return null;

  const activeRows = rows;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background-light/30">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-heading hover:bg-background-light"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-text-heading">
                <Handshake size={24} className="text-primary" />
                Referrals
              </h1>
              <p className="text-sm text-text-muted">
                {direction === "inbound"
                  ? "Leads other professionals referred to you."
                  : "Leads you referred to colleagues."}
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-white p-1 shadow-sm">
            <Link
              href={referralsListHref("inbound", 1)}
              scroll={false}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                direction === "inbound"
                  ? "bg-primary/12 text-primary-dark ring-1 ring-primary/15"
                  : "text-text-muted hover:text-text-heading"
              }`}
            >
              Inbound ({inboundTotal})
            </Link>
            <Link
              href={referralsListHref("outbound", 1)}
              scroll={false}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                direction === "outbound"
                  ? "bg-primary/12 text-primary-dark ring-1 ring-primary/15"
                  : "text-text-muted hover:text-text-heading"
              }`}
            >
              Outbound ({outboundTotal})
            </Link>
          </div>
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-3 py-2">
            <h2 className="text-sm font-semibold leading-tight text-text-heading">
              {direction === "inbound" ? "Inbound referrals" : "Outbound referrals"}
            </h2>
            <p className="mt-0.5 text-[10px] leading-snug text-text-muted">
              Click any row to open the referral workspace. Columns follow each row&apos;s source lead type (agent vs
              lawyer vs mortgage broker).
            </p>
          </div>
          {referralsQuery.isLoading ? (
            <div className="px-3 py-4 text-xs text-text-muted">Loading referrals…</div>
          ) : activeRows.length === 0 ? (
            <div className="px-3 py-4 text-xs text-text-muted">
              {direction === "inbound" ? "No inbound referrals yet." : "You have not referred any leads yet."}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
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
                    <th className="whitespace-nowrap px-2 py-1.5 text-left align-middle">Score</th>
                    {showAgentReferralColumns ? (
                      <>
                        <th className="whitespace-nowrap px-2 py-1.5 text-left align-middle">Intent</th>
                        <th className="min-w-[5rem] px-2 py-1.5 text-left align-middle">Property type</th>
                      </>
                    ) : null}
                    {showProfessionalFocusColumn ? (
                      <th
                        className="min-w-[6rem] px-2 py-1.5 text-left align-middle"
                        title="Lawyer or mortgage snapshot for that row; agent rows use Intent / Property columns."
                      >
                        Referral focus
                      </th>
                    ) : null}
                    <th className="min-w-[6rem] px-2 py-1.5 text-left align-middle">Lead category</th>
                    <th
                      className="whitespace-nowrap px-2 py-1.5 text-left align-middle"
                      title="Referral workflow status for this handoff (e.g. pending until the recipient processes it)."
                    >
                      Status
                    </th>
                    <th className="min-w-[7rem] px-2 py-1.5 text-left align-middle">Referred by</th>
                    <th
                      className="whitespace-nowrap px-2 py-1.5 text-left align-middle"
                      title="Professional role of the colleague who referred this lead (e.g. lawyer, agent)."
                    >
                      Referrer role
                    </th>
                  </tr>
                </thead>
                <tbody className="text-text-body">
                  {activeRows.map((ref) => {
                    const id = String(ref?.id || "");
                    const referrer = ref?.referrer || null;
                    const summary = ref?.lead_summary || null;
                    const leadTypeLabel = summary?.source_role
                      ? roleLabel(summary.source_role)
                      : "—";
                    const leadName = leadDisplayName(ref);

                    return (
                      <tr
                        key={id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open referral for ${leadName}`}
                        className="cursor-pointer border-b border-border/50 align-middle transition-colors hover:bg-primary/[0.05] focus-visible:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                        onClick={() => router.push(detailHref(id, direction))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(detailHref(id, direction));
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
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                          <span className="font-medium text-text-heading">{leadTypeLabel}</span>
                        </td>
                        <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                          <ScoreCell summary={summary} />
                        </td>
                        {showAgentReferralColumns ? (
                          <>
                            <td className="px-2 py-1.5 align-middle">{intentCell(summary)}</td>
                            <td className="px-2 py-1.5 align-middle">{propertyTypeCell(summary)}</td>
                          </>
                        ) : null}
                        {showProfessionalFocusColumn ? (
                          <td className="px-2 py-1.5 align-middle">{professionalFocusCell(summary)}</td>
                        ) : null}
                        <td className="px-2 py-1.5 align-middle leading-snug">{categoryCell(summary)}</td>
                        <td className="px-2 py-1.5 align-middle">
                          <ReferralStatusChip status={ref?.status} />
                        </td>
                        <td className="px-2 py-1.5 align-middle">
                          <ProfessionalCell user={referrer} fallbackName="—" />
                        </td>
                        <td className="px-2 py-1.5 align-middle">
                          <span className="font-medium text-text-heading">
                            {referringProfessionalRoleLabel(ref, summary)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!referralsQuery.isLoading && total > 0 ? (
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-background-light/40 px-3 py-2.5">
              <p className="flex items-center gap-2 text-[11px] text-text-muted">
                {referralsQuery.isFetching && !referralsQuery.isLoading ? (
                  <span
                    className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                    aria-hidden
                  />
                ) : null}
                <span>
                  Page{" "}
                  <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                  <span className="font-semibold text-text-heading">{Math.max(totalPages, 1)}</span>
                  {" · "}
                  <span className="font-semibold text-text-heading">{total}</span> total
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={referralsListHref(direction, Math.max(1, currentPage - 1))}
                  scroll={false}
                  aria-disabled={!hasPrev || referralsQuery.isFetching}
                  className={`inline-flex items-center gap-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95 ${
                    !hasPrev || referralsQuery.isFetching
                      ? "pointer-events-none opacity-40"
                      : ""
                  }`}
                >
                  <ChevronLeft size={14} />
                  Previous
                </Link>
                <Link
                  href={referralsListHref(direction, currentPage + 1)}
                  scroll={false}
                  aria-disabled={!hasNext || referralsQuery.isFetching}
                  className={`inline-flex items-center gap-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95 ${
                    !hasNext || referralsQuery.isFetching ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Next
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
