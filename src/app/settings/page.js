"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, CreditCard, Code2, Building } from "lucide-react";
import PersonalInfo from "@/components/settings/PersonalInfo";
import ChangePassword from "@/components/settings/ChangePassword";
import SubscriptionInfo from "@/components/settings/SubscriptionInfo";
import ChatbotEmbed from "@/components/settings/ChatbotEmbed";
import BusinessInformation from "@/components/settings/BusinessInformation";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const tabs = [
  { id: "personal", label: "Personal Information", icon: User },
  { id: "business", label: "Business Information", icon: Building },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "chatbot", label: "Embed Chatbot", icon: Code2 },
];

export default function SettingsPage() {
  const { isAuthenticated } = useAuthGuard();
  const [activeTab, setActiveTab] = useState("personal");
  const [stickyTop, setStickyTop] = useState("0");

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = typeof window !== "undefined" && window.scrollY > 0;
      setStickyTop(isScrolled ? "15%" : "0");
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
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
      default:
        return PersonalInfo;
    }
  }, [activeTab]);

  const Content = ActiveComponent;

  const activeMeta = tabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeMeta?.icon;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-3 relative">
          <div
            className="rounded-2xl border border-border transition-all duration-800 bg-white shadow-sm p-2 space-y-1 sticky"
            style={{ top: stickyTop }}
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-heading hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-background-light"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="text-left">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {ActiveIcon ? <ActiveIcon size={18} /> : null}
              </div>
              <div>
                <div className="text-xl font-bold text-text-heading">
                  {activeMeta?.label || "Profile Information"}
                </div>
                <div className="text-sm text-text-body">
                  Manage your account preferences
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <Content />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
