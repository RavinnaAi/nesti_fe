import { FEATURES } from "@/constants/features";

/** Nav item id → required feature (any one if array). Omit = always visible. */
export const NAV_FEATURE_MAP = Object.freeze({
  analytics: FEATURES.WORKSPACE_ANALYTICS_PAGE,
  "public-profile": FEATURES.PUBLIC_PROFILE,
  calendar: FEATURES.CALENDAR_INTEGRATION,
});

export const HEADER_FEATURE_LINKS = Object.freeze({
  "web-page": FEATURES.PUBLIC_PROFILE,
  calendar: FEATURES.CALENDAR_INTEGRATION,
});
