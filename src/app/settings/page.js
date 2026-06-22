"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import PersonalInfo from "@/components/settings/PersonalInfo";
import SubscriptionInfo from "@/components/settings/SubscriptionInfo";
import ChatbotEmbed from "@/components/settings/ChatbotEmbed";
import BusinessInformation from "@/components/settings/BusinessInformation";
import IcpIntegrationCard from "@/components/settings/IcpIntegrationCard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";
import { toast } from "react-toastify";
import { SkeletonBlock } from "@/components/ui/ContentSkeletons";
import { useAppDispatch } from "@/store";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";
import {
  CALENDLY_INTEGRATION_TOAST_ID,
  CALENDLY_OAUTH_BROADCAST_CHANNEL,
  CALENDLY_OAUTH_MESSAGE_SOURCE,
  CALENDLY_OAUTH_WINDOW_NAME,
} from "@/lib/calendlyOAuthPopup";

const VALID_TABS = [
  "personal",
  "business",
  "icp",
  "subscription",
  "chatbot",
  "leads",
];

function SettingsPageFallback() {
  return (
    <div className="w-full px-4 py-8 space-y-4" aria-busy="true" aria-label="Loading settings">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <SkeletonBlock className="h-6 w-48 max-w-full" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <SkeletonBlock className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function SettingsPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const dispatch = useAppDispatch();
  const profileQuery = useProfileQuery();
  const { hasFeature } = useFeatureAccess();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const calendlyReturnHandled = useRef(null);
  const onboardingIncompleteOnEntryRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!profileQuery.isSuccess) return;
    if (onboardingIncompleteOnEntryRef.current !== null) return;
    onboardingIncompleteOnEntryRef.current = !profileQuery.data?.profile_setup?.is_complete;
  }, [profileQuery.isSuccess, profileQuery.data?.profile_setup?.is_complete]);

  useEffect(() => {
    const calendly = searchParams.get("calendly");
    if (calendly === "connected" || calendly === "error") {
      const key = searchParams.toString();
      if (calendlyReturnHandled.current === key) return;
      calendlyReturnHandled.current = key;

      if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel(CALENDLY_OAUTH_BROADCAST_CHANNEL);
          if (calendly === "connected") {
            bc.postMessage({ source: CALENDLY_OAUTH_MESSAGE_SOURCE, result: "connected" });
          } else {
            const reason = searchParams.get("reason");
            let message = "Calendly connection did not complete.";
            if (reason) {
              try {
                message = decodeURIComponent(reason);
              } catch {
                /* keep default */
              }
            }
            bc.postMessage({ source: CALENDLY_OAUTH_MESSAGE_SOURCE, result: "error", message });
          }
          bc.close();
        } catch {
          /* ignore */
        }
      } else if (typeof window !== "undefined") {
        if (calendly === "connected") {
          toast.success("Calendly connected.", { toastId: CALENDLY_INTEGRATION_TOAST_ID });
        } else {
          const reason = searchParams.get("reason");
          try {
            const msg = reason
              ? decodeURIComponent(reason)
              : "Calendly connection did not complete.";
            toast.error(msg, { toastId: CALENDLY_INTEGRATION_TOAST_ID });
          } catch {
            toast.error("Calendly connection did not complete.", {
              toastId: CALENDLY_INTEGRATION_TOAST_ID,
            });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
      }

      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.focus();
        } catch {
          /* ignore */
        }
      }

      const shouldTryClose =
        typeof window !== "undefined" &&
        (window.name === CALENDLY_OAUTH_WINDOW_NAME || Boolean(window.opener));

      if (shouldTryClose) {
        try {
          window.close();
        } catch {
          /* ignore */
        }
      }

      const next = new URLSearchParams(searchParams.toString());
      next.delete("calendly");
      next.delete("reason");
      const q = next.toString();
      const cleanUrl = q ? `${pathname}?${q}` : pathname;

      const t =
        typeof window !== "undefined"
          ? window.setTimeout(() => {
              if (!window.closed) {
                router.replace(cleanUrl, { scroll: false });
              }
            }, 0)
          : 0;
      return () => {
        if (t) window.clearTimeout(t);
      };
    }
  }, [searchParams, pathname, router, queryClient]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const upgrade = searchParams.get("upgrade");
    const expired = searchParams.get("expired");

    if (tab === "appointments") {
      router.replace(
        hasFeature(FEATURES.CALENDAR_INTEGRATION) ? "/calendar" : "/settings?tab=subscription",
      );
      return;
    }

    if (tab === "leads") {
      router.replace("/leads");
      return;
    }

    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("personal");
    }

    if (upgrade === "1") {
      toast.info("Upgrade is required to access this feature.");
    } else if (expired === "1") {
      toast.warning("Your trial has expired. Please subscribe to continue.");
    }
  }, [searchParams, router, hasFeature]);

  // Keep settings forms in sync with `/auth/profile`.
  // PersonalInfo/BusinessInformation read from `state.profile.*` (profileSlice),
  // so we must hydrate the slice from the profile query response.
  useEffect(() => {
    if (!profileQuery?.isSuccess) return;
    const apiUser = profileQuery.data?.user || {};
    const apiProfessional = profileQuery.data?.professionalProfile || {};

    // Personal basics are always based on `user`; business fields come from `professionalProfile`.
    const firstName = apiUser?.first_name || "";
    const lastName = apiUser?.last_name || "";
    const fullName = String(apiProfessional?.full_name || "")
      .trim()
      .replace(/\s+/g, " ")
      .trim();

    dispatch(
      setPersonalInfo({
        firstName,
        lastName,
        email: apiUser?.email || "",
        role: apiUser?.role || apiProfessional?.professional_type || "",
        phone: apiProfessional?.phone || apiUser?.phone || "",
        calendlyUrl: apiProfessional?.calendly_link || "",
        location: apiProfessional?.location || "",
        profileImage: apiUser?.profile_image || "",
        coverImage: apiUser?.cover_image || "",
        fullName:
          fullName ||
          [firstName, lastName].filter(Boolean).join(" ").trim(),
      })
    );

    dispatch(
      setBusinessInfo({
        professionalType: apiProfessional?.professional_type || apiUser?.role || "",
        companyName: apiProfessional?.company_name || "",
        website: apiProfessional?.website || "",
        phone: apiProfessional?.phone || apiUser?.phone || "",
        email: apiProfessional?.email || apiUser?.email || "",
        experience: apiProfessional?.experience || "",
        licenseNumber: apiProfessional?.license_number || "",
        socialMedia: apiProfessional?.social_media || "",
        transactionVolume: apiProfessional?.transaction_volume || "",
        avgSalePrice: apiProfessional?.avg_sale_price || "",
        avgHomePrice:
          apiProfessional?.avg_home_price != null ? String(apiProfessional.avg_home_price) : "",
        commissionRatePercent:
          apiProfessional?.commission_rate_percent != null
            ? String(apiProfessional.commission_rate_percent)
            : "",
        responseTime: apiProfessional?.response_time || "",
        availability: apiProfessional?.availability || "",
        supportLevel: apiProfessional?.support_level || "",
        negotiationStyle: apiProfessional?.negotiation_style || "",
        salesApproach: apiProfessional?.sales_approach || "",
        energyStyle: apiProfessional?.energy_style || "",
        personalityTag: apiProfessional?.personality_tag || "",
        awards: apiProfessional?.awards || "",
        testimonial: apiProfessional?.bio || "",
        targetNeighborhoods: apiProfessional?.target_neighborhoods || "",
        fullName:
          fullName ||
          [firstName, lastName].filter(Boolean).join(" ").trim(),
        location: apiProfessional?.location || "",
        specializations: Array.isArray(apiProfessional?.specializations)
          ? apiProfessional.specializations
          : [],
        communicationChannels: Array.isArray(apiProfessional?.communication_channels)
          ? apiProfessional.communication_channels
          : [],
        preferredClients: Array.isArray(apiProfessional?.preferred_clients)
          ? apiProfessional.preferred_clients
          : [],
        calendlyLink: apiProfessional?.calendly_link || "",
      })
    );
  }, [profileQuery?.isSuccess, profileQuery?.data, dispatch]);

  const goToBusinessTab = useCallback(() => {
    setActiveTab("business");
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "business");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}?tab=business`, { scroll: false });
  }, [pathname, router, searchParams]);

  /**
   * After business "Save changes": go to dashboard only on first-time completion (signup onboarding).
   * Returning users who already completed setup stay on Settings when updating.
   */
  const onBusinessSaveSuccess = useCallback(async () => {
    const snapshot = queryClient.getQueryData(["profile"]);
    const wasIncomplete =
      onboardingIncompleteOnEntryRef.current ?? !snapshot?.profile_setup?.is_complete;
    await queryClient.refetchQueries({ queryKey: ["profile"] });
    const data = queryClient.getQueryData(["profile"]);
    if (data?.profile_setup?.is_complete && wasIncomplete) {
      onboardingIncompleteOnEntryRef.current = false;
      router.replace("/dashboard");
    }
  }, [queryClient, router]);

  /**
   * After personal save: dashboard only if this save finished first-time onboarding; else business tab if still incomplete.
   * If profile was already complete, stay on Personal (normal edits).
   */
  const onPersonalSaveSuccess = useCallback(async () => {
    const snapshot = queryClient.getQueryData(["profile"]);
    const wasIncomplete =
      onboardingIncompleteOnEntryRef.current ?? !snapshot?.profile_setup?.is_complete;
    await queryClient.refetchQueries({ queryKey: ["profile"] });
    const data = queryClient.getQueryData(["profile"]);
    if (data?.profile_setup?.is_complete && wasIncomplete) {
      onboardingIncompleteOnEntryRef.current = false;
      router.replace("/dashboard");
      return;
    }
    if (!data?.profile_setup?.is_complete) {
      goToBusinessTab();
    }
  }, [queryClient, router, goToBusinessTab]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfo onSaveSuccess={onPersonalSaveSuccess} />;
      case "subscription":
        return <SubscriptionInfo />;
      case "chatbot":
        return <ChatbotEmbed />;
      case "business":
        return <BusinessInformation onSaveSuccess={onBusinessSaveSuccess} />;
      case "icp":
        return <IcpIntegrationCard />;
      default:
        return <PersonalInfo onSaveSuccess={onPersonalSaveSuccess} />;
    }
  }, [activeTab, onPersonalSaveSuccess, onBusinessSaveSuccess]);

  const profileSetup = profileQuery.data?.profile_setup;
  const setupIncomplete =
    profileQuery.isSuccess && profileSetup && !profileSetup.is_complete;

  if (!isMounted) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="w-full px-4 pb-6 pt-8 sm:pt-9">
      {setupIncomplete ? (
        <div
          className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="status"
        >
          <p className="font-semibold text-amber-950">Finish your workspace setup</p>
          <p className="mt-1.5 leading-relaxed text-amber-900/95">
            Complete <strong>Personal Information</strong> (name, email, phone) and{" "}
            <strong>Business Information</strong> (company name and where you serve). Other areas of the app stay
            locked until both are done.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-900/85">
            {!profileSetup.personal_complete ? (
              <li>Personal: add phone and confirm your name and email.</li>
            ) : null}
            {!profileSetup.business_complete ? (
              <li>
                Business: add <strong>company / brokerage</strong> (Basics). For service area, use{" "}
                <strong>Location</strong> on Basics and/or <strong>target neighborhoods</strong> under Style &amp;
                Metrics.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
      <div className="w-full rounded-xl border border-border bg-white shadow-sm" style={{ width: "100%" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="w-full min-w-0 p-5 sm:p-5"
            style={{ width: "100%" }}
          >
            {tabContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
