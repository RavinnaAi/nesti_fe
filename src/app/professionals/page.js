"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import DashboardProfessionalsTabs from "@/components/dashboard/DashboardProfessionalsTabs";

const ALLOWED_ROLES = new Set(["agent", "lawyer", "mortgage_broker"]);

function ProfessionalsPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((state) => state.auth.token);
  const searchParams = useSearchParams();
  const role = useMemo(() => {
    const raw = String(searchParams?.get("role") || "").trim().toLowerCase();
    return ALLOWED_ROLES.has(raw) ? raw : "agent";
  }, [searchParams]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-primary/[0.04] px-4 py-5">
      <div className="w-full min-h-0 flex-1">
        <DashboardProfessionalsTabs
          token={token}
          initialRole={role}
          showTabs={false}
          paginationOutside
        />
      </div>
    </div>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalsPageContent />
    </Suspense>
  );
}
