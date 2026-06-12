"use client";

import { apiClient, API_ENDPOINTS } from "@/lib/api";

export const BILLING_REFRESH_CHANNEL = "nesti_billing_refresh";

export async function refreshAuthProfileFromStripe(token) {
  if (!token) return null;
  const res = await apiClient({
    url: `${API_ENDPOINTS.auth.profile}?refresh_subscription=1`,
    method: "GET",
    token,
  });
  return res?.user || null;
}

export function broadcastSubscriptionUpdated() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const ch = new BroadcastChannel(BILLING_REFRESH_CHANNEL);
    ch.postMessage({ type: "subscription_updated" });
    ch.close();
  } catch {
    // ignore
  }
}
