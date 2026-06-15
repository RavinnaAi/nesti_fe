"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  MessageCircle,
  Bell,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Lead Scoring",
    description:
      "Instantly ranks lead intent on a scale of 0-100 so you always know exactly who to call first.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "24/7 Chatbot Network",
    description:
      "Captures, qualifies, and schedules client meetings around the clock, even while you sleep.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Bell,
    title: "Automated Nurture Engines",
    description:
      "Replaces boring, generic drip emails with hyper-personalized, behavior-based follow-ups.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Shield,
    title: "Cross-Border Intelligence",
    description:
      "Fully integrated and compliant with localized real estate data across both the USA and Canada.",
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
              Core Capabilities
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
            Core Capabilities
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
            <div className="flex min-w-max gap-3 md:grid md:min-w-0 md:grid-cols-2 xl:grid-cols-4">
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
                    className="group relative h-full min-w-[250px] !overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md md:min-w-0"
                    suppressHydrationWarning
                  >
                    {/* Hover Gradient Background */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />

                    {/* Content Wrapper */}
                    <div className="relative z-10">
                      {/* Icon + Title */}
                      <div className="mb-2.5 flex items-center gap-2.5">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${feature.gradient} p-2 transition-all duration-300 group-hover:scale-105 group-hover:bg-white group-hover:shadow-lg`}
                        >
                          <IconComponent className="h-full w-full text-white transition-colors duration-500 group-hover:text-gray-800" />
                        </div>
                        <h3 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-black leading-tight text-text-heading transition-colors duration-300 group-hover:text-white md:text-[14px]">
                          {feature.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-[13px] leading-5 text-text-body transition-colors duration-300 group-hover:text-white/90">
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
