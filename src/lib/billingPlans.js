const PLAN_MARKETING = {
  basic: {
    description:
      "Core workspace access for professionals who need lead capture, basic CRM, and manual follow-up.",
    features: [
      "Basic chatbot and lead capture",
      "Lead scoring, classification, and CRM list",
      "Up to 50 captured leads",
      "Manual nurture emails (up to 50)",
      "1:1 professional conversations",
      "Notes, referrals, and client management",
    ],
    popular: false,
    tags: [],
  },
  standard: {
    description:
      "Advanced workflows for active professionals using automation, insights, calendar, and referrals.",
    features: [
      "Everything in Basic with up to 150 leads per month",
      "Bulk follow-up workspace (up to 500 emails)",
      "Calendly calendar integration",
      "Advanced lead insights and conversation transcript",
      "Analytics, web page, and AI assistant tools",
      "Group pro chat and referral invite links",
    ],
    popular: true,
    tags: ["Most Popular"],
  },
  enterprise: {
    description:
      "Highest capacity for teams and high-volume professionals using the full existing Nesti workspace.",
    features: [
      "Everything in Standard",
      "Higher chatbot conversation capacity",
      "Higher lead capture capacity",
      "Higher AI assistant and report capacity",
      "Higher nurture and follow-up capacity",
      "Higher referral and analytics capacity",
    ],
    popular: false,
    tags: [],
  },
};

export function mapApiPlanToUi(plan) {
  if (!plan) return null;

  const planKey = String(plan.plan_key || "").trim().toLowerCase();
  const marketing = PLAN_MARKETING[planKey] || {};

  return {
    plan_key: planKey,
    name: plan.name || planKey,
    price: plan.display_amount || "$0",
    period: plan.interval === "month" ? "/month" : `/${plan.interval || "month"}`,
    amount: plan.amount ?? 0,
    currency: plan.currency || "usd",
    stripe_price_configured: Boolean(plan.stripe_price_configured),
    description: marketing.description || "",
    features: marketing.features || [],
    popular: Boolean(marketing.popular),
    tags: marketing.tags || [],
    gradient: "from-primary to-primary-dark",
  };
}

export function mapApiPlansToUi(plans = []) {
  return plans.map(mapApiPlanToUi).filter(Boolean);
}

export function sortPlansForDisplay(plans = []) {
  if (!plans.length) return [];

  const priceValue = (plan) => {
    if (typeof plan?.amount === "number") return plan.amount;
    const numeric = Number(String(plan?.price || "").replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const popularPlan = plans.find((plan) => plan?.popular) || null;
  const otherPlans = plans.filter((plan) => plan !== popularPlan);
  const sortedOthers = otherPlans.sort((a, b) => priceValue(a) - priceValue(b));

  if (!popularPlan) return sortedOthers;
  if (sortedOthers.length <= 1) return [...sortedOthers, popularPlan];

  const [lower, ...higher] = sortedOthers;
  return [lower, popularPlan, ...higher];
}

export function planLabel(planKey) {
  const key = String(planKey || "").trim().toLowerCase();
  if (key === "basic") return "Basic";
  if (key === "standard") return "Standard";
  if (key === "enterprise") return "Enterprise";
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown";
}

export function getPlanKey(plan) {
  if (!plan) return "";
  if (plan.plan_key) return plan.plan_key;

  const name = String(plan.name || "").trim().toLowerCase();
  if (name.includes("basic")) return "basic";
  if (name.includes("standard")) return "standard";
  if (name.includes("enterprise")) return "enterprise";
  return "";
}

export function findPlanByKey(plans = [], planKey) {
  const key = String(planKey || "").trim().toLowerCase();
  if (!key) return null;
  return plans.find((plan) => getPlanKey(plan) === key) || null;
}

const PLAN_TIER_ORDER = {
  basic: 1,
  standard: 2,
  enterprise: 3,
};

export function getPlanTier(planKey) {
  return PLAN_TIER_ORDER[String(planKey || "").trim().toLowerCase()] || 0;
}

export function getPlanSwitchLabel(currentPlanKey, targetPlanKey) {
  const currentTier = getPlanTier(currentPlanKey);
  const targetTier = getPlanTier(targetPlanKey);
  if (!currentTier || !targetTier || currentTier === targetTier) return "Switch plan";
  return targetTier > currentTier ? "Upgrade" : "Downgrade";
}
