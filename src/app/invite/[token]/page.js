"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { captureInviteToken, resolveInviteToken } from "@/lib/inviteClient";
import {
  getOrCreateInviteSessionId,
  getOrCreateInviteVisitorId,
  saveInviteAttribution,
} from "@/lib/inviteAttributionStorage";

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "").trim();

  const resolveQuery = useQuery({
    queryKey: ["invite-resolve", token],
    enabled: Boolean(token),
    queryFn: () => resolveInviteToken({ token }),
    staleTime: 30_000,
  });

  const captureMutation = useMutation({
    mutationFn: () =>
      captureInviteToken({
        token,
        payload: {
          session_id: getOrCreateInviteSessionId(),
          visitor_id: getOrCreateInviteVisitorId(),
          source_channel: "direct",
          source_referrer:
            typeof document !== "undefined" ? document.referrer || "" : "",
          landing_path:
            typeof window !== "undefined" ? window.location.pathname : `/invite/${token}`,
        },
      }),
  });

  const inviterName = useMemo(() => {
    const inviter = resolveQuery.data?.inviter;
    return (
      inviter?.full_name ||
      [inviter?.first_name, inviter?.last_name].filter(Boolean).join(" ").trim() ||
      "A trusted Nesti member"
    );
  }, [resolveQuery.data?.inviter]);
  const inviteMeta = resolveQuery.data?.invite;
  const isLeadReferralInvite = Boolean(
    inviteMeta?.source_conversation_id ||
      inviteMeta?.source_referral_id ||
      String(inviteMeta?.source_channel || "").trim().toLowerCase() === "lead_referral"
  );

  const forwardWithInvite = async (path) => {
    try {
      await captureMutation.mutateAsync();
    } catch {
      // best effort capture; don't block conversion path
    }
    saveInviteAttribution(token, {
      sourceChannel: "direct",
      landingPath: `/invite/${token}`,
    });
    router.push(`${path}?invite=${encodeURIComponent(token)}`);
  };

  if (resolveQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-start justify-center px-6 py-8">
        <p className="text-sm text-text-muted">Loading invite...</p>
      </div>
    );
  }

  if (resolveQuery.isError || !resolveQuery.data?.success) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-start gap-4 px-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-text-heading">Invite link unavailable</h1>
        <p className="text-sm text-text-muted">
          This invite may have expired or is no longer active.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Go to sign up
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-8 pb-10">
      <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck size={14} />
          {isLeadReferralInvite ? "Lead referral invite" : "Trusted invite"}
        </div>
        <h1 className="text-2xl font-bold text-text-heading md:text-3xl">
          {isLeadReferralInvite
            ? "You have a new lead referral invite on Nesti"
            : `${inviterName} invited you to join Nesti`}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          {isLeadReferralInvite
            ? "Complete signup or login to unlock the referred lead workflow. Your invite attribution is captured automatically."
            : "Join with this invite and your account will be connected automatically after signup or login. Attribution stays active for delayed signups, so you can continue later."}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => forwardWithInvite("/sign-up")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <UserPlus size={16} />
            Continue with Email signup
          </button>
          <p className="text-xs text-text-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => forwardWithInvite("/log-in")}
              className="font-semibold text-primary hover:underline"
            >
              {isLeadReferralInvite ? "Log in to continue referral" : "Log in with this invite"}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Fast signup",
            body: "Takes about a minute. Your invite is saved so you can finish later.",
          },
          {
            title: "Automatic connection",
            body: "After you sign up or log in, you'll be linked to the inviter automatically.",
          },
          {
            title: "Secure & trusted",
            body: "Invite attribution is captured safely and helps prevent referral fraud.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border/70 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-text-heading">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
