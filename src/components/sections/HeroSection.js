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
    <section className="relative min-h-[90vh] md:min-h-[95vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-background-light/30 to-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-5 bg-primary" />
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-20 md:py-28">
          {/* Left Column - Content (7 columns) */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-primary bg-primary/10 text-primary"
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
              className="text-5xl md:text-6xl lg:text-6xl font-black leading-[1.05] tracking-tight text-text-heading"
              suppressHydrationWarning
            >
              Transform Real Estate
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
                With AI Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="text-lg md:text-xl text-text-body leading-relaxed max-w-2xl font-light"
              suppressHydrationWarning
            >
              Complete AI-powered platform featuring intelligent lead scoring,
              smart matching, multi-agent chatbots, and automated follow-ups for
              buyers, sellers, and real estate professionals across USA &
              Canada.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4 pt-2"
              suppressHydrationWarning
            >
              <Link
                href="#start"
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-10 py-5 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] overflow-hidden bg-gradient-to-r from-primary to-primary-dark"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight
                    size={18}
                    className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
              </Link>

              <Link
                href="/log-in"
                className="group relative inline-flex items-center justify-center px-10 py-5 text-base font-semibold rounded-xl text-text-heading bg-background border-2 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/50 hover:bg-background-light"
              >
                <span className="flex items-center gap-2">
                  Watch Demo
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
              className="flex flex-wrap items-center gap-8 pt-8"
              suppressHydrationWarning
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {professionalImages.map((imageUrl, i) => (
                    <div
                      key={`professional-${i}`}
                      className="relative w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden"
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
                    <span className="text-2xl font-black text-text-heading">
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

              <div className="hidden sm:block h-10 w-px bg-border" />

              <div className="flex flex-wrap gap-6">
                {trustFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-primary" />
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
            <div className="grid grid-cols-2 gap-5">
              {stats.map((stat, i) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={`stat-${stat.label}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300"
                    suppressHydrationWarning
                  >
                    <div className="w-12 h-12 rounded-xl grid place-items-center mb-4 bg-primary/10 text-primary">
                      <IconComponent size={24} />
                    </div>
                    <div className="text-3xl md:text-4xl font-black mb-1 text-primary-dark">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-text-body">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
    </section>
  );
}
