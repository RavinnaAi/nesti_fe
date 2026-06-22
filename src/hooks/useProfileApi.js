"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";
import { normalizePhoneForStorage } from "@/lib/phoneUtils";

const PERSONAL_ENDPOINT = API_ENDPOINTS.professionals.profile;
const BUSINESS_ENDPOINT = API_ENDPOINTS.professionals.profile;
const ICP_ENDPOINT = API_ENDPOINTS.professionals.icp;

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
      phone: normalizePhoneForStorage(profile?.phone || ""),
      calendlyUrl: profile?.calendly_link || "",
      location: profile?.location || "",
      profileImage: user?.profile_image || "",
      coverImage: user?.cover_image || "",
      fullName:
        profile?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim(),
    },
    business: {
      professionalType: profile?.professional_type || user?.role || "",
      companyName: profile?.company_name || "",
      website: profile?.website || "",
      phone: normalizePhoneForStorage(profile?.phone || ""),
      experience: profile?.experience || "",
      licenseNumber: profile?.license_number || "",
      socialMedia: profile?.social_media || "",
      transactionVolume: profile?.transaction_volume || "",
      avgSalePrice: profile?.avg_sale_price || "",
      avgHomePrice: profile?.avg_home_price != null ? String(profile.avg_home_price) : "",
      commissionRatePercent:
        profile?.commission_rate_percent != null ? String(profile.commission_rate_percent) : "",
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

/** Multipart upload to Cloudinary; updates User.profile_image or User.cover_image on the server. */
export function useUploadProfileMedia() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: ({ file, kind }) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      return apiClient({
        url: API_ENDPOINTS.professionals.uploadImage,
        method: "POST",
        data: fd,
        token,
      });
    },
    onSuccess: (data) => {
      dispatch(
        setPersonalInfo({
          profileImage: data?.profile_image || "",
          coverImage: data?.cover_image || "",
        })
      );
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(data?.message || "Image uploaded");
    },
    onError: toastError,
  });
}

export function useSavePersonalInfo() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
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
      void queryClient.refetchQueries({ queryKey: ["profile"] });
      toast.success(data?.message || "Profile updated successfully");
    },
    onError: toastError,
  });
}

export function useSaveBusinessInfo() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: async (input) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      const { silent, ...payload } = input || {};
      const data = await apiClient({
        url: BUSINESS_ENDPOINT,
        method: "PUT",
        data: payload,
        token,
      });
      return { data, silent: Boolean(silent) };
    },
    onSuccess: (result, variables) => {
      const data = result && typeof result === "object" && "data" in result ? result.data : result;
      const silent = result && typeof result === "object" && "silent" in result ? result.silent : false;
      const mapped = mapBackendProfileToStore(data);
      const { silent: _omit, ...payloadFallback } = variables || {};
      dispatch(
        setBusinessInfo(
          Object.keys(mapped.business).length ? mapped.business : payloadFallback
        )
      );
      dispatch(setPersonalInfo(mapped.personal));
      if (!silent) {
        toast.success(data?.message || "Business info updated successfully");
      }
      void queryClient.refetchQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

export function useIcpProfileQuery() {
  const { token } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["professional-icp"],
    enabled: Boolean(token),
    queryFn: () =>
      apiClient({
        url: ICP_ENDPOINT,
        method: "GET",
        token,
      }),
  });
}

export function useSaveIcpProfile() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: ICP_ENDPOINT,
        method: "PUT",
        data: payload,
        token,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Ideal client profile saved successfully");
    },
    onError: toastError,
  });
}
