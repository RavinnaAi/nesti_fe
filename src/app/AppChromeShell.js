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
      <main className="flex min-h-screen w-full items-center justify-center">
        <p className="text-sm text-text-muted">Loading workspace...</p>
      </main>
    );
  }

  return <AppChrome>{children}</AppChrome>;
}
