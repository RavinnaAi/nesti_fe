"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppChrome from "./AppChrome";
import WorkspaceLoader from "@/components/ui/WorkspaceLoader";

export default function AppChromeShell({ children }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() || "";
  const isChatbotEmbedRoute = pathname === "/chatbot" || pathname.startsWith("/chatbot/");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (isChatbotEmbedRoute) {
      return <>{children}</>;
    }
    return (
      <>
        <main
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background-light/90"
          aria-busy="true"
        >
          <WorkspaceLoader
            fullHeight={false}
            className="max-w-none px-4"
            label="Loading workspace..."
            sublabel="Preparing your tools and data"
          />
        </main>
        {children}
      </>
    );
  }

  return <AppChrome>{children}</AppChrome>;
}
