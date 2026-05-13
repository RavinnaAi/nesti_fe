"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { getSocketOrigin } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { incrementUnread } from "@/store/proChatSlice";

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
  const pathname = usePathname() || "";
  const dispatch = useAppDispatch();
  const myUserId = useAppSelector((s) => s.auth.user?.id || s.auth.user?._id || "");
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

    const onProChatInbox = (payload) => {
      const threadId = String(payload?.thread_id || "").trim();
      if (threadId && pathname === `/messages/${threadId}`) {
        return; // already on this chat
      }
      const msg = payload?.message || {};
      const kind = String(msg?.kind || "").trim();
      const messageId = String(msg?.id || "").trim();
      const sender = msg?.sender || null;
      const senderId = String(msg?.sender_user_id || sender?.id || "").trim();
      if (myUserId && senderId && String(senderId) === String(myUserId)) {
        return; // don't notify for your own actions
      }
      const senderName =
        (sender?.full_name && String(sender.full_name).trim()) ||
        [sender?.first_name, sender?.last_name].filter(Boolean).join(" ").trim() ||
        "A professional";
      const preview = String(msg?.body || "").trim();
      const title = preview ? `${senderName}: ${preview.slice(0, 90)}` : `New message from ${senderName}`;
      toast.info(title, { autoClose: 6000 });
      // A brand-new thread may emit a "thread_started" inbox event so the receiver sees a toast
      // even before the first real message. That should NOT count as an unread message.
      const isThreadStarted = kind === "thread_started" || messageId.startsWith("thread:");
      if (threadId && !isThreadStarted) dispatch(incrementUnread({ threadId }));
      queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
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
    socket.on("prochat:inbox", onProChatInbox);

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
      socket.off("prochat:inbox", onProChatInbox);
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [token, queryClient, pathname, dispatch, myUserId]);
}
