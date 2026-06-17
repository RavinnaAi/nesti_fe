"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export default function FeaturePageGate({ feature, children, redirectTo = "/checkout" }) {
  const router = useRouter();
  const { hasFeature, accountStatus } = useFeatureAccess();
  const [isHydrated, setIsHydrated] = useState(false);
  const allowed = hasFeature(feature);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !allowed) {
      router.replace(redirectTo);
    }
  }, [isHydrated, allowed, redirectTo, router]);

  // Keep initial server/client markup identical to avoid hydration mismatch.
  if (!isHydrated) {
    return <div className="min-h-[12rem]" />;
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center p-6 text-sm text-text-muted">
        This feature is not included in your current plan.
      </div>
    );
  }

  return children;
}
