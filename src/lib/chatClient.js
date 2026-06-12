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

export function persistChatSessionId(sessionId, sessionKey = defaultSessionKey) {
  if (typeof window === "undefined") return;
  const sid = String(sessionId || "").trim();
  if (sid) localStorage.setItem(sessionKey, sid);
}

/** Prefer server-forked session id when intake creates a new conversation thread. */
export function resolveChatSessionId(payload, fallbackSessionId = "") {
  return String(payload?.session_id || fallbackSessionId || "").trim();
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
  forceNewLead = false,
}) {
  const hasFormContact =
    formContact && typeof formContact === "object" && Object.keys(formContact).length > 0;
  const payload = {
    id: sessionId,
    message,
    embedToken,
    visitorId: visitorId || undefined,
    agentType: agentType || undefined,
    channel,
    ...(hasFormContact ? { formContact } : {}),
    ...(forceNewLead ? { forceNewLead: true } : {}),
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

export async function uploadSellerPropertyImages({ embedToken, sessionId, files }) {
  const t = String(embedToken || "").trim();
  const sid = String(sessionId || "").trim();
  const list = Array.from(files || []).filter(Boolean).slice(0, 8);
  if (!t || !sid) throw new Error("Missing chatbot session.");
  if (!list.length) return { success: true, images: [] };

  const body = new FormData();
  body.append("embedToken", t);
  body.append("sessionId", sid);
  list.forEach((file) => body.append("images", file));

  const response = await fetch(API_ENDPOINTS.chat.propertyImages, {
    method: "POST",
    body,
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

/** Load full transcript for an embed session (widget restore on reopen). */
export async function fetchChatSessionMessages({ sessionId, embedToken }) {
  const response = await fetch(apiUrl("/api/chat/session-messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: sessionId,
      embedToken,
    }),
    cache: "no-store",
  });
  const json = await parseJson(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(json));
  }
  return json;
}

export function mapServerChatMessagesToWidget(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content ?? ""),
    timestamp: m.created_at ? new Date(m.created_at) : new Date(),
  }));
}

export async function fetchChatPropertyMatches({
  sessionId,
  embedToken,
  visitorId,
  formContact,
  page = 1,
  limit = 5,
  matchMode = "strict",
}) {
  const payload = {
    id: sessionId,
    embedToken,
    visitorId: visitorId || undefined,
    page,
    limit,
    matchMode: matchMode === "relaxed" ? "relaxed" : "strict",
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

export async function selectChatPropertyMatch({ sessionId, embedToken, property }) {
  const payload = {
    id: sessionId,
    embedToken,
    property,
  };
  const response = await fetch(apiUrl("/api/chat/property-matches/select"), {
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

export async function fetchReferrals({ token, direction, page, limit, status, conversationId } = {}) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (direction) params.set("direction", String(direction));
  if (page != null && page !== "") params.set("page", String(page));
  if (limit != null && limit !== "") params.set("limit", String(limit));
  if (status) params.set("status", String(status));
  if (conversationId) params.set("conversation_id", String(conversationId));
  const qs = params.toString();
  const url = qs ? `${API_ENDPOINTS.referrals.list}?${qs}` : API_ENDPOINTS.referrals.list;
  return apiClient({
    url,
    method: "GET",
    token: authToken,
  });
}

export async function fetchLeadReferrals({ token, leadMatchId }) {
  if (!leadMatchId) return [];
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.referrals.byLeadMatch(leadMatchId),
    method: "GET",
    token: authToken,
  });
}

export async function createReferral({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.referrals.list,
    method: "POST",
    data: payload,
    token: authToken,
  });
}

export async function updateReferral({ token, id, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.referrals.detail(id),
    method: "PATCH",
    data: payload,
    token: authToken,
  });
}

export async function fetchReferralLeadDetails({ token, id }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.referrals.lead(id),
    method: "GET",
    token: authToken,
  });
}

export async function processReferralRequest({ token, id }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.referrals.process(id),
    method: "POST",
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

export async function postNurturePreview({ token, payload }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.nurturePreview,
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

export async function startBulkNurtureDraftJob({ token, icpTier } = {}) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.bulkNurtureDraftJobs,
    method: "POST",
    data: { icp_tier: icpTier || undefined },
    token: authToken,
  });
}

export async function startBulkNurtureSendJob({ token, sourceJobId, itemIds, sendAll = false }) {
  const authToken = token || getStoredAuthToken();
  return apiClient({
    url: API_ENDPOINTS.chat.bulkNurtureSendJobs,
    method: "POST",
    data: {
      source_job_id: sourceJobId,
      send_all: sendAll,
      item_ids: sendAll ? undefined : itemIds,
    },
    token: authToken,
  });
}

export async function fetchBulkNurtureJob({ token, jobId, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.bulkNurtureJob(jobId)}${qs}`,
    method: "GET",
    token: authToken,
  });
}

export async function fetchLatestBulkNurtureJob({ token, type = "bulk_nurture_draft", page, limit } = {}) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (type) params.set("type", String(type));
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.latestBulkNurtureJob}${qs}`,
    method: "GET",
    token: authToken,
  });
}

export async function clearBulkNurtureDrafts({ token, jobId, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.clearBulkNurtureDrafts(jobId)}${qs}`,
    method: "DELETE",
    token: authToken,
  });
}

export async function pauseBulkNurtureDraftJob({ token, jobId, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.pauseBulkNurtureDraftJob(jobId)}${qs}`,
    method: "POST",
    token: authToken,
  });
}

export async function resumeBulkNurtureDraftJob({ token, jobId, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.resumeBulkNurtureDraftJob(jobId)}${qs}`,
    method: "POST",
    token: authToken,
  });
}

export async function updateBulkNurtureDraftItem({ token, jobId, itemId, subject, body, page, limit }) {
  const authToken = token || getStoredAuthToken();
  const params = new URLSearchParams();
  if (page != null && String(page).trim() !== "") params.set("page", String(page));
  if (limit != null && String(limit).trim() !== "") params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient({
    url: `${API_ENDPOINTS.chat.bulkNurtureDraftItem(jobId, itemId)}${qs}`,
    method: "PATCH",
    data: { subject, body },
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
