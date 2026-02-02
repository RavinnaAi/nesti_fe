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
    <section id="onboarding" className="relative py-24 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            suppressHydrationWarning
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs md:text-sm font-semibold border border-primary bg-primary/10 text-primary mb-6">
              <UserCheck size={16} aria-hidden="true" />
              Choose Your Path
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.3 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-text-heading"
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
            className="text-lg md:text-xl text-text-body max-w-3xl mx-auto leading-relaxed"
            suppressHydrationWarning
          >
            Select your role to get personalized AI assistance and perfect
            matches tailored to your goals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {userTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <motion.div
                key={`type-${type.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                suppressHydrationWarning
              >
                <Link
                  href={type.path}
                  className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
                  aria-label={`Get started as ${type.title}`}
                >
                  <div className="group relative rounded-md p-8 border border-border bg-background shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
                    <div
                      className={`w-16 h-16 rounded-md bg-gradient-to-br ${type.gradient} p-4 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg`}
                    >
                      <IconComponent className="w-full h-full text-white" aria-hidden="true" />
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-3 text-text-heading group-hover:text-primary transition-colors">
                        {type.title}
                      </h3>
                      <p className="text-sm text-text-body leading-relaxed">
                        {type.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
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
