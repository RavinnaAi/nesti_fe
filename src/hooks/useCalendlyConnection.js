"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import {
  fetchCalendlyConnectUrl,
  fetchCalendarStatus,
  disconnectCalendly,
  registerCalendlyWebhook,
} from "@/lib/calendarClient";
import {
  CALENDLY_BILLING_URL,
  CALENDLY_PLAN_WEBHOOK_USER_MESSAGE,
  isCalendlyPlanWebhookBlock,
} from "@/lib/calendlyErrors";
import {
  CALENDLY_INTEGRATION_TOAST_ID,
  CALENDLY_OAUTH_RETURN_KEY,
  CALENDLY_OAUTH_WINDOW_NAME,
} from "@/lib/calendlyOAuthPopup";

const CALENDLY_POPUP_FEATURES =
  "popup=yes,width=560,height=720,scrollbars=yes,resizable=yes";

export function useCalendlyConnection() {
  const { token } = useAppSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const autoWebhookAttemptedRef = useRef("");
  const planRenewalToastKeyRef = useRef("");

  const statusQuery = useQuery({
    queryKey: ["calendar-status", token],
    queryFn: () => fetchCalendarStatus({ token }),
    enabled: Boolean(token),
    staleTime: 30_000,
  });

  const cal = statusQuery.data?.status?.find((r) => r.provider === "calendly");
  const connected = Boolean(cal);
  const webhookActive = Boolean(cal?.calendly_webhook_registered_at);
  const webhookError = Boolean(cal?.calendly_webhook_register_error);
  const planBlocked = Boolean(cal && isCalendlyPlanWebhookBlock(cal));
  const allGood = connected && webhookActive && !webhookError;

  const registerWebhookMut = useMutation({
    mutationFn: () => registerCalendlyWebhook({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-status", token] });
    },
    onError: (e) => {
      const msg = e?.message || "Calendly webhook registration failed.";
      toast.error(msg, { toastId: `${CALENDLY_INTEGRATION_TOAST_ID}-webhook` });
    },
  });

  useEffect(() => {
    if (!token) return;
    if (!connected) {
      autoWebhookAttemptedRef.current = "";
      return;
    }
    if (allGood || planBlocked) return;
    // If there is already a stored webhook error, don't hammer Calendly on every mount.
    if (webhookError) return;
    if (registerWebhookMut.isPending) return;
    const key = `${String(token).slice(0, 12)}::${String(cal?.updatedAt || cal?.account_email || "")}`;
    if (autoWebhookAttemptedRef.current === key) return;
    autoWebhookAttemptedRef.current = key;
    registerWebhookMut.mutate();
  }, [
    token,
    connected,
    allGood,
    planBlocked,
    webhookError,
    cal?.updatedAt,
    cal?.account_email,
    registerWebhookMut,
  ]);

  useEffect(() => {
    if (!token || !connected || !planBlocked) return;
    const key = `${String(token).slice(0, 12)}::${String(cal?.updatedAt || cal?.account_email || "")}`;
    if (planRenewalToastKeyRef.current === key) return;
    planRenewalToastKeyRef.current = key;
    toast.warn(
      `${CALENDLY_PLAN_WEBHOOK_USER_MESSAGE} Renew or upgrade your Calendly subscription to resume booking sync. ${CALENDLY_BILLING_URL}`,
      { toastId: `${CALENDLY_INTEGRATION_TOAST_ID}-renewal` }
    );
  }, [token, connected, planBlocked, cal?.updatedAt, cal?.account_email]);

  const startCalendlyOAuth = useCallback(async () => {
    setConnecting(true);
    try {
      try {
        const path = `${window.location.pathname}${window.location.search}`;
        sessionStorage.setItem(CALENDLY_OAUTH_RETURN_KEY, path || "/dashboard");
      } catch {
        /* ignore */
      }

      const data = await fetchCalendlyConnectUrl({ token });
      const url = data?.authUrl;
      if (!url || typeof url !== "string") {
        toast.error("Could not start Calendly connection.", {
          toastId: CALENDLY_INTEGRATION_TOAST_ID,
        });
        return;
      }
      // Popup keeps the main SPA mounted; same-tab assign would tear down the whole app on return.
      const popup = window.open(url, CALENDLY_OAUTH_WINDOW_NAME, CALENDLY_POPUP_FEATURES);
      if (!popup) {
        toast.info("Popup blocked — continuing Calendly sign-in in this tab.", {
          toastId: CALENDLY_INTEGRATION_TOAST_ID,
        });
        window.location.assign(url);
      } else {
        try {
          popup.focus();
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      toast.error(e?.message || "Failed to start Calendly connection", {
        toastId: CALENDLY_INTEGRATION_TOAST_ID,
      });
    } finally {
      setConnecting(false);
    }
  }, [token]);

  const disconnectMut = useMutation({
    mutationFn: () => disconnectCalendly({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-status", token] });
      toast.success("Calendly disconnected.", {
        toastId: CALENDLY_INTEGRATION_TOAST_ID,
      });
    },
    onError: (e) =>
      toast.error(e?.message || "Could not disconnect", {
        toastId: CALENDLY_INTEGRATION_TOAST_ID,
      }),
  });

  return {
    token,
    statusQuery,
    cal,
    connected,
    webhookActive,
    webhookError,
    planBlocked,
    allGood,
    connecting,
    startCalendlyOAuth,
    disconnectMut,
    registerWebhookMut,
  };
}
