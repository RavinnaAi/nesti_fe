"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Gift,
  HeartHandshake,
  Layers3,
  Mail,
  Network,
  PhoneCall,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  fadeUp,
  PageCta,
  splitTitle,
} from "./shared/PublicPageShared";

function AboutHero({ page, meta, audienceSection }) {
  const title = page.title || "";
  const { before, match, after } = splitTitle(title, meta.highlight);
  const intro = audienceSection?.paragraphs?.[0] || "";
  const audiences = audienceSection?.bullets || [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-4rem] top-24 h-[200px] w-[200px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:p-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

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
                {intro ? `${intro} ` : null}
                Built for modern real estate teams, Nesti brings lead intelligence,
                workflow automation, client matching, referrals, and growth tools into
                one connected operating layer so professionals can reduce manual work,
                strengthen relationships, and scale with more clarity.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-background-light/70 to-primary/5 p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Built For
              </p>

              {audiences.length ? (
                <div className="grid gap-2">
                  {audiences.map((item) => (
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
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutStorySection({ section }) {
  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="h-full rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-5 md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Network size={21} strokeWidth={1.8} aria-hidden />
                </span>
                <h2 className="text-2xl font-black leading-tight text-text-heading md:text-[28px]">
                  Why Nesti Exists
                </h2>
              </div>
              <div className="space-y-3 border-l-2 border-primary/20 pl-4">
                {section.paragraphs?.map((p) => (
                  <p key={p.slice(0, 48)} className="text-sm leading-6 text-text-body md:text-[15px]">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-gradient-to-br from-background-light/80 via-white to-primary/5 p-4 shadow-sm md:p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Operating Outcomes
              </p>
              <div className="grid flex-1 content-between gap-2">
                {section.bullets?.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm font-semibold text-text-heading shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden />
                    </span>
                    <span className="leading-snug">
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </span>
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

function AboutMissionVisionSection({ mission, vision }) {
  const cards = [
    { title: mission?.title, text: mission?.paragraphs?.join(" "), Icon: HeartHandshake },
    { title: vision?.title, text: vision?.paragraphs?.join(" "), Icon: Layers3 },
  ].filter((item) => item.title && item.text);

  if (!cards.length) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Purpose & Direction
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-text-heading md:text-[30px]">
                Built with a clear mission and future vision
              </h2>
              <p className="mt-2 max-w-5xl text-sm leading-6 text-text-muted">
                Nesti is designed to make real estate work feel more connected, intelligent, and human-centered across every professional relationship.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-3">
          {cards.map(({ title, text, Icon }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md md:p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  <Icon size={21} strokeWidth={1.8} aria-hidden />
                </span>
                <div>
                  <h3 className="text-xl font-black leading-tight text-text-heading md:text-2xl">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-body md:text-[15px]">
                    {text}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutReferralSection({ section }) {
  if (!section) return null;

  const detailCards = [
    { item: section.subsections?.[0], Icon: Share2 },
    { item: section.subsections?.[1], Icon: Gift },
    { item: section.subsections?.[2], Icon: ShieldCheck },
  ].filter(({ item }) => item);

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Referral Ecosystem
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-text-heading md:text-[30px]">
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 max-w-5xl text-sm leading-6 text-text-muted md:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="relative z-10 grid gap-3 lg:grid-cols-3">
            {detailCards.map(({ item, Icon }) => (
              <div
                key={item.title}
                className="group flex h-full flex-col rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon size={20} strokeWidth={1.9} aria-hidden />
                  </span>
                  <h3 className="text-lg font-black leading-tight text-text-heading">
                    {item.title}
                  </h3>
                </div>

                {item.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-6 text-text-body md:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}

                {item.bullets?.length ? (
                  <div className="mt-3 grid gap-2">
                    {item.bullets.map((bullet, index) => (
                      <div
                        key={bullet}
                        className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 text-xs font-semibold text-text-heading shadow-sm"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {item.title === "How It Works" ? index + 1 : (
                            <CheckCircle2 size={11} strokeWidth={2.5} aria-hidden />
                          )}
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

function AboutDifferentiatorsSection({ section }) {
  if (!section?.subsections?.length) return null;

  const accents = [
    "from-emerald-500 to-green-600",
    "from-blue-500 to-cyan-500",
    "from-teal-500 to-emerald-500",
    "from-orange-500 to-rose-500",
    "from-violet-500 to-purple-600",
  ];
  const leftColumn = section.subsections.filter((_, index) => index % 2 === 0);
  const rightColumn = section.subsections.filter((_, index) => index % 2 === 1);

  const renderFeature = (item) => {
    const index = section.subsections.findIndex(
      (subsection) => subsection.title === item.title
    );
    const accent = accents[index % accents.length];

    return (
      <div
        key={item.title}
        className="group rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-sm font-black text-white shadow-lg shadow-primary/15`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-black leading-tight text-text-heading">
              {item.title}
            </h3>
            {item.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 text-sm leading-6 text-text-body md:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {item.bullets?.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 text-xs font-semibold capitalize text-text-heading shadow-sm"
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
    );
  };

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Platform Difference
            </p>
            <h2 className="text-2xl font-black leading-tight text-text-heading md:text-[30px]">
              {section.title}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-text-muted md:text-[15px]">
              Nesti brings intelligence, automation, and collaboration into one refined
              platform experience, helping professionals move faster while keeping the
              client relationship at the center.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 md:grid-cols-2">
            <div className="grid content-start gap-3">
              {leftColumn.map(renderFeature)}
            </div>
            <div className="grid content-start gap-3">
              {rightColumn.map(renderFeature)}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutContactSection({ section }) {
  if (!section) return null;

  const contactCards = [
    { item: section.subsections?.find((item) => item.title === "Email"), Icon: Mail, href: "mailto:ravinna.raveenthiran@nesti.ca" },
    { item: section.subsections?.find((item) => item.title === "Phone"), Icon: PhoneCall, href: "tel:+14165654791" },
  ].filter(({ item }) => item);

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-5"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Contact
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-text-heading md:text-[30px]">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2 max-w-4xl text-sm leading-6 text-text-muted md:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {contactCards.map(({ item, Icon, href }) => (
                <a
                  key={item.title}
                  href={href}
                  className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/35 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon size={20} strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {item.title}
                    </span>
                    <span className="mt-1 block break-all text-sm font-bold text-text-heading md:text-[15px]">
                      {item.paragraphs?.[0]}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage({ page, meta, sections }) {
  const story = sections?.[1];
  const mission = sections?.find((section) => section.id === "mission");
  const differentiators = sections?.find((section) => section.id === "differentiators");
  const vision = sections?.find((section) => section.id === "vision");
  const referrals = sections?.find((section) => section.id === "referral-ecosystem");
  const contact = sections?.find((section) => section.id === "contact");

  return (
    <>
      <AboutHero page={page} meta={meta} audienceSection={sections?.[0]} />
      {story ? <AboutStorySection section={story} /> : null}
      <AboutMissionVisionSection mission={mission} vision={vision} />
      <AboutReferralSection section={referrals} />
      {differentiators ? <AboutDifferentiatorsSection section={differentiators} /> : null}
      <AboutContactSection section={contact} />
      <PageCta compact />
    </>
  );
}
