"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store";
import { hasFeature } from "@/utils/features";
import { ACCOUNT_STATUS } from "@/constants/features";

export function useFeatureAccess() {
  const user = useAppSelector((state) => state.auth.user);

  const accountStatus = useMemo(
    () =>
      (user?.accountStatus || user?.account_status || ACCOUNT_STATUS.SUBSCRIBED)?.toLowerCase() ||
      ACCOUNT_STATUS.SUBSCRIBED,
    [user]
  );

  return {
    user,
    accountStatus,
    hasFeature: (featureName) => hasFeature(user, featureName),
  };
}
