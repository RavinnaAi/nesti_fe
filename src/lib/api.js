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
    resendVerification: "/auth/resend-verification",
    resetPassword: "/auth/reset-password",
    signup: "/auth/signup",
    verifyEmail: "/auth/verify-email",
    verifyResetOTP: "/auth/verify-reset-otp",
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
