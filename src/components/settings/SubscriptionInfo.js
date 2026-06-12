"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedPlan } from "@/store/selectedPlanSlice";
import { setPlans } from "@/store/pricingSlice";
import { updateProfile } from "@/store/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api";
import { ACCOUNT_STATUS } from "@/constants/features";
import { sortPlansForDisplay, planLabel, getPlanKey, getPlanSwitchLabel, getPlanTier } from "@/lib/billingPlans";
import {
  useBillingPlans,
  useChangeSubscriptionPlan,
  useCreateCheckoutSession,
  useSubscriptionMe,
} from "@/hooks/useBillingApi";
import ThankYouModal from "@/components/checkout/ThankYouModal";
import { broadcastSubscriptionUpdated } from "@/lib/billingProfileRefresh";
import PricingPlanCard from "@/components/billing/PricingPlanCard";
import SubscribeCheckoutModal from "@/components/billing/SubscribeCheckoutModal";
import SubscriptionBillingPanel from "@/components/billing/SubscriptionBillingPanel";

export default function SubscriptionInfo() {
  const dispatch = useAppDispatch();
  const { plans } = useAppSelector((state) => state.pricing);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAppSelector((state) => state.auth);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [planSwitchTarget, setPlanSwitchTarget] = useState(null);

  const billingPlansQuery = useBillingPlans();
  const subscriptionQuery = useSubscriptionMe();
  const { refetch: refetchSubscription } = subscriptionQuery;
  const changePlanMutation = useChangeSubscriptionPlan();

  useEffect(() => {
    const refreshProfile = async () => {
      if (!token) return;
      try {
        const res = await apiClient({ url: "/auth/profile", token });
        if (res.success && res.user) {
          dispatch(updateProfile(res.user));
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    };
    refreshProfile();
  }, [token, dispatch]);

  useEffect(() => {
    if (searchParams.get("billing") !== "success") return;

    const refreshAfterCheckout = async () => {
      if (!token) return;
      try {
        const [res] = await Promise.all([
          apiClient({ url: "/auth/profile?refresh_subscription=1", token }),
          apiClient({ url: "/api/billing/subscription/me?refresh=1", token }),
        ]);
        await refetchSubscription();
        if (res.success && res.user) {
          dispatch(updateProfile(res.user));
          broadcastSubscriptionUpdated();
        }
      } catch (error) {
        console.error("Error refreshing profile after checkout:", error);
      } finally {
        setIsThankYouOpen(true);
        router.replace("/settings");
      }
    };

    refreshAfterCheckout();
  }, [searchParams, token, dispatch, router, refetchSubscription]);

  useEffect(() => {
    if (billingPlansQuery.data?.length) {
      dispatch(setPlans(billingPlansQuery.data));
    }
  }, [billingPlansQuery.data, dispatch]);

  const effectivePlans = billingPlansQuery.data?.length
    ? billingPlansQuery.data
    : plans;

  const sortedPlans = useMemo(
    () => sortPlansForDisplay(effectivePlans),
    [effectivePlans]
  );

  const userStatus = (user?.accountStatus || user?.account_status || "").toLowerCase();
  const isSubscribed = userStatus === ACCOUNT_STATUS.SUBSCRIBED;
  const checkoutMutation = useCreateCheckoutSession();

  const currentPlanKey = String(
    subscriptionQuery.data?.subscription?.subscriptionPlan ||
    user?.subscriptionPlan ||
    user?.subscription_plan ||
    ""
  ).trim().toLowerCase();
  const pendingPlanKey = String(
    subscriptionQuery.data?.subscription?.pendingPlanKey ||
    user?.pendingPlanKey ||
    user?.pending_plan_key ||
    ""
  ).trim().toLowerCase();
  const pendingPlanEffectiveAt =
    subscriptionQuery.data?.subscription?.pendingPlanEffectiveAt ||
    user?.pendingPlanEffectiveAt ||
    user?.pending_plan_effective_at;
  const currentPlan = useMemo(
    () => sortedPlans.find((plan) => getPlanKey(plan) === currentPlanKey) || null,
    [currentPlanKey, sortedPlans]
  );
  const subscriptionEndsAt =
    user?.subscriptionEndsAt ||
    user?.subscription_ends_at ||
    subscriptionQuery.data?.subscription?.subscriptionEndsAt;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleSwitchPlan = (plan) => {
    const planKey = getPlanKey(plan);
    if (!planKey) {
      toast.error("Selected plan is missing a plan key.");
      return;
    }
    if (planKey === currentPlanKey) return;

    setPlanSwitchTarget(plan);
  };

  const confirmSwitchPlan = async () => {
    const plan = planSwitchTarget;
    const planKey = getPlanKey(plan);
    if (!planKey || planKey === currentPlanKey) {
      setPlanSwitchTarget(null);
      return;
    }

    try {
      await changePlanMutation.mutateAsync(planKey);
      const res = await apiClient({ url: "/auth/profile", token });
      if (res.success && res.user) {
        dispatch(updateProfile(res.user));
      }
      await refetchSubscription();
      setPlanSwitchTarget(null);
    } catch {
      // toast handled in hook
    }
  };

  if (billingPlansQuery.isLoading && !effectivePlans.length) {
    return (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-text-heading">Subscription</div>
        <div className="text-sm text-text-body">Loading plans...</div>
      </div>
    );
  }

  if (!effectivePlans?.length) {
    return (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-text-heading">Subscription</div>
        <div className="text-sm text-text-body">
          No plans available. Please check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-border/50 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-text-heading">Subscription</h2>
            <StatusPill user={user} />
          </div>
          <StatusDetails user={user} subscription={subscriptionQuery.data?.subscription} />
        </div>
      </div>

      {isSubscribed ? (
        <p className="text-xs text-text-muted">
          Switch plans anytime — Stripe prorates the difference on your next bill.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          {sortedPlans?.map((plan) => {
              const planKey = getPlanKey(plan);
              const isCurrentPlan = isSubscribed && planKey === currentPlanKey;
              const isScheduledPlan = isSubscribed && pendingPlanKey && planKey === pendingPlanKey;
              const switchLabel = isCurrentPlan
                ? "Current plan"
                : isScheduledPlan
                  ? "Scheduled"
                : getPlanSwitchLabel(currentPlanKey, planKey);

              return (
              <div key={`plan-${plan.plan_key || plan.name}`} className="flex flex-1 min-w-0">
                <PricingPlanCard
                  plan={plan}
                  isCurrentPlan={isCurrentPlan}
                  isScheduledPlan={Boolean(isScheduledPlan)}
                  scheduledLabel={`Scheduled to start ${formatDate(pendingPlanEffectiveAt) || "next renewal"}`}
                  compact
                  showCta
                  onCardClick={
                    !isSubscribed && plan.stripe_price_configured
                      ? () => {
                          setSelectedPlanForModal(plan);
                          setIsModalOpen(true);
                        }
                      : isSubscribed && !isCurrentPlan && plan.stripe_price_configured
                        ? () => handleSwitchPlan(plan)
                        : null
                  }
                  cta={
                    isSubscribed
                      ? {
                          type: "button",
                          label: isCurrentPlan
                            ? "Current plan"
                            : isScheduledPlan
                              ? "Scheduled downgrade"
                            : plan.stripe_price_configured
                              ? switchLabel
                              : "Unavailable",
                          disabled:
                            isCurrentPlan ||
                            isScheduledPlan ||
                            !plan.stripe_price_configured ||
                            changePlanMutation.isPending,
                          onClick: () => handleSwitchPlan(plan),
                        }
                      : {
                          type: "button",
                          label: plan.stripe_price_configured ? "Subscribe" : "Unavailable",
                          disabled: !plan.stripe_price_configured,
                          onClick: () => {
                            if (!plan.stripe_price_configured) {
                              toast.error(`${plan.name} is not available for checkout yet.`);
                              return;
                            }
                            setSelectedPlanForModal(plan);
                            setIsModalOpen(true);
                          },
                        }
                  }
                />
              </div>
            );
          })}
      </div>

      {isSubscribed ? (
        <SubscriptionBillingPanel
          plans={effectivePlans}
          onCancelSuccess={async () => {
            const res = await apiClient({ url: "/auth/profile", token });
            if (res.success && res.user) {
              dispatch(updateProfile(res.user));
            }
            await refetchSubscription();
          }}
        />
      ) : null}

      <SubscribeCheckoutModal
        isOpen={isModalOpen}
        plan={selectedPlanForModal}
        isPaying={checkoutMutation.isPending}
        onClose={() => setIsModalOpen(false)}
        onPay={({ onSuccess, onError }) => {
          const planKey = getPlanKey(selectedPlanForModal);
          if (!planKey) {
            toast.error("Selected plan is missing a plan key.");
            return;
          }

          dispatch(setSelectedPlan(selectedPlanForModal));
          checkoutMutation.mutate(planKey, { onSuccess, onError });
        }}
      />

      <ThankYouModal isOpen={isThankYouOpen} onClose={() => setIsThankYouOpen(false)} />
      <PlanSwitchConfirmModal
        isOpen={Boolean(planSwitchTarget)}
        currentPlanName={planLabel(currentPlanKey)}
        currentPlan={currentPlan}
        targetPlan={planSwitchTarget}
        actionLabel={planSwitchTarget ? getPlanSwitchLabel(currentPlanKey, getPlanKey(planSwitchTarget)) : "Switch"}
        changeType={
          planSwitchTarget && getPlanTier(getPlanKey(planSwitchTarget)) > getPlanTier(currentPlanKey)
            ? "upgrade"
            : "downgrade"
        }
        effectiveAt={subscriptionEndsAt}
        isPending={changePlanMutation.isPending}
        onClose={() => setPlanSwitchTarget(null)}
        onConfirm={confirmSwitchPlan}
      />
    </div>
  );
}

const modalOverlayStyle = {
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

function PlanSwitchConfirmModal({
  isOpen,
  currentPlanName,
  currentPlan,
  targetPlan,
  actionLabel,
  changeType,
  effectiveAt,
  isPending,
  onClose,
  onConfirm,
}) {
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

  if (!mounted || !targetPlan) return null;

  const isUpgrade = changeType === "upgrade";
  const formatDate = (value) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };
  const effectiveDate = formatDate(effectiveAt);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed top-16 bottom-0 left-0 right-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:left-60"
          style={modalOverlayStyle}
        >
          <button
            type="button"
            aria-label="Close plan switch modal"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-transparent"
            style={modalOverlayStyle}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            style={modalOverlayStyle}
          >
            <div className="h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-heading">
                  {actionLabel} to {targetPlan.name}?
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  You are currently on the <span className="font-semibold text-text-heading">{currentPlanName}</span> plan.
                  {isUpgrade
                    ? " You are not charged the full new monthly price today. Stripe bills only the prorated difference for the rest of this billing cycle, then the full price on your next renewal."
                    : ` You will keep your current plan until ${effectiveDate || "the next renewal date"}, then the lower plan starts.`}
                </p>
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 text-sm text-text-body">
                  <p className="font-semibold text-text-heading">Plan change summary</p>
                  {currentPlan?.price ? (
                    <p className="mt-1 text-text-muted">
                      Current: <span className="font-semibold text-text-heading">{currentPlanName}</span>{" "}
                      at <span className="font-semibold text-text-heading">{currentPlan.price}</span>
                      <span className="text-text-muted">{currentPlan.period || "/month"}</span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-text-muted">
                    {isUpgrade ? "Starts now" : `Starts ${effectiveDate || "next renewal"}`}:{" "}
                    <span className="font-semibold text-primary">{targetPlan.name}</span>
                    {targetPlan.price ? (
                      <>
                        {" "}
                        at <span className="font-semibold text-primary">{targetPlan.price}</span>
                        <span className="text-text-muted">{targetPlan.period || "/month"}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-2 text-xs font-medium text-text-muted">
                    {isUpgrade
                      ? "Example: upgrading from $150 to $300 after 2 days usually charges about $140 today (not $300), because unused Basic time is credited against the remaining Standard days. Your renewal date stays the same."
                      : "No immediate charge. Your current plan remains active until the renewal date."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-md p-1 text-text-muted hover:bg-background-light hover:text-text-heading transition disabled:opacity-50"
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
                Keep current plan
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-60"
              >
                {isPending ? "Updating..." : isUpgrade ? `Pay and ${actionLabel}` : `Schedule ${actionLabel}`}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function StatusPill({ user }) {
  if (!user) return null;
  const status = (user.accountStatus || user.account_status || ACCOUNT_STATUS.FREE_TRIAL).toLowerCase();
  const plan = (user.subscriptionPlan || user.subscription_plan || "").toLowerCase();

  let label = "Active";
  let className = "bg-primary/10 text-primary";

  if (status === ACCOUNT_STATUS.FREE_TRIAL) {
    label = "Free Trial";
    className = "bg-amber-100 text-amber-700";
  } else if (status === ACCOUNT_STATUS.EXPIRED) {
    label = "Expired";
    className = "bg-red-100 text-red-700";
  } else if (status === ACCOUNT_STATUS.SUBSCRIBED) {
    label = `${planLabel(plan)} Plan`;
    className = "bg-emerald-100 text-emerald-700";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function StatusDetails({ user, subscription }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  const status = (user.accountStatus || user.account_status || ACCOUNT_STATUS.FREE_TRIAL).toLowerCase();
  const trialEnds = user.trialEndsAt || user.trial_ends_at;
  const subEnds = user.subscriptionEndsAt || user.subscription_ends_at || subscription?.subscriptionEndsAt;
  const plan = (user.subscriptionPlan || user.subscription_plan || "").toLowerCase();

  const formatDate = (value) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const getRemainingTime = (endTime) => {
    if (!endTime) return null;
    const ms = new Date(endTime).getTime() - now;
    if (ms <= 0) return "Expired";

    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  return (
    <div className="text-xs text-text-muted">
      {status === ACCOUNT_STATUS.FREE_TRIAL ? (
        <span>
          Trial active
          {trialEnds ? (
            <>
              {" · "}
              ends {formatDate(trialEnds)}
              <span className="ml-1.5 inline-flex rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-700">
                {getRemainingTime(trialEnds)} left
              </span>
            </>
          ) : null}
        </span>
      ) : null}

      {status === ACCOUNT_STATUS.EXPIRED ? (
        <span className="text-red-600">
          Trial ended — subscribe below to restore access.
        </span>
      ) : null}

      {status === ACCOUNT_STATUS.SUBSCRIBED ? (
        <span>
          {planLabel(plan)} plan
          {subEnds ? (
            <>
              {" · "}
              renews {formatDate(subEnds)}
            </>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
