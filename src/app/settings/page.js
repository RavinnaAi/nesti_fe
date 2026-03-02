"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  CreditCard,
  Code2,
  Building,
  Copy,
  Share2,
} from "lucide-react";
import PersonalInfo from "@/components/settings/PersonalInfo";
import ChangePassword from "@/components/settings/ChangePassword";
import SubscriptionInfo from "@/components/settings/SubscriptionInfo";
import ChatbotEmbed from "@/components/settings/ChatbotEmbed";
import BusinessInformation from "@/components/settings/BusinessInformation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import SidebarTabs from "@/components/ui/SidebarTabs";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { useSearchParams } from "next/navigation";

const tabs = [
  { id: "personal", label: "Personal Information", icon: User },
  { id: "business", label: "Business Information", icon: Building },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "chatbot", label: "Embed Chatbot", icon: Code2 },
];

export default function SettingsPage() {
  const { isAuthenticated } = useAuthGuard();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const tab = searchParams.get("tab");
    const upgrade = searchParams.get("upgrade");
    const expired = searchParams.get("expired");

    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab);
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
      default:
        return PersonalInfo;
    }
  }, [activeTab]);

  const Content = ActiveComponent;

  const activeMeta = tabs.find((t) => t.id === activeTab);
  const { user } = useAppSelector((state) => state.auth);
  const ActiveIcon = activeMeta?.icon;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-3 relative">
          <SidebarTabs
            tabs={tabs}
            activeId={activeTab}
            onChange={setActiveTab}
            stickyTop={stickyTop}
            activeClassName="bg-primary-dark text-white"
            inactiveClassName="text-text-heading hover:bg-primary/5"
            activeIconClassName="bg-white/20 text-white"
            inactiveIconClassName="bg-background-light"
          />
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <div className="rounded-md border border-border bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                {ActiveIcon ? <ActiveIcon size={18} /> : null}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-text-heading">
                  {activeMeta?.label || "Profile Information"}
                </div>
                <div className="text-sm text-text-body">
                  Manage your account preferences
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const link =
                      (typeof window !== "undefined"
                        ? window.location.origin
                        : "") + `/profile?email=${user?.email}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      toast.success("Link copied to clipboard");
                    } catch (err) {
                      toast.error("Failed to copy link");
                    }
                  }}
                  className="h-10 w-10 rounded-md bg-background-light hover:bg-primary/10 flex items-center justify-center border border-border transition"
                  aria-label="Copy public link"
                >
                  <Copy size={16} className="text-text-heading" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const link =
                      (typeof window !== "undefined"
                        ? window.location.origin
                        : "") + `/profile?email=${user?.email}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      toast.success("Share link copied to clipboard");
                    } catch (err) {
                      toast.error("Failed to copy link");
                    }
                  }}
                  className="h-10 w-10 rounded-md bg-background-light hover:bg-primary/10 flex items-center justify-center border border-border transition"
                  aria-label="Share"
                >
                  <Share2 size={16} className="text-text-heading" />
                </button>
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
