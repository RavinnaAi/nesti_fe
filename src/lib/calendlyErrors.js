/**
 * Calendly blocks POST /webhook_subscriptions on free / expired trials (often HTTP 403).
 * Handles both API `calendly_webhook_error_kind` and legacy stored error strings.
 */
export function isCalendlyPlanWebhookBlock(cal) {
  if (cal?.calendly_webhook_error_kind === "calendly_plan") return true;
  const msg = String(cal?.calendly_webhook_register_error || "");
  if (!msg) return false;
  return (
    /\(403\)/.test(msg) &&
    /permission denied|upgrade|standard|trial|plan|calendly account/i.test(msg)
  );
}

/** Shown when webhooks are blocked by plan; keep in sync with node `userFacingCalendlyRegisterError` for calendly_plan. */
/** Aligned with node `userFacingCalendlyRegisterError` for `calendly_plan`. */
export const CALENDLY_PLAN_WEBHOOK_USER_MESSAGE =
  "Calendly requires a Standard (or higher) plan to create booking webhooks. Your OAuth link still works, but new bookings will not be pushed to Nesti until your Calendly account is upgraded.";

export const CALENDLY_BILLING_URL = "https://calendly.com/app/admin/billing";
