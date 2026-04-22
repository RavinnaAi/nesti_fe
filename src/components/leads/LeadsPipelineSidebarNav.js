"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Archive, ListFilter, Sprout, Zap } from "lucide-react";
import {
  DEFAULT_VISIBLE_PIPELINE_KEYS,
  PIPELINE_SETTINGS_EVENT,
  PIPELINE_SIDEBAR_ITEMS,
  readVisiblePipelineKeys,
} from "@/lib/leadPipelineConfig";

const PIPELINE_SIDEBAR_ICONS = {
  active: Zap,
  closed: Archive,
  nurturing: Sprout,
};

function buildLeadsHref(searchParams, { kind, value }) {
  const p = new URLSearchParams(searchParams?.toString() || "");
  p.delete("lead");
  p.set("page", "1");
  p.delete("status");
  p.delete("pipeline");

  if (kind === "all") {
    /* keep other params (e.g. future filters in URL) */
  } else if (kind === "pipeline") {
    p.set("pipeline", value);
  } else if (kind === "status") {
    p.set("status", value);
  }

  const q = p.toString();
  return q ? `/leads?${q}` : "/leads";
}

function isItemActive(searchParams, item) {
  const st = searchParams.get("status") || "";
  const pl = searchParams.get("pipeline") || "";
  if (item.kind === "all") return !st && !pl;
  if (item.kind === "pipeline") return pl === item.value && !st;
  if (item.kind === "status") return st === item.value && !pl;
  return false;
}

/**
 * @param {object} props
 * @param {() => void} [props.onNavigate]
 * @param {boolean} [props.embedded] — hide outer “Pipeline” label + divider (parent section provides title)
 * @param {"compact"|"settings"} [props.variant] — `settings` matches Settings sub-row styling (icon + label)
 * @param {boolean} [props.skipRouteCheck] — show links even when not on /leads (links still go to /leads?…)
 */
export default function LeadsPipelineSidebarNav({
  onNavigate,
  embedded = false,
  variant = "compact",
  skipRouteCheck = false,
}) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE_PIPELINE_KEYS);

  useEffect(() => {
    setVisibleKeys(readVisiblePipelineKeys());
    const onStorage = () => setVisibleKeys(readVisiblePipelineKeys());
    window.addEventListener(PIPELINE_SETTINGS_EVENT, onStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PIPELINE_SETTINGS_EVENT, onStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const items = useMemo(() => {
    const set = new Set(visibleKeys);
    return PIPELINE_SIDEBAR_ITEMS.filter((i) => set.has(i.key));
  }, [visibleKeys]);

  const isLeads = pathname === "/leads" || pathname.startsWith("/leads/");
  if (!skipRouteCheck && !isLeads) return null;

  const list =
    variant === "settings" ? (
      <div className="space-y-1">
        {items.map((item) => {
          const href = buildLeadsHref(searchParams, item);
          const active = isItemActive(searchParams, item);
          const Icon = PIPELINE_SIDEBAR_ICONS[item.key] || ListFilter;
          return (
            <Link
              key={item.key}
              href={href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                active
                  ? "bg-primary/10 text-primary-dark"
                  : "text-text-body hover:bg-primary/5"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={14} className="shrink-0 opacity-90" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    ) : (
      <div
        className={`space-y-0.5 max-h-[min(52vh,360px)] overflow-y-auto [scrollbar-width:thin] ${
          embedded ? "pr-0.5" : "pl-2 pr-1"
        }`}
      >
        {items.map((item) => {
          const href = buildLeadsHref(searchParams, item);
          const active = isItemActive(searchParams, item);
          return (
            <Link
              key={item.key}
              href={href}
              onClick={() => onNavigate?.()}
              className={`flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-primary/12 text-primary-dark"
                  : "text-text-body hover:bg-primary/5 hover:text-text-heading"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    );

  if (embedded) return list;

  return (
    <div className="mt-1 pt-2 border-t border-border/70 space-y-0.5">
      <p className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Pipeline
      </p>
      {list}
    </div>
  );
}
