"use client";

import { BarChart3 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import InviteSignupsPanel from "@/components/analytics/InviteSignupsPanel";

const DEFAULT_WINDOW_DAYS = 30;

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthGuard();
  useFeatureAccess();
  const { token } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-background-light/30">
      <div className="w-full gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-heading">
              <BarChart3 size={24} className="text-primary" />
              Analytics
            </h1>
            <p className="text-sm text-text-muted">Invite signups and growth performance.</p>
          </div>
        </div>

        <div className="mt-4">
          <InviteSignupsPanel token={token} days={DEFAULT_WINDOW_DAYS} />
        </div>
      </div>
    </div>
  );
}
