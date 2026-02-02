"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

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

  return (
    <section className="relative py-24 md:py-32 bg-background">
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
              <Award size={16} aria-hidden="true" />
              CEO Recognition & Press Coverage
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
            className="text-lg md:text-xl text-text-body max-w-3xl mx-auto leading-relaxed"
            suppressHydrationWarning
          >
            Our CEO and platform have been recognized by leading business
            publications and media outlets across North America.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <Link
              key={`feature-${feature.name}-${index}`}
              href={feature.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              aria-label={`Read article about ${feature.name}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{
                  y: -6,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileFocus={{
                  y: -6,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                className="group relative rounded-md p-4 border border-border bg-background hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center text-center cursor-pointer h-full"
                suppressHydrationWarning
              >
                {/* Hover Gradient Background */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 rounded-md bg-gradient-to-br ${feature.gradient}`}
                />

                {/* Logo Image */}
                <div className="w-10 h-10 mb-4 relative z-10 flex items-center justify-center">
                  <Image
                    src={feature.logo}
                    alt={`${feature.name} logo`}
                    width={50}
                    height={50}
                    className="object-contain w-full h-full transition-all duration-200 group-hover:scale-110"
                    loading="lazy"
                    quality={50}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-text-heading transition-colors duration-200 group-hover:text-white group-focus:text-white relative z-10">
                  {feature.name}
                </h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
