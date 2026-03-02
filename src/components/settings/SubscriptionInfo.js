"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedPlan } from "@/store/selectedPlanSlice";
import { setPlans } from "@/store/pricingSlice";
import { updateProfile } from "@/store/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { useStrapiQuery } from "@/lib/strapi";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Building, Mail, User, Send, CreditCard, Plus, Loader2, Trash2 } from "lucide-react";
import FormField from "@/components/auth/FormField";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { ACCOUNT_STATUS, SUBSCRIPTION_PLAN } from "@/constants/features";
import { usePaymentMethods } from "@/hooks/useBillingApi";
import StripeProvider from "@/components/checkout/StripeProvider";
import PaymentForm from "@/components/checkout/PaymentForm";

export default function SubscriptionInfo() {
  const dispatch = useAppDispatch();
  const { plans } = useAppSelector((state) => state.pricing);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAppSelector((state) => state.auth);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // Enterprise Form State
  const [enterpriseData, setEnterpriseData] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [isEnterpriseSubmitting, setIsEnterpriseSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Payment Methods
  const paymentMethodsQuery = usePaymentMethods();

  // 1. Refresh user profile on mount to ensure status is accurate
  useEffect(() => {
    const refreshProfile = async () => {
      if (!token) return;
      try {
        const res = await apiClient({
          url: "/auth/profile",
          token,
        });
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
    const fetchStatus = async () => {
      if (!token) return;
      try {
        const res = await apiClient({
          url: "/api/billing/enterprise-status",
          token
        });
        setIsSubscribed(res.isSubscribed);
      } catch (error) {
        console.error("Error fetching enterprise status:", error);
      }
    };
    fetchStatus();
  }, [token]);

  const handleEnterpriseSubmit = async (e) => {
    e.preventDefault();
    if (!enterpriseData.name || !enterpriseData.email || !enterpriseData.company) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsEnterpriseSubmitting(true);
    try {
      await apiClient({
        url: "/api/billing/enterprise-inquiry",
        method: "POST",
        data: {
          name: enterpriseData.name,
          email: enterpriseData.email,
          company: enterpriseData.company
        },
        token
      });
      toast.success("Successfully joined the Enterprise waitlist!");
      setIsSubscribed(true);
      setEnterpriseData({ name: "", email: "", company: "" });
    } catch (error) {
      toast.error(error.message || "Failed to join waitlist");
    } finally {
      setIsEnterpriseSubmitting(false);
    }
  };

  const { data, isLoading } = useStrapiQuery({
    path: "/api/subscriptions?populate=*",
    cache: "force-cache",
  });

  const strapiPlans = useMemo(() => {
    const entries = data?.data || [];
    const toPopular = (value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === 1;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "yes";
      }
      return Boolean(value);
    };
    const getPriceId = (item) => {
      const attr = item?.attributes || {};
      return (
        item?.plan_Id ||
        attr.plan_Id ||
        item?.plan_id ||
        attr.plan_id ||
        item?.planId ||
        attr.planId ||
        item?.stripe_price_id ||
        attr.stripe_price_id ||
        item?.StripePriceId ||
        attr.StripePriceId ||
        item?.stripePriceId ||
        attr.stripePriceId ||
        item?.price_id ||
        attr.price_id ||
        item?.priceId ||
        attr.priceId ||
        item?.PriceId ||
        attr.PriceId ||
        null
      );
    };
    const getNumericAmount = (price) => {
      if (typeof price === "number") return price;
      const numeric = Number(String(price ?? "").replace(/[^0-9.]/g, ""));
      return Number.isNaN(numeric) ? 0 : numeric;
    };
    return entries.map((item) => {
      const attr = item?.attributes || {};
      const data = item?.attributes ? attr : item; // Fallback if already flattened

      return {
        name: data?.Name || "Plan",
        price: data?.Price ? `$${data.Price}` : "$0",
        period: "/month",
        description: data?.Description || "",
        amount: getNumericAmount(data?.Price),
        currency: data?.Currency || "usd",
        features:
          Array.isArray(data?.Features) && data.Features.length > 0
            ? data.Features.map((f) => f?.name).filter(Boolean)
            : [],
        popular: toPopular(data?.Popular),
        priceId: getPriceId(item),
        tags: Array.isArray(data?.Tags) ? data.Tags.map(t => t.tag_name) : [],
        trialDays:
          data?.trial_days ??
          data?.TrialDays ??
          data?.trialDays ??
          null,
        gradient: "from-primary to-primary-dark",
      };
    });
  }, [data]);

  useEffect(() => {
    if (strapiPlans.length > 0) {
      dispatch(setPlans(strapiPlans));
    }
  }, [strapiPlans, dispatch]);

  const effectivePlans = strapiPlans.length ? strapiPlans : plans;

  const sortedPlans = useMemo(() => {
    if (!effectivePlans?.length) return [];
    const priceValue = (plan) => {
      if (typeof plan?.price === "number") return plan.price;
      const numeric = Number(String(plan?.price || "").replace(/[^0-9.]/g, ""));
      return Number.isNaN(numeric) ? 0 : numeric;
    };
    const popularPlan = effectivePlans.find((plan) => plan?.popular) || null;
    const otherPlans = effectivePlans.filter((plan) => plan !== popularPlan);
    const sortedOthers = otherPlans.sort((a, b) => priceValue(a) - priceValue(b));

    if (!popularPlan) return sortedOthers;
    if (sortedOthers.length <= 1) return [...sortedOthers, popularPlan];

    const lower = sortedOthers[0];
    const higher = sortedOthers.slice(1);
    return [lower, popularPlan, ...higher];
  }, [effectivePlans]);

  const hasSavedCards = paymentMethodsQuery.data?.data?.length > 0;

  const handleOpenAddCard = async () => {
    if (hasSavedCards) return; // Safeguard if button somehow clicked
    setIsAddCardOpen(true);
    try {
      const res = await apiClient({
        url: API_ENDPOINTS.billing.setupIntent,
        method: "POST",
        token,
      });
      const secret = res?.client_secret || res?.clientSecret;
      if (secret) {
        setClientSecret(secret);
      } else {
        toast.error("Failed to initialize payment form.");
      }
    } catch (error) {
      toast.error("Failed to initialize payment form.");
    }
  };

  const handleAddCardSuccess = () => {
    setIsAddCardOpen(false);
    setClientSecret("");
    paymentMethodsQuery.refetch();
  };

  if (isLoading && !effectivePlans.length) {
    return (
      <div className="rounded-md border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-1">
          Subscription
        </div>
        <div className="text-sm text-text-body">Loading plans...</div>
      </div>
    );
  }

  if (!effectivePlans?.length) {
    return (
      <div className="rounded-md border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-1">
          Subscription
        </div>
        <div className="text-sm text-text-body">
          No plans available. Please check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account status summary */}
      <div className="rounded-md border border-border bg-background-light/60 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-heading">
              Account Status
            </div>
            <div className="text-xs text-text-muted">
              Trial, subscription, and plan information
            </div>
          </div>
          <StatusPill user={user} />
        </div>
        <StatusDetails user={user} />
        {searchParams.get("expired") === "1" ? (
          <div className="mt-2 text-xs text-red-600 font-semibold">
            Your trial has expired. Please subscribe to continue using Nesti.
          </div>
        ) : null}
      </div>
      {paymentMethodsQuery.data?.data?.length > 0 && (

        <div className="rounded-md border border-border bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-heading">
                Payment Methods
              </div>
              <div className="text-xs text-text-muted">
                View and manage your saved cards
              </div>
            </div>
            {!hasSavedCards && (
              <button
                onClick={handleOpenAddCard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} />
                Add Card
              </button>
            )}
          </div>

          {paymentMethodsQuery.isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              <span>Loading payment methods...</span>
            </div>
          ) : hasSavedCards ? (
            <div className="grid grid-cols-1 gap-2">
              {paymentMethodsQuery.data.data.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background-light/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-10 rounded bg-white border border-border flex items-center justify-center text-[8px] font-bold uppercase text-text-muted shadow-sm">
                      {pm.card?.brand || "Card"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-heading capitalize">
                        {pm.card?.brand} ending in {pm.card?.last4}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                      </div>
                    </div>
                  </div>
                  {/* <button className="text-text-muted hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center">
              <div className="flex justify-center mb-2 text-text-muted/40">
                <CreditCard size={32} />
              </div>
              <p className="text-xs text-text-muted">No saved payment methods found.</p>
            </div>
          )}
        </div>
      )}
      <div className="rounded-md flex flex-col gap- pb-8 ">
        <div className="flex flex-col justify-center mt-6 gap-8">
          {sortedPlans
            ?.filter((plan) => {
              const userStatus = (user?.accountStatus || user?.account_status || "").toLowerCase();
              const userPlan = (user?.subscriptionPlan || user?.subscription_plan || "").toLowerCase();
              if (userStatus === "subscribed" && userPlan) {
                return plan.name.toLowerCase().includes(userPlan);
              }
              return true;
            })
            .map((plan) => (
              <div
                key={`plan-${plan?.name}`}
                onClick={() => {
                  const userStatus = (user?.accountStatus || user?.account_status || "").toLowerCase();
                  if (userStatus === "subscribed") return;
                  setSelectedPlanForModal(plan);
                  setIsModalOpen(true);
                }}
                className={`group cursor-pointer w-full shadow-inner rounded-md relative md:p-8 flex flex-col gap-3 border py-5 p-2 text-sm transition-all duration-200 ${plan?.popular
                    ? "border-border/60 bg-white text-text-body hover:border-primary-dark/50"
                    : "border-border/60 bg-white text-text-body hover:border-primary-dark/50"
                  } ${(user?.accountStatus || user?.account_status || "").toLowerCase() === "subscribed"
                    ? "cursor-default border-primary/40 bg-primary/5"
                    : ""
                  }`}
              >
                <div className="flex justify-between items-center gap-1">
                  <div
                    className={`md:text-sm text-xs px-5 py-1 rounded-md font-semibold md:min-w-[120px] text-center shadow-inner ${plan?.popular
                        ? "bg-primary-dark/20 text-text-heading"
                        : "bg-primary-dark/20 text-text-heading"
                      }`}
                  >
                    {plan?.name}
                  </div>
                  <div
                    className={`md:text-sm text-xs px-5 py-1 rounded-md font-semibold md:min-w-[150px] text-center shadow-inner ${plan?.popular
                        ? "bg-primary-dark/20 text-text-heading"
                        : "bg-primary-dark/20 text-text-heading"
                      }`}
                  >
                    <div
                      className={`font-semibold ${plan?.popular ? "text-text-heading" : "text-text-heading"
                        }`}
                    >
                      {plan?.price} {plan?.period}
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                {Array.isArray(plan?.tags) && plan.tags.length > 0 && (
                  <div className="flex flex-wrap w-full md:pl-8 pl-2 absolute -top-4 left-1/2 -translate-x-1/2 gap-2 mt-1">
                    {plan.tags.map((tag, idx) => (
                      <div
                        key={idx}
                        className={`md:text-[10px] text-[8px] md:px-3 px-2 md:py-0.5 py-0 rounded-full font-medium md:font-semibold uppercase tracking-wider ${plan?.popular
                            ? "bg-primary text-white border border-primary/30"
                            : "bg-primary text-white border border-primary/30 "
                          }`}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Enterprise Waitlist Section */}
        <div className="mt-20 relative">
          <div className="absolute -top-10 left-0 right-0 h-px bg-border" />

          <div className="rounded-2xl border border-border bg-white p-1 shadow-xl">
            <div className="rounded-[calc(1rem-1px)] bg-white p-6 md:p-10">
              <div className="flex flex-col gap-6 items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                  <Building size={20} />
                  Enterprise Level
                </div>
                {isSubscribed ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-green-50/30 backdrop-blur-sm text-center space-y-4 h-full">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                      <Check size={32} strokeWidth={3} />
                    </div>
                    <h4 className="text-2xl font-bold text-text-heading">You&lsquo;re on the list!</h4>
                    <p className="text-text-body leading-relaxed ">
                      Thank you for your interest in Nesti Enterprise. Our team will contact you soon with exclusive early access and team capabilities.
                    </p>
                    <div className="pt-4">
                      <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        Application Received
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-extrabold text-text-heading leading-tight">
                        Get in list for our <span className="text-primary">Enterprise plan</span>
                      </h3>
                      <p className="text-text-body text-lg leading-relaxed">
                        Designed for teams, brokerages, and high-volume professionals who need custom AI personalities, multi-user CRM, and strategic insights.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {[
                          "Custom AI Personalities",
                          "Multi-user CRM Sync",
                          "Strategic Market Insights",
                          "Geographic Analytics",
                          "Priority 24/7 Support",
                          "Dedicated Account Manager"
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-text-body">
                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              <Check size={12} strokeWidth={3} />
                            </div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full shrink-0">
                      <form onSubmit={handleEnterpriseSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-background-light/30 backdrop-blur-sm">
                        <FormField
                          label="Full Name"
                          name="enterpriseName"
                          placeholder="John Doe"
                          icon={User}
                          value={enterpriseData.name}
                          onChange={(e) => setEnterpriseData({ ...enterpriseData, name: e.target.value })}
                          required
                        />
                        <FormField
                          label="Work Email"
                          name="enterpriseEmail"
                          type="email"
                          placeholder="john@brokerage.com"
                          icon={Mail}
                          value={enterpriseData.email}
                          onChange={(e) => setEnterpriseData({ ...enterpriseData, email: e.target.value })}
                          required
                        />
                        <FormField
                          label="Company"
                          name="enterpriseCompany"
                          placeholder="Nesti Realty"
                          icon={Building}
                          value={enterpriseData.company}
                          onChange={(e) => setEnterpriseData({ ...enterpriseData, company: e.target.value })}
                          required
                        />
                        <button
                          type="submit"
                          disabled={isEnterpriseSubmitting}
                          className="w-full mt-2 rounded-md bg-gradient-to-r from-primary to-primary-dark text-white py-4 font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          {isEnterpriseSubmitting ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                          {isEnterpriseSubmitting ? "Submitting..." : "Join the Waitlist"}
                        </button>
                        <p className="text-[10px] text-center text-text-muted px-4">
                          By joining, you agree to be contacted via email about Nesti&lsquo;s Enterprise features and early access.
                        </p>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && selectedPlanForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-background-light/30 px-6 py-4">
                <h3 className="text-xl font-bold text-text-heading">
                  {selectedPlanForModal.name}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-text-muted hover:bg-background-light hover:text-text-heading transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 md:space-y-6 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Description
                  </div>
                  <p className="text-text-body leading-relaxed">
                    {selectedPlanForModal.description || "No description available for this plan."}
                  </p>
                </div>

                <div className="rounded-lg bg-primary-dark/30 hover:shadow transition-all p-4 border border-border/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-heading">
                      {selectedPlanForModal.price}
                    </span>
                    <span className="text-sm text-text-muted">
                      {selectedPlanForModal.period}
                    </span>
                  </div>
                </div>

                {selectedPlanForModal.features?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Key Features
                    </div>
                    <ul className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-scroll py-3">
                      {selectedPlanForModal.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-body">
                          <div className="mt-1 rounded-full bg-primary/10 p-0.5 text-primary">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-border px-6 py-4 bg-background-light/10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-heading hover:bg-background-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    dispatch(setSelectedPlan(selectedPlanForModal));
                    router.push("/checkout");
                  }}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:brightness-105 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Continue to Checkout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddCardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddCardOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-heading">Add Payment Method</h3>
                <button onClick={() => setIsAddCardOpen(false)} className="text-text-muted hover:text-text-heading">
                  <X size={20} />
                </button>
              </div>

              <StripeProvider clientSecret={clientSecret}>
                {clientSecret ? (
                  <PaymentForm onPaymentMethodReady={handleAddCardSuccess} />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                )}
              </StripeProvider>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ user }) {
  if (!user) return null;
  const rawStatus =
    user.accountStatus || user.account_status || ACCOUNT_STATUS.FREE_TRIAL;
  const status = rawStatus.toLowerCase();
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
    if (plan === SUBSCRIPTION_PLAN.PRO) {
      label = "Pro Plan";
      className = "bg-purple-100 text-purple-700";
    } else if (plan === SUBSCRIPTION_PLAN.BASIC) {
      label = "Basic Plan";
      className = "bg-emerald-100 text-emerald-700";
    } else {
      label = "Subscribed";
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function StatusDetails({ user }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  const status =
    (user.accountStatus || user.account_status || ACCOUNT_STATUS.FREE_TRIAL)
      ?.toLowerCase() || ACCOUNT_STATUS.FREE_TRIAL;

  const trialEnds = user.trialEndsAt || user.trial_ends_at;
  const subEnds = user.subscriptionEndsAt || user.subscription_ends_at;
  const plan = (user.subscriptionPlan || user.subscription_plan || "").toLowerCase();

  const formatDate = (value) => {
    if (!value) return null;
    try {
      const d = new Date(value);
      return d.toLocaleDateString(undefined, {
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
    <div className="text-xs text-text-muted space-y-1 mt-2">
      {status === ACCOUNT_STATUS.FREE_TRIAL && (
        <>
          <div>
            Trial status:{" "}
            <span className="font-semibold text-text-heading">Active</span>
          </div>
          <div>
            Trial ends on:{" "}
            <span className="font-semibold text-text-heading">
              {formatDate(trialEnds) || "Unknown"}
            </span>
            {trialEnds && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                {getRemainingTime(trialEnds)} left
              </span>
            )}
          </div>
        </>
      )}

      {status === ACCOUNT_STATUS.EXPIRED && (
        <div className="text-red-600 font-medium">
          Your free trial has ended. Subscribe to unlock all Nesti features.
        </div>
      )}

      {status === ACCOUNT_STATUS.SUBSCRIBED && (
        <>
          <div>
            Current plan:{" "}
            <span className="font-semibold text-text-heading">
              {plan === SUBSCRIPTION_PLAN.PRO
                ? "Pro"
                : plan === SUBSCRIPTION_PLAN.BASIC
                  ? "Basic"
                  : "Unknown"}
            </span>
          </div>
          {subEnds ? (
            <div>
              Current billing period until:{" "}
              <span className="font-semibold text-text-heading">
                {formatDate(subEnds)}
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
