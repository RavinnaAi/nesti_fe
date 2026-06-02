"use client";

import { motion } from "framer-motion";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { fadeUp, PageCta } from "./shared/PublicPageShared";

const tiers = [
  { name: "Basic", price: "$150", detail: "USD per month" },
  { name: "Standard", price: "$300", detail: "USD per month" },
  { name: "Enterprise", price: "$600", detail: "USD per month" },
];

const finalSaleItems = [
  "All sales are final across every paid tier.",
  "No prorated refunds for partial months.",
  "No credits for unused subscription periods.",
  "No refunds for immediate cancellations.",
];

const policySummaryItems = [
  "Monthly SaaS billing",
  "Stripe payment authorization",
  "Strict no-refund policy",
];

const billingNotes = [
  {
    title: "Automatic Renewal",
    text: "Your subscription renews each month on the exact calendar day of your initial signup.",
  },
  {
    title: "Payment Authorization",
    text: "By providing payment information through Stripe, you authorize recurring monthly charges until cancellation.",
  },
];

const policyCards = [
  {
    title: "Cancellation Access",
    Icon: CalendarClock,
    text: "You may cancel from your dashboard at any time. Access remains active until the end of the current paid billing cycle.",
  },
  {
    title: "Account Verification",
    Icon: ShieldCheck,
    text: "Nesti may verify identities and suspend accounts with fraudulent, high-risk, or suspicious transaction behavior.",
  },
  {
    title: "Governing Law",
    Icon: Scale,
    text: "These terms are governed by the laws of Ontario, Canada, without regard to conflict of law principles.",
  },
];

function SurfaceCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-border bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)] md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function IconBadge({ children, className = "" }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ${className}`}
    >
      {children}
    </span>
  );
}

export default function RefundPolicyPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-background-light/35 to-white py-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-slate-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-3xl border border-border bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.065)] md:p-7"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="max-w-4xl">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  <Sparkles size={13} aria-hidden />
                  Service & Refund Terms
                </span>
                <h1 className="text-3xl font-black leading-tight tracking-tight text-text-heading md:text-4xl">
                  Nesti Terms of Service & Refund Policy
                </h1>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Last Updated: June 2, 2026
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-text-body md:text-[15px]">
                  Welcome to Nesti. By accessing our platform and subscribing to
                  our services, you agree to be bound by these terms and
                  conditions. Please read them carefully before selecting a paid
                  plan.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/8 via-white to-background-light/70 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  Policy Summary
                </p>
                <div className="mt-3 grid gap-2">
                  {policySummaryItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-text-heading"
                    >
                      <CheckCircle2
                        size={15}
                        className="shrink-0 text-primary"
                        aria-hidden
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="grid gap-4">
            <SurfaceCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    Subscription Tiers & Billing
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text-heading md:text-[30px]">
                    Simple monthly SaaS plans
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-text-body md:text-[15px]">
                    Nesti operates on a software-as-a-service model. By signing
                    up, you agree to the recurring fees associated with your
                    selected tier.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  <CreditCard size={14} aria-hidden />
                  Stripe Secure Billing
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="rounded-2xl border border-border bg-gradient-to-br from-white to-background-light/45 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <p className="text-sm font-black text-text-heading">
                      {tier.name} Tier
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-black tracking-tight text-primary">
                        {tier.price}
                      </span>
                      <span className="pb-1 text-xs font-semibold text-text-muted">
                        {tier.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {billingNotes.map((note) => (
                  <div
                    key={note.title}
                    className="rounded-2xl border border-border/80 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-black text-text-heading">
                      {note.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-body">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="border-primary/15 bg-gradient-to-br from-white via-primary/5 to-white">
              <div className="flex items-start gap-4">
                <IconBadge>
                  <Ban size={21} aria-hidden />
                </IconBadge>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    Strict No-Refund Policy
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text-heading">
                    All payments are final
                  </h2>
                  <p className="mt-2 max-w-5xl text-sm leading-6 text-text-body md:text-[15px]">
                    Due to the digital nature of our software and the immediate
                    infrastructure resources allocated upon signup, all payments
                    made to Nesti across all tiers are strictly non-refundable.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {finalSaleItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/80 bg-white px-3.5 py-3 text-xs font-semibold leading-5 text-text-heading shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <div className="grid gap-3 md:grid-cols-3">
              {policyCards.map(({ title, Icon, text }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <IconBadge className="h-10 w-10">
                    <Icon size={19} aria-hidden />
                  </IconBadge>
                  <h3 className="mt-3 text-base font-black text-text-heading">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-body">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <SurfaceCard>
              <div className="flex items-start gap-4">
                <IconBadge>
                  <FileText size={21} aria-hidden />
                </IconBadge>
                <div>
                  <h2 className="text-xl font-black text-text-heading">
                    Agreement to Terms
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-text-body md:text-[15px]">
                    By accessing Nesti and subscribing to our services, you
                    acknowledge that you have read, understood, and agreed to
                    this Terms of Service & Refund Policy.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </motion.div>
        </div>
      </section>

      <PageCta compact />
    </>
  );
}
