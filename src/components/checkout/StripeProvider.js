"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

/**
 * Wraps children with Stripe Elements once a client secret is available.
 */
export default function StripeProvider({ clientSecret, children }) {
  const [stripePromise, setStripePromise] = useState(null);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
      },
    }),
    [clientSecret]
  );

  useEffect(() => {
    // Important: initialize Stripe lazily only when this provider is actually rendered.
    // This avoids Stripe telemetry calls on unrelated pages/tabs.
    if (!clientSecret || !publishableKey || typeof window === "undefined") return;
    let cancelled = false;
    loadStripe(publishableKey).then((stripe) => {
      if (!cancelled) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientSecret, publishableKey]);

  if (!publishableKey) {
    return (
      <div className="text-sm text-red-600">
        Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  if (!clientSecret) {
    if (typeof window !== "undefined") {
      console.warn("StripeProvider: No clientSecret provided.");
    }
    return (
      <div className="text-sm text-red-600">
        Failed to initialize payment form. Please refresh the page and try again.
      </div>
    );
  }

  if (!stripePromise) {
    return <div className="text-sm text-text-muted">Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

