"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { updateProfile } from "@/store/authSlice";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";
import { logoutAndClearAll } from "@/store/actions";
import { ACCOUNT_STATUS } from "@/constants/features";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const profileQuery = useProfileQuery();

  useEffect(() => {
    if (!token) {
      router.replace("/log-in");
    }
  }, [token, router]);

  useEffect(() => {
    if (!token || !profileQuery.isError) return;
    const status = profileQuery.error?.status;
    const message = profileQuery.error?.message?.toLowerCase?.() || "";
    const shouldLogout =
      status === 401 || status === 403 || status === 404 || message.includes("not found");
    if (!shouldLogout) return;
    dispatch(logoutAndClearAll());
    router.replace("/log-in");
  }, [token, profileQuery.isError, profileQuery.error, dispatch, router]);

  useEffect(() => {
    const profile = profileQuery.data?.user || profileQuery.data?.data;
    const professionalProfile =
      profileQuery.data?.professionalProfile || profileQuery.data?.professional_profile;
    if (!profile && !professionalProfile) return;

    const calendlyFromProfile = String(professionalProfile?.calendly_link || "").trim();

    const personalPayload = {
      firstName: profile?.first_name || profile?.firstName || "",
      lastName: profile?.last_name || profile?.lastName || "",
      email: profile?.email || professionalProfile?.email || "",
      phone: professionalProfile?.phone || profile?.phone || "",
      country: profile?.country || "",
      role: profile?.role || professionalProfile?.professional_type || "",
      calendlyUrl: calendlyFromProfile,
    };

    const businessPayload = {
      professionalType:
        professionalProfile?.professional_type || profile?.role || "",
      companyName: professionalProfile?.company_name || "",
      website: professionalProfile?.website || "",
      phone: professionalProfile?.phone || profile?.phone || "",
      email: professionalProfile?.email || profile?.email || "",
      experience: professionalProfile?.experience || "",
      licenseNumber: professionalProfile?.license_number || "",
      socialMedia: professionalProfile?.social_media || "",
      transactionVolume: professionalProfile?.transaction_volume || "",
      avgSalePrice: professionalProfile?.avg_sale_price || "",
      responseTime: professionalProfile?.response_time || "",
      availability: professionalProfile?.availability || "",
      supportLevel: professionalProfile?.support_level || "",
      negotiationStyle: professionalProfile?.negotiation_style || "",
      salesApproach: professionalProfile?.sales_approach || "",
      energyStyle: professionalProfile?.energy_style || "",
      personalityTag: professionalProfile?.personality_tag || "",
      transactionsThisYear: professionalProfile?.transactions_this_year || "",
      careerTransactions: professionalProfile?.career_transactions || "",
      clientRating: professionalProfile?.client_rating || "",
      awards: professionalProfile?.awards || "",
      testimonial: professionalProfile?.testimonial || "",
      targetNeighborhoods: professionalProfile?.target_neighborhoods || "",
      fullName:
        professionalProfile?.full_name ||
        profile?.name ||
        [
          profile?.first_name || profile?.firstName,
          profile?.last_name || profile?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "",
      location: professionalProfile?.location || "",
      specializations: professionalProfile?.specializations || [],
      communicationChannels: professionalProfile?.communication_channels || [],
      preferredClients: professionalProfile?.preferred_clients || [],
      autoAcceptLeads: professionalProfile?.auto_accept_leads ?? null,
      maxActiveLeads: professionalProfile?.max_active_leads ?? null,
      profileCompleteness: professionalProfile?.profile_completeness ?? null,
      profileQualityScore: professionalProfile?.profile_quality_score ?? null,
      calendlyLink: calendlyFromProfile,
    };

    dispatch(setPersonalInfo(personalPayload));
    dispatch(setBusinessInfo(businessPayload));

    // Sync auth status (trial, subscription, etc.)
    if (profile) {
      dispatch(updateProfile(profile));
    }
  }, [profileQuery.data, dispatch]);

  // Lightweight account_status-based redirect for expired accounts.
  useEffect(() => {
    const profile = profileQuery.data?.user || profileQuery.data?.data;
    const accountStatus =
      (profile?.accountStatus || profile?.account_status || ACCOUNT_STATUS.SUBSCRIBED)?.toLowerCase() ||
      ACCOUNT_STATUS.SUBSCRIBED;

    if (!token || !profile) return;

    const isSettingsRoute = pathname?.startsWith("/settings");
    const isCheckoutRoute = pathname?.startsWith("/checkout");

    // TEMP: Subscription expired redirect is intentionally disabled on frontend.
    // Re-enable by uncommenting below.
    //
    // if (accountStatus === ACCOUNT_STATUS.EXPIRED && !isSettingsRoute && !isCheckoutRoute) {
    //   router.replace("/settings?tab=subscription&expired=1");
    // }
  }, [token, profileQuery.data, pathname, router]);

  return {
    isAuthenticated: Boolean(token),
    token,
    profile: profileQuery.data,
  };
}
