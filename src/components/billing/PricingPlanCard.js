"use client";

import Link from "next/link";
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

const cardShellClass = (popular, isCurrentPlan, isScheduledPlan, compact) =>
  `group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${compact ? "min-h-[20rem] px-3 pb-3 pt-2.5" : "min-h-[23.5rem] px-4 pb-4 pt-3"} ${
    isCurrentPlan
      ? "border-primary/70 bg-gradient-to-br from-primary/[0.08] via-white to-emerald-50/70 shadow-[0_22px_60px_rgba(22,163,74,0.20)] ring-2 ring-primary/25"
      : isScheduledPlan
        ? "border-primary/30 bg-gradient-to-br from-primary/[0.045] via-white to-background-light/70 shadow-[0_16px_42px_rgba(15,23,42,0.065)] ring-1 ring-primary/12"
      : popular
        ? "border-primary/35 shadow-[0_22px_55px_rgba(22,163,74,0.16)] ring-1 ring-primary/15"
        : "border-border shadow-[0_14px_38px_rgba(15,23,42,0.055)] hover:border-primary/25 hover:shadow-[0_20px_48px_rgba(15,23,42,0.09)]"
  }`;

const ctaClass = (popular, disabled, isCurrentPlan, isScheduledPlan, compact) =>
  `group/cta relative z-10 mt-auto block w-full overflow-hidden rounded-2xl text-center font-bold transition-all ${compact ? "py-2 text-xs" : "py-2.5 text-sm"} ${
    isCurrentPlan
      ? "border border-primary/25 bg-primary/10 text-primary"
      : isScheduledPlan
      ? "border border-primary/12 bg-primary/8 text-primary"
      : popular
      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg"
      : "border border-border bg-white text-text-heading hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background-light hover:text-primary hover:shadow-md"
  } ${disabled && !isCurrentPlan && !isScheduledPlan ? "pointer-events-none opacity-50" : ""} ${isCurrentPlan || isScheduledPlan ? "pointer-events-none" : ""}`;

function PlanCta({ plan, cta, isCurrentPlan, isScheduledPlan, compact }) {
  if (!cta) return null;

  const label = (
    <span className="relative z-10 flex items-center justify-center gap-2">
      {cta.label}
      {cta.showArrow ? (
        <ArrowRight
          size={17}
          className="relative z-10 transition-transform duration-300 group-hover/cta:translate-x-1"
        />
      ) : null}
    </span>
  );

  if (cta.type === "link") {
    return (
      <Link href={cta.href} className={ctaClass(plan.popular, false, isCurrentPlan, isScheduledPlan, compact)}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        cta.onClick?.(e);
      }}
      disabled={cta.disabled}
      className={ctaClass(plan.popular, cta.disabled, isCurrentPlan, isScheduledPlan, compact)}
    >
      {label}
    </button>
  );
}

export default function PricingPlanCard({
  plan,
  cta = null,
  showCta = true,
  onCardClick = null,
  isCurrentPlan = false,
  isScheduledPlan = false,
  scheduledLabel = "Scheduled",
  compact = false,
  className = "",
}) {
  const selectable = Boolean(onCardClick);

  return (
    <div
      className={`${cardShellClass(plan.popular, isCurrentPlan, isScheduledPlan, compact)} ${selectable ? "cursor-pointer" : ""} ${className}`}
      onClick={onCardClick || undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick?.(e);
              }
            }
          : undefined
      }
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          isCurrentPlan
            ? "bg-gradient-to-r from-emerald-500 via-primary to-primary-dark"
            : isScheduledPlan
            ? "bg-gradient-to-r from-primary/30 via-primary/20 to-transparent"
            : plan.popular
            ? "bg-gradient-to-r from-primary via-primary-dark to-primary"
            : "bg-gradient-to-r from-primary/35 via-primary/20 to-transparent"
        }`}
      />
      <div className={`pointer-events-none absolute -right-14 -top-14 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-80 ${compact ? "h-28 w-28" : "h-36 w-36"} ${isCurrentPlan ? "bg-primary/20" : isScheduledPlan ? "bg-primary/12" : "bg-primary/10"}`} />
      {isScheduledPlan ? (
        <div className={`pointer-events-none absolute -bottom-16 -left-16 rounded-full bg-background-light blur-3xl ${compact ? "h-28 w-28" : "h-36 w-36"}`} />
      ) : null}

      <div className={`relative z-10 flex flex-1 flex-col ${compact ? "mb-2.5" : "mb-3"}`}>
        <div className={`flex min-h-[2rem] items-center justify-between gap-2 ${compact ? "mb-2" : "mb-3"}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? "h-7 w-7" : "h-8 w-8"} ${isCurrentPlan ? "bg-primary text-white shadow-md shadow-primary/20" : isScheduledPlan ? "bg-primary/10 text-primary ring-1 ring-primary/15" : "bg-primary/10 text-primary"}`}>
              {plan.popular ? <Sparkles size={compact ? 15 : 17} aria-hidden /> : <ShieldCheck size={compact ? 15 : 17} aria-hidden />}
            </span>
            <h3 className={`${compact ? "text-lg" : "text-xl"} truncate font-black leading-tight text-text-heading`}>{plan.name}</h3>
          </div>
          {isCurrentPlan ? (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-dark px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
              Current
            </span>
          ) : isScheduledPlan ? (
            <span className="shrink-0 rounded-full border border-primary/15 bg-primary/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm">
              Next
            </span>
          ) : plan.popular ? (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-dark px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
              Popular
            </span>
          ) : null}
        </div>

        <p className={`${compact ? "mb-2 min-h-[2.5rem] text-xs leading-5" : "mb-3 min-h-[3rem] text-sm leading-5"} text-text-body`}>
          {plan.description || "Monthly subscription plan"}
        </p>

        {isScheduledPlan ? (
          <div className={`${compact ? "mb-2 px-3 py-2" : "mb-3 px-3 py-2.5"} overflow-hidden rounded-2xl border border-primary/12 bg-white/80 shadow-sm shadow-primary/5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">
              Next plan
            </p>
            <p className={`${compact ? "text-[11px] leading-4" : "text-xs leading-5"} mt-0.5 font-medium text-text-body`}>
              {scheduledLabel}
            </p>
          </div>
        ) : null}

        <div className={`${compact ? "mb-2 rounded-xl p-2.5" : "mb-3 rounded-2xl p-3"} border ${isCurrentPlan ? "border-primary/25 bg-white shadow-inner shadow-primary/5" : isScheduledPlan ? "border-primary/12 bg-gradient-to-br from-white to-background-light/35" : "border-border/80 bg-gradient-to-br from-white to-background-light/45"}`}>
          <div className="flex items-end gap-1">
            <span className={`${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} font-black tracking-tight text-primary`}>
              {plan.price}
            </span>
            <span className={`${compact ? "mb-1 text-xs" : "mb-1.5 text-sm"} font-semibold text-text-muted`}>{plan.period}</span>
          </div>
          <p className={`${compact ? "mt-1 text-[11px]" : "mt-1.5 text-xs"} flex items-center gap-2 font-semibold text-text-muted`}>
            <CreditCard size={compact ? 12 : 13} className="text-primary" aria-hidden />
            Recurring monthly billing
          </p>
        </div>

        {plan.features?.length > 0 ? (
          <ul className={`${compact ? "mb-2.5 space-y-1.5" : "mb-3 space-y-2"} flex-1`}>
            {plan.features.map((feature, idx) => (
              <li
                key={`feature-${plan.plan_key}-${idx}`}
                className={`${compact ? "gap-2 px-2.5 py-1 text-xs" : "gap-2.5 px-3 py-1.5 text-sm"} flex items-start rounded-xl bg-background-light/50`}
              >
                <span className={`${compact ? "h-4 w-4" : "h-5 w-5"} mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary`}>
                  <Check size={compact ? 10 : 12} strokeWidth={2.6} aria-hidden="true" />
                </span>
                <span className={`${compact ? "text-xs leading-4" : "text-sm leading-5"} font-medium text-text-body`}>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {showCta ? <PlanCta plan={plan} cta={cta} isCurrentPlan={isCurrentPlan} isScheduledPlan={isScheduledPlan} compact={compact} /> : null}
    </div>
  );
}
