"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { updateProfile } from "@/store/authSlice";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";
import { logoutAndClearAll } from "@/store/actions";

export function useAuthGuard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const profileQuery = useProfileQuery();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only redirect after mount so client sessionStorage-backed Redux state is ready (avoids false redirects on reload).
  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace("/log-in");
    }
  }, [mounted, token, router]);

  useEffect(() => {
    if (!token || !profileQuery.isError) return;
    const status = profileQuery.error?.status;
    if (status !== 401 && status !== 403) return;
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
      profileImage:
        professionalProfile?.img_url || profile?.img_url || profile?.profile_image || "",
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
      testimonial: professionalProfile?.bio || professionalProfile?.testimonial || "",
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

  return {
    isAuthenticated: Boolean(token),
    token,
    profile: profileQuery.data,
  };
}
