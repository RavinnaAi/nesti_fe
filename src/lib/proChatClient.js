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

export async function createProChatGroupThread({ token, title, participant_ids }) {
  return apiClient({
    url: API_ENDPOINTS?.proChat?.groups || "/api/pro-chat/groups",
    method: "POST",
    token,
    data: { title, participant_ids },
  });
}

export async function updateProChatGroupThread({ token, id, title }) {
  const url = API_ENDPOINTS?.proChat?.groupDetail ? API_ENDPOINTS.proChat.groupDetail(id) : `/api/pro-chat/groups/${id}`;
  return apiClient({
    url,
    method: "PATCH",
    token,
    data: { title },
  });
}

export async function deleteProChatGroupThread({ token, id }) {
  const url = API_ENDPOINTS?.proChat?.groupDelete
    ? API_ENDPOINTS.proChat.groupDelete(id)
    : `/api/pro-chat/groups/${id}`;
  return apiClient({
    url,
    method: "DELETE",
    token,
  });
}

export async function addProChatGroupMembers({ token, id, participant_ids }) {
  const url = API_ENDPOINTS?.proChat?.groupMembers ? API_ENDPOINTS.proChat.groupMembers(id) : `/api/pro-chat/groups/${id}/members`;
  return apiClient({
    url,
    method: "POST",
    token,
    data: { participant_ids },
  });
}

export async function removeProChatGroupMember({ token, id, userId }) {
  const url = API_ENDPOINTS?.proChat?.groupMember
    ? API_ENDPOINTS.proChat.groupMember(id, userId)
    : `/api/pro-chat/groups/${id}/members/${userId}`;
  return apiClient({
    url,
    method: "DELETE",
    token,
  });
}

export async function leaveProChatGroup({ token, id }) {
  const url = API_ENDPOINTS?.proChat?.groupLeave ? API_ENDPOINTS.proChat.groupLeave(id) : `/api/pro-chat/groups/${id}/leave`;
  return apiClient({
    url,
    method: "POST",
    token,
  });
}

export async function requestProChatGroupRejoin({ token, id }) {
  const url = API_ENDPOINTS?.proChat?.groupRejoinRequest
    ? API_ENDPOINTS.proChat.groupRejoinRequest(id)
    : `/api/pro-chat/groups/${id}/rejoin-request`;
  return apiClient({
    url,
    method: "POST",
    token,
  });
}

export async function fetchProChatGroupRejoinRequests({ token, id }) {
  const url = API_ENDPOINTS?.proChat?.groupRejoinRequests
    ? API_ENDPOINTS.proChat.groupRejoinRequests(id)
    : `/api/pro-chat/groups/${id}/rejoin-requests`;
  return apiClient({
    url,
    method: "GET",
    token,
  });
}

export async function resolveProChatGroupRejoinRequest({ token, id, userId, action }) {
  const safeAction = action === "approve" ? "approve" : "reject";
  const url = API_ENDPOINTS?.proChat?.groupRejoinResolve
    ? API_ENDPOINTS.proChat.groupRejoinResolve(id, userId, safeAction)
    : `/api/pro-chat/groups/${id}/rejoin-requests/${userId}/${safeAction}`;
  return apiClient({
    url,
    method: "POST",
    token,
  });
}

export async function fetchMyProChatThreads({ token, page = 1, limit = 200 }) {
  const sp = new URLSearchParams();
  sp.set("page", String(Math.max(1, Number(page) || 1)));
  sp.set("limit", String(Math.max(1, Number(limit) || 1)));
  return apiClient({
    url: `${API_ENDPOINTS?.proChat?.threads || "/api/pro-chat/threads"}?${sp.toString()}`,
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

export async function uploadProChatThreadAttachment({ token, id, file }) {
  const url =
    API_ENDPOINTS?.proChat?.threadAttachments
      ? API_ENDPOINTS.proChat.threadAttachments(id)
      : `/api/pro-chat/threads/${id}/attachments`;
  const fd = new FormData();
  fd.append("file", file);
  return apiClient({
    url,
    method: "POST",
    token,
    data: fd,
  });
}

