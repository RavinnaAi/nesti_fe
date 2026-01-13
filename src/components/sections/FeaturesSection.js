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
      className="relative py-24 md:py-32 bg-gradient-to-b from-background-light/30 to-background"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="text-center mb-20 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            suppressHydrationWarning
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-primary bg-primary/10 text-primary mb-6">
              <Zap size={14} />
              Platform Capabilities
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-text-heading"
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
            className="text-lg md:text-2xl text-text-body max-w-3xl mx-auto leading-relaxed font-light tracking-wide"
            suppressHydrationWarning
          >
            A comprehensive suite of AI-powered tools designed to generate,
            qualify, and convert leads at unprecedented scale. Transform your
            real estate strategy with intelligent automation.
          </motion.p>
        </div>

        <div className="w-full relative">
          <div className="overflow-x-auto scrollbar-hide pb-4">
            <div className="flex gap-6 min-w-max md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-3">
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
                      y: -4,
                      transition: { duration: 0.3 },
                    }}
                    className="group relative h-full rounded-2xl p-8 bg-background border border-border transition-all duration-500 overflow-hidden min-w-[320px] md:min-w-0"
                    suppressHydrationWarning
                  >
                    {/* Hover Gradient Background */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
                    />

                    {/* Content Wrapper */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`w-16 h-16 rounded-2xl p-4 mb-6 bg-gradient-to-br ${feature.gradient} transition-all duration-500 group-hover:bg-white group-hover:shadow-lg group-hover:scale-110`}
                      >
                        <IconComponent className="w-full h-full text-white transition-colors duration-500 group-hover:text-gray-800" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-3 text-text-heading transition-colors duration-500 group-hover:text-white">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-text-body leading-relaxed transition-colors duration-500 group-hover:text-white/90">
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
