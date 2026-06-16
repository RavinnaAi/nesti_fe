"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
} from "lucide-react";

const assistants = [
  {
    name: "Buyer Assistant: The Lead Qualifier",
    role: "Lead Qualification Expert",
    description:
      "Stops you from wasting time on window-shoppers. It automatically qualifies buyer budgets, timelines, and pre-approval status before they ever reach your inbox.",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Property preference analysis",
      "Budget & timeline qualification",
      "Pre-approval status check",
      "Agent matching & scheduling",
    ],
  },
  {
    name: "Seller Assistant: The Listing Magnet",
    role: "Property Marketing Specialist",
    description:
      "Instantly engages potential sellers. It gathers property data, handles initial valuation discussions, and hooks clients with localized market trends.",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Property valuation guidance",
      "Timeline & motivation analysis",
      "Agent performance matching",
      "Free market analysis setup",
    ],
  },
  {
    name: "Follow-Up Assistant: The Ghost-Buster",
    role: "Relationship Nurturing Pro",
    description:
      "Wakes up your dead database. It continuously nurtures cold leads with personalized SMS and email updates until they are ready to transact.",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Automated re-engagement",
      "Personalized market updates",
      "Status change detection",
      "Conversion optimization",
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
              <Image
                src="/logo/logo.png"
                alt="Nesti AI logo"
                width={14}
                height={14}
                className="h-[14px] w-[14px] object-contain"
              />
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
            className="mx-auto max-w-2xl text-[15px] font-normal leading-7 text-text-heading/85 md:text-[17px] md:leading-8"
            suppressHydrationWarning
          >
            Multiple specialized AI agents working 24/7 to qualify leads, match
            connections, and nurture relationships throughout the entire real
            estate journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => {
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
                {/* Content */}
                <div className="space-y-2.5">
                  <div>
                    <h3 className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-black text-text-heading md:text-base">
                      {assistant.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {assistant.role}
                    </p>
                  </div>

                  <p className="text-[15px] leading-6 text-text-heading/80">
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
                        <span className="text-[14px] leading-6 text-text-heading/80">
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
