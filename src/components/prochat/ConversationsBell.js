"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMyProChatThreads } from "@/lib/proChatClient";
import { clearUnread } from "@/store/proChatSlice";

function formatShortTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function displayName(u) {
  if (!u) return "Professional";
  const full = String(u.full_name || "").trim();
  if (full) return full;
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "Professional";
}

function initialsFor(u) {
  const name = displayName(u);
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function ConversationsBell() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const unreadByThread = useAppSelector((s) => s.proChat?.unreadByThread || {});
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPos, setPanelPos] = useState(null);

  const unreadTotal = useMemo(
    () => Object.values(unreadByThread).reduce((sum, n) => sum + Number(n || 0), 0),
    [unreadByThread],
  );

  const updatePanelPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right),
    });
  }, []);

  const listQuery = useQuery({
    queryKey: ["prochat-threads", token],
    enabled: Boolean(token) && open,
    queryFn: () => fetchMyProChatThreads({ token }),
    staleTime: 15_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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

  const togglePanel = () => {
    setOpen((v) => {
      if (v) return false;
      updatePanelPosition();
      return true;
    });
  };

  if (!token) return null;

  const items = Array.isArray(listQuery.data?.items) ? listQuery.data.items : [];

  const panel =
    open && panelPos ? (
      <div
        ref={panelRef}
        className="fixed z-[1000] w-[min(100vw-2rem,24rem)] overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-black/10"
        style={{ top: panelPos.top, right: panelPos.right }}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-3 py-2">
          <span className="text-sm font-semibold text-text-heading">Conversations</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-white text-text-muted transition hover:bg-background-light hover:text-text-heading"
            aria-label="Close conversations"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-[min(70vh,360px)] overflow-y-auto">
          {listQuery.isLoading ? (
            <div className="flex justify-center py-10 text-text-muted">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((t) => {
                const tid = String(t.id || "").trim();
                const other = t.other_user || null;
                const unread = Number(unreadByThread?.[tid] || 0);
                const lastTime = t.last_message_at || t.updated_at;
                const preview = String(t.last_message_text || "").trim();
                return (
                  <li key={tid}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (tid) dispatch(clearUnread({ threadId: tid }));
                        router.push(`/messages/${encodeURIComponent(tid)}`);
                      }}
                      className="w-full px-3 py-2.5 text-left transition hover:bg-background-light/80"
                    >
                      <div className="flex items-start gap-2.5">
                        {other?.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={other.profile_image}
                            alt=""
                            className="mt-0.5 h-9 w-9 rounded-xl object-cover ring-1 ring-border/60"
                          />
                        ) : (
                          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                            {initialsFor(other)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-semibold text-text-heading">
                                {displayName(other)}
                              </div>
                              <div className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">
                                {preview || "No messages yet"}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-[10px] text-text-muted">{formatShortTime(lastTime)}</div>
                              {unread > 0 ? (
                                <div className="mt-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {unread > 99 ? "99+" : unread}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
        aria-label="Conversations"
        aria-expanded={open}
      >
        <MessageSquare size={18} className="text-text-heading" />
        {unreadTotal > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

