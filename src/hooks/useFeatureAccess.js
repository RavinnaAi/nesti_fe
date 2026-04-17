"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAppSelector } from "@/store";
import { hasFeature } from "@/utils/features";
import { ACCOUNT_STATUS, FEATURES } from "@/constants/features";

/**
 * Hook to read the current user's account status & feature access.
 *
 * Optionally enforces that the current route requires a specific feature.
 */
export function useFeatureAccess(requiredFeature) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);

  const accountStatus =
    (user?.accountStatus || user?.account_status || ACCOUNT_STATUS.SUBSCRIBED)?.toLowerCase() ||
    ACCOUNT_STATUS.SUBSCRIBED;

  const canUseRequiredFeature = useMemo(() => {
    if (!requiredFeature) return true;
    return hasFeature(user, requiredFeature);
  }, [user, requiredFeature]);

  useEffect(() => {
    if (!user) return;

    const isSubscriptionSettings =
      pathname?.startsWith("/settings") || pathname?.startsWith("/checkout");

    // TEMP: Subscription gating checks are intentionally disabled on frontend.
    // Re-enable by uncommenting the blocks below.
    //
    // // If expired, restrict everything except subscription/settings-related routes.
    // if (accountStatus === ACCOUNT_STATUS.EXPIRED && !isSubscriptionSettings) {
    //   router.replace("/settings?tab=subscription&expired=1");
    //   return;
    // }
    //
    // if (requiredFeature && !canUseRequiredFeature) {
    //   // Redirect users without the required feature to subscription tab.
    //   router.replace("/settings?tab=subscription&upgrade=1");
    // }
  }, [user, accountStatus, requiredFeature, canUseRequiredFeature, pathname, router]);

  return {
    user,
    accountStatus,
    hasFeature: (featureName) => hasFeature(user, featureName),
  };
}

