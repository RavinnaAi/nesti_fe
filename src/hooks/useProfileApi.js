"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";

const PERSONAL_ENDPOINT = "/api/professionals";
const BUSINESS_ENDPOINT = "/api/professionals";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

function mapBackendProfileToStore(data) {
  const user = data?.user || {};
  const profile = data?.profile || data?.professionalProfile || {};

  return {
    personal: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: user?.email || "",
      role: user?.role || profile?.professional_type || "",
      phone: profile?.phone || "",
      calendlyUrl: profile?.calendly_link || "",
      location: profile?.location || "",
      fullName:
        profile?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim(),
    },
    business: {
      professionalType: profile?.professional_type || user?.role || "",
      companyName: profile?.company_name || "",
      website: profile?.website || "",
      phone: profile?.phone || "",
      experience: profile?.experience || "",
      licenseNumber: profile?.license_number || "",
      socialMedia: profile?.social_media || "",
      transactionVolume: profile?.transaction_volume || "",
      avgSalePrice: profile?.avg_sale_price || "",
      responseTime: profile?.response_time || "",
      availability: profile?.availability || "",
      supportLevel: profile?.support_level || "",
      negotiationStyle: profile?.negotiation_style || "",
      salesApproach: profile?.sales_approach || "",
      energyStyle: profile?.energy_style || "",
      personalityTag: profile?.personality_tag || "",
      awards: profile?.awards || "",
      location: profile?.location || "",
      targetNeighborhoods: profile?.target_neighborhoods || "",
      testimonial: profile?.bio || "",
      fullName:
        profile?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim(),
      certificates: Array.isArray(profile?.certificates) ? profile.certificates : [],
      specializations: Array.isArray(profile?.specializations) ? profile.specializations : [],
      communicationChannels: Array.isArray(profile?.communication_channels)
        ? profile.communication_channels
        : [],
      preferredClients: Array.isArray(profile?.preferred_clients)
        ? profile.preferred_clients
        : [],
      calendlyLink: profile?.calendly_link || "",
    },
  };
}

export function useSavePersonalInfo() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: PERSONAL_ENDPOINT,
        method: "POST",
        data: payload,
        token,
      });
    },
    onSuccess: (data, variables) => {
      const mapped = mapBackendProfileToStore(data);
      dispatch(setPersonalInfo(Object.keys(mapped.personal).length ? mapped.personal : variables));
      dispatch(setBusinessInfo(mapped.business));
      toast.success(data?.message || "Profile updated successfully");
    },
    onError: toastError,
  });
}

export function useSaveBusinessInfo() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: BUSINESS_ENDPOINT,
        method: "PUT",
        data: payload,
        token,
      });
    },
    onSuccess: (data, variables) => {
      const mapped = mapBackendProfileToStore(data);
      dispatch(setBusinessInfo(Object.keys(mapped.business).length ? mapped.business : variables));
      dispatch(setPersonalInfo(mapped.personal));
      toast.success(data?.message || "Business info updated successfully");
    },
    onError: toastError,
  });
}
