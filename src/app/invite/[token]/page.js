"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { captureInviteToken, finalizeInviteToken, resolveInviteToken } from "@/lib/inviteClient";
import {
  clearInviteAttribution,
  getOrCreateInviteSessionId,
  getOrCreateInviteVisitorId,
  saveInviteAttribution,
} from "@/lib/inviteAttributionStorage";

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = String(params?.token || "").trim();
  const authToken = useAppSelector((state) => state.auth.token);
  const captureStartedRef = useRef(false);
  const finalizeDoneRef = useRef(false);
  const finalizeRetryRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  useEffect(() => {
    if (!token || captureStartedRef.current) return;
    captureStartedRef.current = true;
    saveInviteAttribution(token, {
      sourceChannel: "direct",
      landingPath: `/invite/${token}`,
    });
    captureMutation.mutate();
  }, [token, captureMutation]);

  useEffect(() => {
    if (!hydrated || !token || !authToken || finalizeDoneRef.current) return;
    finalizeDoneRef.current = true;

    const completeFinalize = (res) => {
      clearInviteAttribution();
      queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
      queryClient.invalidateQueries({ queryKey: ["lead-referrals"] });
      queryClient.invalidateQueries({ queryKey: ["invite-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["invite-conversions"] });
      if (res?.lead_referral?.id) {
        router.replace(`/referrals/${encodeURIComponent(String(res.lead_referral.id))}?direction=inbound`);
        return;
      }
      router.replace("/referrals?direction=inbound");
    };

    const runFinalize = async (allowRetry) => {
      try {
        const res = await finalizeInviteToken({
          token,
          authToken,
          method: "invite_page_logged_in",
          path: `/invite/${token}`,
        });
        completeFinalize(res);
      } catch (err) {
        const status = Number(err?.status || 0);
        const msg = String(err?.message || "");
        if (status === 404 && allowRetry && !finalizeRetryRef.current) {
          finalizeRetryRef.current = true;
          await new Promise((resolve) => setTimeout(resolve, 800));
          return runFinalize(false);
        }
        if ([400, 410].includes(status) || /self\s*referral/i.test(msg)) {
          clearInviteAttribution();
          toast.info("This invite is no longer active for your account.");
          router.replace("/dashboard");
          return;
        }
        finalizeDoneRef.current = false;
      }
    };

    runFinalize(true);
  }, [hydrated, token, authToken, router, queryClient]);

  const isLoggedIn = hydrated && Boolean(authToken);

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

  const forwardWithInvite = (path) => {
    saveInviteAttribution(token, {
      sourceChannel: "direct",
      landingPath: `/invite/${token}`,
    });
    router.push(`${path}?invite=${encodeURIComponent(token)}`);
  };

  if (!hydrated || resolveQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <p className="text-sm font-medium text-text-heading">Loading invite…</p>
        <p className="text-xs text-text-muted">Please wait a moment.</p>
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

  if (isLoggedIn) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <p className="text-sm font-medium text-text-heading">Connecting your referral…</p>
        <p className="text-xs text-text-muted">
          You are already signed in — we are adding this lead to your inbound referrals.
        </p>
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
