"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "react-toastify";
import { fetchCalendarBookings, cancelCalendlyAppointment } from "@/lib/calendarClient";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function parseStart(iso) {
  if (!iso) return null;
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? null : t;
}

function formatTimeShort(t) {
  if (!t) return "";
  return t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function humanizeToken(value) {
  const s = String(value || "").trim();
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function detailFieldsForBooking(booking) {
  if (booking?.booking_origin === "public_profile_consultation") return [];
  if (!booking?.lead_match_id && !booking?.conversation_id) return [];
  const lawyerQ = booking?.qualification?.lawyer || {};
  const mortgageQ = booking?.qualification?.mortgage_broker || {};
  const inferredType = (() => {
    const explicit = String(booking?.professional_type || "").trim().toLowerCase();
    if (explicit) return explicit;
    if (lawyerQ && Object.keys(lawyerQ).length) return "lawyer";
    if (mortgageQ && Object.keys(mortgageQ).length) return "mortgage_broker";
    return "";
  })();
  if (inferredType === "lawyer") {
    return [
      { label: "Transaction stage", value: humanizeToken(lawyerQ.transaction_stage) },
      { label: "Closing timeline", value: humanizeToken(lawyerQ.closing_timeline) },
      { label: "Transaction type", value: humanizeToken(lawyerQ.transaction_type) },
      { label: "Legal services", value: humanizeToken(lawyerQ.legal_services_needed) },
    ];
  }
  if (inferredType === "mortgage_broker") {
    return [
      { label: "Mortgage timeline", value: humanizeToken(mortgageQ.mortgage_timeline) },
      { label: "Pre-approval", value: humanizeToken(mortgageQ.pre_approval_status) },
      { label: "Credit range", value: humanizeToken(mortgageQ.credit_score_range) },
    ];
  }
  const propertyType =
    booking?.property_type != null && String(booking.property_type).trim()
      ? String(booking.property_type).trim()
      : "—";
  const intentLabel = humanizeToken(booking?.intent);
  const rows = [{ label: "Property type", value: propertyType }];
  if (intentLabel !== "—") rows.push({ label: "Intent", value: intentLabel });
  return rows;
}

/** Stable key when the same lead has multiple calendar rows (nurture logs / workspace docs). */
function bookingRowKey(b, idx) {
  const id =
    b?.nurture_log_id ||
    b?.workspace_appointment_id ||
    `${b?.lead_match_id || "lead"}-${b?.starts_at || ""}`;
  return `${id}-${idx}`;
}

/** Max bookings listed in a day cell (fits without in-cell scroll); rest open the day modal. */
const MAX_VISIBLE_DAY_BOOKINGS = 3;

/** @param {{ booking: object | null; onClose: () => void; token?: string | null; onCanceled?: () => void }} props */
function BookingDetailModal({ booking, onClose, token, onCanceled }) {
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showCancelConfirm) setShowCancelConfirm(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showCancelConfirm]);

  useEffect(() => {
    if (!booking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [booking]);

  useEffect(() => {
    setCanceling(false);
    setShowCancelConfirm(false);
  }, [booking?.lead_match_id]);

  if (!booking) return null;

  const t = parseStart(booking.starts_at);
  const whenFull = t
    ? t.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })
    : "No time recorded";
  const isStandaloneConsultation =
    booking.booking_origin === "public_profile_consultation" ||
    (!booking.lead_match_id && !booking.conversation_id);
  const leadName = booking.contact?.full_name || booking.contact?.email || "—";
  const detailRows = detailFieldsForBooking(booking);
  const canCancel =
    Boolean(token) &&
    booking.cancelable_via_calendly === true &&
    booking.lead_match_id;

  async function performCancelMeeting() {
    if (!token || !booking.lead_match_id) return;
    setCanceling(true);
    try {
      await cancelCalendlyAppointment({ token, leadMatchId: booking.lead_match_id });
      toast.success("Appointment canceled in Calendly.");
      setShowCancelConfirm(false);
      onCanceled?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not cancel the appointment.";
      toast.error(msg);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] lg:inset-y-0 lg:left-60 lg:right-0"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showCancelConfirm ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/90 p-4 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !canceling) setShowCancelConfirm(false);
            }}
          >
            <div
              className="w-full max-w-sm rounded-xl border border-border bg-white p-4 shadow-lg"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cancel-confirm-title"
              aria-describedby="cancel-confirm-desc"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3 id="cancel-confirm-title" className="text-sm font-bold text-text-heading">
                Cancel this meeting?
              </h3>
              <p id="cancel-confirm-desc" className="mt-2 text-sm leading-relaxed text-text-body">
                This removes the event in Calendly. The invitee is notified according to your Calendly
                settings, and the lead is updated in Nesti.
              </p>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={canceling}
                  onClick={() => setShowCancelConfirm(false)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading transition hover:bg-background-light disabled:opacity-60"
                >
                  Go back
                </button>
                <button
                  type="button"
                  disabled={canceling}
                  onClick={performCancelMeeting}
                  className="rounded-lg border border-red-200 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {canceling ? "Canceling…" : "Yes, cancel in Calendly"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 border-l-[3px] border-primary pl-3">
            <h2 id="booking-detail-title" className="text-base font-bold text-text-heading">
              {booking.title || "Appointment"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-primary/5 hover:text-primary-dark"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-4 py-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Meeting time</p>
            <p className="mt-0.5 font-medium text-text-heading">{whenFull}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {isStandaloneConsultation ? "Invitee" : "Lead name"}
            </p>
            <p className="mt-0.5 font-medium text-text-heading">{leadName}</p>
            {booking.contact?.email ? (
              <p className="mt-0.5 text-xs text-text-muted">{booking.contact.email}</p>
            ) : null}
          </div>
          {detailRows.map((row) => (
            <div key={row.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {row.label}
              </p>
              <p className="mt-0.5 text-text-body">{row.value}</p>
            </div>
          ))}
          {canCancel ? (
            <div className="border-t border-border pt-4">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setShowCancelConfirm(true)}
                className="w-full rounded-lg border border-red-200 bg-red-50/80 px-3 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60"
              >
                Cancel meeting
              </button>
              <p className="mt-2 text-[11px] text-text-muted">
                Removes the event in Calendly and updates this lead in Nesti. Requires Calendly to be
                connected.
              </p>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-[11px] text-text-muted">
              To cancel, use Calendly if this booking has no Nesti link metadata yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** @param {{ day: number; cursor: Date; items: object[]; onClose: () => void; onSelectBooking: (b: object) => void }} props */
function DayOverflowModal({ day, cursor, items, onClose, onSelectBooking }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const label = useMemo(() => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [cursor, day]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = parseStart(a.starts_at)?.getTime() ?? 0;
      const tb = parseStart(b.starts_at)?.getTime() ?? 0;
      return ta - tb;
    });
  }, [items]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] lg:inset-y-0 lg:left-60 lg:right-0"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[min(85vh,28rem)] w-full max-w-md overflow-hidden rounded-xl border border-border bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-overflow-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="day-overflow-title" className="text-sm font-bold text-text-heading">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-primary/5"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <ul className="max-h-[min(70vh,22rem)] overflow-y-auto p-2">
          {sorted.map((b, bi) => {
            const t = parseStart(b.starts_at);
            const time = formatTimeShort(t) || "—";
            const pt =
              b.property_type != null && String(b.property_type).trim()
                ? String(b.property_type).trim()
                : null;
            return (
              <li key={bookingRowKey(b, bi)} className="border-b border-border/60 last:border-0">
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2.5 text-left transition hover:bg-primary/[0.06]"
                  onClick={() => {
                    onSelectBooking(b);
                    onClose();
                  }}
                >
                  <span className="text-[11px] font-medium text-primary-dark">{time}</span>
                  <span className="text-sm font-semibold text-text-heading">{b.title}</span>
                  <span className="truncate text-xs text-text-muted">
                    {b.contact?.full_name || b.contact?.email || "Lead"}
                    {pt ? ` · ${pt}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * @param {{ token: string | null | undefined; className?: string; hideHeading?: boolean; compact?: boolean; embeddedInSettings?: boolean }} props
 * `embeddedInSettings` — single-column settings tab: no inner card, tighter grid, no nested scroll.
 */
export default function DashboardAppointmentsCalendar({
  token,
  className = "",
  hideHeading = false,
  compact = false,
  embeddedInSettings = false,
}) {
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dayOverflow, setDayOverflow] = useState(null);

  const query = useQuery({
    queryKey: ["calendar-bookings", token],
    queryFn: () => fetchCalendarBookings({ token }),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const bookings = useMemo(
    () => (Array.isArray(query.data?.bookings) ? query.data.bookings : []),
    [query.data?.bookings]
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      const t = parseStart(b.starts_at);
      if (!t) continue;
      if (!sameMonth(t, cursor)) continue;
      const key = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const ta = parseStart(a.starts_at)?.getTime() ?? 0;
        const tb = parseStart(b.starts_at)?.getTime() ?? 0;
        return ta - tb;
      });
    }
    return map;
  }, [bookings, cursor]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const firstDow = startOfMonth(cursor).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ type: "pad", key: `p-${i}` });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${day}`;
    cells.push({ type: "day", day, key: `d-${day}`, items: byDay.get(key) || [] });
  }

  const pad = embeddedInSettings
    ? ""
    : compact
      ? "p-2 sm:p-3"
      : "p-4 shadow-sm sm:p-5";
  const cellMinH = compact
    ? "min-h-[7rem] sm:min-h-[7.75rem]"
    : "min-h-[8rem] sm:min-h-[9rem]";

  const sectionClass = embeddedInSettings
    ? `flex min-h-0 flex-1 flex-col gap-2 ${className}`.trim()
    : `rounded-xl border border-border bg-white ${pad} ${className}`.trim();

  const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className={sectionClass}>
      <div
        className={`flex shrink-0 flex-wrap items-center justify-between gap-2 ${
          embeddedInSettings
            ? "border-b border-border/70 pb-2.5"
            : `border-b border-border/70 ${compact ? "pb-2" : "gap-3 pb-3"}`
        }`}
      >
        {hideHeading ? (
          <div className="min-w-0 flex-1" aria-hidden />
        ) : (
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark ${
                embeddedInSettings ? "h-9 w-9" : `${compact ? "h-8 w-8" : "h-9 w-9"}`
              }`}
            >
              <CalendarDays size={embeddedInSettings ? 16 : compact ? 16 : 18} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight text-text-heading">
                Booked appointments
              </h2>
              <p
                className={`text-text-muted ${embeddedInSettings ? "mt-0.5 text-[10px] leading-snug" : "text-[11px]"}`}
              >
                {embeddedInSettings
                  ? "From Calendly and your pipeline. Click a slot for details — times are when Nesti recorded the booking."
                  : "Click an event for details. Times reflect when the booking was recorded in Nesti."}
              </p>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-0.5 ${hideHeading ? "ml-auto w-full justify-end sm:w-auto" : ""}`}>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className={`rounded-md border border-border text-text-heading transition hover:bg-primary/[0.06] ${embeddedInSettings ? "p-1.5" : compact ? "p-1" : "p-1.5"}`}
            aria-label="Previous month"
          >
            <ChevronLeft size={compact ? 14 : 16} />
          </button>
          <span
            className={`min-w-[9rem] text-center font-semibold text-text-heading ${compact ? "text-[11px]" : "text-xs"}`}
          >
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className={`rounded-md border border-border text-text-heading transition hover:bg-primary/[0.06] ${embeddedInSettings ? "p-1.5" : compact ? "p-1" : "p-1.5"}`}
            aria-label="Next month"
          >
            <ChevronRight size={compact ? 14 : 16} />
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <p
          className={`text-center text-sm text-text-muted ${compact || embeddedInSettings ? "py-4" : "py-8"}`}
        >
          Loading appointments…
        </p>
      ) : query.isError ? (
        <p
          className={`text-center text-sm text-red-600 ${compact || embeddedInSettings ? "py-4" : "py-6"}`}
        >
          {query.error?.message || "Could not load appointments."}
        </p>
      ) : (
        <>
          {embeddedInSettings ? (
            <div className="flex min-h-0 flex-1 flex-col gap-0 pt-2">
              <div className="grid grid-cols-7 overflow-hidden rounded-t-lg border border-border/80 bg-white">
                {weekdayShort.map((d) => (
                  <div
                    key={d}
                    className="border-r border-border/50 bg-primary/[0.08] py-2 pl-2 pr-1 text-left text-[10px] font-semibold uppercase tracking-wide text-text-heading last:border-r-0 sm:text-[11px]"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-b-lg border border-t-0 border-border/80 bg-white">
                {/* Scroll the full month: h-full + overflow-hidden was clipping rows and collapsing booking chips. */}
                <div className="grid w-full grid-cols-7 bg-white [grid-auto-rows:minmax(5.5rem,auto)]">
                  {cells.map((cell) => {
                    if (cell.type === "pad") {
                      return (
                        <div
                          key={cell.key}
                          className="min-h-[5.5rem] border-r border-t border-border/40 bg-background-lighter [&:nth-child(7n)]:border-r-0"
                          aria-hidden
                        />
                      );
                    }
                    const items = cell.items;
                    const has = items.length > 0;
                    const visible = items.slice(0, MAX_VISIBLE_DAY_BOOKINGS);
                    const overflow = items.length - visible.length;
                    return (
                      <div
                        key={cell.key}
                        className={`flex min-h-[5.5rem] flex-col border-r border-t border-border/40 bg-white pl-2 pr-1 pt-1.5 pb-1 [&:nth-child(7n)]:border-r-0 ${
                          has ? "ring-1 ring-inset ring-primary/18" : ""
                        }`}
                      >
                        <span
                          className={`shrink-0 tabular-nums leading-none text-[11px] font-semibold ${
                            has ? "text-text-heading" : "text-text-muted"
                          }`}
                        >
                          {cell.day}
                        </span>
                        <div className="mt-0.5 flex flex-col gap-px">
                          {visible.map((b, idx) => {
                            const t = parseStart(b.starts_at);
                            const time = formatTimeShort(t);
                            const name = b.contact?.full_name || b.contact?.email || "Lead";
                            return (
                              <button
                                key={bookingRowKey(b, idx)}
                                type="button"
                                onClick={() => setSelectedBooking(b)}
                                className="w-full min-w-0 shrink-0 rounded-sm border-l-[3px] border-primary bg-primary/[0.1] px-1 py-px text-left transition hover:bg-primary/[0.16] focus:outline-none focus:ring-2 focus:ring-primary/25"
                                title={`${name}${time ? ` · ${time}` : ""}`}
                              >
                                <div className="truncate text-[8px] font-semibold leading-tight sm:text-[9px]">
                                  {time ? <span className="text-text-body">{time} </span> : null}
                                  <span className="text-text-heading">{name}</span>
                                </div>
                              </button>
                            );
                          })}
                          {overflow > 0 ? (
                            <button
                              type="button"
                              onClick={() => setDayOverflow({ day: cell.day, items })}
                              title={`${items.length} bookings this day — open full list`}
                              aria-label={`${overflow} more bookings, ${items.length} total this day`}
                              className="mt-px flex w-full shrink-0 flex-col gap-0 rounded-sm px-1 py-px text-left leading-tight"
                            >
                              <span className="text-[8px] font-semibold text-primary underline-offset-2 hover:underline sm:text-[9px]">
                                +{overflow} more
                              </span>
                              <span className="text-[7px] font-medium tabular-nums text-text-muted sm:text-[8px]">
                                {items.length} total
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className={compact ? "mt-2" : "mt-3"}>
              <div className={`grid grid-cols-7 ${compact ? "gap-px" : "gap-0.5"}`}>
                {weekdayShort.map((d) => (
                  <div
                    key={d}
                    className={`bg-background-light/50 pl-2 pr-1 text-left font-semibold uppercase tracking-wide text-text-muted ${
                      compact ? "py-1 text-[9px]" : "py-2 text-[10px]"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className={`mt-px grid grid-cols-7 ${compact ? "gap-px" : "gap-0.5"}`}>
                {cells.map((cell) => {
                  if (cell.type === "pad") {
                    return (
                      <div
                        key={cell.key}
                        className={`rounded-md bg-background-light/30 ${cellMinH} border border-transparent`}
                      />
                    );
                  }
                  const items = cell.items;
                  const has = items.length > 0;
                  const visible = items.slice(0, MAX_VISIBLE_DAY_BOOKINGS);
                  const overflow = items.length - visible.length;
                  const cellPad = compact ? "p-0.5" : "p-1";

                  return (
                    <div
                      key={cell.key}
                      className={`flex ${cellMinH} flex-col rounded-md border ${cellPad} ${
                        has
                          ? "border-primary/25 bg-white"
                          : "border-transparent bg-background-light/20 text-text-muted"
                      }`}
                    >
                      <span
                        className={`shrink-0 pl-2 tabular-nums leading-none ${compact ? "text-[10px]" : "text-[11px] font-medium"} ${
                          has ? "text-text-heading" : "text-text-muted"
                        }`}
                      >
                        {cell.day}
                      </span>
                      <div className="mt-0.5 flex flex-col gap-px">
                        {visible.map((b, idx) => {
                          const t = parseStart(b.starts_at);
                          const time = formatTimeShort(t);
                          const name = b.contact?.full_name || b.contact?.email || "Lead";
                          return (
                            <button
                              key={bookingRowKey(b, idx)}
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className={`w-full min-w-0 shrink-0 rounded-sm border-l-[3px] border-primary bg-primary/[0.12] text-left transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 ${compact ? "px-1 py-px" : "px-1 py-0.5"}`}
                              title={`${name}${time ? ` · ${time}` : ""}`}
                            >
                              <div
                                className={`truncate font-semibold text-primary-dark ${compact ? "text-[8px] leading-tight sm:text-[9px]" : "text-[9px] leading-tight sm:text-[10px]"}`}
                              >
                                {time ? <span className="text-text-body">{time} </span> : null}
                                <span className="text-text-heading">{name}</span>
                              </div>
                            </button>
                          );
                        })}
                        {overflow > 0 ? (
                          <button
                            type="button"
                            onClick={() => setDayOverflow({ day: cell.day, items })}
                            title={`${items.length} bookings this day — open full list`}
                            aria-label={`${overflow} more bookings, ${items.length} total this day`}
                            className={`mt-px flex w-full shrink-0 flex-col gap-0 rounded-sm px-1 py-px text-left leading-tight ${compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"}`}
                          >
                            <span className="font-semibold text-primary-dark underline-offset-2 hover:underline">
                              +{overflow} more
                            </span>
                            <span className="text-[7px] font-medium tabular-nums text-text-muted sm:text-[8px]">
                              {items.length} total
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bookings.some((b) => !b.starts_at) ? (
            <div
              className={`shrink-0 rounded-lg border border-amber-200/80 bg-amber-50/50 text-amber-900 ${compact || embeddedInSettings ? "mt-2 px-2 py-1.5 text-[10px]" : "mt-3 px-3 py-2 text-[11px]"}`}
            >
              <span className="font-semibold">Some bookings have no recorded time</span>
              <span className="text-amber-800/90">
                {" "}
                — times appear when the chat is marked booked via Calendly.
              </span>
            </div>
          ) : null}
        </>
      )}

      {selectedBooking ? (
        <BookingDetailModal
          booking={selectedBooking}
          token={token}
          onClose={() => setSelectedBooking(null)}
          onCanceled={() =>
            queryClient.invalidateQueries({ queryKey: ["calendar-bookings", token] })
          }
        />
      ) : null}
      {dayOverflow ? (
        <DayOverflowModal
          day={dayOverflow.day}
          cursor={cursor}
          items={dayOverflow.items}
          onClose={() => setDayOverflow(null)}
          onSelectBooking={(b) => setSelectedBooking(b)}
        />
      ) : null}
    </section>
  );
}
