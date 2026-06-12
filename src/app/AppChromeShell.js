"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppChrome from "./AppChrome";
import WorkspaceLoader from "@/components/ui/WorkspaceLoader";
import { isPublicMarketingRoute } from "@/lib/publicRoutes";

export default function AppChromeShell({ children }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() || "";
  const isChatbotEmbedRoute = pathname.startsWith("/chatbot/");
  const isProfessionalPublicPage = pathname.startsWith("/p/") || pathname.startsWith("/professional/");
  const isPublicLandingOrMarketing =
    pathname === "/" || isPublicMarketingRoute(pathname) || isProfessionalPublicPage;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted && !isChatbotEmbedRoute) {
    return (
      <>
        <main
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background-light/90"
          aria-busy="true"
        >
          <WorkspaceLoader
            fullHeight={false}
            className="max-w-none px-4"
            label={isPublicLandingOrMarketing ? "Loading Nesti AI..." : "Loading workspace..."}
            sublabel={
              isPublicLandingOrMarketing
                ? "Preparing your experience"
                : "Preparing your tools and data"
            }
          />
        </main>
        {children}
      </>
    );
  }

  return <AppChrome>{children}</AppChrome>;
}
