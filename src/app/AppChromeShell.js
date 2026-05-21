"use client";

import { useEffect, useState } from "react";
import AppChrome from "./AppChrome";

export default function AppChromeShell({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return <AppChrome>{children}</AppChrome>;
}
