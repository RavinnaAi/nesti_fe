"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "@/store";
import WorkspaceSocketBridge from "@/components/realtime/WorkspaceSocketBridge";
import { NotificationsUiProvider } from "@/contexts/NotificationsUiContext";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (mod) => mod.ReactQueryDevtools
    ),
  { ssr: false }
);

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 5,
          },
        },
      })
  );

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <NotificationsUiProvider>
            {mounted ? (
              <WorkspaceSocketBridge>{children}</WorkspaceSocketBridge>
            ) : (
              children
            )}
          </NotificationsUiProvider>
          {isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      </ReduxProvider>
    </GoogleOAuthProvider>
  );
}
