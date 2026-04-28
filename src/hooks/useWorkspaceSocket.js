"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { getSocketOrigin } from "@/lib/api";

/**
 * Subscribes to workspace Socket.IO when `token` is set (agent / mortgage broker / lawyer dashboard).
 * Not used by the public embed chatbot — that flow is HTTPS POST `/api/chat` only.
 *
 * Server: `node-backend/services/realtime/workspaceSocket.js`
 * Events: `notifications:item`, `workspace:lead`, `workspace:ready`
 *
 * DevTools: Chrome’s “Socket” filter only lists WebSocket frames. Socket.IO may briefly use
 * polling (XHR) first — filter “All” or search `socket.io` if you don’t see a WS row yet.
 */
export function useWorkspaceSocket(token, queryClient) {
  useEffect(() => {
    if (!token || !queryClient) return;
    const origin = getSocketOrigin();
    if (!origin) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[workspace-socket] No API origin for Socket.IO. Set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_SOCKET_ORIGIN (see getSocketOrigin in lib/api.js).",
        );
      }
      return;
    }

    const sessionToken = String(token).trim().replace(/^Bearer\s+/i, "");

    const socket = io(origin, {
      path: "/socket.io",
      auth: { token: sessionToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const onNotify = (payload) => {
      refreshNotifications();
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["lead-detail"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });

      const title = payload?.title;
      if (title && typeof title === "string") {
        toast.info(title, { autoClose: 6000 });
      }
    };

    const onLead = () => {
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["lead-detail"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });
    };

    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.info("[workspace-socket] connected", { origin, id: socket.id, transport: socket.io.engine?.transport?.name });
      }
      refreshNotifications();
    });
    socket.on("workspace:ready", refreshNotifications);
    socket.on("notifications:item", onNotify);
    socket.on("workspace:lead", onLead);

    socket.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[workspace-socket] connect_error — check JWT / backend on", origin, err?.message || err);
      }
    });
    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[workspace-socket] disconnected", { reason });
      }
    });

    return () => {
      socket.off("connect");
      socket.off("workspace:ready", refreshNotifications);
      socket.off("notifications:item", onNotify);
      socket.off("workspace:lead", onLead);
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [token, queryClient]);
}
