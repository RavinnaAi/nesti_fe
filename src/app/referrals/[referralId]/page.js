"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import ReferralLeadWorkspace from "@/components/referrals/ReferralLeadWorkspace";

export default function ReferralLeadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const referralId = String(params?.referralId || "").trim();
  const direction = String(searchParams.get("direction") || "inbound").toLowerCase();
  const dirParam = direction === "outbound" ? "outbound" : "inbound";

  const { isAuthenticated, profile } = useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const me = useAppSelector((s) => s.auth.user);
  const meId = String(
    profile?.user?._id ||
      profile?.user?.id ||
      profile?.data?._id ||
      profile?.data?.id ||
      me?._id ||
      me?.id ||
      me?.user_id ||
      ""
  ).trim();

  const backHref = `/referrals?direction=${encodeURIComponent(dirParam)}`;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background-light/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-heading hover:bg-background-light"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-heading">Referral details</h1>
            <p className="text-sm text-text-muted">Full lead workspace for this referral.</p>
          </div>
        </div>

        {!referralId ? (
          <p className="text-sm text-text-muted">Missing referral id.</p>
        ) : (
          <ReferralLeadWorkspace token={token} referralId={referralId} meId={meId} />
        )}
      </div>
    </div>
  );
}
