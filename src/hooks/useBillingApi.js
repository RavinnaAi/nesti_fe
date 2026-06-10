"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { mapApiPlansToUi } from "@/lib/billingPlans";
import { useAppSelector } from "@/store";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billingPlans"],
    queryFn: async () => {
      const res = await apiClient({ url: API_ENDPOINTS.billing.plans });
      return mapApiPlansToUi(res?.plans || []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscriptionMe() {
  const { token } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["subscriptionMe"],
    queryFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.subscriptionMe,
        method: "GET",
        token,
      });
    },
    enabled: !!token,
    staleTime: 45_000,
  });
}

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

export function useCreateCheckoutSession() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (planKey) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.checkoutSession,
        method: "POST",
        data: { plan_key: planKey },
        token,
      });
    },
    onError: toastError,
  });
}

export function openCheckoutPlaceholderWindow() {
  const payWindow = window.open("about:blank", "_blank");
  if (!payWindow) return null;

  try {
    payWindow.document.title = "Stripe Checkout";
    payWindow.document.body.innerHTML =
      '<div style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#334155;"><p>Opening secure checkout...</p></div>';
  } catch {
    // Some browsers restrict document access until navigation.
  }

  return payWindow;
}

export function openStripeCheckoutInNewTab(data, targetWindow = null) {
  const url = data?.url;
  if (!url) {
    try {
      targetWindow?.close();
    } catch {
      // ignore
    }
    toast.error("Missing Stripe checkout URL.");
    return false;
  }

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
    try {
      targetWindow.opener = null;
    } catch {
      // ignore
    }
    targetWindow.focus?.();
    return true;
  }

  const opened = window.open(url, "_blank");
  if (!opened) {
    window.location.href = url;
    return true;
  }

  try {
    opened.opener = null;
  } catch {
    // ignore
  }
  return true;
}

export function redirectToStripeCheckout(data) {
  return openStripeCheckoutInNewTab(data);
}

export function useBillingInvoices(enabled = true) {
  const { token } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["billingInvoices"],
    queryFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.invoices,
        method: "GET",
        token,
      });
    },
    enabled: !!token && enabled,
  });
}

export function useChangeSubscriptionPlan() {
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planKey) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.subscriptionChangePlan,
        method: "POST",
        data: { plan_key: planKey },
        token,
      });
    },
    onSuccess: (data) => {
      if (data?.changeType === "upgrade" && data?.invoice?.hostedInvoiceUrl && data.invoice.status !== "paid") {
        window.location.href = data.invoice.hostedInvoiceUrl;
      }
      queryClient.invalidateQueries({ queryKey: ["subscriptionMe"] });
      queryClient.invalidateQueries({ queryKey: ["billingInvoices"] });
    },
    onError: toastError,
  });
}

export function useResumeSubscription() {
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.subscriptionResume,
        method: "POST",
        data: {},
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionMe"] });
      queryClient.invalidateQueries({ queryKey: ["billingInvoices"] });
    },
    onError: toastError,
  });
}

export function useCancelSubscription() {
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.subscriptionCancel,
        method: "POST",
        data: {},
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionMe"] });
      queryClient.invalidateQueries({ queryKey: ["billingInvoices"] });
    },
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

export function useEnterpriseStatus() {
  const { token } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["enterpriseStatus"],
    queryFn: () => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.enterpriseStatus,
        method: "GET",
        token,
      });
    },
    enabled: !!token,
  });
}

export function useEnterpriseInquiry() {
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: API_ENDPOINTS.billing.enterpriseInquiry,
        method: "POST",
        data: payload,
        token,
      });
    },
    onSuccess: () => {
      toast.success("Successfully joined the Enterprise waitlist!");
      queryClient.invalidateQueries({ queryKey: ["enterpriseStatus"] });
    },
    onError: toastError,
  });
}
