"use client";

import { Users, Eye, CalendarCheck, Mail, Trophy } from "lucide-react";

const TILES = [
  {
    key: "leads_created",
    label: "Leads",
    helper: "Total in leads list",
    Icon: Users,
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "lead_views",
    label: "Lead views",
    helper: "Profile opens",
    Icon: Eye,
    accent: "bg-sky-100 text-sky-600",
  },
  {
    key: "appointments_booked",
    label: "Appointments",
    helper: "Booked meetings",
    Icon: CalendarCheck,
    accent: "bg-violet-100 text-violet-600",
  },
  {
    key: "nurture_emails_sent",
    label: "Nurture emails",
    helper: "Successful sends",
    Icon: Mail,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    key: "leads_closed_won",
    label: "Deals",
    helper: "",
    Icon: Trophy,
    accent: "bg-rose-100 text-rose-600",
    dealsMeta: true,
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
  const values = {
    leads_created: totals.leads_created ?? 0,
    lead_views: totals.lead_views ?? 0,
    appointments_booked: totals.appointments_booked ?? 0,
    nurture_emails_sent: totals.nurture_emails_sent ?? 0,
    leads_closed_won: totals.leads_closed_won ?? 0,
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {TILES.map(({ key, label, helper, Icon, accent, isPercent, dealsMeta }) => {
        const raw = values[key];
        const display = isLoading ? null : isPercent ? formatPercent(raw) : formatInt(raw);
        const totalLeads = totals.leads_created ?? 0;
        const dealsCount = totals.leads_closed_won ?? 0;
        const dealsRateFromTotal =
          totalLeads > 0 ? Number((dealsCount / totalLeads).toFixed(3)) : 0;
        const helperText =
          dealsMeta && !isLoading
            ? `Moved to closed-won · ${formatPercent(dealsRateFromTotal)} win rate · ${formatInt(totalLeads)} leads total`
            : helper;
        return (
          <div
            key={key}
            className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <>
                    <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                    <div className="mt-3 h-7 w-14 rounded bg-slate-100 animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-text-heading">{display}</p>
                  </>
                )}
              </div>
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-105 ${
                  isLoading ? "bg-slate-100 animate-pulse" : accent
                }`}
              >
                {isLoading ? (
                  <span className="block size-4" aria-hidden />
                ) : (
                  <Icon size={15} strokeWidth={2.2} />
                )}
              </span>
            </div>
            {isLoading ? (
              <div className="mt-3 h-3 w-28 rounded bg-slate-100 animate-pulse" />
            ) : (
              <p className="mt-2.5 text-[10px] leading-snug text-slate-500">{helperText}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
