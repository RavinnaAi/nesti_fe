"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { ACCOUNT_STATUS } from "@/constants/features";
import { isPublicMarketingRoute } from "@/lib/publicRoutes";
import { getTrialRemainingMs } from "@/components/ui/TrialCountdownBadge";

const ALLOWED_PREFIXES = [
  "/checkout",
  "/calendly-callback",
  "/log-in",
  "/sign-up",
  "/forgot-password",
  "/verify-reset-otp",
  "/reset-password",
  "/verify-email",
];

function isAllowedAfterTrial(pathname) {
  if (pathname === "/") return true;
  if (isPublicMarketingRoute(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.startsWith("/p/") || pathname.startsWith("/professional/")) return true;
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function useTrialExpiryRedirect(isMounted) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { token, user } = useAppSelector((state) => state.auth);
  const [now, setNow] = useState(Date.now());

  const accountStatus = String(user?.accountStatus || user?.account_status || "").toLowerCase();
  const trialEndsAt = user?.trialEndsAt || user?.trial_ends_at;
  const trialRemainingMs = useMemo(() => getTrialRemainingMs(trialEndsAt, now), [trialEndsAt, now]);
  const trialHasEnded =
    accountStatus === ACCOUNT_STATUS.EXPIRED ||
    (accountStatus === ACCOUNT_STATUS.FREE_TRIAL && Boolean(trialEndsAt) && trialRemainingMs <= 0);

  useEffect(() => {
    if (!isMounted || !token || accountStatus !== ACCOUNT_STATUS.FREE_TRIAL || !trialEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isMounted, token, accountStatus, trialEndsAt]);

  useEffect(() => {
    if (!isMounted || !token) return;
    if (!trialHasEnded) return;
    if (isAllowedAfterTrial(pathname)) return;

    toast.info("Your free trial has ended. Choose a subscription plan to continue.", {
      toastId: "trial-expired-subscription-required",
    });
    router.replace("/checkout?trial=expired");
  }, [isMounted, token, trialHasEnded, pathname, router]);
}
