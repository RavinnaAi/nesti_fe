"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export default function FeaturePageGate({ feature, children, redirectTo = "/checkout" }) {
  const router = useRouter();
  const { hasFeature, accountStatus } = useFeatureAccess();
  const allowed = hasFeature(feature);

  useEffect(() => {
    if (!allowed) {
      router.replace(redirectTo);
    }
  }, [allowed, redirectTo, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center p-6 text-sm text-text-muted">
        This feature is not included in your current plan.
      </div>
    );
  }

  return children;
}
