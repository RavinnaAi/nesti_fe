"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedPlan } from "@/store/selectedPlanSlice";
import { setPlans } from "@/store/pricingSlice";
import { useRouter } from "next/navigation";
import { useStrapiQuery } from "@/lib/strapi";

export default function SubscriptionInfo() {
  const dispatch = useAppDispatch();
  const { plans } = useAppSelector((state) => state.pricing);
  const router = useRouter();

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
    return entries.map((item) => ({
      name: item?.Name || "Plan",
      price: item?.Price ? `$${item.Price}` : "$0",
      period: "/month",
      description: item?.Description || "",
      features:
        Array.isArray(item?.Features) && item.Features.length > 0
          ? item.Features.map((f) => f?.name).filter(Boolean)
          : [],
      popular: toPopular(item?.Popular),
      gradient: "from-primary to-primary-dark",
    }));
  }, [data]);

  useEffect(() => {
    if (!plans?.length && strapiPlans.length) {
      dispatch(setPlans(strapiPlans));
    }
  }, [plans?.length, strapiPlans, dispatch]);

  const effectivePlans = plans?.length ? plans : strapiPlans;

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

  const activePlan = useMemo(() => {
    if (!effectivePlans?.length) return null;
    return effectivePlans.find((p) => p.popular) || effectivePlans[0];
  }, [effectivePlans]);

  if (isLoading && !effectivePlans.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-1">
          Subscription
        </div>
        <div className="text-sm text-text-body">Loading plans...</div>
      </div>
    );
  }

  if (!effectivePlans?.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
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
      {/* <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-heading">
              Current Plan
            </div>
            <div className="text-xs text-text-muted">
              {activePlan?.name || "Plan"} • Billed monthly
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            Active
          </span>
        </div>
        <div className="mt-3 text-sm text-text-body">
          Price: {activePlan?.price || "$0"} {activePlan?.period || ""}
        </div>
      </div> */}

      <div className="rounded-xl flex flex-col gap-6 pb-8 ">
        <div className="text-lg font-semibold mb-2 text-primary-dark">
          Available Plans
        </div>
        <div className="flex flex-wrap items-center justify-center md:gap-3 gap-10">
          {sortedPlans?.map((plan) => (
            <div
              key={`plan-${plan?.name}`}
              onClick={() => {
                dispatch(setSelectedPlan(plan));
                router.push("/checkout");
              }}
              className={`group cursor-pointer w-full md:flex-1 md:min-w-[32%] shadow-inner rounded-lg relative py-8 flex flex-col justify-center items-center gap-3 border p-2 text-sm transition-all duration-200 ${plan?.popular
                ? "border-transparent bg-gradient-to-r from-primary to-primary-dark text-white"
                : "border-border/60 bg-white hover:bg-primary-dark/80 text-text-body hover:border-primary-dark/50"
                }`}
            >

              <div className="flex items-center flex-col gap-1 justify-center">
                <div className={`text-sm px-5 py-1 rounded-full font-semibold min-w-[120px] text-center absolute -top-3.5 left-1/2 shadow-inner -translate-x-1/2 ${plan?.popular ? "bg-background-lighter2 text-primary-dark" : "border-transparent bg-gradient-to-r from-primary to-primary-dark text-white"
                  }`}>{plan?.name}</div>
                <div
                  className={`text-xs ${plan?.popular ? "text-white" : "text-text-muted group-hover:text-white"
                    } text-center`}
                >
                  {plan?.description || "No description"}
                </div>
              </div>

              <div className="space-y-3 ">
                {Array.isArray(plan?.features) && plan?.features?.length > 0 ? (
                  <ul
                    className={`flex flex-wrap gap-3 items-center justify-center align-middle text-xs ${plan?.popular ? "text-white" : "text-text-muted"
                      }`}
                  >
                    {plan?.features?.slice(0, 8).map((feature, index) => (
                      <li
                        key={`${plan?.name}-${feature}`}
                        className="text-center items-center justify-center"
                      >
                        <span
                          className={
                            plan?.popular ? "text-white" : "text-text-body group-hover:text-white"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul
                    className={`mt-2 space-y-1 flex flex-wrap items-center justify-start text-xs ${plan?.popular ? "text-white" : "text-text-muted"
                      }`}
                  >
                    <li className="flex gap-2 items-center justify-start">
                      <span
                        className={
                          plan?.popular ? "text-white" : "text-primary"
                        }
                      >
                        •
                      </span>
                      <span
                        className={
                          plan?.popular ? "text-white" : "text-text-body"
                        }
                      >
                        No features
                      </span>
                    </li>
                  </ul>
                )}
              </div>
              <div className={`text-sm px-5 py-1 rounded-full font-semibold min-w-[150px] text-center absolute -bottom-3.5 left-1/2 shadow-inner -translate-x-1/2 ${plan?.popular ? "bg-background-lighter2 text-primary-dark" : "border-transparent bg-gradient-to-r from-primary to-primary-dark text-white"
                }`}>
                <div
                  className={`font-semibold ${plan?.popular ? "text-primary-dark" : "text-white"
                    }`}
                >
                  {plan?.price} {plan?.period}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
