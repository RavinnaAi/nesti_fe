"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { recordLeadView } from "@/lib/leadsClient";

const leadViewDedupeCache = new Map();

/**
 * Fires a POST /api/leads/:id/view whenever `leadId` becomes truthy or changes.
 * Backend dedupes to one event per UTC day, so calling on every open is safe.
 * Invalidates dashboard analytics queries on a successful first-of-day view so
 * KPI tiles reflect the new count without a manual refresh.
 */
export function useRecordLeadView(leadId, { token, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const firedRef = useRef({ leadId: null, day: null });

  useEffect(() => {
    if (!enabled) return;
    if (!token || !leadId) return;

    const today = new Date().toISOString().slice(0, 10);
    const normalizedLeadId = String(leadId);
    const cacheKey = `${normalizedLeadId}|${today}`;
    const now = Date.now();
    const cached = leadViewDedupeCache.get(cacheKey);
    if (cached && now - cached.at < 60_000) {
      return;
    }
    if (firedRef.current.leadId === normalizedLeadId && firedRef.current.day === today) {
      return;
    }
    firedRef.current = { leadId: normalizedLeadId, day: today };
    leadViewDedupeCache.set(cacheKey, { at: now });

    let cancelled = false;
    recordLeadView({ token, id: normalizedLeadId })
      .then((res) => {
        if (cancelled) return;
        if (res?.recorded) {
          queryClient.invalidateQueries({ queryKey: ["dashboard-analytics-summary"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-analytics-timeseries"] });
        }
      })
      .catch(() => {
        leadViewDedupeCache.delete(cacheKey);
      });

    return () => {
      cancelled = true;
    };
  }, [leadId, token, enabled, queryClient]);
}
