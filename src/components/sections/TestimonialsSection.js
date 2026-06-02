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
      className="relative bg-transparent py-10 md:py-12"
    >
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
              <Star size={14} />
              Success Stories
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
            className="mx-auto max-w-2xl text-sm leading-6 text-text-body md:text-base"
            suppressHydrationWarning
          >
            Real results from real estate professionals across USA and Canada
            who transformed their business with Nesti AI.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.article
              key={`testimonial-${testimonial.name}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.25 } }}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md"
              suppressHydrationWarning
            >
              <div className="mb-3 flex gap-1">
                {[...Array(testimonial.rating)].map((_, idx) => (
                  <Star
                    key={`star-${testimonial.name}-${idx}`}
                    size={15}
                    className="fill-primary text-primary"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mb-4 flex-grow text-sm leading-5 text-text-body">
                &ldquo;{testimonial.testimonial}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border-2 border-border">
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
                  <div className="text-sm font-bold text-text-heading">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-text-body">{testimonial.role}</div>
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
