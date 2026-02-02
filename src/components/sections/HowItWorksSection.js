"use client";

import { motion } from "framer-motion";
import { Target, Home, Brain, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Home,
    title: "Create Your Profile",
    description:
      "Tell us about yourself - buyer, seller, realtor, lawyer, or broker. Our AI learns your preferences, goals, and requirements in minutes.",
  },
  {
    step: "02",
    icon: Brain,
    title: "AI Matches & Scores",
    description:
      "Our intelligent system analyzes your profile, scores leads 0-100, and matches you with perfect partners based on sophisticated compatibility algorithms.",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Close More Deals",
    description:
      "Get actionable insights, automated follow-ups, personalized recommendations, and real-time analytics to close deals 65% faster.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="text-center mb-20 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            suppressHydrationWarning
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold border border-primary bg-primary/10 text-primary mb-6">
              <Target size={14} />
              Simple Process
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
            Get Started in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              3 Easy Steps
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="text-xl md:text-2xl text-text-body max-w-3xl mx-auto leading-relaxed font-light"
            suppressHydrationWarning
          >
            From onboarding to closing deals, our AI handles the heavy lifting
            while you focus on what matters most.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {steps.map((step, i) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={`step-${step.step}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="relative"
                suppressHydrationWarning
              >
                <div className="rounded-md p-10 border border-border h-full bg-background transition-all duration-300 hover:border-primary">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-md grid place-items-center shadow-lg flex-shrink-0 bg-gradient-to-br from-primary to-primary-dark text-white">
                      <IconComponent size={28} />
                    </div>
                    <span className="text-6xl font-black opacity-10 text-primary">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-text-heading">
                    {step.title}
                  </h3>
                  <p className="text-text-body leading-relaxed text-base">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
