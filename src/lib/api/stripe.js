"use client";

import { apiClient } from "../api";

/**
 * Stripe/checkout helpers for the Nesti Node/Express API.
 * Ensure paths match your server (this app’s billing routes live under `/api/billing/*`).
 */

export async function getCheckout({ token } = {}) {
  return apiClient({
    url: "/api/stripe/checkout",
    method: "POST",
    token,
  });
}

export async function createSubscription({ token, paymentMethodId, priceId, trialDays }) {
  const payload = {
    paymentMethodId,
    priceId,
  };

  if (trialDays != null) {
    payload.trialDays = trialDays;
  }

  return apiClient({
    url: "/api/stripe/subscription/new",
    method: "POST",
    data: payload,
    token,
  });
}

export async function updatePaymentMethod({ token, paymentMethodId }) {
  return apiClient({
    url: "/api/stripe/update-payment-method",
    method: "POST",
    data: {
      paymentMethodId,
    },
    token,
  });
}

