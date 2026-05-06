"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Archive, Handshake, ListFilter, Sprout, Zap } from "lucide-react";
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
  referrals: Handshake,
};

function buildPipelineSidebarHref(searchParams, item) {
  const { kind, value } = item;
  const p = new URLSearchParams(searchParams?.toString() || "");
  p.delete("lead");
  p.delete("referral");
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
      <div className="space-y-0.5">
        {items.map((item) => {
          const href = buildPipelineSidebarHref(searchParams, item);
          const active = isItemActive(searchParams, item);
          const Icon = PIPELINE_SIDEBAR_ICONS[item.key] || ListFilter;
          return (
            <Link
              key={item.key}
              href={href}
              onClick={() => onNavigate?.()}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                active
                  ? "bg-primary/[0.11] text-primary-dark ring-1 ring-primary/12 shadow-sm"
                  : "text-text-body hover:bg-primary/[0.06]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)] ring-1 ring-white/30"
                    : "bg-gradient-to-br from-background-lighter to-white text-text-muted ring-1 ring-border/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:from-primary/[0.12] group-hover:text-primary-dark group-hover:ring-primary/22"
                }`}
                aria-hidden
              >
                <Icon size={12} strokeWidth={2} className="transition-transform group-hover:scale-105" />
              </span>
              <span className="min-w-0 truncate">{item.label}</span>
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
          const href = buildPipelineSidebarHref(searchParams, item);
          const active = isItemActive(searchParams, item);
          const Icon = PIPELINE_SIDEBAR_ICONS[item.key] || ListFilter;
          return (
            <Link
              key={item.key}
              href={href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-primary/12 text-primary-dark"
                  : "text-text-body hover:bg-primary/5 hover:text-text-heading"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  active
                    ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm ring-1 ring-white/30"
                    : "bg-gradient-to-br from-background-lighter to-white text-text-muted ring-1 ring-border/50"
                }`}
                aria-hidden
              >
                <Icon size={12} strokeWidth={2} />
              </span>
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
