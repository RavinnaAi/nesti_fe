"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";
import TrialCountdownBadge from "@/components/ui/TrialCountdownBadge";
import WorkspaceLoader from "@/components/ui/WorkspaceLoader";
import AppSidebar from "@/components/layout/AppSidebar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import ConversationsBell from "@/components/prochat/ConversationsBell";
import {
  CalendarDays,
  ChevronDown,
  Globe2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";
import {
  CALENDLY_INTEGRATION_TOAST_ID,
  CALENDLY_OAUTH_BROADCAST_CHANNEL,
  CALENDLY_OAUTH_MESSAGE_SOURCE,
  CALENDLY_OAUTH_WINDOW_NAME,
} from "@/lib/calendlyOAuthPopup";
import { useProfileSetupRedirect } from "@/hooks/useProfileSetupRedirect";
import { useTrialExpiryRedirect } from "@/hooks/useTrialExpiryRedirect";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";
import { updateProfile } from "@/store/authSlice";
import {
  BILLING_REFRESH_CHANNEL,
  broadcastSubscriptionUpdated,
  refreshAuthProfileFromStripe,
} from "@/lib/billingProfileRefresh";
import { finalizeInviteToken } from "@/lib/inviteClient";
import {
  clearInviteAttribution,
  getInviteAttribution,
} from "@/lib/inviteAttributionStorage";
import { isPublicMarketingRoute } from "@/lib/publicRoutes";
import { getOwnPublicProfile } from "@/lib/publicProfileClient";

export default function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const personalInfo = useAppSelector((state) => state.profile.personalInfo);
  const businessInfo = useAppSelector((state) => state.profile.businessInfo);

  const [isMounted, setIsMounted] = useState(false);
  const [authCheckReady, setAuthCheckReady] = useState(false);
  const [hasPersistedToken, setHasPersistedToken] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const calendlyOAuthBroadcastAt = useRef(0);
  const inviteFinalizeAttemptedRef = useRef(false);
  const profileQuery = useProfileQuery();
  const { hasFeature } = useFeatureAccess();
  const showPublicProfile = hasFeature(FEATURES.PUBLIC_PROFILE);
  const showCalendar = hasFeature(FEATURES.CALENDAR_INTEGRATION);
  const publicProfileQuery = useQuery({
    queryKey: ["own-public-profile"],
    queryFn: () => getOwnPublicProfile(token),
    enabled: Boolean(isMounted && token && showPublicProfile),
    staleTime: 60_000,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !token || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") !== "success") return;

    let cancelled = false;
    const syncAfterCheckout = async () => {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        try {
          const user = await refreshAuthProfileFromStripe(token);
          if (cancelled || !user) return;
          dispatch(updateProfile(user));
          queryClient.setQueryData(["profile"], (prev) => ({
            ...(prev || {}),
            success: true,
            user,
          }));
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          broadcastSubscriptionUpdated();
          const status = String(user.accountStatus || user.account_status || "").toLowerCase();
          const plan = String(user.subscriptionPlan || user.subscription_plan || "").trim();
          if (status === "subscribed" && plan) return;
        } catch {
          // retry while Stripe webhook sync catches up
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    syncAfterCheckout();
    return () => {
      cancelled = true;
    };
  }, [isMounted, token, dispatch, queryClient, pathname]);

  useEffect(() => {
    if (!token || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }
    const ch = new BroadcastChannel(BILLING_REFRESH_CHANNEL);
    const onMessage = async (ev) => {
      if (ev?.data?.type !== "subscription_updated") return;
      try {
        const user = await refreshAuthProfileFromStripe(token);
        if (user) {
          dispatch(updateProfile(user));
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    };
    ch.addEventListener("message", onMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
    };
  }, [token, dispatch, queryClient]);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("nesti_auth_state") || sessionStorage.getItem("nesti_auth_state");
      if (!raw) {
        setHasPersistedToken(false);
        setAuthCheckReady(true);
        return;
      }
      const parsed = JSON.parse(raw);
      setHasPersistedToken(Boolean(parsed?.token));
      setAuthCheckReady(true);
    } catch {
      setHasPersistedToken(false);
      setAuthCheckReady(true);
    }
  }, [isMounted, token]);

  useEffect(() => {
    inviteFinalizeAttemptedRef.current = false;
  }, [token]);

  useProfileSetupRedirect(isMounted);
  useTrialExpiryRedirect(isMounted);

  useEffect(() => {
    if (!token || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }
    const ch = new BroadcastChannel(CALENDLY_OAUTH_BROADCAST_CHANNEL);
    const onMessage = (ev) => {
      if (window.name === CALENDLY_OAUTH_WINDOW_NAME) return;
      const data = ev.data;
      if (!data || data.source !== CALENDLY_OAUTH_MESSAGE_SOURCE) return;
      const now = Date.now();
      if (now - calendlyOAuthBroadcastAt.current < 800) return;
      calendlyOAuthBroadcastAt.current = now;
      if (data.result === "connected") {
        toast.success("Calendly connected.", { toastId: CALENDLY_INTEGRATION_TOAST_ID });
        queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
      } else if (data.result === "error") {
        toast.error(data.message || "Calendly connection did not complete.", {
          toastId: CALENDLY_INTEGRATION_TOAST_ID,
        });
        queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
      }
    };
    ch.addEventListener("message", onMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
    };
  }, [token, queryClient]);

  useEffect(() => {
    if (!token || !isMounted) return;
    // `/invite/[token]` finalizes on the landing page for logged-in users; running
    // session_finalize here as well races and can create duplicate lead referrals.
    if (pathname.startsWith("/invite/")) return;
    if (inviteFinalizeAttemptedRef.current) return;
    const attr = getInviteAttribution();
    if (!attr?.token) return;
    inviteFinalizeAttemptedRef.current = true;

    finalizeInviteToken({
      token: attr.token,
      authToken: token,
      method: "session_finalize",
      path: pathname || "",
    })
      .then((res) => {
        if (res?.success) {
          clearInviteAttribution();
          queryClient.invalidateQueries({ queryKey: ["invite-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["invite-conversions"] });
          queryClient.invalidateQueries({ queryKey: ["invite-role-trends"] });
          queryClient.invalidateQueries({ queryKey: ["chat-referrals"] });
          queryClient.invalidateQueries({ queryKey: ["lead-referrals"] });
          if (res?.lead_referral?.id) {
            router.replace(
              `/referrals/${encodeURIComponent(String(res.lead_referral.id))}?direction=inbound`
            );
          }
        }
      })
      .catch((err) => {
        const status = err?.status;
        const msg = String(err?.message || "");
        // Self-referral (or bad/expired tokens) should not keep retrying forever.
        if ([400, 410].includes(Number(status)) || /self\s*referral/i.test(msg)) {
          clearInviteAttribution();
          return;
        }
        inviteFinalizeAttemptedRef.current = false;
      });
  }, [token, isMounted, pathname, queryClient, router]);

  const isChatbotEmbed = pathname.startsWith("/chatbot");
  const isCalendlyCallback = pathname.startsWith("/calendly-callback");
  const isProfessionalPublicPage = pathname.startsWith("/p/") || pathname.startsWith("/professional/");
  const isStandaloneAuthPage = useMemo(
    () =>
      pathname === "/log-in" ||
      pathname === "/sign-up" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/verify-reset-otp") ||
      pathname.startsWith("/reset-password"),
    [pathname]
  );
  const isPublicMarketingPage = isPublicMarketingRoute(pathname);
  const isFixedTableListRoute =
    pathname === "/leads" ||
    pathname === "/conversations" ||
    pathname === "/referrals" ||
    pathname === "/clients";
  const isMessageThreadRoute = pathname.startsWith("/messages/");
  const isFullHeightWorkspaceRoute = isFixedTableListRoute || isMessageThreadRoute;
  const isPublicAuthPage = useMemo(
    () =>
      pathname === "/" ||
      pathname === "/log-in" ||
      pathname === "/sign-up" ||
      pathname.startsWith("/invite/") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/verify-reset-otp") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/verify-email") ||
      isPublicMarketingPage ||
      isProfessionalPublicPage,
    [pathname, isPublicMarketingPage, isProfessionalPublicPage]
  );

  useEffect(() => {
    if (!isMounted || !token || isPublicAuthPage) return;
    const isProd = process.env.NODE_ENV === "production";
    const hrefs = isProd
      ? [
          "/dashboard",
          "/leads",
          "/referrals?direction=inbound",
          "/clients",
          "/professionals?role=agent",
          "/analytics",
          "/nurture-logs",
          "/settings",
          "/calendar",
          "/checkout",
        ]
      : [
          // Dev-only warmup: precompile common routes in background without
          // launching all routes at once (keeps CPU spikes lower).
          "/dashboard",
          "/leads",
          "/calendar",
          "/conversations",
          "/referrals?direction=inbound",
          "/clients",
          "/professionals?role=agent",
          "/analytics",
          "/nurture-logs",
          "/settings",
        ];

    const prefetchAll = () => {
      hrefs.forEach((href, idx) => {
        if (href === pathname) return;
        const run = () => {
          try {
            router.prefetch(href);
          } catch {
            // best-effort prefetch
          }
        };
        // Fix #12 — stagger all prefetches (prod and dev) to avoid a CPU/network burst
        // on initial load. 400ms base + 600ms per route keeps them spread over ~6s.
        setTimeout(run, 400 + idx * 600);
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetchAll, 0);
    return () => clearTimeout(timer);
  }, [isMounted, token, isPublicAuthPage, router, pathname]);

  const displayName = useMemo(() => {
    if (!isMounted) return "";
    const fromBusiness = businessInfo?.fullName?.trim();
    if (fromBusiness) return fromBusiness;
    const fromPersonal = [personalInfo?.firstName, personalInfo?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fromPersonal) return fromPersonal;
    const u = user || {};
    const fromUser = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.name;
    if (fromUser) return fromUser;
    return u.email || "Profile";
  }, [isMounted, businessInfo, personalInfo, user]);

  const avatarUrl = useMemo(() => {
    if (!isMounted) return "";
    const p = personalInfo?.profileImage;
    if (typeof p === "string" && p.trim()) return p.trim();
    return user?.profile_image || user?.img_url || "";
  }, [isMounted, personalInfo, user]);

  const avatarInitials = useMemo(() => {
    if (!displayName || displayName === "Profile") return "?";
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);
  const dashboardOrWebsiteItem = useMemo(
    () =>
      pathname === "/dashboard"
        ? { label: "Website", href: "/", Icon: Home }
        : { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
    [pathname]
  );
  const DashboardOrWebsiteIcon = dashboardOrWebsiteItem.Icon;
  const publicProfileSlug =
    publicProfileQuery.data?.profile?.slug || publicProfileQuery.data?.suggested_slug || "";
  const publicProfileHref = publicProfileSlug
    ? `/professional/${encodeURIComponent(String(publicProfileSlug))}`
    : "/dashboard/public-profile";
  const workspaceHeaderQueriesEnabled = Boolean(token);

  const handleLogout = useCallback(() => {
    dispatch(logoutAndClearAll());
    router.replace("/");
  }, [dispatch, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (!authCheckReady) return;
    if (token || hasPersistedToken) return;
    if (isPublicAuthPage || isChatbotEmbed || isCalendlyCallback) return;
    router.replace("/");
  }, [isMounted, authCheckReady, token, hasPersistedToken, isPublicAuthPage, isChatbotEmbed, isCalendlyCallback, router]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  // ── Chatbot embed: no chrome at all ──
  if (isChatbotEmbed) {
    return <>{children}</>;
  }

  // ── Calendly OAuth return popup: minimal render, no sidebar/header ──
  if (isCalendlyCallback) {
    return <>{children}</>;
  }

  // ── Professional public storefronts own their full layout ──
  if (isProfessionalPublicPage) {
    return <>{children}</>;
  }

  // ── Login/signup own the full viewport: no marketing header/footer, no page scroll ──
  if (isStandaloneAuthPage) {
    return (
      <>
        <BackgroundElements variant="minimal" />
        <main className="relative z-10 h-dvh overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
          {children}
        </main>
        <CustomToastContainer />
      </>
    );
  }

  // ── Not yet mounted: never render public shell on protected routes ──
  if (!isMounted) {
    if (!isPublicAuthPage && !isChatbotEmbed && !isCalendlyCallback && !isProfessionalPublicPage) {
      return (
        <>
          <BackgroundElements variant="default" />
          <main className="relative z-10 flex min-h-screen w-full items-center justify-center">
            <WorkspaceLoader fullHeight={false} />
          </main>
          <CustomToastContainer />
        </>
      );
    }
    return (
      <>
        <BackgroundElements variant="default" />
        <Header />
        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
        <Footer />
        <CustomToastContainer />
      </>
    );
  }

  // ── Mounted but auth-check still resolving on protected routes ──
  if (
    !authCheckReady &&
    !isPublicAuthPage &&
    !isChatbotEmbed &&
    !isCalendlyCallback &&
    !isProfessionalPublicPage
  ) {
    return (
      <>
        <BackgroundElements variant="default" />
        <main className="relative z-10 flex min-h-screen w-full items-center justify-center">
          <WorkspaceLoader fullHeight={false} />
        </main>
        <CustomToastContainer />
      </>
    );
  }

  // ── Mounted: pick layout based on auth state ──
  if (token && !isPublicAuthPage) {
    return (
      <>
        <BackgroundElements variant="default" />
        <div
          className={`relative z-10 flex w-full flex-1 ${
            isFullHeightWorkspaceRoute ? "h-screen min-h-0 overflow-hidden" : "min-h-screen"
          }`}
        >
          <AppSidebar
            isMobileOpen={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />
          <div
            id="workspace-content"
            className={`flex w-full flex-1 flex-col lg:pl-60 ${
              isFullHeightWorkspaceRoute
                ? "bg-transparent"
                : "bg-gradient-to-br from-primary/5 via-white to-primary/10"
            } ${
              isFullHeightWorkspaceRoute ? "h-full min-h-0 overflow-hidden" : "min-h-screen"
            }`}
          >
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white/95 px-3 sm:h-16 sm:bg-white/90 sm:px-6 sm:backdrop-blur">
              <div className="flex min-w-0 max-w-[48%] items-center gap-2.5 sm:max-w-none sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="lg:hidden h-9 w-9 rounded-md border border-border text-text-heading grid place-items-center hover:bg-primary/5 transition"
                  aria-label="Open sidebar"
                >
                  <Menu size={16} />
                </button>
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-xs font-semibold text-text-heading sm:text-sm">Workspace</div>
                  <div className="hidden text-[11px] text-text-muted sm:block">All tools in one place</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <TrialCountdownBadge compact />
                <ConversationsBell enabled={workspaceHeaderQueriesEnabled} />
                <NotificationsBell enabled={workspaceHeaderQueriesEnabled} />
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    id="workspace-user-menu-button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="workspace-user-menu"
                    className="group flex max-w-[min(100%,11rem)] items-center gap-1.5 rounded-lg border border-border bg-white/90 px-1.5 py-1.5 transition hover:border-primary/35 hover:bg-primary/[0.06] sm:max-w-[18rem] sm:gap-2 sm:px-2.5"
                  >
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-[11px] font-bold text-primary">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitials
                      )}
                    </span>
                    <span className="hidden min-w-0 max-w-[7rem] truncate text-left text-sm font-medium text-text-heading group-hover:text-primary sm:block sm:max-w-[12rem]">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`hidden shrink-0 text-text-muted transition-transform sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {userMenuOpen ? (
                    <div
                      id="workspace-user-menu"
                      role="menu"
                      aria-labelledby="workspace-user-menu-button"
                      className="absolute right-0 top-full z-[100] mt-1.5 min-w-[13rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg shadow-slate-900/10"
                    >
                      <Link
                        href={dashboardOrWebsiteItem.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <DashboardOrWebsiteIcon size={16} className="text-text-muted" />
                        {dashboardOrWebsiteItem.label}
                      </Link>
                      <Link
                        href="/profile"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} className="text-text-muted" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={16} className="text-text-muted" />
                        Settings
                      </Link>
                      {showPublicProfile ? (
                        <Link
                          href={publicProfileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Globe2 size={16} className="text-text-muted" />
                          Web Page
                        </Link>
                      ) : null}
                      {showCalendar ? (
                        <Link
                          href="/calendar"
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <CalendarDays size={16} className="text-text-muted" />
                          Calendar
                        </Link>
                      ) : null}
                      <div className="my-1 h-px bg-border" role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </header>
            <main
              id="workspace-main"
              className={`relative z-0 flex min-h-0 flex-1 flex-col ${
                isFullHeightWorkspaceRoute
                  ? "overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  : "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              }`}
            >
              {children}
            </main>
            {!isFullHeightWorkspaceRoute ? (
              <footer className="shrink-0 border-t border-primary/20 bg-gradient-to-r from-primary/[0.08] via-white/95 to-primary/[0.06] px-4 py-2.5 sm:px-6">
                <div className="flex items-center justify-between gap-3 text-[11px] text-text-muted">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg overflow-hidden">
                      <Image
                        src="/logo/logo.png"
                        alt="Nesti AI logo"
                        width={28}
                        height={28}
                        className="h-7 w-7 object-cover"
                      />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[12px] font-semibold text-text-heading">Nesti AI</p>
                      <p className="truncate text-[10px] text-text-muted">Workspace</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[10px] text-text-muted/90">
                    &copy; {new Date().getFullYear()} Nesti AI
                  </p>
                </div>
              </footer>
            ) : null}
          </div>
        </div>
        <CustomToastContainer />
      </>
    );
  }

  return (
    <>
      <BackgroundElements variant="default" />
      <Header />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </main>
      <Footer />
      <CustomToastContainer />
    </>
  );
}
