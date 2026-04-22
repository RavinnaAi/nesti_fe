"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Users,
  UserRound,
  BarChart3,
  ClipboardList,
  Code2,
  Settings,
  CreditCard,
  Lock,
  Building2,
  User,
  Target,
  LogOut,
  ChevronDown,
  X,
  ListFilter,
  GitBranch,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";
import LeadsPipelineSidebarNav from "@/components/leads/LeadsPipelineSidebarNav";

const PRIMARY_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", href: "/leads", icon: Users },
  { id: "clients", label: "Clients", href: "/clients", icon: UserRound },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "logs", label: "Logs", href: "/nurture-logs", icon: ClipboardList },
  { id: "chatbot", label: "Chatbot", href: "/settings?tab=chatbot", icon: Code2 },
  { id: "checkout", label: "Checkout", href: "/checkout", icon: CreditCard },
];

const SETTINGS_ITEMS = [
  { id: "personal", label: "Personal Information", tab: "personal", icon: User },
  { id: "business", label: "Business Information", tab: "business", icon: Building2 },
  { id: "icp", label: "Ideal Client Profile", tab: "icp", icon: Target },
  { id: "password", label: "Change Password", tab: "password", icon: Lock },
  { id: "subscription", label: "Subscription", tab: "subscription", icon: CreditCard },
  { id: "leads_pipeline", label: "Leads pipeline", tab: "leads", icon: ListFilter },
];

function isPrimaryNavActive(pathname, href, searchParams) {
  const q = href.indexOf("?");
  const cleanHref = q === -1 ? href : href.slice(0, q);
  if (cleanHref === "/") return pathname === "/";
  const pathMatches = pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  if (!pathMatches) return false;
  if (q === -1) return true;
  const wanted = new URLSearchParams(href.slice(q + 1));
  for (const [key, val] of wanted.entries()) {
    if ((searchParams?.get(key) ?? "") !== val) return false;
  }
  return true;
}

export default function AppSidebar({ isMobileOpen, onCloseMobile }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const settingsTab = searchParams?.get("tab") || "";
  const settingsTabSet = useMemo(
    () => new Set(SETTINGS_ITEMS.map((item) => item.tab)),
    []
  );
  const isSettingsRoute = pathname === "/settings";
  const isSettingsActive =
    isSettingsRoute && (!settingsTab || settingsTabSet.has(settingsTab));

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pipelineNavOpen, setPipelineNavOpen] = useState(false);

  const isLeadsArea = pathname === "/leads" || pathname.startsWith("/leads/");

  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
    else setSettingsOpen(false);
  }, [isSettingsActive]);

  useEffect(() => {
    if (!isLeadsArea) setPipelineNavOpen(false);
  }, [isLeadsArea]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onCloseMobile?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, onCloseMobile]);

  useEffect(() => {
    if (!isMobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "User";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = () => {
    dispatch(logoutAndClearAll());
    onCloseMobile?.();
    router.push("/log-in");
  };

  /**
   * Settings expanded → no primary “selected” (sub-links carry state).
   * On /leads/* the Leads link never uses the same strong pill as other nav items (Pipeline carries expanded focus),
   * but it always gets a lighter “you are here” style + aria-current so it doesn’t look broken.
   * Pipeline expanded while on another top-level route → suppress primary until Pipeline is collapsed.
   */
  const primaryItemActive = (item) => {
    const routeActive = isPrimaryNavActive(pathname, item.href, searchParams);
    if (settingsOpen) return false;
    if (item.id === "leads" && isLeadsArea) return false;
    if (pipelineNavOpen && !isLeadsArea) return false;
    if (pipelineNavOpen && isLeadsArea) return routeActive && item.id !== "leads";
    return routeActive;
  };

  const pipelineRowExpanded = pipelineNavOpen;
  const pipelineRowInLeadsWorkspace = isLeadsArea && !pipelineNavOpen;

  const leadsNavInWorkspace = (item) => item.id === "leads" && isLeadsArea && !pipelineNavOpen;

  const sidebarInner = (
    <aside
      ref={menuRef}
      className="h-screen w-[272px] bg-white/95 backdrop-blur border-r border-border flex flex-col"
    >
      <div className="h-16 px-4 border-b border-border flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={() => onCloseMobile?.()}
        >
          <span className="h-9 w-9 rounded-md grid place-items-center bg-gradient-to-br from-primary to-primary-dark text-white shadow">
            <Bot size={18} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-text-heading">Nesti AI</div>
            <div className="text-[11px] text-text-muted">Workspace</div>
          </div>
        </Link>
        {isMobileOpen ? (
          <button
            type="button"
            onClick={() => onCloseMobile?.()}
            className="lg:hidden h-8 w-8 rounded-md border border-border text-text-body grid place-items-center hover:bg-primary/5"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-1">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = primaryItemActive(item);
            const leadsHere = leadsNavInWorkspace(item);
            return (
              <Fragment key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => {
                    setSettingsOpen(false);
                    setPipelineNavOpen(false);
                    onCloseMobile?.();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary-dark"
                      : leadsHere
                        ? "bg-primary/[0.08] text-primary-dark border border-primary/15"
                        : "text-text-body hover:bg-primary/5 hover:text-text-heading"
                  }`}
                  aria-current={active || leadsHere ? "page" : undefined}
                >
                  <span
                    className={`h-8 w-8 rounded-md grid place-items-center ${
                      active
                        ? "bg-primary/20 text-primary-dark"
                        : leadsHere
                          ? "bg-primary/15 text-primary-dark"
                          : "bg-background-light text-text-muted"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span>{item.label}</span>
                </Link>

                {item.id === "leads" ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPipelineNavOpen((prev) => !prev);
                        setSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold transition ${
                        pipelineRowExpanded
                          ? "bg-primary/10 text-primary-dark"
                          : pipelineRowInLeadsWorkspace
                            ? "bg-primary/[0.07] text-text-heading"
                            : "text-text-body hover:bg-primary/5 hover:text-text-heading"
                      }`}
                      aria-expanded={pipelineNavOpen}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`h-8 w-8 rounded-md grid place-items-center ${
                            pipelineRowExpanded
                              ? "bg-primary/20 text-primary-dark"
                              : pipelineRowInLeadsWorkspace
                                ? "bg-primary/12 text-primary-dark/90"
                                : "bg-background-light text-text-muted"
                          }`}
                        >
                          <GitBranch size={16} />
                        </span>
                        Pipeline
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${pipelineNavOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {pipelineNavOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pr-1 py-1 space-y-1 border-l border-border/80 ml-4">
                            <LeadsPipelineSidebarNav
                              embedded
                              variant="settings"
                              skipRouteCheck
                              onNavigate={() => onCloseMobile?.()}
                            />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSettingsOpen((prev) => !prev);
              setPipelineNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold transition ${
              settingsOpen
                ? "bg-primary/10 text-primary-dark"
                : "text-text-body hover:bg-primary/5 hover:text-text-heading"
            }`}
            aria-expanded={settingsOpen}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`h-8 w-8 rounded-md grid place-items-center ${
                  settingsOpen
                    ? "bg-primary/20 text-primary-dark"
                    : "bg-background-light text-text-muted"
                }`}
              >
                <Settings size={16} />
              </span>
              Settings
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {settingsOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="overflow-hidden"
              >
                <div className="pl-4 pr-1 py-1 space-y-1 border-l border-border/80 ml-4">
                  {SETTINGS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const tabActive = pathname === "/settings" && settingsTab === item.tab;
                    return (
                      <Link
                        key={item.id}
                        href={`/settings?tab=${item.tab}`}
                        onClick={() => onCloseMobile?.()}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                          tabActive
                            ? "bg-primary/10 text-primary-dark"
                            : "text-text-body hover:bg-primary/5"
                        }`}
                        aria-current={tabActive ? "page" : undefined}
                      >
                        <Icon size={14} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <Link
          href={isMounted && displayEmail ? `/profile?email=${displayEmail}` : "/profile"}
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-background-light hover:bg-primary/5 transition"
        >
          <span className="h-8 w-8 rounded-md bg-primary text-white grid place-items-center text-xs font-semibold">
            {initials || "U"}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-text-heading truncate">
              {displayName}
            </span>
            <span className="block text-[11px] text-text-muted truncate">
              {displayEmail || "Open public profile"}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40">{sidebarInner}</div>
      <AnimatePresence>
        {isMobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[70] lg:hidden"
              onClick={() => onCloseMobile?.()}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-[80] lg:hidden"
            >
              {sidebarInner}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
