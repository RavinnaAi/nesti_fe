import { apiClient, API_ENDPOINTS } from "@/lib/api";

/**
 * GET /api/calendar/connect/calendly — returns { success, authUrl } (Bearer).
 */
export async function fetchCalendlyConnectUrl({ token }) {
  return apiClient({
    url: API_ENDPOINTS.calendar.connect("calendly"),
    method: "GET",
    token,
  });
}

/**
 * GET /api/calendar/bookings — { success, bookings: [{ lead_match_id, starts_at, title, contact, ... }] }.
 * `starts_at` is when the booking was recorded (conversation.calendly_booking_at), newest first.
 */
export async function fetchCalendarBookings({ token }) {
  return apiClient({
    url: API_ENDPOINTS.calendar.bookings,
    method: "GET",
    token,
  });
}

/**
 * GET /api/calendar/status — { success, status: [{ provider, account_email, expires_at, ... }] }.
 */
export async function fetchCalendarStatus({ token }) {
  return apiClient({
    url: API_ENDPOINTS.calendar.status,
    method: "GET",
    token,
  });
}

/**
 * DELETE /api/calendar/disconnect/calendly
 */
export async function disconnectCalendly({ token }) {
  return apiClient({
    url: API_ENDPOINTS.calendar.disconnect("calendly"),
    method: "DELETE",
    token,
  });
}

/**
 * POST /api/calendar/calendly/webhook-subscription — { webhookUrl? } body optional if server has env.
 */
export async function registerCalendlyWebhook({ token, webhookUrl }) {
  const trimmed = webhookUrl != null ? String(webhookUrl).trim() : "";
  return apiClient({
    url: API_ENDPOINTS.calendar.webhookSubscription,
    method: "POST",
    data: trimmed ? { webhookUrl: trimmed } : {},
    token,
  });
}

/**
 * POST /api/calendar/calendly/cancel-booking — cancel the Calendly event for a booked lead.
 */
export async function cancelCalendlyAppointment({ token, leadMatchId, reason }) {
  const id = String(leadMatchId || "").trim();
  if (!id) throw new Error("lead_match_id is required");
  const payload = { lead_match_id: id };
  const r = reason != null ? String(reason).trim().slice(0, 500) : "";
  if (r) payload.reason = r;
  return apiClient({
    url: API_ENDPOINTS.calendar.cancelCalendlyBooking,
    method: "POST",
    data: payload,
    token,
  });
}
