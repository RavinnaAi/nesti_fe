"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";
import AppSidebar from "@/components/layout/AppSidebar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import ConversationsBell from "@/components/prochat/ConversationsBell";
import { CalendarDays, ChevronDown, Globe2, LogOut, Menu, Settings, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";
import {
  CALENDLY_INTEGRATION_TOAST_ID,
  CALENDLY_OAUTH_BROADCAST_CHANNEL,
  CALENDLY_OAUTH_MESSAGE_SOURCE,
  CALENDLY_OAUTH_WINDOW_NAME,
} from "@/lib/calendlyOAuthPopup";
import { useProfileSetupRedirect } from "@/hooks/useProfileSetupRedirect";
import { finalizeInviteToken } from "@/lib/inviteClient";
import {
  clearInviteAttribution,
  getInviteAttribution,
} from "@/lib/inviteAttributionStorage";

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        }
      })
      .catch((err) => {
        const status = err?.status;
        const msg = String(err?.message || "");
        // Self-referral (or bad/expired tokens) should not keep retrying forever.
        if ([400, 404, 410].includes(Number(status)) || /self\s*referral/i.test(msg)) {
          clearInviteAttribution();
          return;
        }
        inviteFinalizeAttemptedRef.current = false;
      });
  }, [token, isMounted, pathname, queryClient]);

  const isChatbotEmbed = pathname.startsWith("/chatbot");
  const isCalendlyCallback = pathname.startsWith("/calendly-callback");
  const isProfessionalPublicPage = pathname.startsWith("/p/") || pathname.startsWith("/professional/");
  const isFixedTableListRoute =
    pathname === "/leads" || pathname === "/referrals" || pathname === "/clients";
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
      pathname.startsWith("/publicPage") ||
      isProfessionalPublicPage,
    [pathname, isProfessionalPublicPage]
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
        if (!isProd) {
          // Wider staggering in dev avoids compile storms while still warming routes.
          setTimeout(run, 700 + idx * 1200);
          return;
        }
        try {
          run();
        } catch {
          // best-effort prefetch
        }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(token && !isPublicAuthPage && isFixedTableListRoute)) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [token, isPublicAuthPage, isFixedTableListRoute]);

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

  // ── Not yet mounted: never render public shell on protected routes ──
  if (!isMounted) {
    if (!isPublicAuthPage && !isChatbotEmbed && !isCalendlyCallback) {
      return (
        <>
          <BackgroundElements variant="default" />
          <main className="relative z-10 flex min-h-screen w-full items-center justify-center">
            <p className="text-sm text-text-muted">Loading workspace...</p>
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
  if (!authCheckReady && !isPublicAuthPage && !isChatbotEmbed && !isCalendlyCallback) {
    return (
      <>
        <BackgroundElements variant="default" />
        <main className="relative z-10 flex min-h-screen w-full items-center justify-center">
          <p className="text-sm text-text-muted">Loading workspace...</p>
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
        <div className="relative z-10 flex min-h-screen w-full flex-1">
          <AppSidebar
            isMobileOpen={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />
          <div className="flex min-h-screen w-full flex-1 flex-col bg-gradient-to-br from-primary/5 via-white to-primary/10 lg:pl-60">
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="lg:hidden h-9 w-9 rounded-md border border-border text-text-heading grid place-items-center hover:bg-primary/5 transition"
                  aria-label="Open sidebar"
                >
                  <Menu size={16} />
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-heading">Workspace</div>
                  <div className="text-[11px] text-text-muted">All tools in one place</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <ConversationsBell />
                <NotificationsBell />
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    id="workspace-user-menu-button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="workspace-user-menu"
                    className="group flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border border-border bg-white/90 px-2 py-1.5 transition hover:border-primary/35 hover:bg-primary/[0.06] sm:max-w-[18rem] sm:px-2.5"
                  >
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-[11px] font-bold text-primary">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitials
                      )}
                    </span>
                    <span className="min-w-0 max-w-[7rem] truncate text-left text-sm font-medium text-text-heading group-hover:text-primary sm:max-w-[12rem]">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-text-muted transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
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
                      <Link
                        href="/dashboard/public-profile"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Globe2 size={16} className="text-text-muted" />
                        Create Web Page
                      </Link>
                      <Link
                        href="/calendar"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-heading transition hover:bg-primary/[0.06]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CalendarDays size={16} className="text-text-muted" />
                        Calendar
                      </Link>
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
              className={`relative z-0 flex min-h-0 flex-1 flex-col ${
                isFixedTableListRoute
                  ? "overflow-hidden"
                  : "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              }`}
            >
              {children}
            </main>
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
