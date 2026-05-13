"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock3, Inbox, Loader2, Mail, MessageSquare, Search } from "lucide-react";
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

function displayRole(u) {
  const raw = String(u?.role || "").trim();
  if (!raw) return "Professional";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

export default function ConversationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const unreadByThread = useAppSelector((s) => s.proChat?.unreadByThread || {});

  const listQuery = useQuery({
    queryKey: ["prochat-threads", token],
    enabled: Boolean(token),
    queryFn: () => fetchMyProChatThreads({ token }),
    staleTime: 15_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(
    () => (Array.isArray(listQuery.data?.items) ? listQuery.data.items : []),
    [listQuery.data?.items],
  );

  const unreadTotal = useMemo(
    () => Object.values(unreadByThread).reduce((sum, n) => sum + Number(n || 0), 0),
    [unreadByThread],
  );

  const openThread = (threadId) => {
    const tid = String(threadId || "").trim();
    if (!tid) return;
    dispatch(clearUnread({ threadId: tid }));
    router.push(`/messages/${encodeURIComponent(tid)}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-4 sm:px-6">
      <div className="flex w-full max-w-none flex-col gap-3">
        <div className="px-1 py-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-heading">Conversations</h1>
              <p className="mt-0.5 text-xs text-text-muted">
                View and continue all conversations with other professionals.
              </p>
            </div>
            <div
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] px-3 py-2"
              aria-label={`Unread conversations: ${unreadTotal}`}
              title="Unread"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-primary-dark shadow-sm ring-1 ring-primary/10">
                <Inbox size={15} />
              </div>
              <div className="text-base font-bold leading-none text-primary-dark">{unreadTotal}</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
            <div>
              <div className="text-sm font-semibold text-text-heading">All conversations</div>
              <div className="text-xs text-text-muted">{items.length} total</div>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-background-light px-2.5 py-1.5 text-[11px] text-text-muted sm:flex">
              <Search size={14} />
              Click any thread to open
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex min-h-[18rem] items-center justify-center text-text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center px-4 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/[0.10] text-primary-dark">
                <MessageSquare size={22} />
              </div>
              <h2 className="mt-3 text-base font-semibold text-text-heading">No conversations yet</h2>
              <p className="mt-1 max-w-sm text-sm text-text-muted">
                Open a professional profile and use the Chat button to start your first conversation.
              </p>
            </div>
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
                      onClick={() => openThread(tid)}
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-primary/[0.04]"
                    >
                      {other?.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={other.profile_image}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-border/70"
                        />
                      ) : (
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                          {initialsFor(other)}
                        </span>
                      )}

                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(8rem,0.9fr)_minmax(10rem,1.1fr)_minmax(8rem,0.75fr)_minmax(12rem,1.25fr)_auto] items-center gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold leading-tight text-text-heading group-hover:text-primary-dark">
                            {displayName(other)}
                          </div>
                        </div>

                        <div className="inline-flex min-w-0 items-center gap-1 text-[11px] text-text-muted">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate">{other?.email || "No email"}</span>
                        </div>

                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold text-primary-dark">
                            <span className="truncate">{displayRole(other)}</span>
                          </span>
                        </div>

                        <div className="min-w-0 truncate rounded-lg bg-background-light/70 px-2.5 py-1.5 text-xs text-text-body">
                          <span className="font-semibold text-text-heading">Last message: </span>
                          <span className="align-middle">{preview || "No messages yet"}</span>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2 text-right">
                          {unread > 0 ? (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread} new
                            </span>
                          ) : null}
                          <div className="hidden items-center gap-1 text-xs font-medium text-text-muted sm:inline-flex">
                            <Clock3 size={12} />
                            {formatShortTime(lastTime) || "Recent"}
                          </div>
                          <span className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 bg-white text-text-muted transition group-hover:border-primary/25 group-hover:bg-primary/[0.06] group-hover:text-primary-dark">
                            <ArrowUpRight size={14} />
                          </span>
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
    </div>
  );
}
