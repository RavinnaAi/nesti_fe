"use client";

import { apiClient, API_ENDPOINTS, apiUrl } from "@/lib/api";
const AUTH_STORAGE_KEY = "nesti_auth_state";

const getStoredAuthToken = () => {
  if (typeof window === "undefined") return "";
  try {
    let stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        localStorage.setItem(AUTH_STORAGE_KEY, stored);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    if (!stored) return "";
    const parsed = JSON.parse(stored);
    return parsed?.token || "";
  } catch (_err) {
    return "";
  }
};

const defaultSessionKey = "chatbot_session_id";
const defaultVisitorKey = "chatbot_visitor_id";

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
};

const apiErrorMessage = (json) =>
  json?.detail || json?.message || json?.error || "Request failed. Please try again.";

export const getOrCreateSessionId = (key = defaultSessionKey) => {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(key, sid);
  return sid;
};

export const getVisitorId = (key = defaultVisitorKey) => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
};

export const setVisitorId = (val, key = defaultVisitorKey) => {
  if (typeof window === "undefined" || !val) return;
  localStorage.setItem(key, val);
};

/** New session id + drop stored visitor so the next chat is a clean lead thread. */
export function resetChatIdentity({
  sessionKey = defaultSessionKey,
  visitorKey = defaultVisitorKey,
} = {}) {
  if (typeof window === "undefined") return { sessionId: "", visitorCleared: true };
  const sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(sessionKey, sid);
  localStorage.removeItem(visitorKey);
  return { sessionId: sid, visitorCleared: true };
}

export async function resolveEmbedToken(token) {
  const t = String(token || "").trim();
  if (!t) throw new Error("Missing embed token.");
  const response = await fetch(apiUrl(`/api/embed/resolve/${encodeURIComponent(t)}`), {
    method: "GET",
    cache: "no-store",
  });
  const json = await parseJson(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(json) || "Invalid or inactive chatbot link.");
  }
  return json;
}

export async function sendChatMessage({
  message,
  sessionId,
  embedToken,
  visitorId,
  agentType,
  channel = "web",
  formContact,
}) {
  const payload = {
    id: sessionId,
    message,
    embedToken,
    visitorId: visitorId || undefined,
    agentType: agentType || undefined,
    channel,
    ...(formContact && typeof formContact === "object" && Object.keys(formContact).length
      ? { formContact }
      : {}),
  };

  const response = await fetch(apiUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await parseJson(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(json));
  }
  return json;
}

/** Optional lead score (same as node-backend `POST /api/chat/score-preview`). Fails soft — returns null. */
export async function postChatScorePreview({ formContact, professionalType }) {
  try {
    const response = await fetch(apiUrl("/api/chat/score-preview"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formContact: formContact || undefined,
        professionalType: professionalType || undefined,
      }),
      cache: "no-store",
    });
    const json = await parseJson(response);
    if (!response.ok || !json?.success) return null;
    return json;
  } catch (_err) {
    return null;
  }
}

export async function fetchChatPropertyMatches({
  sessionId,
  embedToken,
  visitorId,
  formContact,
  page = 1,
  limit = 5,
}) {
  const payload = {
    id: sessionId,
    embedToken,
    visitorId: visitorId || undefined,
    page,
    limit,
    ...(formContact && typeof formContact === "object" && Object.keys(formContact).length
      ? { formContact }
      : {}),
  };

  const response = await fetch(apiUrl("/api/chat/property-matches"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await parseJson(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(json));
  }
  return json;
}

export async function clearChatSession(sessionId) {
  const response = await fetch(
    apiUrl(`/api/chat/clear/${encodeURIComponent(String(sessionId || ""))}`),
    {
      method: "DELETE",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const json = await parseJson(response);
    throw new Error(apiErrorMessage(json));
  }
  return true;
}

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, val]) => val !== undefined && val !== null && val !== "");
  if (!entries.length) return "";
  const query = new URLSearchParams(entries);
  return `?${query.toString()}`;
};

export async function fetchChatAnalyticsSummary({ token, days = 30 } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ days: Number.isFinite(days) ? days : 30 });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.summary}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchChatAnalyticsFunnel({ token, days = 30 } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ days: Number.isFinite(days) ? days : 30 });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.funnel}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchChatAnalyticsTimeseries({ token, days = 30 } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ days: Number.isFinite(days) ? days : 30 });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.timeseries}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchChatAnalyticsLeadTrends({ token, days = 30 } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ days: Number.isFinite(days) ? days : 30 });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.leadTrends}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchConversations({ token, embedId, start, end } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ embed_id: embedId, start, end });
  return apiClient({
    url: `${API_ENDPOINTS.chat.conversations}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchConversationMessages({ token, conversationId }) {
  if (!conversationId) return [];
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.conversationMessages(conversationId),
    method: "GET",
    token: authToken,
  });
}

export async function fetchReferrals({ token }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.referrals,
    method: "GET",
    token: authToken,
  });
}

export async function createReferral({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.referrals,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function updateReferral({ token, id, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.referral(id),
    method: "PATCH",
    data: payload,
    token: authToken,
  });
}

export async function postNurtureDraft({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.nurtureDraft,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function postNurtureRefine({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.nurtureRefine,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function sendNurtureEmail({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.nurtureSend,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function fetchNurtureLogs({ token, leadMatchId, leadProfileId, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (leadMatchId && String(leadMatchId).trim()) {
    params.set("lead_match_id", String(leadMatchId).trim());
  }
  if (leadProfileId && String(leadProfileId).trim()) {
    params.set("lead_profile_id", String(leadProfileId).trim());
  }
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.nurtureLogs}${qs}`,
    method: "GET",
    token: authToken,
  });
}

export async function runMortgageCalculator({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.calculators.mortgage,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function runClosingCalculator({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.calculators.closing,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function fetchCalculatorRuns({ token, type } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ type });
  return apiClient({
    url: `${API_ENDPOINTS.chat.calculators.runs}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchAnalyticsSummary({ token, start, end } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ start, end });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.summary}${query}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchAnalyticsFunnel({ token, start, end } = {}) {
  const authToken = token || getStoredAuthToken();
  const query = buildQueryString({ start, end });
  return apiClient({
    url: `${API_ENDPOINTS.chat.analytics.funnel}${query}`,
    method: "GET",
    token: authToken,
  });
}
