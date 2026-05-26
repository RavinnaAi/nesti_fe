"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { resolveAuthUserId } from "@/lib/resolveAuthUserId";
import ReferralLeadWorkspace from "@/components/referrals/ReferralLeadWorkspace";

export default function ReferralLeadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const referralId = String(params?.referralId || "").trim();
  const direction = String(searchParams.get("direction") || "inbound").toLowerCase();
  const dirParam = direction === "outbound" ? "outbound" : "inbound";
  const fromPipeline = String(searchParams.get("from") || "").trim().toLowerCase() === "pipeline";
  const listPageRaw = Number.parseInt(String(searchParams.get("list_page") || "1"), 10);
  const listPage = Number.isFinite(listPageRaw) && listPageRaw > 0 ? listPageRaw : 1;

  const { isAuthenticated, hydrated, profile } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const me = useAppSelector((s) => s.auth.user);
  const meId = useMemo(() => resolveAuthUserId(profile, me), [profile, me]);

  const backHref = fromPipeline
    ? listPage > 1
      ? `/leads?pipeline=referrals&page=${listPage}`
      : "/leads?pipeline=referrals"
    : `/referrals?direction=${encodeURIComponent(dirParam)}`;

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-text-muted">Loading referral…</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background-light/30">
      <div className="w-full px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            aria-label={fromPipeline ? "Back to pipeline referrals" : "Back to referrals list"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-heading hover:bg-background-light"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-heading">Referral details</h1>
            <p className="text-sm text-text-muted">
              {fromPipeline
                ? "Opened from Leads → Pipeline → Referrals. Use the arrow above to return to that list."
                : dirParam === "outbound"
                  ? "Read-only snapshot of a referral you sent. The recipient manages nurture and notes on their side."
                  : "Full workspace for this referral (handoff notes, snapshot, actions)."}
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
            referralDirection={dirParam}
          />
        )}
      </div>
    </div>
  );
}
