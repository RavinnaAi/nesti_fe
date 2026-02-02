"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-primary-light to-primary-dark">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
          suppressHydrationWarning
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            Ready to Transform Your
            <br />
            Real Estate Business?
          </h2>
          <p className="text-lg md:text-xl text-white/95 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of real estate professionals who are generating more
            leads, closing more deals, and growing faster with Nesti AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="#onboarding"
              className="group relative rounded-md px-10 py-4 text-base font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 flex items-center gap-2 bg-white text-primary border-2 border-transparent hover:border-primary/50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10"></div>

              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                  aria-hidden="true"
                />
              </span>
            </Link>

            <Link
              href="#features"
              className="group relative rounded-md px-10 py-4 text-base font-semibold transition-all border-2 border-white/50 hover:bg-white/10 hover:border-white/70 flex items-center gap-2 text-white backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            >
              <span className="flex items-center gap-2">
                Learn More
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-0.5 transition-transform duration-300"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
