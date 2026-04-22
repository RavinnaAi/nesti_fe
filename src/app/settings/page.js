"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import PersonalInfo from "@/components/settings/PersonalInfo";
import ChangePassword from "@/components/settings/ChangePassword";
import SubscriptionInfo from "@/components/settings/SubscriptionInfo";
import ChatbotEmbed from "@/components/settings/ChatbotEmbed";
import BusinessInformation from "@/components/settings/BusinessInformation";
import IcpIntegrationCard from "@/components/settings/IcpIntegrationCard";
import LeadsPipelineSettings from "@/components/settings/LeadsPipelineSettings";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { toast } from "react-toastify";
import { SkeletonBlock } from "@/components/ui/ContentSkeletons";
import {
  CALENDLY_INTEGRATION_TOAST_ID,
  CALENDLY_OAUTH_BROADCAST_CHANNEL,
  CALENDLY_OAUTH_MESSAGE_SOURCE,
  CALENDLY_OAUTH_WINDOW_NAME,
} from "@/lib/calendlyOAuthPopup";

const VALID_TABS = ["personal", "business", "icp", "password", "subscription", "chatbot", "leads"];

function SettingsPageFallback() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4" aria-busy="true" aria-label="Loading settings">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <SkeletonBlock className="h-6 w-48 max-w-full" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <SkeletonBlock className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function SettingsPageContent() {
  const { isAuthenticated } = useAuthGuard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const calendlyReturnHandled = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const calendly = searchParams.get("calendly");
    if (calendly === "connected" || calendly === "error") {
      const key = searchParams.toString();
      if (calendlyReturnHandled.current === key) return;
      calendlyReturnHandled.current = key;

      if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel(CALENDLY_OAUTH_BROADCAST_CHANNEL);
          if (calendly === "connected") {
            bc.postMessage({ source: CALENDLY_OAUTH_MESSAGE_SOURCE, result: "connected" });
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
            bc.postMessage({ source: CALENDLY_OAUTH_MESSAGE_SOURCE, result: "error", message });
          }
          bc.close();
        } catch {
          /* ignore */
        }
      } else if (typeof window !== "undefined") {
        if (calendly === "connected") {
          toast.success("Calendly connected.", { toastId: CALENDLY_INTEGRATION_TOAST_ID });
        } else {
          const reason = searchParams.get("reason");
          try {
            const msg = reason
              ? decodeURIComponent(reason)
              : "Calendly connection did not complete.";
            toast.error(msg, { toastId: CALENDLY_INTEGRATION_TOAST_ID });
          } catch {
            toast.error("Calendly connection did not complete.", {
              toastId: CALENDLY_INTEGRATION_TOAST_ID,
            });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
      }

      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.focus();
        } catch {
          /* ignore */
        }
      }

      const shouldTryClose =
        typeof window !== "undefined" &&
        (window.name === CALENDLY_OAUTH_WINDOW_NAME || Boolean(window.opener));

      if (shouldTryClose) {
        try {
          window.close();
        } catch {
          /* ignore */
        }
      }

      const next = new URLSearchParams(searchParams.toString());
      next.delete("calendly");
      next.delete("reason");
      const q = next.toString();
      const cleanUrl = q ? `${pathname}?${q}` : pathname;

      const t =
        typeof window !== "undefined"
          ? window.setTimeout(() => {
              if (!window.closed) {
                router.replace(cleanUrl, { scroll: false });
              }
            }, 0)
          : 0;
      return () => {
        if (t) window.clearTimeout(t);
      };
    }
  }, [searchParams, pathname, router, queryClient]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const upgrade = searchParams.get("upgrade");
    const expired = searchParams.get("expired");

    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("personal");
    }

    if (upgrade === "1") {
      toast.info("Upgrade is required to access this feature.");
    } else if (expired === "1") {
      toast.warning("Your trial has expired. Please subscribe to continue.");
    }
  }, [searchParams]);

  const ActiveComponent = useMemo(() => {
    switch (activeTab) {
      case "personal":
        return PersonalInfo;
      case "password":
        return ChangePassword;
      case "subscription":
        return SubscriptionInfo;
      case "chatbot":
        return ChatbotEmbed;
      case "business":
        return BusinessInformation;
      case "icp":
        return IcpIntegrationCard;
      case "leads":
        return LeadsPipelineSettings;
      default:
        return PersonalInfo;
    }
  }, [activeTab]);

  const Content = ActiveComponent;

  if (!isMounted) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            <Content />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
