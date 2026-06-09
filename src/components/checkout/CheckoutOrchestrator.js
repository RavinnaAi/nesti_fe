"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedPlan } from "@/store/selectedPlanSlice";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  openCheckoutPlaceholderWindow,
  openStripeCheckoutInNewTab,
  useBillingPlans,
  useCreateCheckoutSession,
  useSubscriptionMe,
} from "@/hooks/useBillingApi";
import { findPlanByKey, getPlanKey, sortPlansForDisplay } from "@/lib/billingPlans";
import { ACCOUNT_STATUS } from "@/constants/features";
import SubscriptionBillingPanel from "@/components/billing/SubscriptionBillingPanel";
import PricingPlanCard from "@/components/billing/PricingPlanCard";
import { toast } from "react-toastify";

export default function CheckoutOrchestrator() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAppSelector((state) => state.auth);
  const { plan: selectedPlan } = useAppSelector((state) => state.selectedPlan);
  const { plans } = useAppSelector((state) => state.pricing);
  const [isChoosingPlan, setIsChoosingPlan] = useState(false);
  const checkoutMutation = useCreateCheckoutSession();
  const billingPlansQuery = useBillingPlans();
  const subscriptionMeQuery = useSubscriptionMe();

  const userStatus = String(user?.accountStatus || user?.account_status || "").toLowerCase();
  const subscriptionStatus = String(
    subscriptionMeQuery.data?.subscription?.accountStatus ||
      subscriptionMeQuery.data?.subscription?.account_status ||
      ""
  ).toLowerCase();
  const effectiveStatus = subscriptionStatus || userStatus;
  const isSubscribed = effectiveStatus === ACCOUNT_STATUS.SUBSCRIBED;

  const effectivePlans = billingPlansQuery.data?.length
    ? billingPlansQuery.data
    : plans;

  const planFromQuery = useMemo(() => {
    const queryPlanKey = String(searchParams.get("plan") || "").trim().toLowerCase();
    if (!queryPlanKey || !effectivePlans?.length) return null;
    return findPlanByKey(effectivePlans, queryPlanKey);
  }, [effectivePlans, searchParams]);

  useEffect(() => {
    if (!planFromQuery || selectedPlan) return;
    dispatch(setSelectedPlan(planFromQuery));
  }, [dispatch, planFromQuery, selectedPlan]);

  const activePlan = useMemo(() => {
    if (selectedPlan) return selectedPlan;
    if (planFromQuery) return planFromQuery;
    return null;
  }, [planFromQuery, selectedPlan]);

  const planKey = getPlanKey(activePlan);
  const selectedPlanKey = getPlanKey(selectedPlan || planFromQuery);
  const sortedPlans = useMemo(() => sortPlansForDisplay(effectivePlans || []), [effectivePlans]);

  useEffect(() => {
    if (!selectedPlan && !planFromQuery && sortedPlans.length) {
      setIsChoosingPlan(true);
    }
  }, [planFromQuery, selectedPlan, sortedPlans.length]);

  const handleChoosePlan = (plan) => {
    if (!plan?.stripe_price_configured) {
      toast.error(`${plan?.name || "This plan"} is not available for checkout yet.`);
      return;
    }
    dispatch(setSelectedPlan(plan));
    setIsChoosingPlan(false);
  };

  const handleCheckout = () => {
    if (!planKey) {
      toast.error("Selected plan is missing a plan key.");
      return;
    }

    const payWindow = openCheckoutPlaceholderWindow();

    checkoutMutation.mutate(planKey, {
      onSuccess: (data) => {
        if (openStripeCheckoutInNewTab(data, payWindow)) {
          if (payWindow) {
            toast.info("Complete payment in the new tab.");
          }
        }
      },
      onError: () => {
        try {
          payWindow?.close();
        } catch {
          // ignore
        }
      },
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isSubscribed) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        <SubscriptionBillingPanel plans={effectivePlans} showManagePlansLink />
      </div>
    );
  }

  if (isChoosingPlan || !activePlan) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="text-center">
            <div className="text-2xl font-black text-text-heading">Choose your subscription plan</div>
            <p className="mt-2 text-sm text-text-muted">
              Select the plan that fits your current workflow. You can change it later from Billing.
            </p>
          </div>

          {billingPlansQuery.isLoading && !sortedPlans.length ? (
            <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm text-text-muted shadow-sm">
              Loading available plans...
            </div>
          ) : sortedPlans.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {sortedPlans.map((plan) => {
                const key = getPlanKey(plan);
                return (
                  <PricingPlanCard
                    key={`checkout-plan-${key || plan.name}`}
                    plan={plan}
                    compact
                    isCurrentPlan={Boolean(selectedPlanKey && key === selectedPlanKey)}
                    onCardClick={() => handleChoosePlan(plan)}
                    cta={{
                      type: "button",
                      label: selectedPlanKey && key === selectedPlanKey ? "Selected" : "Select plan",
                      disabled: !plan.stripe_price_configured,
                      onClick: () => handleChoosePlan(plan),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm text-text-muted shadow-sm">
              No subscription plans are available right now.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-md border border-border bg-white shadow-sm p-6 space-y-6">
        <div>
          <div className="text-lg font-semibold text-text-heading">Complete your subscription</div>
          <div className="text-sm text-text-muted">
            Your plan is already selected. Pay securely on Stripe — card details are never stored on Nesti.
          </div>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">
            Selected plan
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-semibold text-text-heading">{activePlan.name}</div>
              <div className="text-sm text-text-muted mt-1">
                {activePlan.description || "Monthly subscription"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-text-heading">{activePlan.price}</div>
              <div className="text-xs text-text-muted">{activePlan.period || "/month"}</div>
            </div>
          </div>

          {activePlan.features?.length > 0 ? (
            <ul className="space-y-2 border-t border-primary/10 pt-4">
              {activePlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-body">
                  <Check size={16} className="mt-0.5 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between border-t border-primary/10 pt-4 text-sm">
            <span className="font-semibold text-text-heading">Total due today</span>
            <span className="font-bold text-text-heading">{activePlan.price}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsChoosingPlan(true)}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-text-heading hover:bg-background-light transition"
          >
            Change plan
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!planKey || checkoutMutation.isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>
              {planKey ? `Pay now — ${activePlan.price}` : "Plan unavailable"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
