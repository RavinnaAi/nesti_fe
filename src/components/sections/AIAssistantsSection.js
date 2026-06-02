"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Home,
  Building2,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const assistants = [
  {
    name: "Buyer Assistant",
    role: "Lead Qualification Expert",
    description:
      "Understands buyer needs, captures contact details, qualifies financing status, and matches with perfect agents and brokers.",
    icon: Home,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Property preference analysis",
      "Budget & timeline qualification",
      "Pre-approval status check",
      "Agent matching & scheduling",
    ],
  },
  {
    name: "Seller Assistant",
    role: "Property Marketing Specialist",
    description:
      "Gathers property details, understands selling goals, provides market insights, and connects with top-performing local agents.",
    icon: Building2,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Property valuation guidance",
      "Timeline & motivation analysis",
      "Agent performance matching",
      "Free market analysis setup",
    ],
  },
  {
    name: "Professional Matcher",
    role: "Smart Connection Engine",
    description:
      "Analyzes user needs and intelligently matches with agents, brokers, and lawyers based on expertise, location, and performance.",
    icon: HeartHandshake,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Multi-factor matching algorithm",
      "Professional profile presentation",
      "Consultation scheduling",
      "Engagement tracking",
    ],
  },
  {
    name: "General Assistant",
    role: "Platform Navigation Guide",
    description:
      "Routes users to specialized bots, answers platform questions, provides market insights, and captures initial lead information.",
    icon: MessageSquare,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Intelligent routing",
      "Service explanation",
      "Market insights for USA/Canada",
      "Lead capture & qualification",
    ],
  },
  {
    name: "Follow-Up Assistant",
    role: "Relationship Nurturing Pro",
    description:
      "Re-engages cold leads, provides market updates, checks situation changes, and moves leads through the conversion funnel.",
    icon: RefreshCw,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Automated re-engagement",
      "Personalized market updates",
      "Status change detection",
      "Conversion optimization",
    ],
  },
  {
    name: "Analytics Engine",
    role: "Intelligence & Insights",
    description:
      "Tracks all interactions, scores leads 0-100, generates performance reports, and provides actionable insights for professionals.",
    icon: BarChart3,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Advanced lead scoring",
      "Performance analytics",
      "Conversion tracking",
      "ROI measurement",
    ],
  },
];

export default function AIAssistantsSection() {
  return (
    <section className="relative bg-transparent py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-9">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            suppressHydrationWarning
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Bot size={14} />
              AI-Powered Assistant Network
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="mb-2.5 text-2xl font-black leading-tight text-text-heading md:text-3xl lg:text-4xl"
            suppressHydrationWarning
          >
            Meet Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              AI Dream Team
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl text-sm font-light leading-6 text-text-body md:text-base"
            suppressHydrationWarning
          >
            Multiple specialized AI agents working 24/7 to qualify leads, match
            connections, and nurture relationships throughout the entire real
            estate journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => {
            const IconComponent = assistant.icon;
            return (
              <motion.article
                key={`assistant-${assistant.name}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                className="group relative h-full rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md"
                suppressHydrationWarning
              >
                {/* Icon */}
                <div
                  className={`mb-3 h-10 w-10 rounded-xl bg-gradient-to-br ${assistant.gradient} p-2.5 shadow-md transition-transform duration-300 group-hover:scale-105`}
                >
                  <IconComponent className={`w-full h-full text-white `} />
                </div>

                {/* Content */}
                <div className="space-y-2.5">
                  <div>
                    <h3 className="mb-1 text-lg font-black text-text-heading">
                      {assistant.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {assistant.role}
                    </p>
                  </div>

                  <p className="text-sm leading-5 text-text-body">
                    {assistant.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 border-t border-border pt-2.5">
                    {assistant.features.map((feature) => (
                      <div
                        key={`${assistant.name}-${feature}`}
                        className="flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="text-sm leading-5 text-text-body">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
