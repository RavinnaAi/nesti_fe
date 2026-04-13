"use client";

// HTTP client for the Nesti API: Node.js + Express (see `node-backend` in this repo), not NestJS.
const BASE_URL = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/**
 * Fixes mistaken "http://hosthttp://host/path" when the API base was concatenated twice.
 */
export function normalizeApiUrl(url) {
  if (!url || typeof url !== "string") return url;
  let s = url.trim();
  const m = s.match(/^(https?:\/\/[^/]+)(https?:\/\/[^/]+)(\/.*)$/i);
  if (m && m[1].toLowerCase() === m[2].toLowerCase()) {
    s = `${m[1]}${m[3]}`;
  }
  const o = BASE_URL;
  if (o) {
    let n = 0;
    while (n++ < 12 && s.startsWith(o + o)) {
      s = o + s.slice(o.length * 2);
    }
  }
  return s;
}

/** Build one absolute API URL from a pathname (must use a single leading `/`). */
export function apiUrl(path) {
  const pathOnly = String(path || "").trim().startsWith("/")
    ? String(path).trim()
    : `/${String(path || "").trim()}`;
  if (!BASE_URL) return normalizeApiUrl(pathOnly);
  return normalizeApiUrl(`${BASE_URL}${pathOnly}`);
}

function joinUrl(pathOrAbsolute) {
  const raw = String(pathOrAbsolute ?? "").trim();
  let fixed = normalizeApiUrl(raw);
  if (fixed.startsWith("http://") || fixed.startsWith("https://")) return normalizeApiUrl(fixed);
  const path = fixed.startsWith("/") ? fixed : `/${fixed}`;
  const out = BASE_URL ? `${BASE_URL}${path}` : path;
  return normalizeApiUrl(out);
}

function withBaseUrl(endpoint) {
  if (typeof endpoint === "function") {
    return (...args) => joinUrl(endpoint(...args));
  }
  return joinUrl(endpoint);
}

export const API_ENDPOINTS = {
  auth: {
    checkEmail: withBaseUrl("/auth/check-email"),
    changePassword: withBaseUrl("/auth/change-password"),
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
  leads: {
    list: withBaseUrl("/api/leads"),
    detail: withBaseUrl((id) => `/api/leads/${id}`),
    conversation: withBaseUrl((id) => `/api/leads/${id}/conversation`),
  },
  chat: {
    /** Public embed POST (no Bearer); body includes embedToken. */
    send: withBaseUrl("/api/chat"),
    clearSession: (sessionId) => withBaseUrl(`/api/chat/clear/${sessionId}`),
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
  calendar: {
    connect: (provider) => withBaseUrl(`/api/calendar/connect/${provider}`),
    bookings: withBaseUrl("/api/calendar/bookings"),
    status: withBaseUrl("/api/calendar/status"),
    disconnect: (provider) => withBaseUrl(`/api/calendar/disconnect/${provider}`),
  },
  billing: {
    setupIntent: withBaseUrl("/api/billing/setup-intent"),
    subscriptions: withBaseUrl("/api/billing/subscriptions"),
    paymentMethods: withBaseUrl("/api/billing/payment-methods"),
    taxCalculate: withBaseUrl("/api/billing/tax/calculate"),
  },
};

export async function apiClient({ url, method = "GET", data, token, rawToken = false }) {
  // url can be either a base-relative string ("/route") or an absolute url
  // If user passes a full url, don't prepend BASE_URL.
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  let fullUrl = isAbsolute ? url : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  fullUrl = normalizeApiUrl(fullUrl);
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    // rawToken: send the JWT directly without the "Bearer " prefix.
    // Some backend endpoints (e.g. verifyEmail, resetPassword) read
    // req.headers.authorization as a raw JWT rather than a Bearer scheme.
    headers.Authorization = rawToken ? token : `Bearer ${token}`;
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
