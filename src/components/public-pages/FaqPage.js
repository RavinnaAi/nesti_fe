"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { fadeUp, PageCta, splitTitle } from "./shared/PublicPageShared";

const faqIcons = ["logo", HelpCircle, Zap, Sparkles, CheckCircle2, ShieldCheck];

function FaqHero({ page, meta, faqs }) {
  const title = page.title || "";
  const { before, match, after } = splitTitle(title, meta.highlight);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-4rem] top-24 h-[220px] w-[220px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:p-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />

          <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
                <Sparkles size={13} aria-hidden />
                {meta.badge}
              </span>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-text-heading md:text-4xl">
                {before ? `${before} ` : null}
                {match ? (
                  <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    {match}
                  </span>
                ) : null}
                {after ? ` ${after}` : null}
                {!match ? title : null}
              </h1>

              {page.subtitle ? (
                <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-text-heading md:text-xl">
                  {page.subtitle}
                </p>
              ) : null}
              <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted md:text-[15px]">
                Find clear answers about Nesti, who it supports, how AI assists real
                estate workflows, and how security, trials, and professional guidance
                fit into the platform experience.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-background-light/80 via-white to-primary/5 p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Quick Answers
              </p>
              <div className="grid gap-2">
                {meta.summary?.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-text-heading shadow-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-text-muted">
                {faqs.length} common questions answered
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FaqList({ faqs }) {
  if (!faqs?.length) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Frequently Asked Questions
            </p>
            <h2 className="text-2xl font-black leading-tight text-text-heading md:text-[30px]">
              Everything you need to know before getting started
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-text-muted md:text-[15px]">
              These answers are written for buyers, sellers, real estate professionals,
              mortgage teams, and partners evaluating how Nesti fits into their workflow.
            </p>
          </div>

          <div className="relative z-10 columns-1 gap-3 lg:columns-2">
            {faqs.map((item, index) => {
              const Icon = faqIcons[index % faqIcons.length];

              return (
                <details
                  key={item.q}
                  className="group mb-3 break-inside-avoid rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 open:border-primary/20 open:shadow-md hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md md:p-5"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-open:bg-primary group-open:text-white">
                      {Icon === "logo" ? (
                        <Image
                          src="/logo/logo.png"
                          alt="Nesti AI logo"
                          width={19}
                          height={19}
                          className="h-[19px] w-[19px] object-contain"
                        />
                      ) : (
                        <Icon size={19} strokeWidth={1.9} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-black leading-tight text-text-heading md:text-lg">
                        {item.q}
                      </span>
                    </span>
                    <ChevronDown
                      size={18}
                      className="mt-1 shrink-0 text-text-muted transition-transform duration-300 group-open:rotate-180 group-open:text-primary"
                      aria-hidden
                    />
                  </summary>

                  <p className="mt-3 border-l-2 border-primary/20 pl-4 text-sm leading-6 text-text-body md:text-[15px]">
                    {item.a}
                  </p>
                </details>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function FaqPage({ page, meta, sections }) {
  const faqs = sections?.flatMap((section) => section.faqs || []) || [];

  return (
    <>
      <FaqHero page={page} meta={meta} faqs={faqs} />
      <FaqList faqs={faqs} />
      <PageCta compact />
    </>
  );
}
