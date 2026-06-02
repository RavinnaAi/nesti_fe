"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  UserCheck,
  BarChart3,
  MessageCircle,
  Bell,
  LineChart,
  Search,
  Target,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Lead Scoring (0-100)",
    description:
      "AI analyzes behavior, budget readiness, timeline urgency, and engagement to score every lead, helping you prioritize hot prospects automatically.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: UserCheck,
    title: "Intelligent Matching",
    description:
      "Match buyers with sellers, agents with clients based on personality, preferences, specialization, location, and communication style.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Beautiful dashboards showing engagement rates, conversion metrics, lead quality scores, and ROI with actionable insights.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Chatbot Network",
    description:
      "Multiple specialized conversational AI agents capture lead details, answer questions, qualify prospects, and book appointments round the clock.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Bell,
    title: "Automated Lead Nurturing",
    description:
      "Send personalized content, follow-ups, market updates, and property recommendations based on lead behavior and preferences.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: LineChart,
    title: "Performance Insights",
    description:
      "Detailed reports on agent performance, lead sources, conversion funnels, and market trends to optimize your strategy.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Search,
    title: "Advanced Lead Qualification",
    description:
      "Automatically assess pre-approval status, budget range, timeline, motivation level, and decision-making stage for every lead.",
    gradient: "from-teal-500 to-green-500",
  },
  {
    icon: Target,
    title: "Professional Routing",
    description:
      "Intelligently route leads to the most suitable agents, brokers, and lawyers based on expertise, location, and historical performance.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "USA & Canada Coverage",
    description:
      "Comprehensive market insights, professional networks, and localized intelligence across all major cities and regions.",
    gradient: "from-red-500 to-pink-500",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-transparent py-10 md:py-12"
    >
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
              <Zap size={14} />
              Platform Capabilities
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
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              Unlock Market Dominance
            </span>
            <br />
            <span className="text-text-heading">with NestiAI</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl text-sm font-light leading-6 text-text-body md:text-base"
            suppressHydrationWarning
          >
            A comprehensive suite of AI-powered tools designed to generate,
            qualify, and convert leads at unprecedented scale. Transform your
            real estate strategy with intelligent automation.
          </motion.p>
        </div>

        <div className="w-full relative">
          <div className="overflow-x-auto scrollbar-hide pb-4">
            <div className="flex min-w-max gap-3 md:grid md:min-w-0 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={`feature-${feature.title}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.3 }}
                    whileHover={{
                      y: -3,
                      transition: { duration: 0.25 },
                    }}
                    className="group relative h-full min-w-[270px] !overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md md:min-w-0"
                    suppressHydrationWarning
                  >
                    {/* Hover Gradient Background */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />

                    {/* Content Wrapper */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`mb-3 h-10 w-10 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 transition-all duration-300 group-hover:scale-105 group-hover:bg-white group-hover:shadow-lg`}
                      >
                        <IconComponent className="w-full h-full text-white transition-colors duration-500 group-hover:text-gray-800" />
                      </div>

                      {/* Title */}
                      <h3 className="mb-1.5 text-[17px] font-black text-text-heading transition-colors duration-300 group-hover:text-white">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm leading-5 text-text-body transition-colors duration-300 group-hover:text-white/90">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
