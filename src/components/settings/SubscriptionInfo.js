"use client";

import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedPlan } from "@/store/selectedPlanSlice";
import { useRouter } from "next/navigation";

export default function SubscriptionInfo() {
  const dispatch = useAppDispatch();
  const { plans } = useAppSelector((state) => state.pricing);
  const router = useRouter();

  const activePlan = useMemo(() => {
    if (!plans?.length) return null;
    return plans.find((p) => p.popular) || plans[0];
  }, [plans]);

  if (!plans?.length) {
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

      <div className="rounded-xl bg-white shadow-sm">
        <div className="text-lg font-semibold mb-2 text-primary-dark">
          Available Plans
        </div>
        <div className="grid grid-cols-1 space-y-3 gap-3">
          {plans?.map((plan) => (
            <div
              key={`plan-${plan?.name}`}
              onClick={() => {
                dispatch(setSelectedPlan(plan));
                router.push("/checkout");
              }}
              className={`group cursor-pointer flex items-start justify-between rounded-lg border px-3 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                plan?.popular
                  ? "border-transparent bg-gradient-to-r from-primary to-primary-dark text-white"
                  : "border-border/60 bg-background-light/50 text-text-body hover:border-primary"
              }`}
            >
              <div className="space-y-3 pr-3">
                <div
                  className={`font-semibold ${
                    plan?.popular ? "text-white" : "text-primary-dark"
                  }`}
                >
                  {plan?.name}
                </div>
                <div
                  className={`text-xs ${
                    plan?.popular ? "text-white" : "text-text-muted"
                  }`}
                >
                  {plan?.description || "No description"}
                </div>
                {Array.isArray(plan?.features) && plan?.features?.length > 0 ? (
                  <ul
                    className={`mt-2 flex flex-wrap gap-4 Ditems-center justify-start text-xs ${
                      plan?.popular ? "text-white" : "text-text-muted"
                    }`}
                  >
                    {plan?.features?.map((feature) => (
                      <li
                        key={`${plan?.name}-${feature}`}
                        className="flex gap-2 items-center justify-start"
                      >
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
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul
                    className={`mt-2 space-y-1 flex flex-wrap items-center justify-start text-xs ${
                      plan?.popular ? "text-white" : "text-text-muted"
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
              <div className="text-right min-w-[200px]">
                <div
                  className={`font-semibold ${
                    plan?.popular ? "text-white" : "text-text-muted"
                  }`}
                >
                  {plan?.price} {plan?.period}
                </div>
                {plan?.popular ? (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/20 text-white">
                    Popular
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
