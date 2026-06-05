"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { PROFESSIONAL_ROLE_VALUES } from "@/constants/auth";
import { isPublicMarketingRoute } from "@/lib/publicRoutes";

const ALLOWED_PREFIXES = ["/settings", "/checkout", "/calendly-callback", "/profile"];

function pathAllowedDuringSetup(pathname) {
  if (isPublicMarketingRoute(pathname)) return true;
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Sends agents / brokers / lawyers to Settings until personal + business basics exist (matches backend gate).
 */
export function useProfileSetupRedirect(isMounted) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const { data: profileData, isSuccess, isPending } = useProfileQuery();
  const toastShownRef = useRef(false);

  const effectiveRole = user?.role || profileData?.user?.role;
  const needsGate = Boolean(
    effectiveRole && PROFESSIONAL_ROLE_VALUES.includes(effectiveRole)
  );

  useEffect(() => {
    if (profileData?.profile_setup?.is_complete) {
      toastShownRef.current = false;
    }
  }, [profileData?.profile_setup?.is_complete]);

  useEffect(() => {
    if (!isMounted || !token) return;
    if (!needsGate) return;
    if (isPending || !isSuccess || !profileData) return;
    const setup = profileData.profile_setup;
    if (!setup || setup.is_complete) return;
    if (pathAllowedDuringSetup(pathname)) return;
    if (!toastShownRef.current) {
      toastShownRef.current = true;
      toast.info("Complete your personal and business details in Settings to use the workspace.", {
        toastId: "profile-setup-required",
      });
    }
    router.replace("/settings?tab=personal&setup=required");
  }, [isMounted, token, needsGate, isPending, isSuccess, profileData, pathname, router]);
}
