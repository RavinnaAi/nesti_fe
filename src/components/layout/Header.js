"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Globe2,
  Home,
  LayoutDashboard,
  X,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { PUBLIC_HOME_PATH, navigateToPublicHome } from "@/lib/workspaceNavigation";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const { hasFeature } = useFeatureAccess();
  const showPublicProfile = hasFeature(FEATURES.PUBLIC_PROFILE);
  const showCalendar = hasFeature(FEATURES.CALENDAR_INTEGRATION);
  const personalInfo = useAppSelector((state) => state.profile?.personalInfo);
  const businessInfo = useAppSelector((state) => state.profile?.businessInfo);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch:
  // server render doesn't have client auth state yet, so defer auth-dependent
  // navigation until after mount.
  const isInviteLanding = String(pathname || "").startsWith("/invite/");
  const isAuthenticated = isMounted && Boolean(token) && !isInviteLanding;

  const NAVIGATION_ITEMS = useMemo(
    () => [
          { label: "About", href: "/about" },
          { label: "Mission", href: "/mission" },
          { label: "Blog", href: "/blog" },
          { label: "FAQ", href: "/faq" },
          { label: "Privacy Policy", href: "/privacy" },
        ],
    []
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const displayName = useMemo(() => {
    const fromBusiness = businessInfo?.fullName?.trim();
    if (fromBusiness) return fromBusiness;
    const fromPersonal = [personalInfo?.firstName, personalInfo?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fromPersonal) return fromPersonal;
    return (
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.email ||
      ""
    );
  }, [businessInfo, personalInfo, user]);
  const displayEmail = user?.email || "";
  const avatarUrl = useMemo(() => {
    const p = personalInfo?.profileImage;
    if (typeof p === "string" && p.trim()) return p.trim();
    return user?.profile_image || user?.img_url || "";
  }, [personalInfo, user]);
  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "?";
  const dashboardOrWebsiteItem =
    pathname === "/dashboard"
      ? { label: "Website", href: PUBLIC_HOME_PATH, Icon: Home }
      : { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard };
  const DashboardOrWebsiteIcon = dashboardOrWebsiteItem.Icon;

  const handleLogout = () => {
    dispatch(logoutAndClearAll());
    setIsProfileOpen(false);
    router.replace(PUBLIC_HOME_PATH);
  };

  const goToPublicHome = () =>
    navigateToPublicHome(router, pathname, () => {
      setIsMenuOpen(false);
      setIsProfileOpen(false);
    });

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo — public landing home */}
          <button
            type="button"
            onClick={goToPublicHome}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Go to Nesti AI home"
          >
            <motion.div
              className="grid h-10 w-10 place-items-center transition-all group-hover:scale-105"
              whileHover={{ rotate: 6 }}
            >
              <Image
                src="/logo/logo.png"
                alt="Nesti AI logo"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-black leading-tight tracking-tight text-text-heading">
                Nesti AI
              </span>
              <span className="-mt-0.5 text-[13px] font-medium leading-tight text-text-muted">
                Real Estate Intelligence
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-background-light/45 p-1">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-1.5 text-[15px] font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                        : "text-text-body hover:bg-white/75 hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden items-center gap-2 lg:flex">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/log-in"
                  className="hidden rounded-xl border border-border bg-white px-4 py-2 text-[15px] font-semibold text-text-heading shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary hover:shadow-md sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-[15px] font-bold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ArrowRight
                      size={16}
                      className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </span>
                </Link>
              </>
            ) : (
              <>
                <NotificationsBell />
                <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  className="group flex max-w-[17rem] items-center gap-2 rounded-xl border border-border bg-white px-2 py-1.5 shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-md"
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-[11px] font-bold text-primary">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="min-w-0 max-w-[9rem] truncate text-left text-[13px] font-bold text-text-heading group-hover:text-primary">
                    {displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-text-muted transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-slate-900/10"
                    >
                      <div className="border-b border-border/80 bg-background-light/35 px-3.5 py-2.5">
                        <div className="truncate text-sm font-bold text-text-heading">
                          {displayName}
                        </div>
                        {displayEmail && (
                          <div className="truncate text-xs font-medium text-primary">
                            {displayEmail}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 p-1.5">
                        <Link
                          href={dashboardOrWebsiteItem.href}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-heading transition-colors hover:bg-primary/5"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <DashboardOrWebsiteIcon size={15} />
                          </span>
                          <span className="font-medium">{dashboardOrWebsiteItem.label}</span>
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-heading transition-colors hover:bg-primary/5"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <User size={15} />
                          </span>
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-heading transition-colors hover:bg-primary/5"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Settings size={15} />
                          </span>
                          <span className="font-medium">Settings</span>
                        </Link>
                        {showPublicProfile ? (
                          <Link
                            href="/dashboard/public-profile"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-heading transition-colors hover:bg-primary/5"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Globe2 size={15} />
                            </span>
                            <span className="font-medium">Web Page</span>
                          </Link>
                        ) : null}
                        {showCalendar ? (
                          <Link
                            href="/calendar"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-heading transition-colors hover:bg-primary/5"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <CalendarDays size={15} />
                            </span>
                            <span className="font-medium">Calendar</span>
                          </Link>
                        ) : null}
                        <div className="my-1 h-px bg-border" role="separator" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <LogOut size={15} />
                          </span>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Mobile / tablet menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated ? <NotificationsBell /> : null}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-body hover:text-primary hover:bg-background-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={isMenuOpen}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">Open main menu</span>
              <AnimatePresence mode="wait">
                {!isMenuOpen ? (
                  <motion.svg
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="close"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay and panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile menu panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className="fixed inset-y-0 left-0 z-[70] h-dvh w-[min(22rem,calc(100vw-3rem))] overflow-y-auto overflow-x-hidden bg-white shadow-2xl shadow-slate-900/20 [scrollbar-width:none] [-ms-overflow-style:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            >
              {/* Menu header */}
              <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-4 py-3.5">
                <button
                  type="button"
                  onClick={goToPublicHome}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Go to Nesti AI home"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center">
                    <Image
                      src="/logo/logo.png"
                      alt="Nesti AI logo"
                      width={36}
                      height={36}
                      className="h-9 w-9 object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-lg font-black leading-tight text-text-heading">
                      Nesti AI
                    </span>
                    <span className="block truncate text-[11px] font-medium leading-tight text-text-muted">
                      Real Estate Intelligence
                    </span>
                  </div>
                </button>
                <motion.button
                  onClick={() => setIsMenuOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-white text-text-body shadow-sm transition-colors hover:bg-primary/5 hover:text-primary"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Navigation items */}
              <div className="space-y-1.5 p-3.5">
                {NAVIGATION_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-white shadow-md shadow-primary/15"
                            : "text-text-body hover:bg-primary/10 hover:text-primary"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-1.5 rounded-md bg-white"
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Auth / Profile section */}
              <div className="space-y-3 border-t border-border p-3.5 pt-4">
                {!isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: NAVIGATION_ITEMS.length * 0.1 + 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      <Link
                        href="/log-in"
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-base font-semibold transition-all duration-200 ${pathname === "/log-in"
                          ? "bg-primary text-white shadow-md"
                          : "bg-background-light text-text-body hover:bg-border border border-border"
                          }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: NAVIGATION_ITEMS.length * 0.1 + 0.2,
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      <Link
                        href="/sign-up"
                        className="group flex items-center justify-center gap-2 px-4 py-3 rounded-md text-base font-bold text-white bg-gradient-to-r from-primary to-primary-dark shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get Started
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform duration-300"
                        />
                      </Link>
                    </motion.div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-background-light border border-border">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-heading">
                          {displayName}
                        </span>
                        {displayEmail && (
                          <span className="text-xs text-text-muted">
                            {displayEmail}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={dashboardOrWebsiteItem.href}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-text-heading hover:bg-primary/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <DashboardOrWebsiteIcon size={18} />
                        {dashboardOrWebsiteItem.label}
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-text-heading hover:bg-primary/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={18} />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-text-heading hover:bg-primary/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      {showPublicProfile ? (
                        <Link
                          href="/dashboard/public-profile"
                          className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-text-heading hover:bg-primary/10 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Globe2 size={18} />
                          Web Page
                        </Link>
                      ) : null}
                      {showCalendar ? (
                        <Link
                          href="/calendar"
                          className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-text-heading hover:bg-primary/10 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <CalendarDays size={18} />
                          Calendar
                        </Link>
                      ) : null}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
