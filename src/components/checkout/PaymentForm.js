"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Reusable payment form that confirms a SetupIntent and reports back
 * the resulting payment_method ID to the parent orchestrator.
 */
export default function PaymentForm({ onPaymentMethodReady }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to save payment method.");
        return;
      }

      const setupIntent = result.setupIntent;
      if (setupIntent?.status === "succeeded" && setupIntent.payment_method) {
        onPaymentMethodReady(setupIntent.payment_method);
        toast.success("Payment method saved.");
      } else {
        toast.error("Unable to confirm payment method. Please try again.");
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="rounded-md border border-border/70 bg-background-light/60 p-4"
        style={{ minHeight: "250px" }}
      >
        <PaymentElement options={{ paymentMethodOrder: ['card'] }} />
        {!stripe || !elements ? (
          <div className="flex items-center justify-center p-8 text-sm text-text-muted gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading payment options...</span>
          </div>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !stripe || !elements}
        className="w-full mt-2 rounded-md bg-primary text-white py-3 font-semibold hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>Save payment method</span>
      </button>
    </form>
  );
}

