"use client";

import { Target } from "lucide-react";

export default function NetworkCircleProgressBar({ networkCircle, isLoading = false }) {
  const nc = networkCircle || {};
  const current = Number(nc.referrals_sent_paid ?? 0);
  const target = Number(nc.free_month_target ?? 60);
  const progress = Math.min(100, Math.max(0, Number(nc.free_month_progress ?? 0) * 100));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary-dark">
            <Target size={13} strokeWidth={2.5} />
          </span>
          <span className="text-xs font-semibold text-text-heading">Free-month goal</span>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
          {isLoading ? "…" : `${current} / ${target}`}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!isLoading && progress > 0 && progress < 100 && (
        <p className="mt-1.5 text-[10px] text-slate-500">
          {Math.round(progress)}% complete — {target - current} referrals remaining
        </p>
      )}
    </div>
  );
}
