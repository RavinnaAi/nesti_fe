"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Star,
  CheckCircle2,
  Users,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function HeroSection() {
  const stats = [
    {
      label: "Active Professionals",
      value: "10K+",
      icon: Users,
    },
    { label: "Leads Generated", value: "500K+", icon: Target },
    { label: "Match Accuracy", value: "98%", icon: TrendingUp },
    { label: "Time Saved", value: "65%", icon: Clock },
  ];

  const trustFeatures = ["AI Matching", "24/7 Support", "Verified Platform"];

  const professionalImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  ];

  return (
    <section className="relative flex items-center overflow-hidden bg-transparent">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-6 py-8 md:py-10 lg:grid-cols-12 lg:gap-9">
          {/* Left Column - Content (7 columns) */}
          <div className="space-y-5 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
              suppressHydrationWarning
            >
              <Sparkles size={14} />
              AI-Powered Real Estate Intelligence Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-black leading-[1.08] tracking-tight text-text-heading md:text-4xl lg:text-[34px] lg:whitespace-nowrap"
              suppressHydrationWarning
            >
              Your Real Estate{" "}
              <span className="text-primary">
                Business on Autopilot.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl text-[16px] font-normal leading-7 text-text-heading/85 md:text-[18px] md:leading-8"
              suppressHydrationWarning
            >
              Meet Nesti, an all-in-one lead operations platform that qualifies
              prospects, scores intent from 0-100, and automates follow-ups
              24/7. Spend less time chasing cold leads and more time closing
              qualified deals across the USA and Canada.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-start gap-3 pt-1 sm:flex-row"
              suppressHydrationWarning
            >
              <Link
                href="#start"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Claim My Free Trial
                  <ArrowRight
                    size={18}
                    className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
              </Link>

              <Link
                href="/log-in"
                className="group relative inline-flex items-center justify-center rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text-heading shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background-light hover:shadow-md"
              >
                <span className="flex items-center gap-2">
                  See It In Action (1 Min)
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform duration-300"
                  />
                </span>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
              suppressHydrationWarning
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {professionalImages.map((imageUrl, i) => (
                    <div
                      key={`professional-${i}`}
                      className="relative h-9 w-9 overflow-hidden rounded-xl border-2 border-white shadow-md"
                    >
                      <Image
                        src={imageUrl}
                        alt={`Professional ${i + 1}`}
                        width={40}
                        height={40}
                        className="object-cover"
                        loading="lazy"
                        quality={75}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black text-text-heading">
                      10K+
                    </span>
                    <div className="flex gap-0.5 ml-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={`star-${i}`}
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-text-body">
                    Happy Professionals
                  </p>
                </div>
              </div>

              <div className="hidden h-9 w-px bg-border sm:block" />

              <div className="flex flex-wrap gap-4">
                {trustFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-text-heading">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats Overlay (5 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-5 relative"
            suppressHydrationWarning
          >
            <div className="grid w-full max-w-[19rem] gap-2 lg:ml-auto">
              {stats.map((stat, i) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={`stat-${stat.label}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    whileHover={{ y: -3 }}
                    className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border border-border/80 bg-white/95 px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition-all duration-300 hover:border-primary/25 hover:shadow-[0_14px_30px_rgba(15,23,42,0.075)]"
                    suppressHydrationWarning
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <IconComponent size={15} strokeWidth={1.9} />
                    </div>
                    <div className="flex min-w-0 items-baseline gap-2">
                      <div className="text-xl font-black leading-none tracking-tight text-primary-dark">
                        {stat.value}
                      </div>
                      <div className="whitespace-nowrap text-xs font-semibold leading-tight text-text-body">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
