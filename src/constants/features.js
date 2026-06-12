"use client";

// Feature identifiers used across the app.
// Keep these in sync with backend `services/billing/entitlements.js`.

export const ACCOUNT_STATUS = {
  FREE_TRIAL: "free_trial",
  EXPIRED: "expired",
  SUBSCRIBED: "subscribed",
};

export const SUBSCRIPTION_PLAN = {
  BASIC: "basic",
  STANDARD: "standard",
  ENTERPRISE: "enterprise",
};

export const FEATURES = {
  // Always-allowed (even when expired)
  SETTINGS_SUBSCRIPTION: "settings.subscription",

  // Basic plan
  CHATBOT_BASIC: "chatbot.basic",
  LEADS_CAPTURE: "leads.capture",
  LEADS_QUESTIONNAIRES: "leads.questionnaires",
  LEADS_SCORING: "leads.scoring",
  LEADS_CLASSIFICATION: "leads.classification",
  CRM_BASIC_LIST: "crm.basic.list",
  CRM_BASIC_STATUS: "crm.basic.status",
  CRM_FOLLOWUP_MANUAL: "crm.followup.manual",
  CRM_LEAD_CONVERSATION: "crm.lead.conversation",
  PUBLIC_PROFILE: "public_profile.basic",

  // Standard and Enterprise
  CHATBOT_EMOTIONAL: "chatbot.emotional",
  CHATBOT_EMOTIONAL_QA: "chatbot.emotional.qa",
  CHATBOT_EMOTIONAL_TONE: "chatbot.emotional.emotion_tone",
  CALENDAR_INTEGRATION: "calendar.integration",
  CALENDAR_VIRTUAL_CONSULT: "calendar.virtual_consultations",
  LEADS_FOLLOWUP_AUTOMATED: "leads.followup.automated",
  DASHBOARD_ANALYTICS: "dashboard.analytics",
  WORKSPACE_ANALYTICS_PAGE: "workspace.analytics.page",
  REPORTS_AI_MONTHLY: "reports.ai_monthly",
  ASSISTANT_PROFESSIONAL: "assistant.professional",
  ASSISTANT_PROFESSIONAL_CLOSING: "assistant.professional.closing",
  ASSISTANT_PROFESSIONAL_FOLLOWUP: "assistant.professional.followup",
  LEADS_INSIGHTS_ADVANCED: "leads.insights.advanced",
  REFERRALS_MANUAL: "referrals.manual",
  REFERRALS_INVITES: "referrals.invites",
  PROFILE_ANALYTICS: "profile.analytics",
  PRO_CHAT: "prochat.messaging",
  PRO_CHAT_DM: "prochat.dm",
};

