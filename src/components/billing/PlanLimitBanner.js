"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { planLimitMessages } from "@/lib/planLimitUtils";

export default function PlanLimitBanner({ className = "" }) {
  const { planLimits, usage } = useFeatureAccess();
  const messages = planLimitMessages(planLimits, usage);

  if (!messages.length) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm ${className}`.trim()}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div className="space-y-1.5 leading-relaxed">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
        <Link
          href="/checkout"
          className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/80 transition"
        >
          Upgrade plan
        </Link>
      </div>
    </div>
  );
}
