"use client";

import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "@/store";
import WorkspaceSocketBridge from "@/components/realtime/WorkspaceSocketBridge";
import { NotificationsUiProvider } from "@/contexts/NotificationsUiContext";

export default function Providers({ children }) {
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

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <NotificationsUiProvider>
            <WorkspaceSocketBridge>{children}</WorkspaceSocketBridge>
          </NotificationsUiProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ReduxProvider>
    </GoogleOAuthProvider>
  );
}
