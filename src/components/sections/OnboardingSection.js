"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCheck, Users, Scale, DollarSign, ArrowRight } from "lucide-react";

const userTypes = [
  {
    id: "realtor",
    title: "Realtor / Agent",
    description: "Generate quality leads and connect with ready-to-buy clients",
    icon: Users,
    gradient: "from-purple-500 to-pink-500",
    path: "/sign-up",
  },
  {
    id: "lawyer",
    title: "Real Estate Lawyer",
    description:
      "Connect with clients needing legal expertise for transactions",
    icon: Scale,
    gradient: "from-orange-500 to-red-500",
    path: "/sign-up",
  },
  {
    id: "broker",
    title: "Mortgage Broker",
    description: "Match with pre-qualified buyers needing financing",
    icon: DollarSign,
    gradient: "from-indigo-500 to-purple-500",
    path: "/sign-up",
  },
];

export default function OnboardingSection() {
  return (
    <section id="onboarding" className="relative bg-transparent py-10 md:py-12">
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
              <UserCheck size={14} aria-hidden="true" />
              Choose Your Path
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
            I am a{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              Real Estate...
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl text-sm leading-6 text-text-body md:text-base"
            suppressHydrationWarning
          >
            Select your role to get personalized AI assistance and perfect
            matches tailored to your goals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {userTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <motion.div
                key={`type-${type.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                suppressHydrationWarning
              >
                <Link
                  href={type.path}
                  className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`Get started as ${type.title}`}
                >
                  <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${type.gradient} p-2.5 shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg`}
                      >
                        <IconComponent className="h-full w-full text-white" aria-hidden="true" />
                      </div>
                      <h3 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-black leading-tight text-text-heading transition-colors group-hover:text-primary">
                        {type.title}
                      </h3>
                    </div>

                    <div className="flex-grow">
                      <p className="text-sm leading-5 text-text-body">
                        {type.description}
                      </p>
                    </div>

                    <div className="mt-3 flex translate-x-2 items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <span>Get Started</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
