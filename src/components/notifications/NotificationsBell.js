"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store";
import {
  fetchNotifications,
  fetchNotificationsUnreadCount,
  markAllNotificationsReadRequest,
  resolveProChatRejoinRequestFromNotification,
} from "@/lib/notificationsClient";
import { useNotificationsUi } from "@/contexts/NotificationsUiContext";

function formatShortTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function rejoinActionMeta(notification) {
  const action = notification?.action || {};
  if (String(action?.type || "").trim() !== "prochat_rejoin_request") return null;
  const threadId = String(action?.thread_id || "").trim();
  const requesterUserId = String(action?.requester_user_id || "").trim();
  if (!threadId || !requesterUserId) return null;
  const requester = action?.requester || null;
  const status = String(action?.status || "").trim().toLowerCase() || "pending";
  return { threadId, requesterUserId, requester, status };
}

function updateRejoinNotificationStatus(notification, { threadId, requesterUserId, status }) {
  const action = notification?.action || {};
  if (
    String(action?.type || "").trim() !== "prochat_rejoin_request" ||
    String(action?.thread_id || "").trim() !== String(threadId) ||
    String(action?.requester_user_id || "").trim() !== String(requesterUserId)
  ) {
    return notification;
  }
  return {
    ...notification,
    read_at: notification.read_at || new Date().toISOString(),
    action: {
      ...action,
      status,
      resolved_at: action.resolved_at || new Date().toISOString(),
    },
  };
}

function updateRejoinStatusCacheValue(value, meta) {
  if (!value) return value;
  if (Array.isArray(value.items)) {
    return { ...value, items: value.items.map((item) => updateRejoinNotificationStatus(item, meta)) };
  }
  return updateRejoinNotificationStatus(value, meta);
}

export default function NotificationsBell({ enabled = true }) {
  const { openNotificationDetail } = useNotificationsUi();
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPos, setPanelPos] = useState(null);

  const updatePanelPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right),
    });
  }, []);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count", token],
    queryFn: () => fetchNotificationsUnreadCount({ token }),
    enabled: Boolean(token) && enabled,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list", token, "preview"],
    queryFn: () => fetchNotifications({ token, limit: 12, offset: 0 }),
    enabled: Boolean(token) && enabled && open,
    staleTime: 30_000,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsReadRequest({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const resolveRejoinMutation = useMutation({
    mutationFn: ({ threadId, requesterUserId, action }) =>
      resolveProChatRejoinRequestFromNotification({ token, threadId, requesterUserId, action }),
    onSuccess: (_data, variables) => {
      const status = variables.action === "approve" ? "approved" : "rejected";
      const meta = {
        threadId: variables.threadId,
        requesterUserId: variables.requesterUserId,
        status,
      };
      queryClient.setQueriesData({ queryKey: ["notifications", "list", token] }, (old) =>
        updateRejoinStatusCacheValue(old, meta)
      );
      queryClient.setQueriesData({ queryKey: ["notifications", "detail", token] }, (old) =>
        updateRejoinStatusCacheValue(old, meta)
      );
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["prochat-thread"] });
      queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
    },
  });

  useEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (buttonRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const items = listQuery.data?.items ?? [];
  const unread = Number(unreadQuery.data ?? 0);

  const openItem = (n) => {
    setOpen(false);
    window.setTimeout(() => openNotificationDetail(n), 0);
  };

  const togglePanel = () => {
    setOpen((v) => {
      if (v) return false;
      const el = buttonRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setPanelPos({
          top: r.bottom + 8,
          right: Math.max(8, window.innerWidth - r.right),
        });
      }
      return true;
    });
  };

  if (!token || !enabled) return null;

  const panel =
    open && panelPos ? (
      <div
        ref={panelRef}
        className="fixed z-[1000] w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-white shadow-xl shadow-black/10"
        style={{ top: panelPos.top, right: panelPos.right }}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-3 py-2">
          <span className="text-sm font-semibold text-text-heading">Notifications</span>
          <button
            type="button"
            disabled={!unread || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {markAllMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
            Mark all read
          </button>
        </div>
        <div className="max-h-[min(70vh,320px)] overflow-y-auto">
          {listQuery.isLoading ? (
            <div className="flex justify-center py-8 text-text-muted">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((n) => (
                <li key={n.id}>
                  {(() => {
                    const rejoinMeta = rejoinActionMeta(n);
                    const requesterName =
                      String(rejoinMeta?.requester?.full_name || "").trim() ||
                      [rejoinMeta?.requester?.first_name, rejoinMeta?.requester?.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim() ||
                      "Professional";
                    const requesterImage = String(rejoinMeta?.requester?.profile_image || "").trim();
                    return (
                      <div
                        className={`w-full px-3 py-2.5 text-left transition hover:bg-background-light/80 ${
                          n.read_at ? "opacity-75" : "bg-primary/[0.04]"
                        }`}
                      >
                        <button type="button" onClick={() => openItem(n)} className="block w-full text-left">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold leading-snug text-text-heading line-clamp-2">
                              {n.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-text-muted">{formatShortTime(n.created_at)}</span>
                          </div>
                          {n.body ? (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-text-muted">{n.body}</p>
                          ) : null}
                        </button>
                        {rejoinMeta ? (
                          <div className="mt-1.5 rounded-md border border-border/70 bg-white/85 p-2">
                            <div className="flex items-center gap-2">
                              {requesterImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={requesterImage}
                                  alt=""
                                  className="h-7 w-7 rounded-md object-cover ring-1 ring-border/60"
                                />
                              ) : (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/[0.10] text-[10px] font-bold text-primary-dark">
                                  {requesterName.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "P"}
                                </span>
                              )}
                              <span className="min-w-0 truncate text-[11px] font-semibold text-text-heading">{requesterName}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-end gap-1.5">
                              {rejoinMeta.status === "pending" ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={resolveRejoinMutation.isPending}
                                    onClick={() =>
                                      resolveRejoinMutation.mutate({
                                        threadId: rejoinMeta.threadId,
                                        requesterUserId: rejoinMeta.requesterUserId,
                                        action: "reject",
                                      })
                                    }
                                    className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    disabled={resolveRejoinMutation.isPending}
                                    onClick={() =>
                                      resolveRejoinMutation.mutate({
                                        threadId: rejoinMeta.threadId,
                                        requesterUserId: rejoinMeta.requesterUserId,
                                        action: "approve",
                                      })
                                    }
                                    className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                  >
                                    Approve
                                  </button>
                                </>
                              ) : (
                                <span
                                  className={`rounded px-2 py-1 text-[10px] font-semibold ${
                                    rejoinMeta.status === "approved"
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  {rejoinMeta.status === "approved" ? "Approved" : "Rejected"}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}
                        {n.action?.type === "open_prochat_thread" ? (
                          <button
                            type="button"
                            onClick={() => openItem(n)}
                            className="mt-1 block text-[11px] font-semibold text-primary"
                          >
                            Open chat →
                          </button>
                        ) : n.action?.type === "open_lead" ? (
                          <button
                            type="button"
                            onClick={() => openItem(n)}
                            className="mt-1 block text-[11px] font-semibold text-primary"
                          >
                            View details →
                          </button>
                        ) : n.action?.type === "open_referral" ? (
                          <button
                            type="button"
                            onClick={() => openItem(n)}
                            className="mt-1 block text-[11px] font-semibold text-primary"
                          >
                            Open referral →
                          </button>
                        ) : n.action?.type === "open_bulk_followups" ? (
                          <button
                            type="button"
                            onClick={() => openItem(n)}
                            className="mt-1 block text-[11px] font-semibold text-primary"
                          >
                            Review drafts →
                          </button>
                        ) : null}
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border/80 px-3 py-2">
          <Link
            href="/notifications"
            className="block w-full text-center text-sm font-semibold text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePanel}
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border/80 bg-white text-text-heading shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} className="text-text-heading" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
