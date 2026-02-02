"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, CalendarDays, Shield } from "lucide-react";
import { countries } from "countries-list";
import { useAppSelector } from "@/store";
import FormField from "@/components/auth/FormField";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const paymentMethods = [{ id: "card", label: "Card" }];

export default function CheckoutClient() {
  const { isAuthenticated } = useAuthGuard();
  const { plan: selectedPlan } = useAppSelector((state) => state.selectedPlan);
  const { plans } = useAppSelector((state) => state.pricing);
  const [method, setMethod] = useState("card");
  const [country, setCountry] = useState("");

  const countryOptions = useMemo(
    () =>
      Object.entries(countries)
        .map(([code, info]) => ({
          value: code.toLowerCase(),
          label: info.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const activePlan = useMemo(() => {
    if (selectedPlan) return selectedPlan;
    if (plans?.length) return plans.find((p) => p.popular) || plans[0];
    return null;
  }, [plans, selectedPlan]);

  if (!isAuthenticated) {
    return null;
  }

  if (!activePlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-md border border-border bg-white p-6 shadow-sm text-center space-y-3">
          <div className="text-lg font-semibold text-text-heading">
            No plan selected
          </div>
          <div className="text-sm text-text-muted">
            Please choose a subscription plan first.
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:brightness-95 transition"
          >
            Go to Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md border border-border bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <div className="text-lg font-semibold text-text-heading">
                  Payment Method
                </div>
                <div className="text-xs text-text-muted">
                  Select how you want to pay
                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                    method === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-background-light/60 text-text-heading hover:border-primary/60"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div> */}

            {method === "card" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <FormField
                    label="Card number"
                    name="cardNumber"
                    placeholder="1234 1234 1234 1234"
                    icon={CreditCard}
                    className="bg-background-light/60"
                  />
                </div>
                <div className="space-y-1">
                  <FormField
                    label="Expiration date"
                    name="expiry"
                    placeholder="MM / YY"
                    icon={CalendarDays}
                    className="bg-background-light/60"
                  />
                </div>
                <div className="space-y-1">
                  <FormField
                    label="Security code"
                    name="cvc"
                    placeholder="CVC"
                    icon={Shield}
                    className="bg-background-light/60"
                  />
                </div>
                <div className="space-y-1">
                  <SelectDropdown
                    label="Country"
                    placeholder="Select country"
                    options={countryOptions}
                    value={country}
                    onChange={setCountry}
                  />
                </div>
                <button className="w-full mt-2 rounded-md bg-primary text-white py-3 font-semibold hover:brightness-95 transition">
                  Pay Now
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-md border border-border bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-text-heading">
                  Summary
                </div>
              </div>
              <div className="text-sm font-semibold text-text-heading">
                {activePlan?.price || "$0"}
                <div className="text-xs text-text-muted">
                  {activePlan?.period || "Monthly"}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border/70 bg-background-light/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-text-heading font-semibold">
                {activePlan?.name || "Selected Plan"}
              </div>
              <div className="text-xs text-text-muted">
                {activePlan?.description || "Plan details will appear here."}
              </div>
            </div>

            <div className="space-y-2 text-sm text-text-body">
              <div className="flex items-center justify-between">
                <span>Monthly</span>
                <span className="font-semibold text-text-heading">
                  {activePlan?.price || "$0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="font-semibold text-text-heading">$0.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold text-text-heading">Total</span>
                <span className="font-bold text-text-heading">
                  {activePlan?.price || "$0"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Your selected plan will be ready to use immediately.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>
                  You will receive an invoice by email with your details.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>You can change the plan at any time.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
