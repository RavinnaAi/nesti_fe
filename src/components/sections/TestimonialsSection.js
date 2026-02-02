"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Real Estate Agent",
    company: "Century 21, New York",
    testimonial:
      "Nesti AI completely transformed my lead management. The 0-100 scoring helps me focus on ready-to-buy clients. My conversion rate jumped 40% and I'm closing deals 3x faster!",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Michael Chen",
    role: "Mortgage Broker",
    company: "HomeLoans Inc, Toronto",
    testimonial:
      "The AI matching is incredibly accurate. I'm now connected with pre-qualified buyers who match my specialty perfectly. It's like having a 24/7 assistant that never sleeps.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Property Seller",
    company: "San Francisco, CA",
    testimonial:
      "I was skeptical at first, but Nesti matched me with the perfect agent who understood my timeline and goals. Sold my house in 2 weeks above asking price. Absolutely incredible!",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    gradient: "from-green-500 to-emerald-500",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32 bg-gradient-to-b from-background-light/30 to-background"
    >
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
              <Star size={16} />
              Success Stories
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
            Trusted by{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              Top Professionals
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
            Real results from real estate professionals across USA and Canada
            who transformed their business with Nesti AI.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.article
              key={`testimonial-${testimonial.name}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="rounded-md p-8 border border-border bg-background shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
              suppressHydrationWarning
            >
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, idx) => (
                  <Star
                    key={`star-${testimonial.name}-${idx}`}
                    size={18}
                    className="fill-primary text-primary"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="text-text-body leading-relaxed mb-8 text-base flex-grow">
                &ldquo;{testimonial.testimonial}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 border-border">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    quality={75}
                  />
                </div>
                <div>
                  <div className="font-bold text-base text-text-heading">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-text-body">{testimonial.role}</div>
                  <div className="text-xs text-text-muted">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
