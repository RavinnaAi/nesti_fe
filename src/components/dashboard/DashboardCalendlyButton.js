"use client";

import { Calendar } from "lucide-react";
import { useCalendlyConnection } from "@/hooks/useCalendlyConnection";

/**
 * Single control for the dashboard hero: shows Calendly connection status and toggles OAuth / disconnect.
 * @param {"dark" | "light"} surface — `dark` for overlay heroes; `light` for white card footers (e.g. Settings-style dashboard hero).
 */
export default function DashboardCalendlyButton({ className = "", surface = "dark" }) {
  const {
    token,
    statusQuery,
    connected,
    connecting,
    startCalendlyOAuth,
    disconnectMut,
    registerWebhookMut,
    allGood,
    planBlocked,
    webhookError,
  } = useCalendlyConnection();

  if (!token) return null;

  const busy =
    connecting ||
    disconnectMut.isPending ||
    registerWebhookMut?.isPending ||
    statusQuery.isFetching;
  const loading = statusQuery.isLoading;
  const light = surface === "light";

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 " +
    (light
      ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white");

  if (loading) {
    return (
      <div
        className={`${base} ${
          light
            ? "border-border/80 bg-slate-50 text-text-muted"
            : "border-white/25 bg-white/10 text-white/80"
        } ${className}`}
        aria-busy
      >
        <Calendar size={18} className="opacity-90" aria-hidden />
        …
      </div>
    );
  }

  if (connected) {
    const label = allGood
      ? "Calendly Connected"
      : planBlocked
        ? "Calendly Connected"
        : webhookError
          ? "Calendly Connected (action needed to finish sync)"
          : "Calendly Connected (finishing setup)";

    const title = allGood
      ? "Click to disconnect Calendly"
      : planBlocked
        ? "Calendly is connected, but bookings can't sync because your plan doesn't allow webhooks. Upgrade to Standard/Teams to enable booking sync."
        : webhookError
          ? "Calendly is connected, but webhooks couldn't be registered. Open Settings → Calendar to reconnect."
          : "Calendly connected, but webhooks are still syncing — bookings may not update yet.";

    return (
      <button
        type="button"
        onClick={() => disconnectMut.mutate()}
        disabled={busy}
        className={`${base} ${
          planBlocked || webhookError
            ? light
              ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/90"
              : "border-amber-200/50 bg-amber-500/25 text-white hover:bg-amber-500/35"
            : light
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90"
              : "border-emerald-200/50 bg-emerald-500/25 text-white hover:bg-emerald-500/35"
        } ${className}`}
        title={title}
      >
        <Calendar size={18} className="opacity-95" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startCalendlyOAuth}
      disabled={busy}
      className={`${base} ${
        light
          ? "border-border bg-white text-text-heading shadow-sm hover:bg-primary/[0.06]"
          : "border-white/40 bg-white/10 text-white hover:bg-white/20"
      } ${className}`}
      title="Connect your Calendly account"
    >
      <Calendar size={18} className="opacity-95" aria-hidden />
      {connecting ? "Connecting…" : "Calendly Disconnected"}
    </button>
  );
}
