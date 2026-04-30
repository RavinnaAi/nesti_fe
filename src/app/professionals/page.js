"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import DashboardProfessionalsTabs from "@/components/dashboard/DashboardProfessionalsTabs";

const ALLOWED_ROLES = new Set(["agent", "lawyer", "mortgage_broker"]);

export default function ProfessionalsPage() {
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((state) => state.auth.token);
  const searchParams = useSearchParams();
  const role = useMemo(() => {
    const raw = String(searchParams?.get("role") || "").trim().toLowerCase();
    return ALLOWED_ROLES.has(raw) ? raw : "agent";
  }, [searchParams]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-0 flex-1 bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-4 py-5">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardProfessionalsTabs token={token} initialRole={role} showTabs={false} />
      </div>
    </div>
  );
}
