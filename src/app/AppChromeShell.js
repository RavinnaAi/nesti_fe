"use client";

import { useEffect, useState } from "react";
import AppChrome from "./AppChrome";

export default function AppChromeShell({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <main
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background-light/90"
          aria-busy="true"
        >
          <p className="text-sm text-text-muted">Loading workspace...</p>
        </main>
        {children}
      </>
    );
  }

  return <AppChrome>{children}</AppChrome>;
}
