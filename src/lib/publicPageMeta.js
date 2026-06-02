import {
  Sparkles,
  Target,
  BookOpen,
  Shield,
  Scale,
  HelpCircle,
  Building2,
} from "lucide-react";

/** Per-slug UI metadata (icons, badges, hero accents) */
export const PUBLIC_PAGE_META = {
  about: {
    badge: "Our Story",
    Icon: Building2,
    gradient: "from-emerald-500 to-green-600",
    highlight: "Nesti",
    summary: [
      "AI-powered real estate ecosystem",
      "Built for modern professionals",
      "Unified lead and growth infrastructure",
    ],
  },
  mission: {
    badge: "Purpose",
    Icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    highlight: "Mission",
    summary: [
      {
        title: "Lead Intelligence",
        description: "Smarter lead qualification for buyers, sellers, and real estate opportunities.",
      },
      {
        title: "Workflow Automation",
        description: "Human-centered automation for follow-ups, nurturing, and daily operational tasks.",
      },
      {
        title: "Client Experience",
        description: "Better communication and smoother guidance across the full real estate journey.",
      },
    ],
  },
  blog: {
    badge: "Insights Hub",
    Icon: BookOpen,
    gradient: "from-indigo-500 to-purple-500",
    highlight: "Journal",
    summary: [
      "AI, real estate, and growth insights",
      "Market intelligence for professionals",
      "Product and ecosystem updates",
    ],
  },
  terms: {
    badge: "Legal Terms",
    Icon: Scale,
    gradient: "from-slate-600 to-slate-800",
    highlight: "Use",
    summary: [
      "Responsible platform access",
      "Professional obligations",
      "AI and subscription terms",
    ],
  },
  privacy: {
    badge: "Trust",
    Icon: Shield,
    gradient: "from-teal-500 to-green-500",
    highlight: "Policy",
    summary: [
      "Transparent data practices",
      "Responsible AI processing",
      "Security and privacy commitments",
    ],
  },
  faq: {
    badge: "Support",
    Icon: HelpCircle,
    gradient: "from-violet-500 to-purple-500",
    highlight: "Questions",
    summary: [
      "Common platform answers",
      "AI, security, and trial details",
      "Who Nesti is built for",
    ],
  },
};

export function getPublicPageMeta(slug) {
  return PUBLIC_PAGE_META[slug] || {
    badge: "Nesti AI",
    Icon: Sparkles,
    gradient: "from-primary to-primary-dark",
    highlight: null,
    summary: [
      "Modern real estate infrastructure",
      "AI-powered workflows",
      "Built for professionals",
    ],
  };
}
