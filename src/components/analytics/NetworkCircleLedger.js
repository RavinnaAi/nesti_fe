"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRewardsLedger } from "@/lib/inviteClient";

const STATUS_STYLES = {
  Success: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  Active: "bg-primary/[0.06] text-primary-dark ring-primary/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200/80",
};

function StatusBadge({ status }) {
  const key = String(status || "Pending");
  const cls = STATUS_STYLES[key] || STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cls}`}>
      {key}
    </span>
  );
}

export default function NetworkCircleLedger({ token, enabled = true }) {
  const ledgerQuery = useQuery({
    queryKey: ["analytics-rewards-ledger", token],
    enabled: Boolean(token) && enabled,
    queryFn: () => fetchRewardsLedger({ token, page: 1, limit: 12 }),
    staleTime: 60_000,
  });

  const rows = Array.isArray(ledgerQuery.data?.items) ? ledgerQuery.data.items : [];

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rewards ledger</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.6fr)_88px_minmax(0,1fr)] gap-2 border-b border-slate-100 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Activity</span>
          <span>Status</span>
          <span className="text-right">Earned</span>
        </div>
        {ledgerQuery.isLoading ? (
          <div className="px-4 py-10 text-center text-xs text-slate-400">Loading…</div>
        ) : ledgerQuery.isError ? (
          <div className="px-4 py-8 text-center text-xs text-amber-700">Could not load ledger.</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">No activity yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[minmax(0,1.6fr)_88px_minmax(0,1fr)] items-center gap-2 px-4 py-3 text-xs transition-colors hover:bg-slate-50/60"
              >
                <span className="truncate font-medium text-text-heading">
                  {row.activity_description || row.event_type || "Activity"}
                </span>
                <StatusBadge status={row.status} />
                <span className="truncate text-right font-semibold tabular-nums text-text-heading">
                  {row.reward_earned || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
