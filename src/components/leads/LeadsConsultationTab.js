"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck2, Info, Mail, Route } from "lucide-react";
import { getStatusDisplay } from "@/lib/leadPipelineConfig";

export default function LeadsConsultationTab({
  lead,
  onCancelCalendlyAppointment,
  cancelCalendlyPending = false,
  onGoToNurture,
}) {
  const [showCalendlyCancelModal, setShowCalendlyCancelModal] = useState(false);
  const [calendlyCancelSubmitting, setCalendlyCancelSubmitting] = useState(false);

  useEffect(() => {
    if (!showCalendlyCancelModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showCalendlyCancelModal]);

  useEffect(() => {
    if (!showCalendlyCancelModal) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !calendlyCancelSubmitting && !cancelCalendlyPending) {
        setShowCalendlyCancelModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCalendlyCancelModal, calendlyCancelSubmitting, cancelCalendlyPending]);

  const leadData = lead && typeof lead === "object" ? lead : {};
  const pipelineStatus = leadData.status || leadData.match_status || "";
  const statusInfo = getStatusDisplay(pipelineStatus);

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const raw = String(value).replace(/_/g, " ").trim();
    if (!raw) return "—";
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const apptRaw = leadData.appointment_status;
  const apptNorm = String(apptRaw || "").toLowerCase();
  const nurtureBooked = apptNorm === "booked" && Boolean(leadData.nurture_consultation_booked);
  const calendlyRaw = leadData.calendly_booking_status;
  const hasBookedSignal =
    apptNorm === "booked" ||
    pipelineStatus === "consult_booked" ||
    pipelineStatus === "showing_booked";

  const KeyValue = ({ label, value, children }) => (
    <div className="rounded-md border border-border/60 bg-background-light/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-xs font-normal text-text-heading mt-0.5 break-words">
        {children ?? readable(value)}
      </div>
    </div>
  );

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {!lead ? (
        <div className="flex min-h-[220px] items-center justify-center px-3 py-6">
          <div className="w-full max-w-sm rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center shadow-sm">
            <span className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Info size={16} />
            </span>
            <p className="text-sm font-semibold text-text-heading">Choose a lead to view consultation</p>
            <p className="mt-1 text-xs text-text-muted">
              Select a lead to check booking status and Calendly activity.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`rounded-lg border px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${
              hasBookedSignal
                ? "border-violet-200 bg-violet-50/80"
                : "border-border/70 bg-background-light/40"
            }`}
          >
            <div className="flex items-start gap-2">
              <CalendarCheck2
                className={`shrink-0 mt-0.5 ${hasBookedSignal ? "text-violet-700" : "text-text-muted"}`}
                size={18}
                aria-hidden
              />
              <div>
                <div className="text-sm font-semibold text-text-heading">Consultation summary</div>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  {hasBookedSignal
                    ? "This lead has at least one booked or nurture-tracked consultation signal."
                    : "No booked consultation detected yet (Calendly, pipeline stage, or nurture meeting flag)."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-heading">
              <Route size={16} className="text-primary" aria-hidden />
              Pipeline &amp; scheduling
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <KeyValue label="Pipeline stage">
                <span
                  className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-snug whitespace-nowrap ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </KeyValue>
              <KeyValue label="Appointment status (resolved)" value={apptRaw} />
              <KeyValue label="Calendly booking" value={calendlyRaw} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-heading">
              <Mail size={16} className="text-primary" aria-hidden />
              Nurture email
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <KeyValue label="Consultation booked via nurture">
                <span
                  className={
                    nurtureBooked
                      ? "font-semibold text-emerald-700"
                      : "text-text-muted font-medium"
                  }
                >
                  {nurtureBooked ? "Yes" : "No"}
                </span>
              </KeyValue>
              <div className="rounded-md border border-dashed border-border/80 bg-background-light/30 px-3 py-2 flex flex-col justify-center gap-2">
                <p className="text-[11px] text-text-muted leading-snug">
                  Meeting clicks from nurture tracking links set this flag when the lead books.
                </p>
                {typeof onGoToNurture === "function" ? (
                  <button
                    type="button"
                    onClick={onGoToNurture}
                    className="self-start rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    Open Nurture Email tab
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {apptNorm === "booked" && typeof onCancelCalendlyAppointment === "function" ? (
            <div className="rounded-md border border-border/80 bg-white p-4 space-y-2">
              <div className="text-xs font-semibold text-text-heading">Calendly</div>
              <button
                type="button"
                disabled={cancelCalendlyPending || calendlyCancelSubmitting}
                onClick={() => setShowCalendlyCancelModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelCalendlyPending || calendlyCancelSubmitting
                  ? "Canceling…"
                  : "Cancel Calendly appointment"}
              </button>
              <p className="text-[11px] text-text-muted leading-snug">
                Cancels the scheduled event via Calendly. Some group-style events may need to be managed
                in Calendly.
              </p>
            </div>
          ) : null}
        </>
      )}

      {showCalendlyCancelModal &&
      typeof document !== "undefined" &&
      typeof onCancelCalendlyAppointment === "function"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !calendlyCancelSubmitting && !cancelCalendlyPending) {
                  setShowCalendlyCancelModal(false);
                }
              }}
            >
              <div
                className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-xl"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="consult-calendly-cancel-title"
                aria-describedby="consult-calendly-cancel-desc"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 id="consult-calendly-cancel-title" className="text-sm font-bold text-text-heading">
                  Cancel this meeting?
                </h3>
                <p id="consult-calendly-cancel-desc" className="mt-2 text-sm leading-relaxed text-text-body">
                  This removes the event in Calendly. The invitee is notified according to your Calendly
                  settings, and the lead is updated in Nesti.
                </p>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={calendlyCancelSubmitting || cancelCalendlyPending}
                    onClick={() => setShowCalendlyCancelModal(false)}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading transition hover:bg-background-light disabled:opacity-60"
                  >
                    Go back
                  </button>
                  <button
                    type="button"
                    disabled={calendlyCancelSubmitting || cancelCalendlyPending}
                    onClick={async () => {
                      setCalendlyCancelSubmitting(true);
                      try {
                        await onCancelCalendlyAppointment();
                        setShowCalendlyCancelModal(false);
                      } catch {
                        /* toast from parent mutation */
                      } finally {
                        setCalendlyCancelSubmitting(false);
                      }
                    }}
                    className="rounded-lg border border-red-200 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {calendlyCancelSubmitting || cancelCalendlyPending
                      ? "Canceling…"
                      : "Yes, cancel in Calendly"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
