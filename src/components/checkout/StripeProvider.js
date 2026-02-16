"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise =
  typeof window === "undefined"
    ? null
    : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

/**
 * Wraps children with Stripe Elements once a client secret is available.
 */
export default function StripeProvider({ clientSecret, children }) {
  if (!stripePromise) {
    return (
      <div className="text-sm text-red-600">
        Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-sm text-red-600">
        Failed to initialize payment form. Please refresh the page and try again.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
        },
      }}
    >
      {children}
    </Elements>
  );
}

