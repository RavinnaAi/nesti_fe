"use client";

import { motion } from "framer-motion";
import { DollarSign, Loader2 } from "lucide-react";
import PricingPlanCard from "@/components/billing/PricingPlanCard";
import { useBillingPlans } from "@/hooks/useBillingApi";
import { sortPlansForDisplay } from "@/lib/billingPlans";

export default function PricingSection() {
  const { data: plans = [], isLoading } = useBillingPlans();
  const displayPlans = sortPlansForDisplay(plans);

  return (
    <section id="pricing" className="relative bg-transparent py-10 md:py-12">
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-stretch">
            {displayPlans.map((plan) => (
              <motion.div
                key={`plan-${plan.plan_key}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="flex flex-1 min-w-0"
                suppressHydrationWarning
              >
                <PricingPlanCard
                  plan={plan}
                  cta={{
                    type: "link",
                    href: "/sign-up",
                    label: "Start Subscription",
                    showArrow: true,
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
