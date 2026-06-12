"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import SettingsAppointmentsCalendar from "@/components/settings/SettingsAppointmentsCalendar";
import FeaturePageGate from "@/components/billing/FeaturePageGate";
import { FEATURES } from "@/constants/features";

function CalendarPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  if (!isAuthenticated) return null;

  return (
    <FeaturePageGate feature={FEATURES.CALENDAR_INTEGRATION}>
      <div className="w-full max-w-none bg-background-light/80 px-2 py-2 sm:px-3 sm:py-3">
        <div className="w-full rounded-xl border border-border bg-white shadow-sm sm:rounded-xl">
          <div className="flex h-[calc(100dvh-7.5rem)] min-h-[18rem] flex-col overflow-hidden p-2 sm:h-[calc(100dvh-7rem)] sm:p-3">
            <SettingsAppointmentsCalendar />
          </div>
        </div>
      </div>
    </FeaturePageGate>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageContent />
    </Suspense>
  );
}
