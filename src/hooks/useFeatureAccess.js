"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { hasFeature } from "@/utils/features";
import { ACCOUNT_STATUS } from "@/constants/features";
import { NAV_FEATURE_MAP } from "@/constants/navFeatures";
import { apiClient, API_ENDPOINTS } from "@/lib/api";

export function useFeatureAccess() {
  const token = useAppSelector((state) => state.auth.token);
  const authUser = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    queryFn: () =>
      apiClient({
        url: API_ENDPOINTS.auth.profile,
        method: "GET",
        token,
      }),
  });
  const user = profileData?.user || authUser;

  const accountStatus = useMemo(
    () =>
      (user?.accountStatus || user?.account_status || ACCOUNT_STATUS.EXPIRED)?.toLowerCase() ||
      ACCOUNT_STATUS.EXPIRED,
    [user]
  );

  const planLimits = useMemo(
    () => user?.planLimits || user?.plan_limits || null,
    [user]
  );

  const usage = useMemo(() => user?.usage || null, [user]);

  const can = useCallback((featureName) => hasFeature(user, featureName), [user]);

  const filterNavItems = useCallback(
    (items = []) =>
      items.filter((item) => {
        const required = NAV_FEATURE_MAP[item.id];
        if (!required) return true;
        return hasFeature(user, required);
      }),
    [user]
  );

  return {
    user,
    accountStatus,
    planLimits,
    usage,
    hasFeature: can,
    can,
    filterNavItems,
  };
}
