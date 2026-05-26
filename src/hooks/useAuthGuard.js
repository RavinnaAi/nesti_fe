"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";

export function useAuthGuard() {
  const token = useAppSelector((state) => state.auth.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return {
    isAuthenticated: hydrated && Boolean(token),
    token,
    profile: null,
    hydrated,
    isLoading: !hydrated,
  };
}
