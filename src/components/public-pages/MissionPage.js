"use client";

import { motion } from "framer-motion";
import { CheckCircle2, HeartHandshake, Sparkles } from "lucide-react";
import { fadeUp, PageCta, splitTitle } from "./shared/PublicPageShared";

function MissionHero({ page, meta, introText = "" }) {
  const title = page.title || "";
  const { before, match, after } = splitTitle(title, meta.highlight);
  const summaryItems = meta.summary || [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-4rem] top-24 h-[200px] w-[200px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="text-left">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <Sparkles size={13} aria-hidden />
              {meta.badge}
            </span>

            <h1 className="text-4xl font-black leading-none tracking-tight text-text-heading md:text-5xl">
              {before ? `${before} ` : null}
              {match ? (
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {match}
                </span>
              ) : null}
              {after ? ` ${after}` : null}
              {!match ? title : null}
            </h1>

            <div className="mt-5 max-w-2xl space-y-3">
              {page.subtitle ? (
                <p className="text-lg font-medium leading-8 text-text-heading md:text-[22px]">
                  {page.subtitle}
                </p>
              ) : null}
              <p className="text-sm leading-7 text-text-muted md:text-[15px]">
                {introText ||
                  "Nesti exists to modernize real estate with intelligent systems that help professionals manage leads, automate workflows, improve communication, and deliver a more seamless client experience from first inquiry to long-term relationship."}
              </p>
            </div>

            <div className="mt-6 h-px w-24 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
          </div>

          {summaryItems.length ? (
            <div className="grid gap-3">
              {summaryItems.map((item, idx) => {
                const cardTitle = typeof item === "string" ? null : item.title;
                const description = typeof item === "string" ? item : item.description;

                return (
                  <motion.div
                    key={typeof item === "string" ? item : item.title}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-white/95 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl"
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-primary-dark" />
                    <div className="flex gap-4 pl-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 size={16} strokeWidth={2.4} aria-hidden />
                      </span>
                      <div>
                        {cardTitle ? (
                          <h3 className="mb-1.5 text-sm font-semibold text-text-heading">
                            {cardTitle}
                          </h3>
                        ) : null}
                        <p className="text-sm leading-6 text-text-body">{description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}

function MissionBeliefsSection({ section, closingText = "" }) {
  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:p-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20">
                  <HeartHandshake size={22} strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl font-black leading-tight text-text-heading md:text-[2.35rem]">
                    {section.title}
                  </h2>
                  {closingText ? (
                    <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-text-heading/90 md:text-lg">
                      {closingText}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-1.5 border-l-2 border-primary/25 pl-3">
                {section.paragraphs?.map((p) => (
                  <p key={p} className="max-w-5xl text-sm leading-6 text-text-body md:text-[15px] md:leading-6">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {section.bullets?.length ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Experience Principles
                  </p>
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-primary/25 to-transparent sm:block" />
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                  {section.bullets.map((item, i) => (
                    <motion.div
                      key={item}
                      {...fadeUp}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="group flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-3 text-center text-sm font-semibold capitalize text-text-heading shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                        <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden />
                      </span>
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function MissionPage({ page, meta, sections }) {
  const introText = sections?.[0]?.paragraphs?.[0] || "";
  const [, beliefs, closing] = sections;
  const closingText = closing?.paragraphs?.[0] || "";

  return (
    <>
      <MissionHero page={page} meta={meta} introText={introText} />
      {beliefs ? <MissionBeliefsSection section={beliefs} closingText={closingText} /> : null}
      <PageCta compact />
    </>
  );
}
