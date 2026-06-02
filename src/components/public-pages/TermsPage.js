"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileCheck2, Scale, Sparkles } from "lucide-react";
import { fadeUp, PageCta, splitTitle } from "./shared/PublicPageShared";

function TermsHero({ page, meta, introSection }) {
  const title = page.title || "";
  const { before, match, after } = splitTitle(title, meta.highlight);
  const intro = introSection?.paragraphs?.[0] || "";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-4rem] top-24 h-[220px] w-[220px] rounded-full bg-slate-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:p-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-600 via-primary to-primary-dark" />

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
              {intro ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted md:text-[15px]">
                  {intro}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-background-light/80 via-white to-primary/5 p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {meta.summaryLabel || "Terms Summary"}
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TermsSections({ sections, meta }) {
  const detailSections = sections?.filter((section) => section.title) || [];
  if (!detailSections.length) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {meta.detailKicker || "Platform Terms"}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-text-heading md:text-[30px]">
              {meta.detailHeading || "Rules and responsibilities for using Nesti"}
            </h2>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-text-muted md:text-[15px]">
              {meta.detailDescription ||
                "These terms outline platform access, responsible use, professional obligations, subscriptions, AI disclaimers, intellectual property, and account standards."}
            </p>
          </div>

          <div className="relative z-10 grid gap-3">
            {detailSections.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    {item.title === "Acceptance of Terms" ? (
                      <Scale size={19} strokeWidth={1.9} aria-hidden />
                    ) : (
                      <FileCheck2 size={19} strokeWidth={1.9} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black leading-tight text-text-heading">
                      {item.title}
                    </h3>
                    {item.paragraphs?.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="mt-2 max-w-5xl text-sm leading-6 text-text-body md:text-[15px]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {item.bullets?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:pl-[54px]">
                    {item.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 text-xs font-semibold text-text-heading shadow-sm"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 size={11} strokeWidth={2.5} aria-hidden />
                        </span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function TermsPage({ page, meta, sections }) {
  return (
    <>
      <TermsHero page={page} meta={meta} introSection={sections?.[0]} />
      <TermsSections sections={sections} meta={meta} />
      <PageCta compact />
    </>
  );
}
