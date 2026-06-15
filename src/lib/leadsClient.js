"use client";

import { apiClient, API_ENDPOINTS } from "@/lib/api";

function withQuery(url, params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `${url}?${q}` : url;
}

export async function fetchLeads({ token, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.list, query),
    method: "GET",
    token,
  });
}

export async function fetchLeadProfiles({ token, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.profiles, query),
    method: "GET",
    token,
  });
}

export async function fetchLeadProfileById({ token, profileId, include, page, limit }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.profileDetail(profileId), { include, page, limit }),
    method: "GET",
    token,
  });
}

export async function fetchLeadsByProfileId({ token, profileId, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.profileLeads(profileId), query),
    method: "GET",
    token,
  });
}

export async function fetchLeadById({ token, id }) {
  return apiClient({
    url: API_ENDPOINTS.leads.detail(id),
    method: "GET",
    token,
  });
}

export async function fetchLeadInquiredProperty({ token, id }) {
  return apiClient({
    url: API_ENDPOINTS.leads.inquiredProperty(id),
    method: "GET",
    token,
  });
}

export async function analyzeLeadInsights({ token, leadId, refresh = false }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.ai.analyzeLeadInsights(leadId), refresh ? { refresh: 1 } : {}),
    method: "POST",
    token,
  });
}

/** PATCH lead: `match_status` and/or `note` (append-only agent note), plus optional close metadata. */
export async function patchLead({
  token,
  id,
  match_status,
  note,
  close_reason,
  closed_value,
  agent_closing_checklist,
  lawyer_closing_checklist,
  mortgage_closing_checklist,
}) {
  const data = {};
  if (match_status != null && String(match_status).trim() !== "") {
    data.match_status = String(match_status).trim();
  }
  if (note != null && String(note).trim() !== "") {
    data.note = String(note).trim();
  }
  if (close_reason != null && String(close_reason).trim() !== "") {
    data.close_reason = String(close_reason).trim();
  }
  if (closed_value != null && closed_value !== "") {
    data.closed_value = Number(closed_value);
  }
  if (agent_closing_checklist && typeof agent_closing_checklist === "object") {
    data.agent_closing_checklist = agent_closing_checklist;
  }
  if (lawyer_closing_checklist && typeof lawyer_closing_checklist === "object") {
    data.lawyer_closing_checklist = lawyer_closing_checklist;
  }
  if (mortgage_closing_checklist && typeof mortgage_closing_checklist === "object") {
    data.mortgage_closing_checklist = mortgage_closing_checklist;
  }
  return apiClient({
    url: API_ENDPOINTS.leads.patch(id),
    method: "PATCH",
    token,
    data,
  });
}

export async function fetchLeadConversation({ token, leadId, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.conversation(leadId), query),
    method: "GET",
    token,
  });
}

export async function fetchLeadPropertyMatches({ token, leadId, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.leads.propertyMatches(leadId), query),
    method: "GET",
    token,
  });
}

export async function deleteLeadById({ token, id }) {
  return apiClient({
    url: API_ENDPOINTS.leads.remove(id),
    method: "DELETE",
    token,
  });
}

/**
 * Record a lead_viewed KPI event. Backend dedupes to one event per lead per UTC day,
 * so calling this every time a lead is opened is safe.
 */
export async function recordLeadView({ token, id }) {
  if (!token || !id) return null;
  return apiClient({
    url: API_ENDPOINTS.leads.recordView(id),
    method: "POST",
    token,
  });
}
