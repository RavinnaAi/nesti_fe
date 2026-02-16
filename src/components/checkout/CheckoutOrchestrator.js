"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { countries } from "countries-list";
import { useAppSelector } from "@/store";
import SelectDropdown from "@/components/ui/SelectDropdown";
import FormField from "@/components/auth/FormField";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  useCreateSetupIntent,
  useCreateSubscription,
  useCalculateTax,
} from "@/hooks/useBillingApi";
import { toast } from "react-toastify";
import StripeProvider from "./StripeProvider";
import PaymentForm from "./PaymentForm";

function getNumericPrice(plan) {
  if (!plan) return 0;
  if (typeof plan.price === "number") return plan.price;
  if (typeof plan.amount === "number") return plan.amount;
  const numeric = Number(String(plan.price || "").replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatUnixSeconds(seconds) {
  if (!seconds) return "";
  try {
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Multi-step Stripe checkout orchestrator:
 * 1. Plan selection (handled upstream on settings page)
 * 2. Billing & payment method collection
 * 3. Subscription confirmation
 */
export default function CheckoutOrchestrator() {
  const { isAuthenticated, token } = useAuthGuard();
  const { plan: selectedPlan } = useAppSelector((state) => state.selectedPlan);
  const { plans } = useAppSelector((state) => state.pricing);

  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [taxCalculation, setTaxCalculation] = useState(null);

  const [step, setStep] = useState(1); // 1: Billing, 2: Payment, 3: Confirmation

  const setupIntentMutation = useCreateSetupIntent();
  const createSubscriptionMutation = useCreateSubscription();
  const calculateTaxMutation = useCalculateTax();

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

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (clientSecret || setupIntentMutation.isLoading) return;

    setupIntentMutation.mutate(undefined, {
      onSuccess: (data) => {
        const secret = data?.client_secret || data?.clientSecret;
        if (secret) {
          setClientSecret(secret);
        } else {
          toast.error(
            "Missing client secret from billing setup-intent response."
          );
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, clientSecret]);

  const handleEstimateTax = () => {
    if (!activePlan) return;

    const amount = getNumericPrice(activePlan);
    if (!amount) {
      toast.error("Selected plan does not have a valid amount.");
      return;
    }
    if (!country || !postalCode) {
      toast.error("Please provide country and postal code for tax estimation.");
      return;
    }

    const payload = {
      amount,
      currency: activePlan?.currency || "usd",
      customer_details: {
        address: {
          country: country.toUpperCase(),
          state: stateRegion,
          postal_code: postalCode,
        },
        address_source: "shipping",
      },
    };

    calculateTaxMutation.mutate(payload, {
      onSuccess: (data) => {
        setTaxCalculation(data || null);
      },
    });
  };

  const handleCreateSubscription = () => {
    if (!activePlan) return;
    if (!paymentMethodId) {
      toast.error("Please save a payment method first.");
      setStep(2);
      return;
    }
    if (!activePlan.priceId) {
      toast.error("Selected plan is missing a Stripe price ID.");
      return;
    }

    createSubscriptionMutation.mutate(
      {
        priceId: activePlan.priceId,
        paymentMethodId,
        trialDays: activePlan.trialDays ?? undefined,
      },
      {
        onSuccess: (data) => {
          setSubscription(data || null);
          toast.success("Subscription created.");
          setStep(3);
        },
      }
    );
  };

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
          {/* Step 1: Billing + tax estimation */}
          <div className="rounded-md border border-border bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <div className="text-lg font-semibold text-text-heading">
                  Billing information
                </div>
                <div className="text-xs text-text-muted">
                  Provide your billing details to estimate taxes before
                  confirming.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <SelectDropdown
                  className="w-full"
                  label="Country"
                  placeholder="Select country"
                  options={countryOptions}
                  value={country}
                  onChange={setCountry}
                />
              </div>
              <div className="space-y-1">
                <FormField
                  label="State / Region"
                  name="stateRegion"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  onFocus={() => setFocusedField("stateRegion")}
                  onBlur={() => setFocusedField("")}
                  placeholder="CA"
                  focusedField={focusedField}
                />
              </div>
              <div className="space-y-1">
                <FormField
                  label="Postal code"
                  name="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  onFocus={() => setFocusedField("postalCode")}
                  onBlur={() => setFocusedField("")}
                  placeholder="94105"
                  focusedField={focusedField}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  handleEstimateTax();
                  setStep(2);
                }}
                disabled={calculateTaxMutation.isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background-light/60 text-sm font-semibold text-text-heading hover:border-primary hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {calculateTaxMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>Estimate tax & continue</span>
              </button>
              {taxCalculation ? (
                <div className="text-xs text-text-muted text-right">
                  <div>
                    Estimated tax:{" "}
                    <span className="font-semibold text-text-heading">
                      {typeof taxCalculation.amount_tax === "number"
                        ? `$${(taxCalculation.amount_tax / 100).toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    Estimated total:{" "}
                    <span className="font-semibold text-text-heading">
                      {typeof taxCalculation.amount_total === "number"
                        ? `$${(taxCalculation.amount_total / 100).toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Step 2: Payment method */}
          <div className="rounded-md border border-border bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <div>
                <div className="text-lg font-semibold text-text-heading">
                  Payment method
                </div>
                <div className="text-xs text-text-muted">
                  Add a card to start your subscription.
                </div>
              </div>
            </div>

            {step >= 2 ? (
              <StripeProvider clientSecret={clientSecret}>
                {setupIntentMutation.isLoading && !clientSecret ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing secure payment form...</span>
                  </div>
                ) : (
                  <PaymentForm onPaymentMethodReady={setPaymentMethodId} />
                )}
              </StripeProvider>
            ) : (
              <div className="text-xs text-text-muted">
                Complete billing details above to continue to payment.
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Confirmation / summary */}
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
                <span className="font-semibold text-text-heading">
                  {taxCalculation && typeof taxCalculation.amount_tax === "number"
                    ? `$${(taxCalculation.amount_tax / 100).toFixed(2)}`
                    : "$0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold text-text-heading">Total</span>
                <span className="font-bold text-text-heading">
                  {taxCalculation &&
                  typeof taxCalculation.amount_total === "number"
                    ? `$${(taxCalculation.amount_total / 100).toFixed(2)}`
                    : activePlan?.price || "$0"}
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

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCreateSubscription}
                disabled={
                  !paymentMethodId || createSubscriptionMutation.isLoading
                }
                className="w-full rounded-md bg-primary text-white py-2.5 text-sm font-semibold hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createSubscriptionMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>
                  {paymentMethodId
                    ? "Start subscription"
                    : "Save a payment method to continue"}
                </span>
              </button>

              {subscription ? (
                <div className="mt-2 rounded-md border border-border/70 bg-background-light/60 p-3 space-y-1 text-xs text-text-muted">
                  <div>
                    Status:{" "}
                    <span className="font-semibold text-text-heading">
                      {subscription.status || "unknown"}
                    </span>
                  </div>
                  {subscription.current_period_end ? (
                    <div>
                      Next billing date:{" "}
                      <span className="font-semibold text-text-heading">
                        {formatUnixSeconds(subscription.current_period_end)}
                      </span>
                    </div>
                  ) : null}
                  {subscription.invoice_url ? (
                    <div>
                      <a
                        href={subscription.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-semibold"
                      >
                        View last invoice
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

