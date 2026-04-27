"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CALENDLY_OAUTH_BROADCAST_CHANNEL,
  CALENDLY_OAUTH_MESSAGE_SOURCE,
  CALENDLY_OAUTH_RETURN_KEY,
  CALENDLY_OAUTH_WINDOW_NAME,
  safeCalendlyReturnPath,
} from "@/lib/calendlyOAuthPopup";

function broadcastResult(result, message) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const bc = new BroadcastChannel(CALENDLY_OAUTH_BROADCAST_CHANNEL);
    bc.postMessage({ source: CALENDLY_OAUTH_MESSAGE_SOURCE, result, message });
    bc.close();
  } catch {
    /* ignore */
  }
}

function CalendlyCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [returnHint, setReturnHint] = useState("/dashboard");

  useEffect(() => {
    const calendly = searchParams.get("calendly");
    if (calendly !== "connected" && calendly !== "error") {
      router.replace("/dashboard");
      return;
    }

    let stored = null;
    try {
      stored = sessionStorage.getItem(CALENDLY_OAUTH_RETURN_KEY);
      sessionStorage.removeItem(CALENDLY_OAUTH_RETURN_KEY);
    } catch {
      /* ignore */
    }
    const returnTo = safeCalendlyReturnPath(stored);
    setReturnHint(returnTo);

    if (calendly === "connected") {
      broadcastResult("connected");
    } else {
      const reason = searchParams.get("reason");
      let message = "Calendly connection did not complete.";
      if (reason) {
        try {
          message = decodeURIComponent(reason);
        } catch {
          /* keep default */
        }
      }
      broadcastResult("error", message);
    }

    const isOAuthPopup =
      window.name === CALENDLY_OAUTH_WINDOW_NAME || Boolean(window.opener);

    const t = window.setTimeout(() => {
      if (isOAuthPopup) {
        try {
          window.close();
        } catch {
          /* ignore */
        }
        if (!window.closed) {
          router.replace(returnTo);
        }
      } else {
        router.replace(returnTo);
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm rounded-xl border border-border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <h1 className="text-sm font-semibold text-text-heading">Finishing Calendly sign-in…</h1>
        <p className="mt-1 text-xs text-text-muted">
          Taking you back to your workspace. If nothing happens,{" "}
          <a href={returnHint} className="font-semibold text-primary underline">
            continue here
          </a>
          .
        </p>
      </div>
    </main>
  );
}

export default function CalendlyCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      }
    >
      <CalendlyCallbackInner />
    </Suspense>
  );
}
