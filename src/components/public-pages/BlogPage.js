"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Home,
  Megaphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  fadeUp,
  PageCta,
  splitTitle,
} from "./shared/PublicPageShared";

const categoryIcons = [
  Brain,
  TrendingUp,
  Home,
  BarChart3,
  BookOpen,
  Megaphone,
];

const categoryAccents = [
  "from-indigo-500 to-purple-500",
  "from-emerald-500 to-green-600",
  "from-blue-500 to-cyan-500",
  "from-orange-500 to-amber-500",
  "from-teal-500 to-emerald-500",
  "from-violet-500 to-fuchsia-500",
];

function BlogHero({ page, meta, introSection }) {
  const title = page.title || "";
  const { before, match, after } = splitTitle(title, meta.highlight);
  const intro = introSection?.paragraphs?.join(" ") || "";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-[340px] w-[340px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-[-4rem] top-24 h-[220px] w-[220px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:p-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-primary to-primary-dark" />
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
                  {intro} Clear education on AI, automation, financing, market trends, and
                  smarter client experiences.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-background-light/80 via-white to-primary/5 p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Insight Focus
              </p>
              <div className="grid gap-2">
                {meta.summary?.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-text-heading shadow-sm"
                  >
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

function BlogCategories({ section }) {
  if (!section?.subsections?.length) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Featured Categories
            </p>
            <h2 className="text-2xl font-black leading-tight text-text-heading md:text-[30px]">
              Explore insights built for real estate professionals
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-text-muted md:text-[15px]">
              A focused library for agents, brokers, mortgage teams, and growth-minded
              operators who want to understand where real estate technology is heading.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.subsections.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              const accent = categoryAccents[index % categoryAccents.length];

              return (
                <div
                  key={category.title}
                  className="group flex h-full flex-col rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-primary/15`}
                    >
                      <Icon size={19} strokeWidth={1.9} aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-black leading-tight text-text-heading">
                        {category.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-text-body md:text-[15px]">
                        {category.paragraphs?.[0]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Read insights
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function BlogPage({ page, meta, sections }) {
  const introSection = sections?.[0];
  const categories = sections?.find((section) => section.subsections?.length);

  return (
    <>
      <BlogHero page={page} meta={meta} introSection={introSection} />
      <BlogCategories section={categories} />
      <PageCta compact />
    </>
  );
}
