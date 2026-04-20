"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";
import AppSidebar from "@/components/layout/AppSidebar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAndClearAll } from "@/store/actions";

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const personalInfo = useAppSelector((state) => state.profile.personalInfo);
  const businessInfo = useAppSelector((state) => state.profile.businessInfo);

  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isChatbotEmbed = pathname.startsWith("/chatbot");
  const isPublicAuthPage = useMemo(
    () =>
      pathname === "/" ||
      pathname === "/log-in" ||
      pathname === "/sign-up" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/publicPage"),
    [pathname]
  );

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
    return user?.img_url || "";
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
    router.push("/log-in");
  }, [dispatch, router]);

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

  // ── Not yet mounted: render a neutral shell that matches server output exactly ──
  if (!isMounted) {
    if (isPublicAuthPage) {
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
    return <LoadingShell />;
  }

  // ── Mounted: pick layout based on auth state ──
  if (token && !isPublicAuthPage) {
    return (
      <>
        <BackgroundElements variant="default" />
        <div className="relative z-10 flex min-h-0 flex-1">
          <AppSidebar
            isMobileOpen={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />
          <div className="min-h-0 flex-1 flex flex-col lg:pl-[272px]">
            <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
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
            <main className="relative z-0 min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
