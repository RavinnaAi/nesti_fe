/**
 * Copy defaults for public chat embeds by professional type.
 * All roles share the agent visual theme for consistent public profile chat styling.
 */

const KNOWN_ROLES = new Set(["agent", "lawyer", "mortgage_broker"]);

/** Normalize API / DB values so UI themes match (e.g. lawyer, mortgage_broker). */
export function normalizeWidgetRole(widgetRole) {
  const raw = String(widgetRole ?? "agent").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (raw === "mortgagebroker") return "mortgage_broker";
  if (KNOWN_ROLES.has(raw)) return raw;
  return "agent";
}

/** Short label for header badge (embed owner role). */
export function getWidgetRoleShortLabel(widgetRole) {
  const r = normalizeWidgetRole(widgetRole);
  if (r === "lawyer") return "Lawyer";
  if (r === "mortgage_broker") return "Mortgage broker";
  if (r === "agent") return "Agent";
  return "Assistant";
}

/** Accent tokens consumed by chat widget child components (step bar, buttons, bubbles, selects). */
const AGENT_ACCENT = {
  accentBg: "bg-primary",
  accentBgHover: "hover:brightness-95",
  accentBgLight: "bg-emerald-50",
  accentBgLighter: "bg-primary/10",
  accentText: "text-primary",
  accentTextBold: "text-emerald-800",
  accentBorder: "border-primary/20",
  accentRingFocus: "focus:ring-primary/25 focus:border-primary",
  accentSelectActive: "bg-primary/15 text-primary font-semibold",
  accentSelectHover: "hover:bg-primary/10 hover:text-primary",
  accentBadge: "bg-primary text-white",
  accentDot40: "bg-primary/40",
  accentDot60: "bg-primary/60",
  accentDotFull: "bg-primary",
  accentBulletList: "from-emerald-50/40",
};

const AGENT_PRESENTATION = {
  ...AGENT_ACCENT,
  headerClass: "flex items-center justify-between border-b border-border bg-white px-5 py-4",
  headerTitleClass: "font-semibold text-text-heading",
  headerSubtitleClass: "text-xs text-text-muted",
  headerRoleBadgeClass:
    "inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800",
  iconBubbleClass:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary",
  statusPillClass:
    "inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700",
  statusDotClass: "h-2 w-2 rounded-full bg-emerald-500",
  closeButtonClass: "rounded-lg p-2 text-text-heading transition hover:bg-background-light",
  launcherClass: "bg-primary hover:brightness-95",
};

export function getChatWidgetRolePresentation(widgetRole) {
  const r = normalizeWidgetRole(widgetRole);

  if (r === "mortgage_broker") {
    return {
      ...AGENT_PRESENTATION,
      defaultTitle: "Nesti AI – Mortgage",
      defaultSubtitle: "24/7 Mortgage Broker",
      defaultGreeting:
        "Hi! I'm here to help with financing questions, pre-approval, refinancing, and next steps. What would you like to know?",
      launcherAriaLabel: "Open mortgage assistant",
    };
  }
  if (r === "lawyer") {
    return {
      ...AGENT_PRESENTATION,
      defaultTitle: "Nesti AI – Legal",
      defaultSubtitle: "24/7 Real Estate Lawyer",
      defaultGreeting:
        "Hello! I can help with real estate closing questions, timelines, and scheduling. How can I assist you today?",
      launcherAriaLabel: "Open legal assistant",
    };
  }
  return {
    ...AGENT_PRESENTATION,
    defaultTitle: "Nesti AI",
    defaultSubtitle: "24/7 Real Estate Copilot",
    defaultGreeting: "Hello! How can I help with your real estate journey today?",
    launcherAriaLabel: "Open real estate chat",
  };
}
