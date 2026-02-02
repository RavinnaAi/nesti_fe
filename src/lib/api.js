"use client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function withBaseUrl(endpoint) {
  if (typeof endpoint === "function") {
    return (...args) => `${BASE_URL}${endpoint(...args)}`;
  }
  return `${BASE_URL}${endpoint}`;
}

export const API_ENDPOINTS = {
  auth: {
    checkEmail: withBaseUrl("/auth/check-email"),
    forgotPassword: withBaseUrl("/auth/forgot-password"),
    google: withBaseUrl("/auth/google"),
    googleSignup: withBaseUrl("/auth/google-signup"),
    login: withBaseUrl("/auth/login"),
    profile: withBaseUrl("/auth/profile"),
    publicProfile: withBaseUrl("/auth/public-profile"),
    resendVerification: withBaseUrl("/auth/resend-verification"),
    resetPassword: withBaseUrl("/auth/reset-password"),
    signup: withBaseUrl("/auth/signup"),
    verifyEmail: withBaseUrl("/auth/verify-email"),
    verifyResetOTP: withBaseUrl("/auth/verify-reset-otp"),
  },
  embed: {
    list: withBaseUrl("/api/embed/list"),
    generate: withBaseUrl("/api/embed/generate"),
    update: withBaseUrl((id) => `/api/embed/${id}`),
    remove: withBaseUrl((id) => `/api/embed/${id}`),
    resolve: withBaseUrl((token) => `/api/embed/resolve/${token}`),
  },
  chat: {
    conversations: withBaseUrl("/api/chat/conversations"),
    conversationMessages: withBaseUrl((id) => `/api/chat/conversations/${id}/messages`),
    referrals: withBaseUrl("/api/chat/referrals"),
    referral: withBaseUrl((id) => `/api/chat/referrals/${id}`),
    nurtureSend: withBaseUrl("/api/chat/nurture/send"),
    nurtureLogs: withBaseUrl("/api/chat/nurture/logs"),
    calculators: {
      mortgage: withBaseUrl("/api/chat/calculators/mortgage"),
      closing: withBaseUrl("/api/chat/calculators/closing"),
      runs: withBaseUrl("/api/chat/calculators/runs"),
    },
    analytics: {
      summary: withBaseUrl("/api/chat/analytics/summary"),
      funnel: withBaseUrl("/api/chat/analytics/funnel"),
    },
  },
};

export async function apiClient({ url, method = "GET", data, token }) {
  // url can be either a base-relative string ("/route") or an absolute url
  // If user passes a full url, don't prepend BASE_URL.
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  const fullUrl = isAbsolute ? url : `${BASE_URL}${url}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });

  let json = null;
  try {
    json = await response.json();
  } catch (error) {
    // ignore parse errors, handle below
  }

  if (!response.ok) {
    const message =
      json?.detail ||
      json?.message ||
      json?.error ||
      "Request failed. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return json || {};
}
