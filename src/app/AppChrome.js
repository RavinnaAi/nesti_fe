"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackgroundElements from "@/components/layout/BackgroundElements";
import CustomToastContainer from "@/components/ui/ToastContainer";
import AppSidebar from "@/components/layout/AppSidebar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { Menu } from "lucide-react";
import { useAppSelector } from "@/store";

/**
 * Public /chatbot/* routes are embedded in iframes on other sites — no site header/footer.
 */
export default function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const { token } = useAppSelector((state) => state.auth);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Avoid hydration mismatch: server render doesn't have client auth token yet.
  const useSidebarLayout = isMounted && Boolean(token) && !isPublicAuthPage;

  if (isChatbotEmbed) {
    return <>{children}</>;
  }

  if (useSidebarLayout) {
    return (
      <>
        <BackgroundElements variant="default" />
        <div className="relative z-10 flex min-h-0 flex-1">
          <AppSidebar
            isMobileOpen={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />
          <div className="min-h-0 flex-1 flex flex-col lg:pl-[272px]">
            <header className="h-16 bg-white/90 backdrop-blur border-b border-border px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="lg:hidden h-9 w-9 rounded-md border border-border text-text-heading grid place-items-center hover:bg-primary/5 transition"
                  aria-label="Open sidebar"
                >
                  <Menu size={16} />
                </button>
                <div>
                  <div className="text-sm font-semibold text-text-heading">Workspace</div>
                  <div className="text-[11px] text-text-muted">All tools in one place</div>
                </div>
              </div>
              <NotificationsBell />
            </header>
            <main className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
