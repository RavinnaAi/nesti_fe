"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateProfile } from "@/store/authSlice";
import { ACCOUNT_STATUS } from "@/constants/features";
import { planLabel, findPlanByKey } from "@/lib/billingPlans";
import { apiClient } from "@/lib/api";
import { useBillingInvoices, useCancelSubscription, useResumeSubscription, useSubscriptionMe } from "@/hooks/useBillingApi";

function formatDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function resolvePeriodEnd({ user, subscription, invoices = [] }) {
  const direct =
    subscription?.subscriptionEndsAt ||
    subscription?.current_period_end ||
    subscription?.currentPeriodEnd ||
    user?.subscriptionEndsAt ||
    user?.subscription_ends_at;

  if (direct) return direct;

  const invoiceWithPeriod = invoices.find((invoice) => invoice.periodEnd);
  if (invoiceWithPeriod?.periodEnd) return invoiceWithPeriod.periodEnd;

  return null;
}

const workspaceOverlayStyle = {
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

function CancelSubscriptionModal({ isOpen, onClose, onConfirm, isPending, renewDate, planName }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const scrollTarget = document.getElementById("workspace-main") || document.body;
    const previousOverflow = scrollTarget.style.overflow;
    scrollTarget.style.overflow = "hidden";
    return () => {
      scrollTarget.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed top-16 bottom-0 left-0 right-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:left-60"
          style={workspaceOverlayStyle}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-transparent"
            style={workspaceOverlayStyle}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            style={workspaceOverlayStyle}
          >
            <div className="h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-heading">Cancel subscription?</h3>
                <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                  You will keep full access until{" "}
                  <span className="font-semibold text-primary">
                    {renewDate || "the end of your billing period"}
                  </span>
                  . No further charges after that.
                </p>
                <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-950">
                  <p className="font-semibold">We&apos;re sorry to see you go.</p>
                  <p className="mt-1 text-amber-900">
                    {planName ? (
                      <>
                        If you cancel your <span className="font-medium">{planName}</span> plan, you
                        will lose access to paid features after your current period ends.
                      </>
                    ) : (
                      <>If you cancel, you will lose access to paid features after your current period ends.</>
                    )}{" "}
                    Changed your mind? You can continue your subscription anytime before then.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-text-muted hover:bg-background-light hover:text-text-heading transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-heading hover:bg-background-light transition disabled:opacity-60"
              >
                Keep subscription
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Cancel subscription
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function MetaTile({ label, value, valueClassName = "text-text-heading" }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/45 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function BillingPanelSkeleton() {
  return (
    <div className="w-full space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.055)] sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-primary/10" />
          <div className="h-6 w-44 animate-pulse rounded bg-background-light" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-16 animate-pulse rounded-2xl bg-background-light" />
          <div className="h-16 animate-pulse rounded-2xl bg-background-light" />
          <div className="h-16 animate-pulse rounded-2xl bg-background-light" />
        </div>
      </section>
      <section className="h-36 animate-pulse rounded-3xl border border-border bg-white" />
    </div>
  );
}

export default function SubscriptionBillingPanel({
  plans = [],
  showManagePlansLink = false,
  onCancelSuccess,
}) {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const subscriptionQuery = useSubscriptionMe();
  const invoicesQuery = useBillingInvoices(true);
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = subscriptionQuery.data?.subscription;
  const userStatus = String(user?.accountStatus || user?.account_status || "").toLowerCase();
  const subscriptionStatus = String(
    subscription?.accountStatus || subscription?.account_status || ""
  ).toLowerCase();
  const isSubscribed =
    (subscriptionStatus || userStatus) === ACCOUNT_STATUS.SUBSCRIBED;
  const invoices = invoicesQuery.data?.invoices || [];

  const cancelAtPeriodEnd = Boolean(
    subscription?.cancelAtPeriodEnd ??
      user?.cancelAtPeriodEnd ??
      user?.cancel_at_period_end
  );

  const currentPlanKey = String(
    subscription?.subscriptionPlan ||
      user?.subscriptionPlan ||
      user?.subscription_plan ||
      ""
  )
    .trim()
    .toLowerCase();

  const currentPlan = useMemo(
    () => findPlanByKey(plans, currentPlanKey),
    [plans, currentPlanKey]
  );
  const pendingPlanKey = String(
    subscription?.pendingPlanKey ||
      user?.pendingPlanKey ||
      user?.pending_plan_key ||
      ""
  ).trim().toLowerCase();
  const pendingPlan = useMemo(
    () => findPlanByKey(plans, pendingPlanKey),
    [plans, pendingPlanKey]
  );
  const pendingPlanEffectiveLabel = formatDate(
    subscription?.pendingPlanEffectiveAt ||
      user?.pendingPlanEffectiveAt ||
      user?.pending_plan_effective_at
  );

  const periodEndRaw = resolvePeriodEnd({ user, subscription, invoices });
  const periodEndLabel = formatDate(periodEndRaw);
  const isLoadingPeriod = subscriptionQuery.isLoading && !periodEndLabel;

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      const res = await apiClient({ url: "/auth/profile", token });
      if (res.success && res.user) {
        dispatch(updateProfile(res.user));
      }
      await subscriptionQuery.refetch();
      setShowCancelModal(false);
      onCancelSuccess?.();
    } catch {
      // toast handled in hook
    }
  };

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync();
      const res = await apiClient({ url: "/auth/profile", token });
      if (res.success && res.user) {
        dispatch(updateProfile(res.user));
      }
      await subscriptionQuery.refetch();
      onCancelSuccess?.();
    } catch {
      // toast handled in hook
    }
  };

  if (!isSubscribed) return null;
  if (subscriptionQuery.isLoading && !subscription) return <BillingPanelSkeleton />;

  return (
    <div className="w-full space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.055)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={18} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-text-heading sm:text-2xl">
                    {planLabel(currentPlanKey)} plan
                  </h2>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-text-body">
                {currentPlan?.description || "Monthly subscription billed through Stripe."}
              </p>
            </div>

            <div className="w-full shrink-0 rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/45 p-4 lg:w-auto lg:min-w-[10rem]">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                  {currentPlan?.price || "—"}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-text-muted">
                  {currentPlan?.period || "/month"}
                </span>
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted">
                <CreditCard size={13} className="text-primary" aria-hidden />
                Recurring monthly billing
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetaTile
              label={cancelAtPeriodEnd ? "Access until" : "Next renewal"}
              value={
                isLoadingPeriod ? (
                  <span className="inline-flex items-center gap-2 font-normal text-text-muted">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  periodEndLabel || "—"
                )
              }
            />
            <MetaTile
              label="Status"
              value={
                pendingPlan
                  ? `Downgrade scheduled`
                  : cancelAtPeriodEnd
                    ? "Cancels at period end"
                    : "Active subscription"
              }
              valueClassName={pendingPlan || cancelAtPeriodEnd ? "text-amber-700" : "text-emerald-700"}
            />
            {showManagePlansLink ? (
              <div className="flex items-center rounded-2xl border border-border/80 bg-gradient-to-br from-white to-background-light/45 px-4 py-3">
                <Link
                  href="/settings?tab=subscription"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Change plan →
                </Link>
              </div>
            ) : null}
          </div>

          {pendingPlan ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold text-amber-950">
                  Downgrade scheduled
                </p>
                <p className="mt-1 leading-relaxed">
                  You will stay on the <span className="font-semibold">{planLabel(currentPlanKey)}</span> plan until{" "}
                  <span className="font-semibold">{pendingPlanEffectiveLabel || periodEndLabel || "your next renewal"}</span>.
                  Then your subscription will move to{" "}
                  <span className="font-semibold">{pendingPlan.name}</span>
                  {pendingPlan.price ? (
                    <>
                      {" "}at <span className="font-semibold">{pendingPlan.price}</span>
                      <span>{pendingPlan.period || "/month"}</span>.
                    </>
                  ) : (
                    "."
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-muted">
                  You can still cancel the subscription entirely. Access continues until the end of your billing period.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelMutation.isPending}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          ) : cancelAtPeriodEnd ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-body">
                <p className="font-semibold text-text-heading">We&apos;re sorry to see you go.</p>
                <p className="mt-1 leading-relaxed text-text-muted">
                  Your cancellation is confirmed. You still have full access until your billing
                  period ends — and you can restart your subscription anytime before then if you
                  change your mind.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">
                  Access ends
                  {periodEndLabel ? (
                    <>
                      {" "}
                      on <span className="font-bold text-amber-950">{periodEndLabel}</span>
                    </>
                  ) : (
                    " at the end of the current billing period"
                  )}
                  . No further charges after that date.
                </p>
              <button
                type="button"
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
              >
                {resumeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue subscription
              </button>
            </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-muted">
                Cancel anytime. Access continues until the end of your billing period.
              </p>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={cancelMutation.isPending}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_14px_38px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
          <h3 className="text-base font-black text-text-heading">Billing history</h3>
          <p className="mt-1 text-sm text-text-muted">Paid invoices from your subscription.</p>
        </div>

        <div className="px-5 py-4 sm:px-6">
          {invoicesQuery.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin text-primary" />
              Loading invoices...
            </div>
          ) : null}

          {invoicesQuery.isError ? (
            <p className="py-4 text-sm text-red-600">Unable to load billing history.</p>
          ) : null}

          {!invoicesQuery.isLoading && !invoicesQuery.isError && invoices.length === 0 ? (
            <p className="py-4 text-sm text-text-muted">No paid invoices yet.</p>
          ) : null}

          {invoices.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    <th className="pb-3 pr-4 font-bold">Date</th>
                    <th className="pb-3 pr-4 font-bold">Invoice</th>
                    <th className="pb-3 pr-4 font-bold">Description</th>
                    <th className="pb-3 pr-4 font-bold text-right">Amount</th>
                    <th className="pb-3 font-bold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/40 last:border-0 hover:bg-background-light/50"
                    >
                      <td className="py-3.5 pr-4 text-text-body whitespace-nowrap">
                        {formatDate(invoice.createdAt) || "—"}
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-xs text-text-muted whitespace-nowrap">
                        {invoice.number}
                      </td>
                      <td className="py-3.5 pr-4 text-text-body">
                        <span className="line-clamp-1">{invoice.description}</span>
                        {invoice.prorationNote ? (
                          <span className="mt-1 block text-xs leading-5 text-text-muted">
                            {invoice.prorationNote}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-bold text-primary whitespace-nowrap">
                        {invoice.displayAmount}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                          >
                            View
                            <ExternalLink size={13} />
                          </a>
                        ) : invoice.invoicePdf ? (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                          >
                            PDF
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isPending={cancelMutation.isPending}
        renewDate={periodEndLabel}
        planName={planLabel(currentPlanKey)}
      />
    </div>
  );
}
