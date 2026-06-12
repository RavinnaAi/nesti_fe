/** Limits with live quota enforcement in the backend. */
export const ENFORCED_PLAN_LIMIT_KEYS = Object.freeze(["captured_leads", "followup_actions"]);

function limitState(planLimits, usage, key) {
  const max = planLimits?.[key];
  const used = Number(usage?.[key] ?? 0);
  if (max == null || !Number.isFinite(Number(max))) return null;
  const maxNum = Number(max);
  if (used < maxNum) return null;
  return { key, used, max: maxNum, atCap: true };
}

export function getCapturedLeadsLimitState(planLimits, usage) {
  return limitState(planLimits, usage, "captured_leads");
}

export function getFollowupActionsLimitState(planLimits, usage) {
  return limitState(planLimits, usage, "followup_actions");
}

/** All plan limits currently at or over cap. */
export function getActivePlanLimitStates(planLimits, usage) {
  return ENFORCED_PLAN_LIMIT_KEYS.map((key) => limitState(planLimits, usage, key)).filter(Boolean);
}

function formatUsage(limitState) {
  return `${limitState.used}/${limitState.max}`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}

export function capturedLeadsLimitMessage(limitState) {
  if (!limitState) return "";
  const usage = formatUsage(limitState);
  const visibleLeadLabel = pluralize(limitState.max, "lead");
  const savedLeadLabel = pluralize(limitState.used, "lead");
  if (limitState.used > limitState.max) {
    return `Your current plan displays up to ${limitState.max} ${visibleLeadLabel} in the workspace, while ${limitState.used} ${savedLeadLabel} are saved from your chatbot (${usage}). Upgrade to view and manage all captured leads.`;
  }
  return `You have reached your captured lead limit (${usage}). Upgrade your plan to view and manage additional leads captured by your chatbot.`;
}

export function followupActionsLimitMessage(limitState) {
  if (!limitState) return "";
  const usage = formatUsage(limitState);
  const maxEmailLabel = pluralize(limitState.max, "nurture email");
  return `You have reached your nurture email limit (${usage} ${pluralize(limitState.used, "email")} sent). Your plan allows ${limitState.max} ${maxEmailLabel}; upgrade to send more follow-up emails.`;
}

export function planLimitMessage(limitState) {
  if (!limitState) return "";
  if (limitState.key === "followup_actions") return followupActionsLimitMessage(limitState);
  return capturedLeadsLimitMessage(limitState);
}

export function planLimitMessages(planLimits, usage) {
  return getActivePlanLimitStates(planLimits, usage)
    .map((state) => planLimitMessage(state))
    .filter(Boolean);
}
