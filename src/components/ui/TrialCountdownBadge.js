"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import { ACCOUNT_STATUS } from "@/constants/features";

function getRemainingMs(trialEndsAt, currentTime = Date.now()) {
  if (!trialEndsAt) return 0;
  try {
    const end = new Date(trialEndsAt).getTime();
    return Math.max(0, end - currentTime);
  } catch {
    return 0;
  }
}

function formatRemaining(ms) {
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

export default function TrialCountdownBadge() {
  const user = useAppSelector((state) => state.auth.user);
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(Date.now());

  const accountStatus =
    (user?.accountStatus || user?.account_status || ACCOUNT_STATUS.SUBSCRIBED)?.toLowerCase() ||
    ACCOUNT_STATUS.SUBSCRIBED;

  const trialEndsAt = user?.trialEndsAt || user?.trial_ends_at;

  const remainingMs = useMemo(() => getRemainingMs(trialEndsAt, now), [trialEndsAt, now]);

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
  /** Lawyers use the same workspace without this fixed pill (avoids clutter with chat/embed). */
  if (String(user?.role || "").toLowerCase() === "lawyer") return null;
  if (accountStatus !== ACCOUNT_STATUS.FREE_TRIAL) return null;
  if (!trialEndsAt) return null;
  if (remainingMs <= 0) return null;

  /* lg:left clears fixed sidebar (w-60) + gap so Sign out stays clickable */
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-30 max-w-[min(calc(100vw-2rem),24rem)] lg:left-[calc(15rem+1rem)]">
      <div className="pointer-events-auto inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-slate-900/90 px-3 py-2 text-xs font-medium text-white shadow-lg sm:px-4">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Free trial</span>
        <span className="text-amber-200 font-semibold">{formatRemaining(remainingMs)}</span>
      </div>
    </div>
  );
}

