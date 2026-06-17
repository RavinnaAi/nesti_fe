"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  BarChart3,
  ClipboardList,
  Code2,
  Globe2,
  Settings,
  CreditCard,
  Building2,
  User,
  Target,
  LogOut,
  ChevronDown,
  X,
  GitBranch,
  CalendarDays,
  Handshake,
  Inbox,
  Send,
  MessageSquare,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";
import LeadsPipelineSidebarNav from "@/components/leads/LeadsPipelineSidebarNav";
import { PUBLIC_HOME_PATH, navigateToPublicHome } from "@/lib/workspaceNavigation";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

const REFERRAL_DIRECTION_ITEMS = [
  { id: "referral-inbound", label: "Inbound", href: "/referrals?direction=inbound", icon: Inbox },
  { id: "referral-outbound", label: "Outbound", href: "/referrals?direction=outbound", icon: Send },
];

const PRIMARY_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", href: "/leads", icon: Users },
  { id: "conversations", label: "Conversations", href: "/conversations", icon: MessageSquare },
  { id: "referrals", label: "Referrals", href: "/referrals?direction=inbound", icon: Handshake },
  { id: "clients", label: "Clients", href: "/clients", icon: UserRound },
  { id: "professionals", label: "Professionals", href: "/professionals?role=agent", icon: Building2 },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "logs", label: "Logs", href: "/nurture-logs", icon: ClipboardList },
  { id: "billing", label: "Billing", href: "/checkout", icon: CreditCard },
];

const PROFESSIONAL_ROLE_ITEMS = [
  { id: "pro-agent", label: "Agents", href: "/professionals?role=agent", icon: UserRound },
  { id: "pro-lawyer", label: "Lawyers", href: "/professionals?role=lawyer", icon: User },
  { id: "pro-mortgage", label: "Mortgage Brokers", href: "/professionals?role=mortgage_broker", icon: Building2 },
];

const SETTINGS_ITEMS = [
  { id: "personal", label: "Personal Information", tab: "personal", icon: User },
  { id: "business", label: "Business Information", tab: "business", icon: Building2 },
  { id: "icp", label: "Ideal Client Profile", tab: "icp", icon: Target },
  { id: "subscription", label: "Subscription", tab: "subscription", icon: CreditCard },
  { id: "chatbot", label: "Chatbot", tab: "chatbot", icon: Code2 },
  { id: "public-profile", label: "Web Page", href: "/dashboard/public-profile", icon: Globe2 },
];

/** Sidebar nav icon: gradient tile, depth, hover lift on idle state */
function NavIconTile({ Icon, variant = "idle" }) {
  const wrap =
    variant === "active"
      ? "bg-gradient-to-br from-primary via-primary to-primary-dark text-white shadow-[0_4px_14px_rgba(52,199,89,0.38)] ring-1 ring-white/35"
      : variant === "soft"
        ? "bg-gradient-to-br from-primary/35 to-primary/12 text-primary-dark shadow-[inset_0_-1px_0_rgba(42,168,74,0.14)] ring-1 ring-primary/28"
        : "bg-gradient-to-br from-background-lighter to-white text-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-border/55 group-hover:from-primary/[0.16] group-hover:to-white group-hover:text-primary-dark group-hover:ring-primary/28 group-hover:shadow-[0_2px_8px_rgba(52,199,89,0.12)]";

  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out ${wrap}`}
      aria-hidden
    >
      <Icon
        size={variant === "active" ? 16 : 15}
        strokeWidth={2}
        className={
          variant === "idle"
            ? "transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-px"
            : "drop-shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
        }
      />
    </span>
  );
}

function SettingsSubIcon({ Icon, active }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
        active
          ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)] ring-1 ring-white/30"
          : "bg-gradient-to-br from-background-lighter to-white text-text-muted ring-1 ring-border/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:from-primary/[0.12] group-hover:text-primary-dark group-hover:ring-primary/22"
      }`}
      aria-hidden
    >
      <Icon size={12} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-105" />
    </span>
  );
}

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

/** Referrals → Inbound/Outbound pills: highlight only on the list route `/referrals`, not on `/referrals/[id]` (detail shares `?direction=`). */
function isReferralsInboxDirectionActive(pathname, href, searchParams) {
  if (pathname !== "/referrals") return false;
  return isPrimaryNavActive(pathname, href, searchParams);
}

export default function AppSidebar({ isMobileOpen, onCloseMobile }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { filterNavItems, hasFeature } = useFeatureAccess();
  const visiblePrimaryItems = useMemo(() => filterNavItems(PRIMARY_ITEMS), [filterNavItems]);
  const visibleSettingsItems = useMemo(() => filterNavItems(SETTINGS_ITEMS), [filterNavItems]);
  const showCalendarNav = hasFeature(FEATURES.CALENDAR_INTEGRATION);
  const shouldPrefetch = process.env.NODE_ENV === "production";
  const personalInfo = useAppSelector((state) => state.profile.personalInfo);
  const menuRef = useRef(null);

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
  const [professionalsOpen, setProfessionalsOpen] = useState(false);
  const [referralsOpen, setReferralsOpen] = useState(false);

  const isLeadsArea = pathname === "/leads" || pathname.startsWith("/leads/");
  const isCalendarRoute = pathname === "/calendar" || pathname.startsWith("/calendar/");
  const isProfessionalsRoute = pathname === "/professionals" || pathname.startsWith("/professionals/");
  const isReferralsRoute = pathname === "/referrals" || pathname.startsWith("/referrals/");

  useEffect(() => {
    // In dev, aggressive prefetch can trigger on-demand route compilation storms
    // and make navigation feel slower. Keep eager prefetch for production only.
    if (process.env.NODE_ENV !== "production") return;
    const hrefs = [
      "/dashboard",
      "/leads",
      "/referrals?direction=inbound",
      "/clients",
      "/professionals?role=agent",
      "/analytics",
      "/nurture-logs",
      "/calendar",
      "/settings",
    ];
    hrefs.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        // best-effort prefetch only
      }
    });
  }, [router]);

  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
    else setSettingsOpen(false);
  }, [isSettingsActive]);

  useEffect(() => {
    if (isProfessionalsRoute) setProfessionalsOpen(true);
    else setProfessionalsOpen(false);
  }, [isProfessionalsRoute]);

  useEffect(() => {
    if (isReferralsRoute) setReferralsOpen(true);
    else setReferralsOpen(false);
  }, [isReferralsRoute]);

  /** Only collapse when leaving /leads — never on /calendar while opening pipeline (avoids wiping state before navigation). */
  useEffect(() => {
    if (!pathname.startsWith("/leads")) {
      setPipelineNavOpen(false);
    }
  }, [pathname]);

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
    "User";
  const sidebarAvatarUrl = String(
    user?.profile_image || personalInfo?.profileImage || ""
  ).trim();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = () => {
    dispatch(logoutAndClearAll());
    onCloseMobile?.();
    router.replace("/");
  };

  const navigateFast = (href) => {
    if (shouldPrefetch) {
      try {
        router.prefetch(href);
      } catch {
        // best-effort
      }
    }
    router.push(href);
  };

  const goToPublicHome = () =>
    navigateToPublicHome(router, pathname, () => {
      setSettingsOpen(false);
      setPipelineNavOpen(false);
      setProfessionalsOpen(false);
      setReferralsOpen(false);
      onCloseMobile?.();
    });

  /** Submenu + Pipeline “selected” chrome only on /leads — never while on Calendar or other routes. */
  const pipelineExpandedUI = pipelineNavOpen && isLeadsArea;

  /**
   * Settings expanded → no primary “selected” (sub-links carry state).
   * On /leads/* the Leads link never uses the same strong pill as other nav items (Pipeline carries expanded focus),
   * but it always gets a lighter “you are here” style + aria-current so it doesn’t look broken.
   * Pipeline expanded while on another top-level route → suppress primary until Pipeline is collapsed.
   */
  const primaryItemActive = (item) => {
    const routeActive = isPrimaryNavActive(pathname, item.href, searchParams);
    if (settingsOpen) return false;
    if (item.id === "referrals" && isReferralsRoute) return false;
    if (item.id === "leads" && isLeadsArea) return false;
    if (pipelineNavOpen && !isLeadsArea) return false;
    if (pipelineExpandedUI) return routeActive && item.id !== "leads";
    return routeActive;
  };

  const pipelineRowInLeadsWorkspace = isLeadsArea && !pipelineNavOpen;

  const leadsNavInWorkspace = (item) => item.id === "leads" && isLeadsArea && !pipelineNavOpen;

  const sidebarInner = (
    <aside
      ref={menuRef}
      className="flex h-screen w-60 min-h-0 flex-col border-r border-primary/25 shadow-[2px_0_24px_rgba(45,55,72,0.05)]"
      style={{
        background: "linear-gradient(135deg, #F4FCF6 0%, #E8FAEE 48%, #D8F5E2 100%)",
      }}
    >
      <div className="relative shrink-0 border-b border-border/50 px-3 py-2.5">
        <div
          className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          aria-hidden
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goToPublicHome}
            onMouseEnter={() => {
              if (!shouldPrefetch) return;
              try {
                router.prefetch(PUBLIC_HOME_PATH);
              } catch {
                // best-effort
              }
            }}
            className="relative z-20 group flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent py-0.5 text-left transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Go to Nesti AI home"
          >
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg grid place-items-center transition duration-300 group-hover:scale-[1.03]">
              <Image
                src="/logo/logo.png"
                alt="Nesti AI logo"
                width={32}
                height={32}
                className="relative h-8 w-8 object-cover"
              />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="font-heading text-sm font-bold tracking-tight text-text-heading">
                Nesti AI
              </div>
              <div className="text-[10px] font-medium text-text-muted">Workspace</div>
            </div>
          </button>
          {isMobileOpen ? (
            <button
              type="button"
              onClick={() => onCloseMobile?.()}
              className="lg:hidden h-8 w-8 shrink-0 rounded-lg border border-border/70 bg-gradient-to-br from-background-lighter to-white text-text-body shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] grid place-items-center transition hover:border-primary/30 hover:text-primary-dark hover:shadow-sm"
              aria-label="Close menu"
            >
              <X size={15} strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-0.5">
          {visiblePrimaryItems.map((item) => {
            const Icon = item.icon;
            const active = primaryItemActive(item);
            const leadsHere = leadsNavInWorkspace(item);
            return (
              <Fragment key={item.id}>
                {item.id !== "professionals" && item.id !== "referrals" ? (
                  <Link
                    href={item.href}
                    onClick={() => {
                      setSettingsOpen(false);
                      setPipelineNavOpen(false);
                      setProfessionalsOpen(false);
                      setReferralsOpen(false);
                      onCloseMobile?.();
                    }}
                    className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                        : leadsHere
                          ? "bg-primary/[0.08] text-primary-dark ring-1 ring-primary/10"
                          : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
                    }`}
                    aria-current={active || leadsHere ? "page" : undefined}
                    onMouseEnter={() => {
                      if (!shouldPrefetch) return;
                      router.prefetch(item.href);
                    }}
                  >
                    {(active || leadsHere) && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                        aria-hidden
                      />
                    )}
                    <NavIconTile
                      Icon={Icon}
                      variant={active ? "active" : leadsHere ? "soft" : "idle"}
                    />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                ) : null}

                {item.id === "leads" ? (
                  <>
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          setProfessionalsOpen(false);
                          setReferralsOpen(false);
                          if (!isLeadsArea) {
                            setPipelineNavOpen(true);
                            navigateFast("/leads");
                            onCloseMobile?.();
                            return;
                          }
                          setPipelineNavOpen((prev) => !prev);
                        }}
                        className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light ${
                          pipelineExpandedUI
                            ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                            : pipelineRowInLeadsWorkspace
                              ? "bg-white/90 text-text-heading ring-1 ring-border/60"
                              : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
                        }`}
                        aria-expanded={pipelineExpandedUI}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <NavIconTile
                            Icon={GitBranch}
                            variant={pipelineExpandedUI ? "active" : "idle"}
                          />
                          <span className="truncate">Pipeline</span>
                        </span>
                        <ChevronDown
                          size={15}
                          className={`shrink-0 text-text-muted transition-transform duration-200 ${
                            pipelineExpandedUI ? "rotate-180 text-primary-dark" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {pipelineExpandedUI ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.16 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 mt-0.5 space-y-0.5 rounded-lg border border-border/60 bg-white/80 py-1.5 pl-2 pr-1">
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
                    {showCalendarNav ? (
                      <Link
                        href="/calendar"
                        onClick={() => {
                          setSettingsOpen(false);
                          setPipelineNavOpen(false);
                          setProfessionalsOpen(false);
                          setReferralsOpen(false);
                          onCloseMobile?.();
                        }}
                        className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light ${
                          isCalendarRoute
                            ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                            : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
                        }`}
                        aria-current={isCalendarRoute ? "page" : undefined}
                      >
                        {isCalendarRoute ? (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        <NavIconTile Icon={CalendarDays} variant={isCalendarRoute ? "active" : "idle"} />
                        <span className="truncate">Calendar</span>
                      </Link>
                    ) : null}
                  </>
                ) : null}
                {item.id === "referrals" ? (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        setPipelineNavOpen(false);
                        setProfessionalsOpen(false);
                        if (!isReferralsRoute) {
                          setReferralsOpen(true);
                          navigateFast("/referrals?direction=inbound");
                          onCloseMobile?.();
                          return;
                        }
                        setReferralsOpen((prev) => !prev);
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light ${
                        referralsOpen && isReferralsRoute
                          ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                          : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
                      }`}
                      aria-expanded={referralsOpen && isReferralsRoute}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <NavIconTile
                          Icon={Handshake}
                          variant={referralsOpen && isReferralsRoute ? "active" : "idle"}
                        />
                        <span className="truncate">Referrals</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-text-muted transition-transform duration-200 ${
                          referralsOpen && isReferralsRoute ? "rotate-180 text-primary-dark" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {referralsOpen && isReferralsRoute ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-2 mt-0.5 space-y-0.5 rounded-lg border border-border/60 bg-white/80 py-1.5 pl-2 pr-1">
                            {REFERRAL_DIRECTION_ITEMS.map((refItem) => {
                              const active = isReferralsInboxDirectionActive(pathname, refItem.href, searchParams);
                              const Icon = refItem.icon;
                              return (
                                <Link
                                  key={refItem.id}
                                  href={refItem.href}
                                  onClick={() => onCloseMobile?.()}
                                  onMouseEnter={() => {
                                    if (!shouldPrefetch) return;
                                    router.prefetch(refItem.href);
                                  }}
                                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-snug transition ${
                                    active
                                      ? "bg-primary/12 text-primary-dark ring-1 ring-primary/12"
                                      : "text-text-body hover:bg-primary/5"
                                  }`}
                                  aria-current={active ? "page" : undefined}
                                >
                                  <SettingsSubIcon Icon={Icon} active={active} />
                                  <span className="truncate">{refItem.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
                {item.id === "professionals" ? (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        setPipelineNavOpen(false);
                        setReferralsOpen(false);
                        if (!isProfessionalsRoute) {
                          setProfessionalsOpen(true);
                          navigateFast("/professionals?role=agent");
                          onCloseMobile?.();
                          return;
                        }
                        setProfessionalsOpen((prev) => !prev);
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light ${
                        professionalsOpen && isProfessionalsRoute
                          ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                          : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
                      }`}
                      aria-expanded={professionalsOpen && isProfessionalsRoute}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <NavIconTile
                          Icon={Building2}
                          variant={professionalsOpen && isProfessionalsRoute ? "active" : "idle"}
                        />
                        <span className="truncate">Professionals</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-text-muted transition-transform duration-200 ${
                          professionalsOpen && isProfessionalsRoute ? "rotate-180 text-primary-dark" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {professionalsOpen && isProfessionalsRoute ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-2 mt-0.5 space-y-0.5 rounded-lg border border-border/60 bg-white/80 py-1.5 pl-2 pr-1">
                            {PROFESSIONAL_ROLE_ITEMS.map((proItem) => {
                              const active = isPrimaryNavActive(pathname, proItem.href, searchParams);
                              const Icon = proItem.icon;
                              return (
                                <Link
                                  key={proItem.id}
                                  href={proItem.href}
                                  onClick={() => onCloseMobile?.()}
                                  onMouseEnter={() => {
                                    if (!shouldPrefetch) return;
                                    router.prefetch(proItem.href);
                                  }}
                                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-snug transition ${
                                    active
                                      ? "bg-primary/12 text-primary-dark ring-1 ring-primary/12"
                                      : "text-text-body hover:bg-primary/5"
                                  }`}
                                  aria-current={active ? "page" : undefined}
                                >
                                  <SettingsSubIcon Icon={Icon} active={active} />
                                  <span className="truncate">{proItem.label}</span>
                                </Link>
                              );
                            })}
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

        <div>
          <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">
            Account
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((prev) => !prev);
                setPipelineNavOpen(false);
                setProfessionalsOpen(false);
                setReferralsOpen(false);
              }}
              className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                settingsOpen
                  ? "bg-gradient-to-r from-primary/14 to-primary/5 text-primary-dark shadow-sm ring-1 ring-primary/10"
                  : "text-text-body hover:bg-white/90 hover:text-text-heading hover:ring-1 hover:ring-border/70"
              }`}
              aria-expanded={settingsOpen}
            >
              <span className="flex items-center gap-2">
                <NavIconTile Icon={Settings} variant={settingsOpen ? "active" : "idle"} />
                Settings
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 text-text-muted transition-transform duration-200 ${
                  settingsOpen ? "rotate-180 text-primary-dark" : ""
                }`}
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
                  <div className="ml-2 mt-0.5 space-y-0.5 rounded-lg border border-border/60 bg-white/80 py-1.5 pl-2 pr-1">
                    {visibleSettingsItems.map((item) => {
                      const Icon = item.icon;
                      const href = item.href || `/settings?tab=${item.tab}`;
                      const tabActive = item.href
                        ? pathname === item.href
                        : pathname === "/settings" && settingsTab === item.tab;
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          onClick={() => {
                            setPipelineNavOpen(false);
                            setProfessionalsOpen(false);
                            setReferralsOpen(false);
                            onCloseMobile?.();
                          }}
                          onMouseEnter={() => {
                            if (!shouldPrefetch) return;
                            router.prefetch(href);
                          }}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-snug transition ${
                            tabActive
                              ? "bg-primary/12 text-primary-dark ring-1 ring-primary/12"
                              : "text-text-body hover:bg-primary/5"
                          }`}
                          aria-current={tabActive ? "page" : undefined}
                        >
                          <Icon size={13} strokeWidth={2} className="shrink-0" />
                          <span className="min-w-0">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        className="shrink-0 border-t border-primary/25 p-2.5"
        style={{
          background: "linear-gradient(135deg, #F4FCF6 0%, #E8FAEE 48%, #D8F5E2 100%)",
        }}
      >
        <div className="flex items-stretch gap-2 rounded-xl border border-border/70 bg-white px-2 py-1.5 shadow-sm">
          <Link
            href="/settings?tab=personal"
            onClick={() => {
              setPipelineNavOpen(false);
              setProfessionalsOpen(false);
              setReferralsOpen(false);
              onCloseMobile?.();
            }}
            className="group relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary-dark text-[11px] font-bold text-white shadow-[0_3px_12px_rgba(52,199,89,0.35)] ring-2 ring-white transition duration-200 hover:scale-[1.02]"
            title="Personal settings"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-70" aria-hidden />
            {sidebarAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sidebarAvatarUrl}
                alt=""
                className="relative h-full w-full object-cover"
              />
            ) : (
              <span className="relative">{initials || "U"}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="group ml-auto inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200/90 bg-white px-3 text-[11px] font-bold leading-none text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 ring-1 ring-red-100 transition group-hover:bg-red-100 group-hover:ring-red-200/80">
              <LogOut size={12} strokeWidth={2} />
            </span>
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div
        className="hidden lg:block fixed inset-y-0 left-0 z-[100]"
        style={{
          background: "linear-gradient(135deg, #F4FCF6 0%, #E8FAEE 48%, #D8F5E2 100%)",
        }}
      >
        {sidebarInner}
      </div>
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
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
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
