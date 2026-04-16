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

export async function fetchLeadProfileById({ token, profileId }) {
  return apiClient({
    url: API_ENDPOINTS.leads.profileDetail(profileId),
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
    url: withQuery(API_ENDPOINTS.leads.detail(id), { include_conversion: 1 }),
    method: "GET",
    token,
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
