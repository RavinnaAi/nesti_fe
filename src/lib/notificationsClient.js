import { apiClient, API_ENDPOINTS } from "./api";

export async function fetchNotificationsUnreadCount({ token }) {
  const json = await apiClient({ url: API_ENDPOINTS.notifications.unreadCount, token });
  return Number(json?.unread_count ?? 0);
}

export async function fetchNotificationById({ token, id }) {
  const json = await apiClient({ url: API_ENDPOINTS.notifications.detail(id), token });
  const n = json?.notification ?? json?.data?.notification;
  if (!n && json?.success === false) {
    throw new Error(json?.message || "Notification not found");
  }
  if (!n) throw new Error("Invalid notification response");
  return n;
}

export async function fetchNotifications({ token, limit = 20, offset = 0, unreadOnly = false }) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (unreadOnly) params.set("unread_only", "1");
  const qs = params.toString();
  const base = API_ENDPOINTS.notifications.list;
  const url = qs ? `${base}?${qs}` : base;
  return apiClient({ url, token });
}

export async function markNotificationReadRequest({ token, id }) {
  return apiClient({
    url: API_ENDPOINTS.notifications.markRead(id),
    method: "PATCH",
    token,
  });
}

export async function markAllNotificationsReadRequest({ token }) {
  return apiClient({
    url: API_ENDPOINTS.notifications.markAllRead,
    method: "PATCH",
    token,
  });
}
