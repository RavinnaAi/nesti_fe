"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import { ACCOUNT_STATUS } from "@/constants/features";
import { useSubscriptionMe } from "@/hooks/useBillingApi";

export function getTrialRemainingMs(trialEndsAt, currentTime = Date.now()) {
  if (!trialEndsAt) return 0;
  try {
    const end = new Date(trialEndsAt).getTime();
    return Math.max(0, end - currentTime);
  } catch {
    return 0;
  }
}

export function formatTrialRemaining(ms) {
  if (ms <= 0) return "Trial ended";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return `${parts.join(" ")} left`;
}

export default function TrialCountdownBadge({ compact = false }) {
  const user = useAppSelector((state) => state.auth.user);
  const subscriptionMeQuery = useSubscriptionMe();
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(Date.now());

  const accountStatus = String(
    subscriptionMeQuery.data?.subscription?.accountStatus ||
      subscriptionMeQuery.data?.subscription?.account_status ||
      user?.accountStatus ||
      user?.account_status ||
      ACCOUNT_STATUS.SUBSCRIBED
  ).toLowerCase();

  const trialEndsAt =
    subscriptionMeQuery.data?.subscription?.trialEndsAt ||
    subscriptionMeQuery.data?.subscription?.trial_ends_at ||
    user?.trialEndsAt ||
    user?.trial_ends_at;

  const remainingMs = useMemo(() => getTrialRemainingMs(trialEndsAt, now), [trialEndsAt, now]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (accountStatus !== ACCOUNT_STATUS.FREE_TRIAL) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [accountStatus]);

  if (!isMounted) return null;
  if (!user) return null;
  if (accountStatus !== ACCOUNT_STATUS.FREE_TRIAL) return null;
  if (!trialEndsAt) return null;

  return (
    <div className={`inline-flex max-w-full items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm ${compact ? "px-2.5 py-1 text-[11px]" : ""}`}>
      <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" />
      <span className="hidden sm:inline">Free trial</span>
      <span className="text-amber-900">{formatTrialRemaining(remainingMs)}</span>
    </div>
  );
}

