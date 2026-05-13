"use client";

import { apiClient, API_ENDPOINTS } from "@/lib/api";

export async function createOrGetProChatThread({ token, other_user_id }) {
  return apiClient({
    url: API_ENDPOINTS?.proChat?.threads || "/api/pro-chat/threads",
    method: "POST",
    token,
    data: { other_user_id },
  });
}

export async function fetchMyProChatThreads({ token }) {
  return apiClient({
    url: API_ENDPOINTS?.proChat?.threads || "/api/pro-chat/threads",
    method: "GET",
    token,
  });
}

export async function fetchProChatThreadById({ token, id }) {
  return apiClient({
    url: (API_ENDPOINTS?.proChat?.threadDetail ? API_ENDPOINTS.proChat.threadDetail(id) : `/api/pro-chat/threads/${id}`),
    method: "GET",
    token,
  });
}

export async function fetchProChatThreadMessages({ token, id, page = 1, limit = 50 }) {
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("limit", String(limit));
  const base =
    API_ENDPOINTS?.proChat?.threadMessages
      ? API_ENDPOINTS.proChat.threadMessages(id)
      : `/api/pro-chat/threads/${id}/messages`;
  return apiClient({
    url: `${base}?${sp.toString()}`,
    method: "GET",
    token,
  });
}

