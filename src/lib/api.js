"use client";

// HTTP client for the Nesti API: Node.js + Express (see `node-backend` in this repo), not NestJS.
const BASE_URL = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const inFlightReadRequests = new Map();

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
  referrals: {
    list: withBaseUrl("/api/referrals"),
    byLeadMatch: withBaseUrl((leadMatchId) => `/api/referrals/lead-match/${leadMatchId}`),
    detail: withBaseUrl((id) => `/api/referrals/${id}`),
    lead: withBaseUrl((id) => `/api/referrals/${id}/lead`),
    process: withBaseUrl((id) => `/api/referrals/${id}/process`),
  },
  invites: {
    list: withBaseUrl("/api/invites"),
    metrics: withBaseUrl("/api/invites/metrics"),
    conversions: withBaseUrl("/api/invites/conversions"),
    conversionRoleTrends: withBaseUrl("/api/invites/conversions/role-trends"),
    resolve: withBaseUrl((token) => `/api/invites/resolve/${token}`),
    capture: withBaseUrl("/api/invites/capture"),
    finalize: withBaseUrl("/api/invites/finalize"),
    rewardEvents: withBaseUrl("/api/invites/rewards/events"),
    rewardsProfile: withBaseUrl("/api/invites/rewards/profile"),
  },
  ai: {
    leadInsights: withBaseUrl((conversationId) => `/api/ai/lead/insights/${conversationId}`),
    analyzeLeadInsights: withBaseUrl((leadId) => `/api/ai/lead/${leadId}/insights/analyze`),
  },
  leads: {
    list: withBaseUrl("/api/leads"),
    profiles: withBaseUrl("/api/leads/profiles"),
    profileDetail: withBaseUrl((id) => `/api/leads/profiles/${id}`),
    profileLeads: withBaseUrl((id) => `/api/leads/profiles/${id}/leads`),
    detail: withBaseUrl((id) => `/api/leads/${id}`),
    inquiredProperty: withBaseUrl((id) => `/api/leads/${id}/inquired-property`),
    patch: withBaseUrl((id) => `/api/leads/${id}`),
    remove: withBaseUrl((id) => `/api/leads/${id}`),
    conversation: withBaseUrl((id) => `/api/leads/${id}/conversation`),
    propertyMatches: withBaseUrl((id) => `/api/leads/${id}/property-matches`),
    recordView: withBaseUrl((id) => `/api/leads/${id}/view`),
  },
  chat: {
    /** Public embed POST (no Bearer); body includes embedToken. */
    send: withBaseUrl("/api/chat"),
    sessionMessages: withBaseUrl("/api/chat/session-messages"),
    propertyImages: withBaseUrl("/api/chat/property-images"),
    clearSession: (sessionId) => withBaseUrl(`/api/chat/clear/${sessionId}`),
    conversations: withBaseUrl("/api/chat/conversations"),
    conversationMessages: withBaseUrl((id) => `/api/chat/conversations/${id}/messages`),
    nurtureDraft: withBaseUrl("/api/chat/nurture/draft"),
    nurtureRefine: withBaseUrl("/api/chat/nurture/refine"),
    nurturePreview: withBaseUrl("/api/chat/nurture/preview"),
    nurtureSend: withBaseUrl("/api/chat/nurture/send"),
    nurtureLogs: withBaseUrl("/api/chat/nurture/logs"),
    bulkNurtureDraftJobs: withBaseUrl("/api/chat/nurture/bulk/draft-jobs"),
    bulkNurtureSendJobs: withBaseUrl("/api/chat/nurture/bulk/send-jobs"),
    bulkNurtureJob: (id) => withBaseUrl(`/api/chat/nurture/bulk/jobs/${id}`),
    clearBulkNurtureDrafts: (id) => withBaseUrl(`/api/chat/nurture/bulk/jobs/${id}/drafts`),
    pauseBulkNurtureDraftJob: (id) => withBaseUrl(`/api/chat/nurture/bulk/jobs/${id}/pause`),
    resumeBulkNurtureDraftJob: (id) => withBaseUrl(`/api/chat/nurture/bulk/jobs/${id}/resume`),
    bulkNurtureDraftItem: (jobId, itemId) => withBaseUrl(`/api/chat/nurture/bulk/jobs/${jobId}/items/${itemId}`),
    latestBulkNurtureJob: withBaseUrl("/api/chat/nurture/bulk/jobs/latest"),
    calculators: {
      mortgage: withBaseUrl("/api/chat/calculators/mortgage"),
      closing: withBaseUrl("/api/chat/calculators/closing"),
      runs: withBaseUrl("/api/chat/calculators/runs"),
    },
    analytics: {
      summary: withBaseUrl("/api/chat/analytics/summary"),
      funnel: withBaseUrl("/api/chat/analytics/funnel"),
      timeseries: withBaseUrl("/api/chat/analytics/timeseries"),
      leadTrends: withBaseUrl("/api/chat/analytics/lead-trends"),
    },
  },
  calendar: {
    connect: (provider) => withBaseUrl(`/api/calendar/connect/${provider}`),
    webhookSubscription: withBaseUrl("/api/calendar/calendly/webhook-subscription"),
    cancelCalendlyBooking: withBaseUrl("/api/calendar/calendly/cancel-booking"),
    bookings: withBaseUrl("/api/calendar/bookings"),
    status: withBaseUrl("/api/calendar/status"),
    disconnect: (provider) => withBaseUrl(`/api/calendar/disconnect/${provider}`),
  },
  billing: {
    plans: withBaseUrl("/api/billing/plans"),
    checkoutSession: withBaseUrl("/api/billing/checkout-session"),
    setupIntent: withBaseUrl("/api/billing/setup-intent"),
    subscriptionMe: withBaseUrl("/api/billing/subscription/me"),
    subscriptionCancel: withBaseUrl("/api/billing/subscription/cancel"),
    subscriptionResume: withBaseUrl("/api/billing/subscription/resume"),
    subscriptionChangePlan: withBaseUrl("/api/billing/subscription/change-plan"),
    invoices: withBaseUrl("/api/billing/invoices"),
    paymentMethods: withBaseUrl("/api/billing/payment-methods"),
    enterpriseInquiry: withBaseUrl("/api/billing/enterprise-inquiry"),
    enterpriseStatus: withBaseUrl("/api/billing/enterprise-status"),
  },
  notifications: {
    list: withBaseUrl("/api/notifications"),
    detail: (id) => withBaseUrl(`/api/notifications/${id}`),
    unreadCount: withBaseUrl("/api/notifications/unread-count"),
    markRead: withBaseUrl((id) => `/api/notifications/${id}/read`),
    markAllRead: withBaseUrl("/api/notifications/read-all"),
  },
  professionals: {
    profile: withBaseUrl("/api/professionals"),
    me: withBaseUrl("/api/professionals/me"),
    list: withBaseUrl("/api/professionals/list"),
    detail: withBaseUrl((id) => `/api/professionals/${id}`),
    icp: withBaseUrl("/api/professionals/icp"),
    uploadImage: withBaseUrl("/api/professionals/upload-image"),
  },
  proChat: {
    threads: withBaseUrl("/api/pro-chat/threads"),
    groups: withBaseUrl("/api/pro-chat/groups"),
    groupDetail: withBaseUrl((id) => `/api/pro-chat/groups/${id}`),
    groupDelete: withBaseUrl((id) => `/api/pro-chat/groups/${id}`),
    groupMembers: withBaseUrl((id) => `/api/pro-chat/groups/${id}/members`),
    groupMember: withBaseUrl((id, userId) => `/api/pro-chat/groups/${id}/members/${userId}`),
    groupLeave: withBaseUrl((id) => `/api/pro-chat/groups/${id}/leave`),
    groupRejoinRequest: withBaseUrl((id) => `/api/pro-chat/groups/${id}/rejoin-request`),
    groupRejoinRequests: withBaseUrl((id) => `/api/pro-chat/groups/${id}/rejoin-requests`),
    groupRejoinResolve: withBaseUrl((id, userId, action) => `/api/pro-chat/groups/${id}/rejoin-requests/${userId}/${action}`),
    threadDetail: withBaseUrl((id) => `/api/pro-chat/threads/${id}`),
    threadMessages: withBaseUrl((id) => `/api/pro-chat/threads/${id}/messages`),
    threadAttachments: withBaseUrl((id) => `/api/pro-chat/threads/${id}/attachments`),
  },
};

/**
 * Origin for Socket.IO (host only, no path).
 * Tries dedicated realtime env vars, then API URLs.
 * Hosts without a scheme default to http:// so local `localhost:5000` works (https would fail).
 */
export function getSocketOrigin() {
  const candidates = [
    process.env.NEXT_PUBLIC_SOCKET_ORIGIN,
    process.env.NEXT_PUBLIC_WS_ORIGIN,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_NODE_BACKEND_URL,
  ];
  for (const raw of candidates) {
    const s = String(raw || "")
      .trim()
      .replace(/\/+$/, "");
    if (!s) continue;
    try {
      const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
      const u = new URL(withProto);
      return u.origin;
    } catch {
      continue;
    }
  }
  return "";
}

/** @deprecated Prefer getSocketOrigin — kept for compatibility */
export function getApiOrigin() {
  return getSocketOrigin();
}

export async function apiClient({ url, method = "GET", data, token, rawToken = false }) {
  // url can be either a base-relative string ("/route") or an absolute url
  // If user passes a full url, don't prepend BASE_URL.
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  let fullUrl = isAbsolute ? url : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  fullUrl = normalizeApiUrl(fullUrl);
  const normalizedMethod = String(method || "GET").toUpperCase();
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    // rawToken: send the JWT directly without the "Bearer " prefix.
    // Some backend endpoints (e.g. verifyEmail, resetPassword) read
    // req.headers.authorization as a raw JWT rather than a Bearer scheme.
    headers.Authorization = rawToken ? token : `Bearer ${token}`;
  }

  const shouldDedupeInFlightRead = (normalizedMethod === "GET" || normalizedMethod === "HEAD") && !data;
  const inFlightKey = shouldDedupeInFlightRead
    ? `${normalizedMethod}:${fullUrl}:auth=${headers.Authorization || ""}`
    : "";
  const existingInFlight = inFlightKey ? inFlightReadRequests.get(inFlightKey) : null;
  if (existingInFlight) return existingInFlight;

  const requestPromise = (async () => {
    const response = await fetch(fullUrl, {
      method: normalizedMethod,
      headers,
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
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
      if (json?.code) error.code = json.code;
      if (json?.limit) error.limit = json.limit;
      if (json?.limits) error.limits = json.limits;
      if (
        typeof window !== "undefined" &&
        token &&
        json?.code === "TRIAL_QUOTA_EXHAUSTED"
      ) {
        window.dispatchEvent(
          new CustomEvent("nesti:subscription-quota-required", {
            detail: {
              code: json.code,
              limit: json.limit,
              limits: json.limits,
              message,
            },
          })
        );
      }
      throw error;
    }

    return json || {};
  })();

  if (inFlightKey) {
    inFlightReadRequests.set(inFlightKey, requestPromise);
    requestPromise.then(
      () => {
        inFlightReadRequests.delete(inFlightKey);
      },
      () => {
        inFlightReadRequests.delete(inFlightKey);
      }
    );
  }

  return requestPromise;
}
