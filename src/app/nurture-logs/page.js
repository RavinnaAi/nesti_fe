"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppSelector } from "@/store";
import { fetchNurtureLogs } from "@/lib/chatClient";
import LeadsNurtureLogsTab from "@/components/leads/LeadsNurtureLogsTab";

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const PAGE_SIZE = 20;

export default function NurtureLogsPage() {
  const { isAuthenticated } = useAuthGuard();
  const token = useAppSelector((state) => state.auth.token);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const logsQuery = useQuery({
    queryKey: ["chat-nurture-logs", token, "all", page, PAGE_SIZE],
    enabled: Boolean(token),
    queryFn: () => fetchNurtureLogs({ token, page, limit: PAGE_SIZE }),
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
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <LeadsNurtureLogsTab
          logs={logs}
          loading={logsQuery.isLoading}
          page={currentPage}
          totalPages={totalPages}
          total={total}
          hasPrev={hasPrev}
          hasNext={hasNext}
          isFetching={logsQuery.isFetching}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
