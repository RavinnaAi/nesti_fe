"use client";

import { Calendar } from "lucide-react";
import { useCalendlyConnection } from "@/hooks/useCalendlyConnection";

/**
 * Single control for the dashboard hero: shows "Connected" or "Disconnected" and toggles OAuth / disconnect.
 */
export default function DashboardCalendlyButton({ className = "" }) {
  const {
    token,
    statusQuery,
    connected,
    connecting,
    startCalendlyOAuth,
    disconnectMut,
  } = useCalendlyConnection();

  if (!token) return null;

  const busy = connecting || disconnectMut.isPending || statusQuery.isFetching;
  const loading = statusQuery.isLoading;

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-55";

  if (loading) {
    return (
      <div
        className={`${base} border-white/25 bg-white/10 text-white/80 ${className}`}
        aria-busy
      >
        <Calendar size={18} className="opacity-90" aria-hidden />
        …
      </div>
    );
  }

  if (connected) {
    return (
      <button
        type="button"
        onClick={() => disconnectMut.mutate()}
        disabled={busy}
        className={`${base} border-emerald-200/50 bg-emerald-500/25 text-white hover:bg-emerald-500/35 ${className}`}
        title="Click to disconnect Calendly"
      >
        <Calendar size={18} className="opacity-95" aria-hidden />
        Connected
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startCalendlyOAuth}
      disabled={busy}
      className={`${base} border-white/40 bg-white/10 text-white hover:bg-white/20 ${className}`}
      title="Connect your Calendly account"
    >
      <Calendar size={18} className="opacity-95" aria-hidden />
      {connecting ? "Connecting…" : "Disconnected"}
    </button>
  );
}
