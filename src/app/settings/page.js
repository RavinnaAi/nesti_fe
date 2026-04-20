"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import PersonalInfo from "@/components/settings/PersonalInfo";
import ChangePassword from "@/components/settings/ChangePassword";
import SubscriptionInfo from "@/components/settings/SubscriptionInfo";
import ChatbotEmbed from "@/components/settings/ChatbotEmbed";
import BusinessInformation from "@/components/settings/BusinessInformation";
import IcpIntegrationCard from "@/components/settings/IcpIntegrationCard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { toast } from "react-toastify";
import { SkeletonBlock } from "@/components/ui/ContentSkeletons";

const VALID_TABS = ["personal", "business", "icp", "password", "subscription", "chatbot"];

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
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
