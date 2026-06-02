"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const subscriptionPlans = [
  {
    name: "Basic",
    price: "$150",
    period: "/month",
    description:
      "Essential AI real estate tools for professionals starting with a cleaner operating system.",
    features: [
      "Core AI workflow tools",
      "Lead and client organization",
      "Smart follow-up support",
      "Secure monthly Stripe billing",
    ],
    popular: false,
  },
  {
    name: "Standard",
    price: "$300",
    period: "/month",
    description:
      "A stronger plan for active professionals who need better automation, visibility, and client management.",
    features: [
      "Everything in Basic",
      "Advanced automation workflows",
      "Enhanced lead intelligence",
      "Priority growth tools",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$600",
    period: "/month",
    description:
      "Premium infrastructure for teams and high-volume businesses that need scalable AI support.",
    features: [
      "Everything in Standard",
      "Team-ready operating layer",
      "Expanded automation support",
      "Dedicated scaling infrastructure",
    ],
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
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
              <DollarSign size={14} />
              Transparent Pricing
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
            className="mx-auto max-w-2xl text-sm font-light leading-6 text-text-body md:text-base"
            suppressHydrationWarning
          >
            Transparent monthly subscriptions designed for modern real estate
            professionals, teams, and high-volume businesses.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <motion.div
              key={`plan-${plan.name}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              whileHover={{
                y: -4,
                transition: { duration: 0.25 },
              }}
              className={`group relative flex min-h-[23.5rem] flex-col overflow-hidden rounded-3xl border bg-white px-4 pb-4 pt-3 transition-all duration-300 ${
                plan.popular
                  ? "border-primary/35 shadow-[0_22px_55px_rgba(22,163,74,0.16)] ring-1 ring-primary/15"
                  : "border-border shadow-[0_14px_38px_rgba(15,23,42,0.055)] hover:border-primary/25 hover:shadow-[0_20px_48px_rgba(15,23,42,0.09)]"
              }`}
              suppressHydrationWarning
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary via-primary-dark to-primary"
                    : "bg-gradient-to-r from-primary/35 via-primary/20 to-transparent"
                }`}
              />
              <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-3xl transition-opacity duration-300 group-hover:opacity-80" />

              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md"
                  suppressHydrationWarning
                >
                  Popular
                </motion.div>
              )}

              <div className="relative z-10 mb-3 flex flex-grow flex-col">
                <div className={`mb-3 flex items-center gap-2.5 ${plan.popular ? "pr-20" : ""}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {plan.popular ? (
                      <Sparkles size={17} aria-hidden />
                    ) : (
                      <ShieldCheck size={17} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black leading-tight text-text-heading">
                      {plan.name}
                    </h3>
                  </div>
                </div>
                <p className="mb-3 min-h-[3rem] text-sm leading-5 text-text-body">
                  {plan.description}
                </p>
                <div className="mb-3 rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/45 p-3">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black tracking-tight text-primary md:text-4xl">
                    {plan.price}
                    </span>
                    <span className="mb-1.5 text-sm font-semibold text-text-muted">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <CreditCard size={13} className="text-primary" aria-hidden />
                    Recurring monthly billing
                  </p>
                </div>

                <ul className="mb-3 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={`feature-${plan.name}-${idx}`}
                      className="flex items-start gap-2.5 rounded-xl bg-background-light/50 px-3 py-1.5"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium leading-5 text-text-body">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/sign-up"
                className={`group/cta relative z-10 mt-auto block w-full overflow-hidden rounded-2xl py-2.5 text-center text-sm font-bold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg"
                    : "border border-border bg-white text-text-heading hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background-light hover:text-primary hover:shadow-md"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Subscription
                  <ArrowRight
                    size={17}
                    className="relative z-10 transition-transform duration-300 group-hover/cta:translate-x-1"
                  />
                </span>
                {plan.popular && (
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover/cta:translate-x-[100%] group-hover/cta:opacity-100"></div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
