"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAppSelector } from "@/store";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

export function useCreateSetupIntent() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.setupIntent,
        method: "POST",
        token,
      });
    },
    onError: toastError,
  });
}

export function useCreateSubscription() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: ({ priceId, paymentMethodId, trialDays }) => {
      if (!token) throw new Error("missing or invalid Authorization header");

      const payload = {
        priceId,
        paymentMethodId,
      };

      if (trialDays != null) {
        payload.trial_days = trialDays;
      }

      return apiClient({
        url: API_ENDPOINTS.billing.subscriptions,
        method: "POST",
        data: payload,
        token,
      });
    },
    onError: toastError,
  });
}

export function useCalculateTax() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) =>
      apiClient({
        url: API_ENDPOINTS.billing.taxCalculate,
        method: "POST",
        data: payload,
        token,
      }),
    onError: toastError,
  });
}

export function usePaymentMethods() {
  const { token } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.paymentMethods,
        method: "GET",
        token,
      });
    },
    enabled: !!token,
  });
}
