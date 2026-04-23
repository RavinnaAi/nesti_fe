"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, X } from "lucide-react";
import { useAppSelector } from "@/store";
import { fetchNotificationById, markNotificationReadRequest } from "@/lib/notificationsClient";

function normalizeLeadId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const fromQuery = decoded.match(/[?&]lead=([a-fA-F0-9]{24})/);
  if (fromQuery?.[1]) return fromQuery[1];
  const idMatch = decoded.match(/([a-fA-F0-9]{24})/);
  return idMatch?.[1] || "";
}

function severityStyles(sev) {
  const s = String(sev || "").toLowerCase();
  if (s === "critical")
    return "border-red-200 bg-red-50 text-red-800";
  if (s === "high") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-border bg-background-light/80 text-text-heading";
}

function MetaItem({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="rounded-lg border border-border/70 bg-white/80 px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text-heading">{String(value)}</p>
    </div>
  );
}

export default function NotificationDetailModal({ notification, onClose }) {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  const id = notification?.id ? String(notification.id) : null;

  const detailQuery = useQuery({
    queryKey: ["notifications", "detail", token, id],
    queryFn: () => fetchNotificationById({ token, id }),
    enabled: Boolean(token && id),
    staleTime: 30_000,
  });

  const detail = detailQuery.data;
  const display = detail ?? notification;
  const isLoading = Boolean(id && detailQuery.isLoading && !detail);
  const isError = detailQuery.isError;

  /** Avoid duplicate PATCH /read when mutation state + broad invalidation re-ran the effect. */
  const markReadAttemptedRef = useRef(false);
  useEffect(() => {
    markReadAttemptedRef.current = false;
  }, [id]);

  const markReadMutation = useMutation({
    mutationFn: ({ nid }) => markNotificationReadRequest({ token, id: nid }),
    onSuccess: (data) => {
      const updated = data?.notification;
      if (updated && id) {
        queryClient.setQueryData(["notifications", "detail", token, id], updated);
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  useEffect(() => {
    if (!detail?.id || detail.read_at || markReadAttemptedRef.current) return;
    markReadAttemptedRef.current = true;
    const nid = String(detail.id);
    markReadMutation.mutate(
      { nid },
      {
        onError: () => {
          markReadAttemptedRef.current = false;
        },
      }
    );
  }, [detail?.id, detail?.read_at]);

  useEffect(() => {
    if (!notification) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [notification, onClose]);

  if (!notification || typeof document === "undefined") return null;

  const openLeadId =
    display?.action?.type === "open_lead" && display?.action?.lead_match_id
      ? normalizeLeadId(display.action.lead_match_id)
      : display?.lead_match_id
        ? normalizeLeadId(display.lead_match_id)
        : null;

  const created =
    display?.created_at &&
    new Date(display.created_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const pna = display?.primary_next_action;
  const pnaTitle = pna && typeof pna === "object" ? pna.title : null;
  const pnaTemplate = pna && typeof pna === "object" ? pna.follow_up_template : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[min(90vh,800px)] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 bg-white p-5 shadow-2xl shadow-black/20 sm:p-6 ${severityStyles(display?.severity)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell size={18} />
            </span>
            <div className="min-w-0">
              {display?.notification_type ? (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {String(display.notification_type).replace(/_/g, " ")}
                </p>
              ) : null}
              <h2
                id="notification-detail-title"
                className="text-base font-bold leading-snug text-text-heading sm:text-xl"
              >
                {display?.title || "Notification"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {created ? <p className="text-xs text-text-muted">{created}</p> : null}
                {display?.read_at ? (
                  <span className="text-[10px] font-medium text-text-muted">Read</span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border bg-white/90 p-1.5 text-text-heading hover:bg-background-light"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-text-muted">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm">Loading notification…</p>
          </div>
        ) : isError ? (
          <p className="mt-6 text-sm text-red-600">
            {detailQuery.error?.message || "Could not load this notification."}
          </p>
        ) : (
          <>
            {display?.body ? (
              <p className="mt-4 text-sm leading-relaxed text-text-heading/90">{display.body}</p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MetaItem label="Grade" value={display?.grade} />
              <MetaItem label="Score" value={display?.score != null ? String(display.score) : null} />
              <MetaItem label="Intent" value={display?.intent} />
              <MetaItem label="Appointment" value={display?.appointment_status?.replace(/_/g, " ")} />
              <MetaItem label="Urgency" value={display?.urgency} />
              <MetaItem label="Response window" value={display?.urgency_window} />
            </div>

            {display?.speed_to_lead_tip ? (
              <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-text-heading">
                <span className="font-semibold text-primary">Speed to lead: </span>
                {display.speed_to_lead_tip}
              </div>
            ) : null}

            {display?.outcomes_headline ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Goal</p>
                <p className="text-sm text-text-heading">{display.outcomes_headline}</p>
              </div>
            ) : null}

            {display?.booking_cta ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Booking CTA</p>
                <p className="text-sm text-text-heading">{display.booking_cta}</p>
              </div>
            ) : null}

            {(pnaTitle || pnaTemplate) ? (
              <div className="mt-4 rounded-xl border border-border bg-background-light/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Recommended next action
                </p>
                {pnaTitle ? <p className="mt-1 text-sm font-semibold text-text-heading">{pnaTitle}</p> : null}
                {pnaTemplate ? (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-md border border-border/80 bg-white p-2.5 text-xs leading-relaxed text-text-muted">
                    {pnaTemplate}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading hover:bg-background-light"
          >
            Close
          </button>
          {openLeadId && !isLoading && !isError ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/leads/${encodeURIComponent(openLeadId)}`);
              }}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
            >
              Open lead
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
