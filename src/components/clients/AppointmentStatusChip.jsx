"use client";

function labelForStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

/**
 * Pill chip for appointment status (clients list, profile, lead rows).
 * Tones: booked = primary green (matches Leads count chip), not_booked = muted, canceled = amber.
 */
export function AppointmentStatusChip({ status, className = "" }) {
  const s = String(status || "").trim().toLowerCase();
  const text = labelForStatus(status);
  const base =
    "inline-flex max-w-[140px] shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize leading-tight sm:text-[11px]";

  let tone = "border-border/80 bg-slate-100/90 text-text-muted";
  if (s === "booked") {
    tone = "border-primary/20 bg-primary/[0.12] text-primary-dark";
  } else if (s === "canceled") {
    tone = "border-amber-200/90 bg-amber-50 text-amber-900";
  } else if (s === "not_booked") {
    tone = "border-primary/15 bg-primary/[0.06] text-text-muted";
  }

  return (
    <span title={text} className={`${base} ${tone} ${className}`.trim()}>
      {text}
    </span>
  );
}

/**
 * Nurture email consultation (meeting_booked in nurture logs), not Calendly-only appointment_status.
 */
export function NurtureConsultationStatusChip({ booked, className = "" }) {
  const isBooked = Boolean(booked);
  const base =
    "inline-flex max-w-[140px] shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize leading-tight sm:text-[11px]";
  const tone = isBooked
    ? "border-violet-200 bg-violet-50 text-violet-900"
    : "border-primary/15 bg-primary/[0.06] text-text-muted";
  const label = isBooked ? "Booked" : "Not booked";
  const title = isBooked
    ? "Meeting booked via nurture email tracking"
    : "No nurture-tracked consultation booking for this profile";

  return (
    <span title={title} className={`${base} ${tone} ${className}`.trim()}>
      {label}
    </span>
  );
}

/** Green count pill — same family as booked appointment chip. */
export function LeadsCountChip({ count, title = "Leads linked to this profile" }) {
  const n = Number(count) || 0;
  return (
    <span
      title={title}
      className="inline-flex min-h-[1.25rem] min-w-[1.75rem] items-center justify-center rounded-full border border-primary/20 bg-primary/[0.12] px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary-dark sm:min-h-[1.375rem] sm:text-[11px]"
    >
      {n}
    </span>
  );
}
