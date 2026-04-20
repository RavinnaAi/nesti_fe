"use client";

import Link from "next/link";
import { InfoCard } from "@/components/profile/ProfileInfoCard";

export default function SubscriptionCard({ activePlan }) {
  return (
    <InfoCard delay={0.05}>
      {activePlan ? (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-base font-semibold text-text-heading">{activePlan?.name || "Plan"}</div>
            <div className="text-sm text-text-muted">{activePlan?.description || "Active subscription"}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-lg font-semibold tabular-nums text-text-heading">
              {activePlan?.price || "$0"}{" "}
              <span className="text-sm font-normal text-text-muted">{activePlan?.period || ""}</span>
            </div>
            {activePlan?.popular ? (
              <span className="mt-1 inline-block rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Popular
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-5 py-6 text-center">
          <p className="text-sm text-text-muted">
            No active subscription yet. Choose a plan in settings when you&apos;re ready.
          </p>
          <Link
            href="/settings?tab=subscription"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            View plans
          </Link>
        </div>
      )}
    </InfoCard>
  );
}
