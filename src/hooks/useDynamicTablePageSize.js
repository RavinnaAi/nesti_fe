"use client";

import { useEffect, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Dynamic rows-per-page based on viewport height.
 * Keeps small screens at minRows; scales rows on larger screens.
 */
export default function useDynamicTablePageSize({
  minRows = 10,
  maxRows = 24,
  rowHeight = 44,
  reserveHeight = 240,
  largeScreenMinWidth = 1024,
} = {}) {
  const [rows, setRows] = useState(minRows);

  useEffect(() => {
    const recalc = () => {
      if (typeof window === "undefined") return;
      const h = Number(window.innerHeight || 0);
      const w = Number(window.innerWidth || 0);
      if (w < largeScreenMinWidth) {
        setRows(minRows);
        return;
      }
      const usable = Math.max(0, h - reserveHeight);
      const computed = Math.floor(usable / Math.max(1, rowHeight));
      setRows(clamp(computed, minRows, maxRows));
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [minRows, maxRows, rowHeight, reserveHeight, largeScreenMinWidth]);

  return rows;
}
