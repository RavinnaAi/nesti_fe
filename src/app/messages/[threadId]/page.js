"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { ArrowLeft, Send } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/store";
import { getSocketOrigin } from "@/lib/api";
import { fetchProChatThreadById, fetchProChatThreadMessages } from "@/lib/proChatClient";
import { clearUnread } from "@/store/proChatSlice";

function displayName(u) {
  if (!u) return "Professional";
  const full = String(u.full_name || "").trim();
  if (full) return full;
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "Professional";
}

function initialsFor(u) {
  const name = displayName(u);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";
}

function displayRole(u) {
  const raw = String(u?.role || "").trim();
  if (!raw) return "Professional";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeUuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ProMessagesThreadPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const threadId = String(params?.threadId || "").trim();
  const dispatch = useAppDispatch();
  const { token, user: authUser } = useAppSelector((s) => s.auth);
  const myUserId = String(authUser?.id || authUser?._id || "").trim();

  const threadQuery = useQuery({
    queryKey: ["prochat-thread", token, threadId],
    enabled: Boolean(token && threadId),
    queryFn: () => fetchProChatThreadById({ token, id: threadId }),
  });

  const messagesQuery = useQuery({
    queryKey: ["prochat-messages", token, threadId, 1],
    enabled: Boolean(token && threadId),
    queryFn: () => fetchProChatThreadMessages({ token, id: threadId, page: 1, limit: 50 }),
  });

  const otherUser = threadQuery.data?.other_user || null;
  const headerTitle = useMemo(() => displayName(otherUser), [otherUser]);
  const headerSubtitle = useMemo(() => displayRole(otherUser), [otherUser]);

  const [draft, setDraft] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentAt = useRef(0);

  const messages = useMemo(() => {
    const fromApi = Array.isArray(messagesQuery.data?.items) ? messagesQuery.data.items : [];
    const merged = [...fromApi];
    const seen = new Set(merged.map((m) => String(m.id)));
    for (const m of liveMessages) {
      const id = String(m?.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(m);
    }
    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return merged;
  }, [messagesQuery.data?.items, liveMessages]);

  const getScrollEl = () => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.clientHeight > 8) return el;
    if (typeof document === "undefined") return null;
    return document.scrollingElement || document.documentElement || null;
  };

  const scrollToBottom = (behavior = "auto") => {
    const el = getScrollEl();
    if (!el) return;
    const top = el.scrollHeight;
    try {
      el.scrollTo({ top, behavior });
    } catch {
      el.scrollTop = top;
    }
  };

  useLayoutEffect(() => {
    // Layout-safe auto scroll: sometimes the outer <main> is the scroller.
    // Run after DOM updates so scrollHeight is correct.
    scrollToBottom(messagesQuery.isLoading ? "auto" : "smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    if (threadId) dispatch(clearUnread({ threadId }));
  }, [dispatch, threadId]);

  useEffect(() => {
    // Ensure textarea height matches persisted draft (e.g. on fast refresh/back nav).
    requestAnimationFrame(() => autosizeComposer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (!token || !threadId) return;
    const origin = getSocketOrigin();
    if (!origin) return;
    const sessionToken = String(token).trim().replace(/^Bearer\s+/i, "");

    const socket = io(origin, {
      path: "/socket.io",
      auth: { token: sessionToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("prochat:join", { thread_id: threadId }, (ack) => {
        if (!ack?.success) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[prochat] join failed", ack);
          }
        }
      });
    });
    socket.on("disconnect", () => setConnected(false));

    const onMsg = (m) => {
      if (!m || String(m.thread_id) !== String(threadId)) return;
      setLiveMessages((prev) => {
        if (prev.some((x) => String(x?.id) === String(m.id))) return prev;
        return [...prev, m];
      });
    };
    socket.on("prochat:message", onMsg);

    const onTyping = (payload) => {
      if (!payload || String(payload.thread_id) !== String(threadId)) return;
      if (myUserId && String(payload.user_id) === String(myUserId)) return;
      setOtherTyping(Boolean(payload.is_typing));
    };
    socket.on("prochat:typing", onTyping);

    socket.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[prochat] connect_error", err?.message || err);
      }
    });

    return () => {
      socket.off("prochat:message", onMsg);
      socket.off("prochat:typing", onTyping);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, threadId]);

  const emitTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit("prochat:typing", { thread_id: threadId, is_typing: Boolean(isTyping) });
  };

  const autosizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    // Slightly taller max so normal long messages don't show an inner scrollbar immediately.
    const MAX = 240; // px (keeps UI stable)
    try {
      el.style.height = "0px";
      const next = Math.min(el.scrollHeight || 0, MAX);
      el.style.height = `${Math.max(next, 52)}px`;
      el.style.overflowY = (el.scrollHeight || 0) > MAX ? "auto" : "hidden";
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    const text = String(draft || "").trim();
    if (!text) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error("Chat not connected yet. Try again.");
      return;
    }
    const client_id = safeUuid();
    setDraft("");
    requestAnimationFrame(() => autosizeComposer());
    socket.emit("prochat:send", { thread_id: threadId, body: text, client_id }, (ack) => {
      if (!ack?.success) {
        toast.error(ack?.message || "Could not send message");
        setDraft(text);
        return;
      }
      const m = ack?.message;
      if (m) {
        setLiveMessages((prev) => {
          if (prev.some((x) => String(x?.id) === String(m.id))) return prev;
          return [...prev, m];
        });
      }
      requestAnimationFrame(() => scrollToBottom("smooth"));
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading shadow-sm transition hover:bg-background-light"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-start gap-2">
            {otherUser?.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={otherUser.profile_image}
                alt=""
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/60"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                {initialsFor(otherUser)}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text-heading">{headerTitle}</div>
              <div className="text-[11px] text-text-muted">
                {headerSubtitle}
              </div>
            </div>
          </div>
        </div>
        <div className="w-[74px]" aria-hidden />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-44 sm:px-6 sm:pb-52"
      >
        {threadQuery.isLoading || messagesQuery.isLoading ? (
          <p className="py-6 text-center text-xs text-text-muted">Loading messages…</p>
        ) : threadQuery.isError ? (
          <p className="py-6 text-center text-xs text-red-600">
            {threadQuery.error?.message || "Could not load this chat."}
          </p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">No messages yet. Say hello.</p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {messages.map((m) => {
              const mine = myUserId && String(m.sender_user_id) === String(myUserId);
              return (
                <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[min(760px,92%)] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine ? (
                      <div className="hidden shrink-0 sm:block">
                        {otherUser?.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={otherUser.profile_image}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white"
                          />
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.10] text-[10px] font-bold text-primary-dark shadow-sm ring-2 ring-white">
                            {initialsFor(otherUser)}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ring-1 ${
                        mine
                          ? "bg-gradient-to-br from-primary to-primary-dark text-white ring-primary/20 rounded-br-md"
                          : "bg-white text-text-heading ring-border/70 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                    </div>
                    <div className={`mt-1 px-1 text-[10px] ${mine ? "text-text-muted" : "text-text-muted"}`}>
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 z-40 px-3 sm:px-6 lg:left-60 bottom-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="w-full rounded-2xl border border-border/70 bg-white/95 p-3 shadow-[0_12px_50px_rgba(15,23,42,0.10)] backdrop-blur sm:p-4">
          {otherTyping ? (
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/15">
                {initialsFor(otherUser)}
              </span>
              <span className="truncate">{headerTitle} is typing</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:120ms]" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:240ms]" />
              </span>
            </div>
          ) : null}

          <div className="relative w-full">
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(e) => {
                const next = e.target.value;
                setDraft(next);
                autosizeComposer();
                const now = Date.now();
                // throttle typing "true" to avoid spamming
                if (now - lastTypingSentAt.current > 700) {
                  lastTypingSentAt.current = now;
                  emitTyping(true);
                }
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1100);
              }}
              rows={1}
              placeholder="Type a message…"
              className="min-h-[52px] w-full resize-none rounded-2xl border border-border bg-white px-4 py-3.5 pr-14 text-sm text-text-heading shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!draft.trim()}
              aria-label="Send message"
              className="absolute right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

