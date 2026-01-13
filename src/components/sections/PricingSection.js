"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "$100",
    period: "/month",
    description: "Perfect for individual agents starting out",
    features: [
      "Up to 100 leads/month",
      "Basic AI chatbot",
      "Lead scoring (0-100)",
      "Email support",
      "Basic analytics dashboard",
      "1 user account",
      "Mobile app access",
    ],
    popular: false,
    gradient: "from-gray-600 to-gray-700",
  },
  {
    name: "Professional",
    price: "$150",
    period: "/month",
    description: "For growing teams and agencies",
    features: [
      "Up to 500 leads/month",
      "Advanced AI chatbot network",
      "Smart matching algorithm",
      "Priority email & chat support",
      "Advanced analytics & insights",
      "Up to 5 user accounts",
      "Automated follow-ups",
      "Custom branding",
      "API access",
    ],
    popular: true,
    gradient: "from-primary to-primary-dark",
  },
  {
    name: "Premium",
    price: "$300",
    period: "/month",
    description: "Enterprise-grade for top performers",
    features: [
      "Unlimited leads",
      "Full AI assistant network",
      "Premium matching & routing",
      "24/7 phone & priority support",
      "White-label solution",
      "Unlimited user accounts",
      "Custom integrations",
      "Dedicated account manager",
      "Advanced reporting & BI",
      "Custom AI training",
    ],
    popular: false,
    gradient: "from-purple-600 to-pink-600",
  },
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
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
              <DollarSign size={14} />
              Transparent Pricing
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
            Choose Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              Perfect Plan
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
            Flexible pricing options designed to scale with your business. All
            plans include 14-day free trial.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={`plan-${plan.name}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3 },
              }}
              className={`relative flex flex-col rounded-3xl p-10 border bg-background transition-all duration-300 ${
                plan.popular
                  ? "shadow-xl md:scale-105 border-2 border-primary"
                  : "shadow-sm border-border hover:border-primary/50"
              }`}
              suppressHydrationWarning
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-5 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full text-xs font-bold text-white shadow-lg bg-gradient-to-r from-primary to-primary-dark"
                  suppressHydrationWarning
                >
                  Most Popular
                </motion.div>
              )}

              <div className="text-center mb-10 flex-grow flex flex-col">
                <h3 className="text-2xl md:text-3xl font-black mb-3 text-text-heading">
                  {plan.name}
                </h3>
                <p className="text-text-body text-sm mb-8">
                  {plan.description}
                </p>
                <div className="flex items-end justify-center gap-1 mb-10">
                  <span className="text-5xl md:text-6xl font-black text-primary">
                    {plan.price}
                  </span>
                  <span className="text-text-muted text-lg mb-2">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-10 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={`feature-${plan.name}-${idx}`} className="flex items-start gap-3">
                      <Check
                        size={20}
                        className="mt-0.5 flex-shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-text-body leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/sign-up"
                className={`group relative block w-full rounded-xl py-4 text-center font-bold text-base transition-all mt-auto overflow-hidden ${
                  plan.popular
                    ? "text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary-dark"
                    : "border-2 border-border text-text-heading hover:bg-background-light hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Free Trial
                  {plan.popular && (
                    <ArrowRight
                      size={18}
                      className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                    />
                  )}
                </span>
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.3 }}
          className="text-center text-text-muted mt-12"
          suppressHydrationWarning
        >
          All plans include 14-day free trial • No credit card required • Cancel
          anytime
        </motion.p>
      </div>
    </section>
  );
}
