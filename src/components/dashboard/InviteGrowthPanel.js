"use client";

import { useMemo } from "react";
import { Copy, Link2, Share2, Sparkles, Users } from "lucide-react";

function formatRate(rate) {
  const n = Number(rate || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

export default function InviteGrowthPanel({
  metrics,
  links = [],
  isLoading = false,
  onGenerateInvite,
  onCopyLatest,
  showConversion = true,
}) {
  const totals = metrics?.totals || {};
  const points = metrics?.points || {};
  const latestLink = links?.[0]?.share_url || "";

  const channels = useMemo(() => {
    if (!Array.isArray(metrics?.by_channel)) return [];
    return metrics.by_channel.slice(0, 4);
  }, [metrics?.by_channel]);

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-heading">Referral growth</h3>
          <p className="mt-1 text-xs text-text-muted">
            Invite links, conversions, and reward points from your growth network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerateInvite}
            className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            <Sparkles size={14} />
            Create invite
          </button>
          <button
            type="button"
            onClick={onCopyLatest}
            disabled={!latestLink}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={14} />
            Copy latest
          </button>
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-2 gap-3 ${
          showConversion ? "md:grid-cols-5" : "md:grid-cols-4"
        }`}
      >
        {[
          { key: "invites_sent", label: "Invites", value: totals.invites_sent ?? 0 },
          { key: "clicked", label: "Clicks", value: totals.clicked ?? 0 },
          { key: "pending", label: "Pending", value: totals.pending ?? 0 },
          { key: "completed", label: "Completed", value: totals.completed ?? 0 },
          ...(showConversion
            ? [
                {
                  key: "conversion_rate",
                  label: "Conversion",
                  value: formatRate(totals.conversion_rate ?? 0),
                },
              ]
            : []),
        ].map((item) => (
          <div key={item.key} className="rounded-lg border border-border/70 bg-primary/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-bold text-text-heading tabular-nums">
              {isLoading ? "..." : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-heading">
            <Users size={14} className="text-primary" />
            Channel breakdown
          </div>
          {channels.length ? (
            <div className="space-y-1.5 text-xs text-text-body">
              {channels.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between gap-2">
                  <span className="capitalize text-text-muted">{ch.channel || "direct"}</span>
                  <span className="font-semibold tabular-nums">
                    {ch.completed}/{ch.clicked}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No channel data yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-heading">
            <Link2 size={14} className="text-primary" />
            Share shortcuts
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "email",
                label: "Email",
                href: latestLink
                  ? `mailto:?subject=Join%20my%20Nesti%20network&body=${encodeURIComponent(latestLink)}`
                  : "#",
              },
              {
                id: "whatsapp",
                label: "WhatsApp",
                href: latestLink
                  ? `https://wa.me/?text=${encodeURIComponent(`Join my Nesti network: ${latestLink}`)}`
                  : "#",
              },
              {
                id: "sms",
                label: "SMS",
                href: latestLink
                  ? `sms:?body=${encodeURIComponent(`Join my Nesti network: ${latestLink}`)}`
                  : "#",
              },
              {
                id: "x",
                label: "Social",
                href: latestLink
                  ? `https://x.com/intent/tweet?text=${encodeURIComponent(`Join my Nesti network ${latestLink}`)}`
                  : "#",
              },
            ].map((action) => (
              <a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                  latestLink
                    ? "border-border bg-white text-text-heading hover:bg-primary/5"
                    : "pointer-events-none border-border/60 bg-slate-100 text-text-muted"
                }`}
              >
                <Share2 size={12} />
                {action.label}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Points balance: <span className="font-semibold text-text-heading">{points.points_balance || 0}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
