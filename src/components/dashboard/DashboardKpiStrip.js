"use client";

import { Users, Eye, CalendarCheck, Mail, TrendingUp } from "lucide-react";

const TILES = [
  {
    key: "leads_created",
    label: "New leads",
    helper: "Captured in period",
    Icon: Users,
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    key: "lead_views",
    label: "Lead views",
    helper: "Profile opens",
    Icon: Eye,
    accent: "text-sky-600 bg-sky-50",
  },
  {
    key: "appointments_booked",
    label: "Appointments",
    helper: "Booked meetings",
    Icon: CalendarCheck,
    accent: "text-violet-600 bg-violet-50",
  },
  {
    key: "nurture_emails_sent",
    label: "Nurture emails",
    helper: "Successful sends",
    Icon: Mail,
    accent: "text-amber-600 bg-amber-50",
  },
  {
    key: "conversion_rate",
    label: "Conversion",
    helper: "Booked / created",
    Icon: TrendingUp,
    accent: "text-rose-600 bg-rose-50",
    isPercent: true,
  },
];

function formatPercent(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n < 0) return "—";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

function formatInt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(v));
}

export default function DashboardKpiStrip({ summary, isLoading }) {
  const totals = summary?.totals || {};
  const rates = summary?.conversion_rates || {};
  const values = {
    leads_created: totals.leads_created ?? 0,
    lead_views: totals.lead_views ?? 0,
    appointments_booked: totals.appointments_booked ?? 0,
    nurture_emails_sent: totals.nurture_emails_sent ?? 0,
    conversion_rate: rates.booked_from_created ?? 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
      {TILES.map(({ key, label, helper, Icon, accent, isPercent }) => {
        const raw = values[key];
        const display = isLoading ? null : isPercent ? formatPercent(raw) : formatInt(raw);
        return (
          <div
            key={key}
            className={`rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow ${
              isLoading ? "" : "hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <>
                    <div className="h-3 w-20 rounded-md bg-primary/10 animate-pulse" />
                    <div className="mt-2 h-8 w-16 rounded-md bg-primary/15 animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-text-heading">{display}</p>
                  </>
                )}
              </div>
              <span
                className={`rounded-lg p-2 shrink-0 ${isLoading ? "bg-primary/10 animate-pulse" : accent}`}
              >
                {isLoading ? <span className="block size-4" aria-hidden /> : <Icon size={16} strokeWidth={2.2} />}
              </span>
            </div>
            {isLoading ? (
              <div className="mt-2 h-3 w-28 rounded-md bg-primary/10 animate-pulse" />
            ) : (
              <p className="mt-2 text-[11px] text-text-muted">{helper}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
