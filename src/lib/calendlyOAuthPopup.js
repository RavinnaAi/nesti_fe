/** Second argument to `window.open` — OAuth runs here so the opener tab stays on the SPA. */
export const CALENDLY_OAUTH_WINDOW_NAME = "calendly-oauth";

/** Where to send the user after OAuth completes (same-tab return). */
export const CALENDLY_OAUTH_RETURN_KEY = "nesti-calendly-oauth-return";

/** Same-origin channel so the tab can show a toast + refresh queries after OAuth (incl. same-tab return). */
export const CALENDLY_OAUTH_BROADCAST_CHANNEL = "nesti-calendly-oauth-result";

export const CALENDLY_OAUTH_MESSAGE_SOURCE = "nesti-calendly-oauth";

/** One toast slot for connect/disconnect/result so messages don’t stack. */
export const CALENDLY_INTEGRATION_TOAST_ID = "nesti-calendly-integration";

/** Avoid open redirects: only allow same-origin relative paths. */
export function safeCalendlyReturnPath(raw) {
  if (raw == null || typeof raw !== "string") return "/dashboard";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/dashboard";
  return t.split("#")[0] || "/dashboard";
}
