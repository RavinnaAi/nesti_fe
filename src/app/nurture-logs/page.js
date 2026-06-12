"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchNurtureLogs } from "@/lib/chatClient";
import LeadsNurtureLogsTab from "@/components/leads/LeadsNurtureLogsTab";
import { NurtureLogsListSkeleton } from "@/components/ui/ContentSkeletons";
import useDynamicTablePageSize from "@/hooks/useDynamicTablePageSize";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function NurtureLogsPage() {
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((state) => state.auth.token);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = useDynamicTablePageSize({
    minRows: 10,
    maxRows: 24,
    rowHeight: 44,
    reserveHeight: 240,
  });
  const effectivePageSize = Math.max(10, pageSize - 2);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const logsQuery = useQuery({
    queryKey: ["chat-nurture-logs", token, "all", page, effectivePageSize],
    enabled: Boolean(token),
    queryFn: () => fetchNurtureLogs({ token, page, limit: effectivePageSize }),
    placeholderData: (prev) => prev,
  });

  const logs = useMemo(() => normalizeList(logsQuery.data?.items || logsQuery.data), [logsQuery.data]);
  const pagination = logsQuery.data?.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Number(pagination.total_pages || 1);
  const total = Number(pagination.total || logs.length || 0);
  const hasPrev = Boolean(pagination.has_prev_page || currentPage > 1);
  const hasNext = Boolean(pagination.has_next_page || currentPage < totalPages);

  if (!hydrated) {
    return (
      <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <div className="h-full w-full px-6 py-6">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <NurtureLogsListSkeleton rows={effectivePageSize} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="flex h-full w-full min-h-0 flex-col px-6 py-6">
        <div className="min-h-0 flex-1">
          <LeadsNurtureLogsTab
            logs={logs}
            loading={logsQuery.isLoading}
            rowsPerPage={effectivePageSize}
            page={currentPage}
            totalPages={totalPages}
            total={total}
            hasPrev={hasPrev}
            hasNext={hasNext}
            isFetching={logsQuery.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            paginationOutside
          />
        </div>
      </div>
    </div>
  );
}
