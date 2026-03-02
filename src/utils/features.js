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
    (user.accountStatus || user.account_status || ACCOUNT_STATUS.SUBSCRIBED).toLowerCase();
  const plan =
    (user.subscriptionPlan || user.subscription_plan || "").toLowerCase();

  // Expired: only allow subscription management
  if (status === ACCOUNT_STATUS.EXPIRED) {
    return feature === FEATURES.SETTINGS_SUBSCRIPTION;
  }

  // Free trial: behaves like basic tier
  if (status === ACCOUNT_STATUS.FREE_TRIAL) {
    return BASIC_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
  }

  // Subscribed: check plan
  if (status === ACCOUNT_STATUS.SUBSCRIBED) {
    if (plan === SUBSCRIPTION_PLAN.BASIC) {
      return BASIC_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
    }
    if (plan === SUBSCRIPTION_PLAN.PRO) {
      return PRO_FEATURES.has(feature) || feature === FEATURES.SETTINGS_SUBSCRIPTION;
    }
  }

  // Legacy / unknown state: don't block settings, otherwise allow by default
  if (feature === FEATURES.SETTINGS_SUBSCRIPTION) return true;
  return status === ACCOUNT_STATUS.SUBSCRIBED;
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
]);

const PRO_FEATURES = new Set([
  ...BASIC_FEATURES,
  FEATURES.CHATBOT_EMOTIONAL,
  FEATURES.CHATBOT_EMOTIONAL_QA,
  FEATURES.CHATBOT_EMOTIONAL_TONE,
  FEATURES.CALENDAR_INTEGRATION,
  FEATURES.CALENDAR_VIRTUAL_CONSULT,
  FEATURES.LEADS_FOLLOWUP_AUTOMATED,
  FEATURES.REPORTS_AI_MONTHLY,
  FEATURES.ASSISTANT_PROFESSIONAL,
  FEATURES.ASSISTANT_PROFESSIONAL_CLOSING,
  FEATURES.ASSISTANT_PROFESSIONAL_FOLLOWUP,
  FEATURES.LEADS_INSIGHTS_ADVANCED,
]);

