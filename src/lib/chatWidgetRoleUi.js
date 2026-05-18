/**
 * Visual + copy defaults for public chat embeds by professional type.
 * Aligns with node-backend index.html / mortgage-broker.html / lawyer.html headers.
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
const ROLE_ACCENT = {
  agent: {
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
  },
  lawyer: {
    accentBg: "bg-indigo-600",
    accentBgHover: "hover:bg-indigo-700",
    accentBgLight: "bg-indigo-50",
    accentBgLighter: "bg-indigo-600/10",
    accentText: "text-indigo-600",
    accentTextBold: "text-indigo-800",
    accentBorder: "border-indigo-600/20",
    accentRingFocus: "focus:ring-indigo-500/25 focus:border-indigo-500",
    accentSelectActive: "bg-indigo-600/15 text-indigo-700 font-semibold",
    accentSelectHover: "hover:bg-indigo-600/10 hover:text-indigo-700",
    accentBadge: "bg-indigo-600 text-white",
    accentDot40: "bg-indigo-400/40",
    accentDot60: "bg-indigo-400/60",
    accentDotFull: "bg-indigo-500",
    accentBulletList: "from-indigo-50/40",
  },
  mortgage_broker: {
    accentBg: "bg-teal-600",
    accentBgHover: "hover:bg-teal-700",
    accentBgLight: "bg-teal-50",
    accentBgLighter: "bg-teal-600/10",
    accentText: "text-teal-700",
    accentTextBold: "text-teal-800",
    accentBorder: "border-teal-600/20",
    accentRingFocus: "focus:ring-teal-500/25 focus:border-teal-500",
    accentSelectActive: "bg-teal-600/15 text-teal-700 font-semibold",
    accentSelectHover: "hover:bg-teal-600/10 hover:text-teal-700",
    accentBadge: "bg-teal-600 text-white",
    accentDot40: "bg-teal-400/40",
    accentDot60: "bg-teal-400/60",
    accentDotFull: "bg-teal-500",
    accentBulletList: "from-teal-50/40",
  },
};

export function getChatWidgetRolePresentation(widgetRole) {
  const r = normalizeWidgetRole(widgetRole);
  const accent = ROLE_ACCENT[r] || ROLE_ACCENT.agent;

  if (r === "mortgage_broker") {
    return {
      ...accent,
      defaultTitle: "Nesti AI – Mortgage",
      defaultSubtitle: "24/7 Mortgage Lead Assistant",
      defaultGreeting:
        "Hi! I'm here to help with financing questions, pre-approval, refinancing, and next steps. What would you like to know?",
      headerClass:
        "border-b border-teal-900/25 bg-teal-950 bg-gradient-to-r from-teal-800 via-teal-900 to-teal-950 px-5 py-4 flex items-center justify-between text-white",
      headerTitleClass: "text-base font-semibold !text-white",
      headerSubtitleClass: "text-xs !text-teal-100",
      headerRoleBadgeClass:
        "inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide !text-white/95",
      iconBubbleClass:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 !text-white ring-1 ring-white/20",
      statusPillClass:
        "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] !text-teal-100",
      statusDotClass: "h-2 w-2 rounded-full bg-emerald-400",
      closeButtonClass: "rounded-lg p-2 !text-white transition hover:bg-white/10",
      launcherClass: "bg-teal-600 hover:bg-teal-700",
      launcherAriaLabel: "Open mortgage assistant",
    };
  }
  if (r === "lawyer") {
    return {
      ...accent,
      defaultTitle: "Nesti AI – Legal",
      defaultSubtitle: "24/7 Real Estate Closing Assistant",
      defaultGreeting:
        "Hello! I can help with real estate closing questions, timelines, and scheduling. How can I assist you today?",
      headerClass:
        "border-b border-indigo-900/25 bg-indigo-950 bg-gradient-to-r from-indigo-800 via-indigo-900 to-indigo-950 px-5 py-4 flex items-center justify-between text-white",
      headerTitleClass: "text-base font-semibold !text-white",
      headerSubtitleClass: "text-xs !text-indigo-100",
      headerRoleBadgeClass:
        "inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide !text-white/95",
      iconBubbleClass:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 !text-white ring-1 ring-white/20",
      statusPillClass:
        "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] !text-indigo-100",
      statusDotClass: "h-2 w-2 rounded-full bg-emerald-400",
      closeButtonClass: "rounded-lg p-2 !text-white transition hover:bg-white/10",
      launcherClass: "bg-indigo-600 hover:bg-indigo-700",
      launcherAriaLabel: "Open legal assistant",
    };
  }
  return {
    ...accent,
    defaultTitle: "Nesti AI",
    defaultSubtitle: "24/7 Real Estate Copilot",
    defaultGreeting: "Hello! How can I help with your real estate journey today?",
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
    launcherAriaLabel: "Open real estate chat",
  };
}
