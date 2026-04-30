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

export default function NotificationsBell() {
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
    enabled: Boolean(token),
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list", token, "preview"],
    queryFn: () => fetchNotifications({ token, limit: 12, offset: 0 }),
    enabled: Boolean(token) && open,
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

  if (!token) return null;

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
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`w-full px-3 py-2.5 text-left transition hover:bg-background-light/80 ${
                      n.read_at ? "opacity-75" : "bg-primary/[0.04]"
                    }`}
                  >
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
