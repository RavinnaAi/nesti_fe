"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  fetchNotifications,
  fetchNotificationsUnreadCount,
  markAllNotificationsReadRequest,
  resolveProChatRejoinRequestFromNotification,
} from "@/lib/notificationsClient";
import { useNotificationsUi } from "@/contexts/NotificationsUiContext";
import { NotificationsListSkeleton } from "@/components/ui/ContentSkeletons";

const PAGE_SIZE = 20;

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

export default function NotificationsPage() {
  useAuthGuard();
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  const { openNotificationDetail } = useNotificationsUi();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [unreadOnly]);

  const offset = (page - 1) * PAGE_SIZE;

  const listQuery = useQuery({
    queryKey: ["notifications", "list", token, "full", unreadOnly, page, PAGE_SIZE],
    queryFn: () => fetchNotifications({ token, limit: PAGE_SIZE, offset, unreadOnly }),
    enabled: Boolean(token),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const unreadTotalQuery = useQuery({
    queryKey: ["notifications", "unread-count", token],
    queryFn: () => fetchNotificationsUnreadCount({ token }),
    enabled: Boolean(token),
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const items = listQuery.data?.items ?? [];
  const total = Number(listQuery.data?.total ?? 0);
  const rawTotalPages = Number(listQuery.data?.total_pages ?? 0);
  const totalPages =
    total > 0 ? Math.max(1, rawTotalPages || Math.ceil(total / PAGE_SIZE)) : 1;
  const currentPage = Number(listQuery.data?.current_page ?? listQuery.data?.page ?? page);
  const hasPrev = listQuery.data?.has_prev_page ?? currentPage > 1;
  const hasNext = listQuery.data?.has_next_page ?? currentPage < totalPages;
  const showPagination = items.length > 0 && total > 0 && (hasPrev || hasNext || totalPages > 1);

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsReadRequest({ token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
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

  const unreadTotal = Number(unreadTotalQuery.data ?? 0);

  const onRowClick = (n) => {
    openNotificationDetail(n);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background-light/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-heading hover:bg-background-light"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-text-heading">
                <Bell size={24} className="text-primary" />
                Notifications
              </h1>
              <p className="text-sm text-text-muted">Real-time updates for new leads and activity.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-text-heading">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Unread only
            </label>
            <button
              type="button"
              disabled={markAllMutation.isPending || unreadTotal === 0}
              onClick={() => markAllMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-40"
            >
              {markAllMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
              Mark all read
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {listQuery.isLoading ? (
            <div className="py-2">
              <NotificationsListSkeleton rows={6} />
              <p className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-primary">
                <Loader2 size={16} className="animate-spin shrink-0" />
                Loading notifications…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-16 text-center text-text-muted">
              <p className="font-medium text-text-heading">
                {listQuery.data?.empty_state?.reason || "No notifications yet."}
              </p>
              {listQuery.data?.empty_state?.action ? (
                <p className="mt-2 text-sm">{listQuery.data.empty_state.action}</p>
              ) : null}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/70">
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
                          className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition hover:bg-background-light/60 ${
                            n.read_at ? "" : "bg-primary/[0.03]"
                          }`}
                        >
                          <button type="button" onClick={() => onRowClick(n)} className="block w-full text-left">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <span className="font-semibold text-text-heading">{n.title}</span>
                              <span className="text-xs text-text-muted">
                                {n.created_at
                                  ? new Date(n.created_at).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : ""}
                              </span>
                            </div>
                            {n.body ? <p className="line-clamp-2 text-sm text-text-muted">{n.body}</p> : null}
                          </button>
                          {rejoinMeta ? (
                            <div className="mt-1.5 rounded-lg border border-border/70 bg-white/80 p-2.5">
                              <div className="flex items-center gap-2">
                                {requesterImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={requesterImage}
                                    alt=""
                                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/60"
                                  />
                                ) : (
                                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.10] text-[10px] font-bold text-primary-dark">
                                    {requesterName.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "P"}
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-semibold text-text-heading">{requesterName}</div>
                                  <div className="text-[11px] text-text-muted">Requested to rejoin this group</div>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-end gap-2">
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
                                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
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
                                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                    >
                                      Approve
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
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
                          {n.action?.type === "open_lead" ? (
                            <button
                              type="button"
                              onClick={() => onRowClick(n)}
                              className="text-left text-xs font-semibold text-primary"
                            >
                              View details →
                            </button>
                          ) : n.action?.type === "open_prochat_thread" ? (
                            <button
                              type="button"
                              onClick={() => onRowClick(n)}
                              className="text-left text-xs font-semibold text-primary"
                            >
                              Open chat →
                            </button>
                          ) : n.action?.type === "open_referral" ? (
                            <button
                              type="button"
                              onClick={() => onRowClick(n)}
                              className="text-left text-xs font-semibold text-primary"
                            >
                              Open referral →
                            </button>
                          ) : n.action?.type === "open_bulk_followups" ? (
                            <button
                              type="button"
                              onClick={() => onRowClick(n)}
                              className="text-left text-xs font-semibold text-primary"
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
              {showPagination ? (
                <div className="flex flex-col gap-3 border-t border-border/80 bg-background-light/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-text-muted sm:text-sm">
                    {listQuery.isFetching && !listQuery.isLoading ? (
                      <Loader2 size={14} className="animate-spin shrink-0 text-primary" aria-hidden />
                    ) : null}
                    <span>
                    Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                    <span className="font-semibold text-text-heading">{totalPages}</span>
                    {total > 0 ? (
                      <>
                        {" "}
                        · <span className="font-medium text-text-heading">{total}</span> total
                      </>
                    ) : null}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasPrev || listQuery.isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading shadow-sm transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!hasNext || listQuery.isFetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-text-heading shadow-sm transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
