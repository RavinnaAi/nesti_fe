"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const isProfessionalPublicPage = pathname.startsWith("/p/") || pathname.startsWith("/professional/");
  const router = useRouter();
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

    const refreshLeadWorkspaceData = () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-leads"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });
    };

    const actionHref = (action) => {
      const type = String(action?.type || "").trim();
      if (!type) return null;
      if (type === "open_prochat_thread") {
        const tid = String(action?.thread_id || "").trim();
        return tid ? `/messages/${encodeURIComponent(tid)}` : null;
      }
      if (type === "open_lead") {
        const lid = String(action?.lead_match_id || "").trim();
        return lid ? `/leads/${encodeURIComponent(lid)}` : null;
      }
      if (type === "open_referral") {
        const rid = String(action?.referral_id || "").trim();
        const dir = String(action?.direction || "inbound").trim().toLowerCase();
        const d = dir === "outbound" ? "outbound" : "inbound";
        return rid
          ? `/referrals/${encodeURIComponent(rid)}?direction=${encodeURIComponent(d)}`
          : null;
      }
      if (type === "open_bulk_followups") {
        const href = String(action?.href || "").trim();
        return href || "/clients/follow-ups";
      }
      return null;
    };

    const actionLabel = (action) => {
      const type = String(action?.type || "").trim();
      if (type === "open_prochat_thread") return "Open chat";
      if (type === "open_lead") return "Open lead";
      if (type === "open_referral") return "Open referral";
      if (type === "open_bulk_followups") return "Review drafts";
      return "Open";
    };

    const onNotify = (payload) => {
      refreshNotifications();
      const action = payload?.action || {};
      if (String(action?.type || "").trim() === "open_prochat_thread") {
        const threadId = String(action?.thread_id || "").trim();
        queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
        queryClient.invalidateQueries({ queryKey: ["prochat-thread"] });
        if (threadId) {
          queryClient.invalidateQueries({ queryKey: ["prochat-messages"] });
        }
      }
      refreshLeadWorkspaceData();

      // Public professional pages should not show workspace toasts.
      // Keep background cache updates, but avoid UI notification noise here.
      if (isProfessionalPublicPage) {
        return;
      }

      const title = payload?.title;
      const href = actionHref(payload?.action);
      if (href && pathname && href === pathname) {
        return;
      }
      if (title && typeof title === "string") {
        if (!href) {
          toast.info(title, { autoClose: 6000 });
          return;
        }
        toast.info(
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold">{title}</div>
              {payload?.body ? (
                <div className="mt-0.5 line-clamp-2 text-[12px] opacity-80">{String(payload.body)}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-dark"
              onClick={() => {
                toast.dismiss();
                router.push(href);
              }}
            >
              {actionLabel(payload?.action)}
            </button>
          </div>,
          { autoClose: 9000, closeOnClick: false }
        );
      }
    };

    const onLead = () => {
      refreshLeadWorkspaceData();
      refreshNotifications();
    };

    const onProChatInbox = (payload) => {
      if (isProfessionalPublicPage) {
        queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
        return;
      }
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
      // A brand-new thread may emit a "thread_started" inbox event so the receiver sees a toast
      // even before the first real message. That should NOT count as an unread message.
      const isThreadStarted =
        kind === "thread_started" ||
        kind === "group_created" ||
        messageId.startsWith("thread:") ||
        messageId.startsWith("group:");
      if (isThreadStarted) {
        const senderName =
          (sender?.full_name && String(sender.full_name).trim()) ||
          [sender?.first_name, sender?.last_name].filter(Boolean).join(" ").trim() ||
          "A professional";
        const preview = String(msg?.body || "").trim();
        const title = preview ? `${senderName}: ${preview.slice(0, 90)}` : `New message from ${senderName}`;
        toast.info(title, { autoClose: 6000 });
      }
      if (threadId && !isThreadStarted) {
        dispatch(incrementUnread({ threadId }));
        const senderName =
          (sender?.full_name && String(sender.full_name).trim()) ||
          [sender?.first_name, sender?.last_name].filter(Boolean).join(" ").trim() ||
          "A professional";
        const preview = String(msg?.body || "").trim() || "Sent an attachment";
        toast.info(`${senderName}: ${preview.slice(0, 90)}`, { autoClose: 6000 });
      }
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
  }, [token, queryClient, pathname, isProfessionalPublicPage, dispatch, myUserId, router]);
}
