"use client";

import { apiClient, API_ENDPOINTS } from "@/lib/api";

export async function resolveInviteToken({ token }) {
  return apiClient({
    url: API_ENDPOINTS.invites.resolve(token),
    method: "GET",
  });
}

export async function captureInviteToken({ token, payload = {} }) {
  return apiClient({
    url: API_ENDPOINTS.invites.capture,
    method: "POST",
    data: { token, ...payload },
  });
}

export async function finalizeInviteToken({ token, authToken, method = "auth", path = "" }) {
  return apiClient({
    url: API_ENDPOINTS.invites.finalize,
    method: "POST",
    token: authToken,
    data: { token, method, path },
  });
}

export async function fetchInviteMetrics({ token, days = 30 }) {
  const qs = `?days=${encodeURIComponent(String(days || 30))}`;
  return apiClient({
    url: `${API_ENDPOINTS.invites.metrics}${qs}`,
    method: "GET",
    token,
  });
}

export async function createInviteLink({ token, payload = {} }) {
  return apiClient({
    url: API_ENDPOINTS.invites.list,
    method: "POST",
    token,
    data: payload,
  });
}

export async function fetchInviteLinks({ token, page = 1, limit = 8 }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiClient({
    url: `${API_ENDPOINTS.invites.list}?${params.toString()}`,
    method: "GET",
    token,
  });
}

export async function fetchRewardsProfile({ token }) {
  return apiClient({
    url: API_ENDPOINTS.invites.rewardsProfile,
    method: "GET",
    token,
  });
}

export async function fetchRewardsLedger({ token, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page || 1),
    limit: String(limit || 20),
  });
  return apiClient({
    url: `${API_ENDPOINTS.invites.rewardEvents}?${params.toString()}`,
    method: "GET",
    token,
  });
}

export async function fetchInviteConversions({ token, days = 30, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    days: String(days || 30),
    page: String(page || 1),
    limit: String(limit || 10),
  });
  return apiClient({
    url: `${API_ENDPOINTS.invites.conversions}?${params.toString()}`,
    method: "GET",
    token,
  });
}

export async function fetchInviteConversionRoleTrends({ token, days = 30 } = {}) {
  const qs = `?days=${encodeURIComponent(String(days || 30))}`;
  return apiClient({
    url: `${API_ENDPOINTS.invites.conversionRoleTrends}${qs}`,
    method: "GET",
    token,
  });
}
