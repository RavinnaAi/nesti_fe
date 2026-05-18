"use client";

import { useAppSelector } from "@/store";
import DashboardAppointmentsCalendar from "@/components/dashboard/DashboardAppointmentsCalendar";

/** Booked appointments calendar (workspace `/calendar` route). */
export default function SettingsAppointmentsCalendar() {
  const { token } = useAppSelector((state) => state.auth);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DashboardAppointmentsCalendar
        token={token}
        embeddedInSettings
        className="min-h-0 flex-1"
      />
    </div>
  );
}
