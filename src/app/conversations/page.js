"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, Clock3, Inbox, Loader2, Mail, MessageSquare, Plus, Search, Users, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { createProChatGroupThread, fetchMyProChatThreads } from "@/lib/proChatClient";
import { clearUnread } from "@/store/proChatSlice";
import { fetchProfessionals } from "@/lib/professionalsClient";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";
import FeaturePageGate from "@/components/billing/FeaturePageGate";

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

function initialsForTitle(title) {
  const s = String(title || "").trim();
  if (!s) return "G";
  const parts = s.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "G";
}

function GroupAvatarMini({ title, members_preview }) {
  const items = Array.isArray(members_preview) ? members_preview.filter(Boolean).slice(0, 3) : [];
  const base = 40; // h-10
  // Tighter overlap so group avatar fits the same lane as a single avatar.
  const step = 8;
  const w = base + Math.max(items.length - 1, 0) * step;
  if (items.length === 0) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-white shadow-sm ring-1 ring-primary/30">
        {initialsForTitle(title)}
      </span>
    );
  }
  return (
    <span className="relative inline-block h-10 shrink-0" style={{ width: `${w}px` }}>
      {items.map((u, idx) => {
        const left = idx * step;
        const z = 10 - idx;
        return u?.profile_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={String(u?.id || idx)}
            src={u.profile_image}
            alt=""
            className="absolute top-0 h-10 w-10 rounded-xl object-cover ring-2 ring-white"
            style={{ left, zIndex: z }}
          />
        ) : (
          <span
            key={String(u?.id || idx)}
            className="absolute top-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-white ring-2 ring-white"
            style={{ left, zIndex: z }}
          >
            {initialsFor(u)}
          </span>
        );
      })}
    </span>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { hasFeature } = useFeatureAccess();
  const canUseProChat = hasFeature(FEATURES.PRO_CHAT_DM);
  const canCreateGroups = hasFeature(FEATURES.PRO_CHAT);
  const token = useAppSelector((s) => s.auth.token);
  const unreadByThread = useAppSelector((s) => s.proChat?.unreadByThread || {});
  const [page, setPage] = useState(1);
  const pageSize = useDynamicTablePageSize({
    minRows: 7,
    maxRows: 24,
    rowHeight: 62,
    reserveHeight: 235,
  });

  const listQuery = useQuery({
    queryKey: ["prochat-threads", token, page, pageSize],
    enabled: Boolean(token) && canUseProChat,
    queryFn: () => fetchMyProChatThreads({ token, page, limit: pageSize }),
    staleTime: 15_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    const raw = Array.isArray(listQuery.data?.items) ? listQuery.data.items : [];
    if (canCreateGroups) return raw;
    return raw.filter((t) => String(t.thread_type || "dm") !== "group");
  }, [listQuery.data?.items, canCreateGroups]);

  const unreadTotal = useMemo(
    () => Object.values(unreadByThread).reduce((sum, n) => sum + Number(n || 0), 0),
    [unreadByThread],
  );
  const pagination = listQuery.data?.pagination || {};
  const totalItems = Number(pagination?.total || 0);
  const totalPages = Math.max(Number(pagination?.total_pages || 1), 1);
  const hasPrevPage = Boolean(pagination?.has_prev_page);
  const hasNextPage = Boolean(pagination?.has_next_page);
  const isEmptyState = !listQuery.isLoading && !listQuery.isError && items.length === 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openThread = (threadId) => {
    const tid = String(threadId || "").trim();
    if (!tid) return;
    dispatch(clearUnread({ threadId: tid }));
    router.push(`/messages/${encodeURIComponent(tid)}`);
  };

  // ── Create group modal ─────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Map()); // id -> professional
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  const profQuery = useQuery({
    queryKey: ["prochat-group-professionals", token, search],
    enabled: Boolean(token) && createOpen,
    queryFn: () => fetchProfessionals({ token, search, page: 1, limit: 12 }),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const profItems = Array.isArray(profQuery.data?.items) ? profQuery.data.items : [];

  const toggleSelect = useCallback((p) => {
    const id = String(p?.id || "").trim();
    if (!id) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, p);
      return next;
    });
  }, []);

  const selectedIds = useMemo(() => Array.from(selected.keys()), [selected]);

  const resetCreate = () => {
    setGroupTitle("");
    setSearch("");
    setSelected(new Map());
    setSubmitting(false);
  };

  const createGroup = async () => {
    if (!token) return;
    if (selectedIds.length < 1) return;
    try {
      setSubmitting(true);
      const res = await createProChatGroupThread({
        token,
        title: groupTitle,
        participant_ids: selectedIds,
      });
      const tid = String(res?.thread?.id || "").trim();
      setCreateOpen(false);
      resetCreate();
      queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
      if (tid) router.push(`/messages/${encodeURIComponent(tid)}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[prochat] create group failed", e?.message || e);
      setSubmitting(false);
    }
  };

  const modal =
    createOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[2000]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div
                ref={modalRef}
                className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-black/15"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <div className="text-sm font-bold text-text-heading">New group</div>
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border/70 bg-white text-text-muted hover:bg-background-light"
                    onClick={() => setCreateOpen(false)}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <div className="mb-1 text-xs font-semibold text-text-muted">Group name (optional)</div>
                    <input
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder="e.g. Downtown partners"
                      className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs font-semibold text-text-muted">Add professionals</div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background-light px-3 py-2">
                      <Search size={16} className="text-text-muted" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        className="h-8 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-border/70">
                    {profQuery.isLoading ? (
                      <div className="flex items-center justify-center py-10 text-text-muted">
                        <Loader2 size={22} className="animate-spin" />
                      </div>
                    ) : profItems.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-text-muted">No professionals found.</div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {profItems.map((p) => {
                          const id = String(p?.id || "").trim();
                          const isSelected = selected.has(id);
                          const nm = String(p?.full_name || "").trim() || String(p?.email || "").trim() || "Professional";
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                onClick={() => toggleSelect(p)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-primary/[0.04]"
                              >
                                {p?.profile_image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.profile_image}
                                    alt=""
                                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/70"
                                  />
                                ) : (
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                                    {initialsFor({ full_name: nm })}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-bold text-text-heading">{nm}</div>
                                  <div className="mt-0.5 truncate text-xs text-text-muted">{p?.email || ""}</div>
                                </div>
                                <span
                                  className={`grid h-8 w-8 place-items-center rounded-lg border ${
                                    isSelected
                                      ? "border-primary/30 bg-primary/[0.10] text-primary-dark"
                                      : "border-border/70 bg-white text-text-muted"
                                  }`}
                                  aria-hidden
                                >
                                  {isSelected ? <Check size={16} /> : null}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {selectedIds.length ? (
                    <div className="text-xs text-text-muted">
                      Selected: <span className="font-semibold text-text-heading">{selectedIds.length}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border/70 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateOpen(false);
                      resetCreate();
                    }}
                    className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text-heading hover:bg-background-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void createGroup()}
                    disabled={selectedIds.length < 1 || submitting}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                    Create group
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <FeaturePageGate feature={FEATURES.PRO_CHAT_DM}>
    <div className="min-h-[calc(100vh-4rem)] bg-transparent px-4 py-4 sm:px-6">
      <div className="flex w-full max-w-none flex-col gap-3">
        <div className="px-1 py-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-heading">Conversations</h1>
              <p className="mt-0.5 text-xs text-text-muted">
                View and continue all conversations with other professionals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canCreateGroups ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text-heading shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.06]"
                >
                  <Plus size={16} className="text-primary-dark" />
                  New group
                </button>
              ) : null}
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
        </div>

        <div
          className={
            isEmptyState
              ? "overflow-hidden bg-transparent"
              : "overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm"
          }
        >
          {!isEmptyState ? (
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
              <div>
                <div className="text-sm font-semibold text-text-heading">All conversations</div>
                <div className="text-xs text-text-muted">{totalItems} total</div>
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-background-light px-2.5 py-1.5 text-[11px] text-text-muted sm:flex">
                <Search size={14} />
                Click any thread to open
              </div>
            </div>
          ) : null}

          {listQuery.isLoading ? (
            <div className="flex min-h-[18rem] items-center justify-center text-text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/[0.10] text-primary-dark">
                <MessageSquare size={22} />
              </div>
              <h2 className="mt-3 text-base font-bold text-text-heading">No conversations yet</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                Start a professional chat to keep your conversations organized in one place.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {items.map((t) => {
                  const tid = String(t.id || "").trim();
                  const isGroup = String(t.thread_type || "dm") === "group";
                  const other = t.other_user || null;
                  const unread = Number(unreadByThread?.[tid] || 0);
                  const lastTime = t.last_message_at || t.updated_at;
                  const preview = String(t.last_message_text || "").trim();
                  const title = isGroup ? (String(t.title || "").trim() || "Group chat") : displayName(other);
                  const emailOrMeta = isGroup
                    ? `${Number(t.member_count || 0)} members`
                    : (other?.email || "No email");
                  const role = isGroup ? "Group" : displayRole(other);
                  return (
                    <li key={tid}>
                      <button
                        type="button"
                        onClick={() => openThread(tid)}
                        className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-primary/[0.04]"
                      >
                        {/* Fixed avatar lane; left-align so DM starts at the left */}
                        <div className="w-[56px] shrink-0 flex items-center justify-start">
                          {!isGroup && other?.profile_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={other.profile_image}
                              alt=""
                              className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/70"
                            />
                          ) : !isGroup ? (
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                              {initialsFor(other)}
                            </span>
                          ) : (
                            <GroupAvatarMini title={title} members_preview={t.members_preview} />
                          )}
                        </div>

                        <div className="grid min-w-0 flex-1 grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_92px_minmax(14rem,1.6fr)_148px] items-center gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold leading-tight text-text-heading group-hover:text-primary-dark">
                              {title}
                            </div>
                          </div>

                          <div className="inline-flex min-w-0 items-center gap-1 text-[11px] text-text-muted">
                            {isGroup ? <Users size={12} className="shrink-0" /> : <Mail size={11} className="shrink-0" />}
                            <span className="truncate">{emailOrMeta}</span>
                          </div>

                          <div className="min-w-0 flex items-center justify-start">
                            <span className="inline-flex h-6 min-w-[76px] max-w-full items-center justify-center rounded-full bg-primary/[0.10] px-2 text-[10px] font-bold text-primary-dark">
                              <span className="truncate">{role}</span>
                            </span>
                          </div>

                          <div className="min-w-0 truncate rounded-lg bg-background-light/70 px-2.5 py-1.5 text-xs text-text-body">
                            <span className="font-semibold text-text-heading">Last message:</span>{" "}
                            <span className="align-middle">{preview || "No messages yet"}</span>
                          </div>

                          <div className="flex items-center justify-end gap-2 text-right">
                            <span className="inline-flex min-w-[54px] justify-end">
                              {unread > 0 ? (
                                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {unread > 99 ? "99+" : unread} new
                                </span>
                              ) : null}
                            </span>
                          <div className="inline-flex w-[86px] items-center justify-end gap-1 whitespace-nowrap text-xs font-medium text-text-muted">
                              <Clock3 size={12} />
                              {formatShortTime(lastTime) || "—"}
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
              <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-2.5">
                <div className="text-xs text-text-muted">
                  Page <span className="font-semibold text-text-heading">{page}</span> of{" "}
                  <span className="font-semibold text-text-heading">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrevPage || listQuery.isFetching}
                    className="h-8 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text-heading hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNextPage || listQuery.isFetching}
                    className="h-8 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text-heading hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {modal}
    </div>
    </FeaturePageGate>
  );
}
