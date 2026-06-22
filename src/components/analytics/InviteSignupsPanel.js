"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Copy, RefreshCw, Users } from "lucide-react";
import { toast } from "react-toastify";
import { fetchInviteConversions, fetchInviteLinks, fetchInviteMetrics } from "@/lib/inviteClient";

function roleLabel(v) {
  const raw = String(v || "").trim().toLowerCase();
  if (!raw) return "—";
  if (raw === "mortgage_broker") return "Mortgage Broker";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

function TotalsCard({ label, value, tone = "default" }) {
  const tones = {
    default: "bg-white",
    soft: "bg-primary/[0.03]",
  };
  return (
    <div className={`rounded-lg border border-border/70 p-3 ${tones[tone] || tones.default}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-heading tabular-nums">{value}</p>
    </div>
  );
}

function displayNameFromUser(user) {
  const full = String(user?.full_name || "").trim();
  if (full) return full;
  return "Unknown user";
}

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";
}

function ProfileCell({ user }) {
  const name = displayNameFromUser(user);
  const avatarUrl = String(user?.profile_image || "").trim();
  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote URLs
        <img
          src={avatarUrl}
          alt={name}
          className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/60"
          loading="lazy"
        />
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/15">
          {initialsFromName(name)}
        </span>
      )}
      <span className="block max-w-[170px] truncate font-medium text-text-heading" title={name}>
        {name}
      </span>
    </div>
  );
}

export default function InviteSignupsPanel({
  token,
  days = 30,
  showMetrics = true,
  showHeader = true,
  externalMetrics = undefined,
  externalMetricsLoading = false,
  skipMetricsFetch = false,
}) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setPage(1);
  }, [days]);

  const metricsQuery = useQuery({
    queryKey: ["invite-metrics", token, days],
    enabled: Boolean(token) && !skipMetricsFetch,
    queryFn: () => fetchInviteMetrics({ token, days }),
    staleTime: 30_000,
  });

  const metricsData = skipMetricsFetch ? externalMetrics : metricsQuery.data?.metrics;
  const metricsLoading = skipMetricsFetch ? externalMetricsLoading : metricsQuery.isLoading;

  const linksQuery = useQuery({
    queryKey: ["invite-links", token],
    enabled: Boolean(token),
    queryFn: () => fetchInviteLinks({ token, page: 1, limit: 20 }),
    staleTime: 30_000,
  });

  const conversionsQuery = useQuery({
    queryKey: ["invite-conversions", token, days, page],
    enabled: Boolean(token),
    queryFn: () => fetchInviteConversions({ token, days, page, limit: rowsPerPage }),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  const totals = metricsData?.totals || {};
  const points = metricsData?.points || {};
  const rewardsEnabled = points?.rewards_enabled !== false;

  const inviteLinks = useMemo(
    () => (Array.isArray(linksQuery.data?.items) ? linksQuery.data.items : []),
    [linksQuery.data?.items]
  );

  const latestGenericLink = useMemo(() => {
    const now = Date.now();
    const isAlive = (it) => {
      if (!it) return false;
      if (it.source_conversation_id) return false; // generic only
      if (it.is_active === false) return false;
      const exp = it.expires_at ? Date.parse(String(it.expires_at)) : NaN;
      if (Number.isFinite(exp) && exp <= now) return false;
      return Boolean(String(it.share_url || "").trim());
    };
    const genericActive = inviteLinks.find(isAlive);
    if (genericActive) return String(genericActive.share_url).trim();
    const anyGeneric = inviteLinks.find((it) => it && !it.source_conversation_id);
    return String(anyGeneric?.share_url || "").trim();
  }, [inviteLinks]);

  const copyButtonHelp = useMemo(() => {
    if (!token) return "Login required.";
    if (linksQuery.isLoading) return "Fetching your latest invite link…";
    if (linksQuery.isError) return "Could not load invite links.";
    if (!latestGenericLink) return "No generic invite link found. Create one from Dashboard → Invite.";
    return "Invite link ready.";
  }, [token, linksQuery.isLoading, linksQuery.isError, latestGenericLink]);

  const handleCopyLatest = async () => {
    if (!latestGenericLink) {
      toast.info("No invite link found yet. Create one from Dashboard → Invite.");
      return;
    }
    try {
      await navigator.clipboard.writeText(latestGenericLink);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Unable to copy invite link.");
    }
  };

  const items = useMemo(
    () => (Array.isArray(conversionsQuery.data?.items) ? conversionsQuery.data.items : []),
    [conversionsQuery.data?.items]
  );
  const pagination = conversionsQuery.data?.pagination || {};
  const totalPages = Number(pagination.total_pages || 0);
  const hasPrev = Boolean(pagination.has_prev_page) || page > 1;
  const hasNext = Boolean(pagination.has_next_page) || (totalPages > 0 && page < totalPages);

  const isLoading = metricsLoading || linksQuery.isLoading || conversionsQuery.isLoading;
  const tableRows = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (items.length >= rowsPerPage) return items;
    return [...items, ...Array.from({ length: rowsPerPage - items.length }, () => null)];
  }, [items, rowsPerPage]);

  return (
    <section className="rounded-lg border border-border bg-white p-3 shadow-sm">
      {showHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-text-heading">Invite link signups</h3>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              People who joined through your invite links in the last {Number(days) || 30} days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!skipMetricsFetch) metricsQuery.refetch();
                linksQuery.refetch();
                conversionsQuery.refetch();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading hover:bg-primary/5"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCopyLatest}
              disabled={!latestGenericLink || linksQuery.isLoading || linksQuery.isError}
              title={copyButtonHelp}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={14} />
              Copy invite link
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (!skipMetricsFetch) metricsQuery.refetch();
              linksQuery.refetch();
              conversionsQuery.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-text-heading hover:bg-primary/5"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      )}
      {showMetrics ? <p className="mt-2 text-[11px] text-text-muted">{copyButtonHelp}</p> : null}

      {showMetrics ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <TotalsCard label="Invites" value={isLoading ? "…" : totals.invites_sent ?? 0} tone="soft" />
          <TotalsCard label="Clicks" value={isLoading ? "…" : totals.clicked ?? 0} />
          <TotalsCard label="Pending" value={isLoading ? "…" : totals.pending ?? 0} />
          <TotalsCard label="Completed" value={isLoading ? "…" : totals.completed ?? 0} />
          <TotalsCard
            label={rewardsEnabled ? "Points" : "Points (disabled)"}
            value={isLoading ? "…" : points.points_balance ?? 0}
            tone={rewardsEnabled ? "default" : "soft"}
          />
          <TotalsCard
            label="Tier"
            value={isLoading ? "…" : String(points.tier || "bronze").replace(/\b\w/g, (c) => c.toUpperCase())}
          />
          <TotalsCard label="Reputation" value={isLoading ? "…" : `${points.reputation_score ?? 50}/100`} />
        </div>
      ) : null}

      {!rewardsEnabled ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          Referral rewards are currently disabled on the backend. Set{" "}
          <span className="font-mono font-semibold">ENABLE_REFERRAL_REWARDS=true</span> and restart the backend to start
          accumulating points.
        </div>
      ) : null}

      <div className={`${showHeader || showMetrics ? (showMetrics ? "mt-4" : "mt-2") : ""} overflow-hidden rounded-lg border border-border/70`}>
        <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-primary/[0.03] px-3 py-1.5">
          <div className="text-xs font-semibold text-text-heading">People joined</div>
          <div className="text-[11px] text-text-muted">
            {pagination.total != null ? (
              <>
                <span className="font-semibold text-text-heading tabular-nums">{pagination.total}</span>{" "}
                total
              </>
            ) : null}
          </div>
        </div>

        {conversionsQuery.isError ? (
          <div className="px-3 py-4 text-xs text-red-700">Could not load invite signups.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead className="border-b border-border/70 bg-white">
                <tr className="border-b border-border bg-primary/[0.03] text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-2 py-1.5">Profile</th>
                  <th className="px-2 py-1.5">Email</th>
                  <th className="px-2 py-1.5">Role</th>
                  <th className="px-2 py-1.5">Joined at</th>
                  <th className="px-2 py-1.5">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {conversionsQuery.isLoading ? (
                  <tr>
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={5}>
                      Loading signups...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={5}>
                      No signups yet.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, idx) => {
                    if (!row) {
                      return (
                        <tr key={`invite-signups-empty-row-${idx}`} className="h-[36px]" aria-hidden>
                          {Array.from({ length: 5 }).map((_, cellIdx) => (
                            <td key={`invite-signups-empty-cell-${idx}-${cellIdx}`} className="px-2 py-1.5">
                              <span className="invisible">—</span>
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    const user = row?.joined_user || null;
                    const email = String(user?.email || "").trim() || "—";
                    return (
                      <tr key={row.id} className="h-[36px] text-xs text-text-body align-middle">
                        <td className="px-2 py-1.5">
                          <ProfileCell user={user} />
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="block max-w-[220px] truncate" title={email === "—" ? "" : email}>
                            {email}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 capitalize">{roleLabel(user?.role)}</td>
                        <td className="px-2 py-1.5">{fmtDateTime(row.consumed_at)}</td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center rounded-md border border-border bg-white px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                            {String(row.source_channel || "direct") || "direct"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-background-light/40 px-3 py-2">
          <p className="text-xs text-text-muted">
            Page <span className="font-semibold text-text-heading">{Number(pagination.page || page || 1)}</span> of{" "}
            <span className="font-semibold text-text-heading">{Math.max(1, Number(totalPages || 1))}</span>
            {" · "}
            <span className="font-semibold text-text-heading">{Number(pagination.total || items.length || 0)}</span>{" "}
            total
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrev || conversionsQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNext || conversionsQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-text-heading transition hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

