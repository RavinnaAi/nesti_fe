"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.35 },
};

export function splitTitle(title, highlight) {
  if (!title || !highlight) return { before: "", match: "", after: "" };
  const idx = title.indexOf(highlight);
  if (idx === -1) return { before: "", match: "", after: "" };
  return {
    before: title.slice(0, idx).trim(),
    match: highlight,
    after: title.slice(idx + highlight.length).trim(),
  };
}

export function PageCta({
  compact = false,
  transparentSection = false,
  compactHeading = "Ready to grow with intelligent real estate tools?",
}) {
  if (compact) {
    return (
      <section className={`${transparentSection ? "bg-transparent" : "bg-white"} py-6 md:py-8`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/[0.045] blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-snug text-text-heading md:text-xl lg:text-[22px]">
                  {compactHeading}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-text-body md:text-[15px]">
                  Use Nesti AI to strengthen lead intelligence, automate repetitive workflows, and create smoother client experiences across your real estate business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Start Free Trial
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/log-in"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text-heading shadow-sm transition-all duration-300 hover:border-primary/30 hover:text-primary hover:shadow-md"
                >
                  Sign In
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="relative z-10 mx-auto mt-5 grid max-w-4xl gap-2 border-t border-border/70 pt-4 sm:grid-cols-3">
              {["3-day free trial", "AI-powered workflows", "USA & Canada"].map((t) => (
                <span
                  key={t}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-text-body"
                >
                  <CheckCircle2 size={14} className="text-primary" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-light to-primary-dark py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-1/2 h-64 w-64 rounded-full bg-white blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 md:px-8">
        <motion.div {...fadeUp} className="space-y-8">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md overflow-hidden">
            <Image
              src="/logo/logo.png"
              alt="Nesti AI logo"
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
            />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl">
            Ready to grow with
            <br />
            intelligent real estate tools?
          </h2>
          <p className="mx-auto max-w-2xl text-lg font-light text-white/90">
            Join professionals using Nesti AI for lead intelligence, automation, and client experiences built for the modern market.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
