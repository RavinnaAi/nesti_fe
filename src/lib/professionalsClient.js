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

export async function fetchProfessionals({ token, ...query }) {
  return apiClient({
    url: withQuery(API_ENDPOINTS.professionals.list, query),
    method: "GET",
    token,
  });
}

export async function fetchProfessionalById({ token, id }) {
  return apiClient({
    url: API_ENDPOINTS.professionals.detail(id),
    method: "GET",
    token,
  });
}
