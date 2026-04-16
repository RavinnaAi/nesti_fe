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
} from "@/lib/notificationsClient";
import { useNotificationsUi } from "@/contexts/NotificationsUiContext";

const PAGE_SIZE = 20;

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
  });

  const unreadTotalQuery = useQuery({
    queryKey: ["notifications", "unread-count", token],
    queryFn: () => fetchNotificationsUnreadCount({ token }),
    enabled: Boolean(token),
    staleTime: 15_000,
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
            <div className="flex justify-center py-16 text-text-muted">
              <Loader2 size={28} className="animate-spin" />
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
                    <button
                      type="button"
                      onClick={() => onRowClick(n)}
                      className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition hover:bg-background-light/60 ${
                        n.read_at ? "" : "bg-primary/[0.03]"
                      }`}
                    >
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
                      {n.action?.type === "open_lead" ? (
                        <span className="text-xs font-semibold text-primary">View details →</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              {showPagination ? (
                <div className="flex flex-col gap-3 border-t border-border/80 bg-background-light/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-text-muted sm:text-sm">
                    Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                    <span className="font-semibold text-text-heading">{totalPages}</span>
                    {total > 0 ? (
                      <>
                        {" "}
                        · <span className="font-medium text-text-heading">{total}</span> total
                      </>
                    ) : null}
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
