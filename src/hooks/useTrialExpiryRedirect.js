"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { ACCOUNT_STATUS } from "@/constants/features";
import { isPublicMarketingRoute } from "@/lib/publicRoutes";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { getActivePlanLimitStates } from "@/lib/planLimitUtils";
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
  const [quotaRedirectRequested, setQuotaRedirectRequested] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    enabled: Boolean(isMounted && token),
    staleTime: 15_000,
    queryFn: () =>
      apiClient({
        url: API_ENDPOINTS.auth.profile,
        method: "GET",
        token,
      }),
  });

  const effectiveUser = profileData?.user || user;

  const accountStatus = String(effectiveUser?.accountStatus || effectiveUser?.account_status || "").toLowerCase();
  const trialEndsAt = effectiveUser?.trialEndsAt || effectiveUser?.trial_ends_at;
  const planLimits = effectiveUser?.planLimits || effectiveUser?.plan_limits || null;
  const usage = effectiveUser?.usage || null;
  const trialRemainingMs = useMemo(() => getTrialRemainingMs(trialEndsAt, now), [trialEndsAt, now]);
  const trialHasEnded =
    accountStatus === ACCOUNT_STATUS.EXPIRED ||
    (accountStatus === ACCOUNT_STATUS.FREE_TRIAL && Boolean(trialEndsAt) && trialRemainingMs <= 0);
  const trialQuotaExhausted =
    accountStatus === ACCOUNT_STATUS.FREE_TRIAL &&
    getActivePlanLimitStates(planLimits, usage).length > 0;

  useEffect(() => {
    if (!isMounted || !token || accountStatus !== ACCOUNT_STATUS.FREE_TRIAL || !trialEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isMounted, token, accountStatus, trialEndsAt]);

  useEffect(() => {
    if (!isMounted || !token) return;
    if (!trialHasEnded && !trialQuotaExhausted && !quotaRedirectRequested) return;
    if (isAllowedAfterTrial(pathname)) return;

    const quotaLocked = trialQuotaExhausted || quotaRedirectRequested;
    toast.info(
      quotaLocked
        ? "Your free trial quota has been used. Choose a subscription plan to continue."
        : "Your free trial has ended. Choose a subscription plan to continue.",
      {
        toastId: quotaLocked ? "trial-quota-subscription-required" : "trial-expired-subscription-required",
      }
    );
    router.replace(quotaLocked ? "/checkout?trial=quota" : "/checkout?trial=expired");
  }, [isMounted, token, trialHasEnded, trialQuotaExhausted, quotaRedirectRequested, pathname, router]);

  useEffect(() => {
    if (!isMounted || !token) return;
    const onQuotaRequired = () => setQuotaRedirectRequested(true);
    window.addEventListener("nesti:subscription-quota-required", onQuotaRequired);
    return () => window.removeEventListener("nesti:subscription-quota-required", onQuotaRequired);
  }, [isMounted, token]);
}
