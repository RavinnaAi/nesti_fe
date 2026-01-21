"use client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const API_ENDPOINTS = {
  auth: {
    checkEmail: "/auth/check-email",
    forgotPassword: "/auth/forgot-password",
    google: "/auth/google",
    googleSignup: "/auth/google-signup",
    login: "/auth/login",
    profile: "/auth/profile",
    publicProfile: "/auth/public-profile",
    resendVerification: "/auth/resend-verification",
    resetPassword: "/auth/reset-password",
    signup: "/auth/signup",
    verifyEmail: "/auth/verify-email",
    verifyResetOTP: "/auth/verify-reset-otp",
  },
  embed: {
    list: "/api/embed/list",
    generate: "/api/embed/generate",
    update: (id) => `/api/embed/${id}`,
    remove: (id) => `/api/embed/${id}`,
    resolve: (token) => `/api/embed/resolve/${token}`,
  },
  chat: {
    conversations: "/api/chat/conversations",
    conversationMessages: (id) => `/api/chat/conversations/${id}/messages`,
    referrals: "/api/chat/referrals",
    referral: (id) => `/api/chat/referrals/${id}`,
    nurtureSend: "/api/chat/nurture/send",
    nurtureLogs: "/api/chat/nurture/logs",
    calculators: {
      mortgage: "/api/chat/calculators/mortgage",
      closing: "/api/chat/calculators/closing",
      runs: "/api/chat/calculators/runs",
    },
    analytics: {
      summary: "/chat/analytics/summary",
      funnel: "/chat/analytics/funnel",
    },
  },
};

export async function apiClient({ url, method = "GET", data, token }) {
  const fullUrl = `${BASE_URL}${url}`;
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
    throw new Error(message);
  }

  return json || {};
}
