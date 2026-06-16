"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAppSelector } from "@/store";
import { FEATURES } from "@/constants/features";
import BulkFollowupWorkspace from "@/components/clients/BulkFollowupWorkspace";

export default function ClientFollowUpsPage() {
  const { isAuthenticated } = useAuthGuard();
  const { hasFeature } = useFeatureAccess();
  const token = useAppSelector((state) => state.auth.token);
  const [hydrated, setHydrated] = useState(false);
  const canBulkFollowup = hasFeature(FEATURES.LEADS_FOLLOWUP_AUTOMATED);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-1 items-center justify-center bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04]">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!canBulkFollowup) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] p-3 font-body text-text-body antialiased sm:p-5">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
          <div className="rounded-2xl border border-primary/10 bg-white px-6 py-8 text-center shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.02]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.06] text-primary">
              <Mail size={22} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-text-heading">Bulk follow-ups require Standard</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
              Bulk nurture emails are included on Standard and Enterprise plans.
              Automated 15-day follow-ups are available on Enterprise.
              Upgrade to generate, review, and send follow-ups from this workspace.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
              >
                View plans
              </Link>
              <Link
                href="/clients"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text-heading hover:bg-slate-50"
              >
                <ArrowLeft size={14} />
                Back to clients
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] p-3 font-body text-text-body antialiased sm:p-5">
      <div className="mb-4 rounded-2xl border border-primary/10 bg-white/80 px-4 py-4 shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading inline-flex items-center gap-2 text-lg font-bold tracking-tight text-text-heading sm:text-xl">
              <Mail size={20} className="text-primary" />
              Client follow-ups
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              Generate, review, and send bulk nurture emails from a dedicated workspace.
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text-heading shadow-sm transition hover:bg-slate-50 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Back to clients
          </Link>
        </div>
      </div>

      <BulkFollowupWorkspace token={token} />
    </div>
  );
}
