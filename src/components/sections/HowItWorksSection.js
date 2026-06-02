"use client";

import { motion } from "framer-motion";
import { Target, Home, Brain, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Home,
    eyebrow: "Profile setup",
    title: "Share your goals",
    description:
      "Choose your role and add the core details Nesti needs to understand your market, clients, and priorities.",
  },
  {
    step: "02",
    icon: Brain,
    eyebrow: "AI routing",
    title: "Prioritize the right opportunities",
    description:
      "Lead intelligence, matching, and scoring help surface the people and next steps that deserve attention first.",
  },
  {
    step: "03",
    icon: TrendingUp,
    eyebrow: "Growth workflow",
    title: "Move faster with clarity",
    description:
      "Automated follow-ups, recommendations, and performance insights keep the pipeline organized from first touch to conversion.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-transparent py-10 md:py-12">
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
              <Target size={14} />
              Simple Process
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
            A cleaner path from{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              setup to growth
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
            Nesti turns onboarding, lead routing, and follow-up into a guided workflow
            built for modern real estate teams.
          </motion.p>
        </div>

        <div className="relative grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent md:block" />
          {steps.map((step, i) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={`step-${step.step}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                className="group relative"
                suppressHydrationWarning
              >
                <div className="relative h-full overflow-hidden rounded-2xl border border-border/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.045)] transition-all duration-300 hover:border-primary/25 hover:shadow-[0_16px_38px_rgba(15,23,42,0.075)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <IconComponent size={19} />
                    </div>
                    <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-black text-primary">
                      {step.step}
                    </span>
                  </div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    {step.eyebrow}
                  </p>
                  <h3 className="mb-2 text-lg font-black leading-tight text-text-heading">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-5 text-text-body">
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
