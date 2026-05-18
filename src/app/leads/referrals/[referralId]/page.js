"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { resolveAuthUserId } from "@/lib/resolveAuthUserId";
import ReferralLeadWorkspace from "@/components/referrals/ReferralLeadWorkspace";

/**
 * Accepted referral from Leads → Pipeline → Referrals (not under `/referrals` inbox).
 * Back returns to the pipeline referrals list on `/leads`.
 */
export default function LeadsPipelineReferralDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const referralId = String(params?.referralId || "").trim();
  const pageRaw = Number.parseInt(String(searchParams.get("page") || "1"), 10);
  const listPage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { isAuthenticated, profile } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const me = useAppSelector((s) => s.auth.user);
  const meId = useMemo(() => resolveAuthUserId(profile, me), [profile, me]);

  const backHref =
    listPage > 1
      ? `/leads?pipeline=referrals&page=${listPage}`
      : "/leads?pipeline=referrals";

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background-light/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            aria-label="Back to pipeline referrals"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-heading hover:bg-background-light"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-heading">Referral (pipeline)</h1>
            <p className="text-sm text-text-muted">
              Accepted referral from Leads → Pipeline → Referrals. Use the arrow above to return to that list.
            </p>
          </div>
        </div>

        {!referralId ? (
          <p className="text-sm text-text-muted">Missing referral id.</p>
        ) : (
          <ReferralLeadWorkspace
            token={token}
            referralId={referralId}
            meId={meId}
            fromPipelineReferrals
            listPage={listPage}
            referralDirection="inbound"
          />
        )}
      </div>
    </div>
  );
}
