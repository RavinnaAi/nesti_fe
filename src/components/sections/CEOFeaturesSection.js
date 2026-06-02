"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Award } from "lucide-react";

// Generate logo URL helper function
const getLogoUrl = (domain) => {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "";
  return `https://img.logo.dev/${domain}?token=${token}&size=100&format=png&retina=true`;
};

const features = [
  {
    name: "Crunchbase",
    url: "https://www.crunchbase.com/person/ravinna-raveenthiran",
    category: "Professional Profile",
    domain: "crunchbase.com",
    gradient: "from-blue-500 to-blue-600",
    logo: getLogoUrl("crunchbase.com"),
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/ravinnaravi/",
    category: "Professional Profile",
    domain: "instagram.com",
    gradient: "from-pink-500 to-purple-600",
    logo: getLogoUrl("instagram.com"),
  },
  {
    name: "Wall Street Times",
    url: "https://wallstreettimes.com/how-ravinna-raveenthiran-rebuilt-nesti-and-herself/",
    category: "Article",
    domain: "wallstreettimes.com",
    gradient: "from-gray-700 to-gray-900",
    logo: getLogoUrl("wallstreettimes.com"),
  },
  {
    name: "Forbes",
    url: "https://www.forbes.com/councils/forbesbusinesscouncil/2025/09/25/the-real-opportunity-in-ai-building-businesses-that-truly-serve-people/",
    category: "Article",
    domain: "forbes.com",
    gradient: "from-blue-600 to-blue-800",
    logo: getLogoUrl("forbes.com"),
  },
  {
    name: "NY Weekly",
    url: "https://nyweekly.com/entrepreneur/how-ravinna-raveenthiran-rebuilt-nesti-and-redefined-its-future/",
    category: "Article",
    domain: "nyweekly.com",
    gradient: "from-red-600 to-red-800",
    logo: getLogoUrl("nyweekly.com"),
  },
  {
    name: "The US Times",
    url: "https://theustimes.com/from-adversity-to-innovation-how-ravinna-raveenthiran-is-revolutionizing-real-estate/?amp",
    category: "Article",
    domain: "theustimes.com",
    gradient: "from-indigo-600 to-indigo-800",
    logo: getLogoUrl("theustimes.com"),
  },
  {
    name: "CEO Feature",
    url: "https://ceofeature.com/queen-of-the-north-how-ravinna-raveenthiran-is-redefining-real-estate-with-resilience-and-compassion/",
    category: "Article",
    domain: "ceofeature.com",
    gradient: "from-amber-600 to-orange-600",
    logo: getLogoUrl("ceofeature.com"),
  },
  {
    name: "Finance Yahoo",
    url: "https://finance.yahoo.com/news/strategic-real-estate-solutions-unveiled-092000720.html",
    category: "Press Release",
    domain: "yahoo.com",
    gradient: "from-purple-600 to-purple-800",
    logo: getLogoUrl("yahoo.com"),
  },
  {
    name: "Digital Journal",
    url: "https://www.digitaljournal.com/pr/news/accesswire/strategic-real-estate-solutions-unveiled-1705781835.html",
    category: "Press Release",
    domain: "digitaljournal.com",
    gradient: "from-teal-600 to-teal-800",
    logo: getLogoUrl("digitaljournal.com"),
  },
  {
    name: "Market Business Insider",
    url: "https://markets.businessinsider.com/news/stocks/strategic-real-estate-solutions-unveiled-ravinna-raveenthiran-launches-nesti-transforming-the-property-market-landscape-1033746211",
    category: "Press Release",
    domain: "businessinsider.com",
    gradient: "from-green-600 to-green-800",
    logo: getLogoUrl("businessinsider.com"),
  },
  {
    name: "AP News",
    url: "https://apnews.com/press-release/accesswire/real-estate-1c9ddf73b1382f89c78c9af9d9ef6c90",
    category: "Press Release",
    domain: "apnews.com",
    gradient: "from-red-700 to-red-900",
    logo: getLogoUrl("apnews.com"),
  },
];

export default function CEOFeaturesSection() {
  const sliderItems = [...features, ...features];

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
              <Award size={14} aria-hidden="true" />
              CEO Recognition & Press Coverage
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
            Featured in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              Top Publications
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
            Our CEO and platform have been recognized by leading business
            publications and media outlets across North America.
          </motion.p>
        </div>

        <div className="relative overflow-hidden py-2">
          <div className="press-logo-track relative flex w-max items-stretch gap-4 py-2.5">
            {sliderItems.map((feature, index) => (
              <Link
                key={`feature-${feature.name}-${index}`}
                href={feature.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-56 w-[17.5rem] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/95 p-4 text-left ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:w-[18.5rem]"
                aria-label={`Read article about ${feature.name}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06] group-focus:opacity-[0.06]`}
                />

                <div className="relative z-10 mb-3 min-w-0">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black leading-5 text-text-heading transition-colors duration-200 group-hover:text-primary-dark">
                      {feature.name}
                    </h3>
                    <p className="mt-1 truncate text-xs font-medium text-text-muted">
                      {feature.domain}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex h-24 w-full items-center justify-center rounded-2xl bg-white px-5 py-4 ring-1 ring-border/65 transition-transform duration-300 group-hover:scale-[1.015]">
                  <Image
                    src={feature.logo}
                    alt={`${feature.name} logo`}
                    width={180}
                    height={80}
                    className="h-full max-h-16 w-full object-contain"
                    loading="lazy"
                    quality={70}
                    sizes="260px"
                  />
                </div>

                <div className="relative z-10 mt-auto flex items-center justify-between pt-3">
                  <span className="text-xs font-semibold text-text-body">
                    View coverage
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white">
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
