"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { openCheckoutPlaceholderWindow, openStripeCheckoutInNewTab } from "@/hooks/useBillingApi";

const overlayStyle = {
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export default function SubscribeCheckoutModal({
  isOpen,
  plan,
  isPaying = false,
  onClose,
  onPay,
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

  if (!mounted || !plan) return null;

  const handlePay = () => {
    const payWindow = openCheckoutPlaceholderWindow();
    if (!payWindow) {
      toast.error("Pop-ups are blocked. Allow pop-ups for this site, or checkout will open here.");
    }

    onPay?.({
      onSuccess: (data) => {
        if (openStripeCheckoutInNewTab(data, payWindow)) {
          onClose?.();
          if (payWindow) {
            toast.info("Complete payment in the new tab. You can keep working here.");
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

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed top-16 bottom-0 left-0 right-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:left-60"
          style={overlayStyle}
        >
          <button
            type="button"
            aria-label="Close checkout modal"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-transparent"
            style={overlayStyle}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscribe-checkout-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-[22rem] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            style={overlayStyle}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
              <div className="min-w-0">
                <h3 id="subscribe-checkout-title" className="text-lg font-bold text-text-heading">
                  {plan.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-text-muted line-clamp-2">
                  {plan.description || "Monthly subscription"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPaying}
                className="shrink-0 rounded-full p-1 text-text-muted transition hover:bg-background-light hover:text-text-heading disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="mb-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-primary">{plan.price}</span>
                <span className="text-sm font-medium text-text-muted">{plan.period}</span>
              </div>

              {plan.features?.length > 0 ? (
                <ul className="space-y-1.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-text-body">
                      <Check size={13} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex gap-2 border-t border-border/60 bg-background-light/40 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPaying}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading transition hover:bg-background-light disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
              >
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Pay {plan.price}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
