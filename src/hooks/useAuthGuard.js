"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";
import { logoutAndClearAll } from "@/store/actions";

export function useAuthGuard() {
  const router = useRouter();
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

    const personalPayload = {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || professionalProfile?.email || "",
      phone: professionalProfile?.phone || profile?.phone || "",
      country: profile?.country || "",
      role: profile?.role || professionalProfile?.professional_type || "",
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
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
        "",
      location: professionalProfile?.location || "",
      specializations: professionalProfile?.specializations || [],
      communicationChannels: professionalProfile?.communication_channels || [],
      preferredClients: professionalProfile?.preferred_clients || [],
      autoAcceptLeads: professionalProfile?.auto_accept_leads ?? null,
      maxActiveLeads: professionalProfile?.max_active_leads ?? null,
      profileCompleteness: professionalProfile?.profile_completeness ?? null,
      profileQualityScore: professionalProfile?.profile_quality_score ?? null,
    };

    dispatch(setPersonalInfo(personalPayload));
    dispatch(setBusinessInfo(businessPayload));
  }, [profileQuery.data, dispatch]);

  return {
    isAuthenticated: Boolean(token),
    token,
    profile: profileQuery.data,
  };
}
