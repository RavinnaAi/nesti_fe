"use client";

import { ACCOUNT_STATUS, FEATURES, SUBSCRIPTION_PLAN } from "@/constants/features";

/**
 * Determine if a user has access to a given feature.
 *
 * @param user - The auth user object (from Redux / profile API)
 * @param featureName - One of FEATURES.*
 */
export function hasFeature(user, featureName) {
  if (!user) return false;
  const feature = String(featureName || "").trim();

  const status =
    (user.accountStatus || user.account_status || ACCOUNT_STATUS.EXPIRED).toLowerCase();
  const plan =
    (user.subscriptionPlan || user.subscription_plan || "").toLowerCase();

  // Expired: only allow subscription management
  if (status === ACCOUNT_STATUS.EXPIRED) {
    return feature === FEATURES.SETTINGS_SUBSCRIPTION;
  }

  // Free trial: unlock the full product during the 3-day evaluation window.
  if (status === ACCOUNT_STATUS.FREE_TRIAL) {
    return ENTERPRISE_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
  }

  // Subscribed: check plan
  if (status === ACCOUNT_STATUS.SUBSCRIBED) {
    if (plan === SUBSCRIPTION_PLAN.BASIC) {
      return BASIC_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
    }
    if (plan === SUBSCRIPTION_PLAN.STANDARD) {
      return STANDARD_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
    }
    if (plan === SUBSCRIPTION_PLAN.ENTERPRISE) {
      return ENTERPRISE_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
    }
  }

  // Unknown states/plans should not bypass the three-tier entitlement map.
  if (feature === FEATURES.SETTINGS_SUBSCRIPTION) return true;
  return false;
}

// Local sets mirroring backend feature groups
const BASIC_FEATURES = new Set([
  FEATURES.CHATBOT_BASIC,
  FEATURES.LEADS_CAPTURE,
  FEATURES.LEADS_QUESTIONNAIRES,
  FEATURES.LEADS_SCORING,
  FEATURES.LEADS_CLASSIFICATION,
  FEATURES.CRM_BASIC_LIST,
  FEATURES.CRM_BASIC_STATUS,
  FEATURES.CRM_FOLLOWUP_MANUAL,
  FEATURES.REFERRALS_MANUAL,
  FEATURES.PRO_CHAT_DM,
  FEATURES.DASHBOARD_ANALYTICS,
]);

const STANDARD_FEATURES = new Set([
  ...BASIC_FEATURES,
  FEATURES.CHATBOT_EMOTIONAL,
  FEATURES.CHATBOT_EMOTIONAL_QA,
  FEATURES.CHATBOT_EMOTIONAL_TONE,
  FEATURES.CALENDAR_INTEGRATION,
  FEATURES.CALENDAR_VIRTUAL_CONSULT,
  FEATURES.LEADS_FOLLOWUP_AUTOMATED,
  FEATURES.ASSISTANT_PROFESSIONAL,
  FEATURES.ASSISTANT_PROFESSIONAL_CLOSING,
  FEATURES.ASSISTANT_PROFESSIONAL_FOLLOWUP,
  FEATURES.CRM_LEAD_CONVERSATION,
  FEATURES.PUBLIC_PROFILE,
  FEATURES.WORKSPACE_ANALYTICS_PAGE,
  FEATURES.REPORTS_AI_MONTHLY,
  FEATURES.LEADS_INSIGHTS_ADVANCED,
  FEATURES.REFERRALS_INVITES,
  FEATURES.PROFILE_ANALYTICS,
  FEATURES.PRO_CHAT,
]);

const ENTERPRISE_FEATURES = new Set([
  ...STANDARD_FEATURES,
]);

