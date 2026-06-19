"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, RefreshCw, Link as LinkIcon, Trash2, Pause, Play } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAppSelector } from "@/store";
import { PROFESSIONAL_ROLE_VALUES } from "@/constants/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/** Origin where the Next app is served (embed + iframe URLs), not the API host. */
function getSiteOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  );
}

export default function ChatbotEmbed() {
  const { token, user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["embed-links"],
    enabled: Boolean(token),
    queryFn: async () => {
      return apiClient({
        url: API_ENDPOINTS.embed.list,
        method: "GET",
        token,
      });
    },
  });

  const embeds = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.embeds)) return data.embeds;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const generateMutation = useMutation({
    mutationFn: (displayName) => {
      const payload = {};
      const role = user?.role;
      if (role && PROFESSIONAL_ROLE_VALUES.includes(role)) {
        payload.widget_role = role;
      }
      const name = String(displayName || "").trim();
      if (name) payload.widget_settings = { display_name: name };
      return apiClient({
        url: API_ENDPOINTS.embed.generate,
        method: "POST",
        data: payload,
        token,
      });
    },
    onSuccess: () => {
      toast.success("Embed link generated");
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["embed-links"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to generate"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient({
        url: API_ENDPOINTS.embed.update(id),
        method: "PATCH",
        data: payload,
        token,
      }),
    onSuccess: () => {
      toast.success("Embed updated");
      queryClient.invalidateQueries({ queryKey: ["embed-links"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiClient({
        url: API_ENDPOINTS.embed.remove(id),
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      toast.success("Embed deleted");
      queryClient.invalidateQueries({ queryKey: ["embed-links"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to delete"),
  });

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1500);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const renderStripedSnippetRow = (label, value, copyKey, tone = "light") => (
    <div className={`border-t border-border px-4 py-3 ${tone === "muted" ? "bg-background-light/45" : "bg-white"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
        <button
          type="button"
          onClick={() => handleCopy(value, copyKey)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-text-muted transition hover:border-primary/35 hover:text-primary"
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          {copiedKey === copyKey ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <code className="font-mono text-[11px] leading-relaxed text-text-body whitespace-nowrap">
          {value}
        </code>
      </div>
    </div>
  );

  const renderEmbedSnippet = (embed) => {
    const tokenValue = embed?.unique_token || embed?.token || embed?._id;
    const origin = getSiteOrigin() || API_BASE;
    const scriptSrc = `${origin}/chatbot/widget.js?token=${tokenValue}`;
    return `<script src="${scriptSrc}"></script>`;
  };

  if (!token) {
    return (
      <div className="rounded-md border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-2">Embed Chatbot</div>
        <p className="text-sm text-text-body">
          Please log in to manage your chatbot embed links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!embeds.length ? (
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="mb-1 text-sm font-semibold text-text-heading">
              Generate New Embed Link
            </div>
              <p className="mb-2 text-xs text-text-muted">
                Create a shareable chatbot URL and ready-to-use code snippets.
              </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Optional name, e.g. 'Website Chatbot'"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => generateMutation.mutate(newName.trim())}
            disabled={generateMutation.isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generateMutation.isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate Link"
            )}
          </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
          <div>
            <div className="text-base font-semibold text-text-heading">Your Embed Links</div>
            <p className="mt-0.5 text-xs text-text-muted">Manage status, preview link, and copy integration snippets.</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-md border border-primary/20 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-text-body">Loading embeds...</div>
        ) : isError ? (
          <div className="text-sm text-red-600">Failed to load embeds.</div>
        ) : !embeds.length ? (
            <div className="text-sm text-text-body">
            No embed links yet. Generate one to get started. The widget matches your account type (agent,
            mortgage broker, or lawyer) and uses the same chat API as the static HTML demos in{" "}
            <code className="text-xs">node-backend/</code>.
          </div>
        ) : (
          <div className="space-y-4">
            {embeds.map((embed) => {
              const embedDocId = embed?._id || embed?.id;
              const tokenValue = embed?.unique_token || embed?.token;
              const origin = getSiteOrigin() || API_BASE;
              const publicUrl = `${origin}/chatbot/${tokenValue}`;
              const codeSnippet = renderEmbedSnippet(embed);
              const iframeSnippet = `<iframe src="${publicUrl}" style="width:100%;height:100%;border:none;"></iframe>`;
              const providedSnippet = embed?.embed_code || "";
              const active = embed?.is_active !== false;
              const createdAtValue = embed?.created_at || embed?.createdAt || null;

              return (
                <div
                  key={`embed-${embedDocId || tokenValue}`}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-text-heading">
                          {embed?.widget_settings?.display_name || "Website Chatbot"}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <div
                          className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border bg-background-light/50 px-2.5 py-1"
                          title={tokenValue}
                        >
                          <span className="font-semibold text-text-muted">Token</span>
                          <span className="max-w-[22rem] truncate font-mono text-[11px] text-text-body">
                            {tokenValue}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background-light/50 px-2.5 py-1">
                          <span className="font-semibold text-text-muted">Widget</span>
                          <span className="font-medium capitalize text-text-body">
                            {embed?.widget_role || "agent"}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background-light/50 px-2.5 py-1">
                          <span className="font-semibold text-text-muted">Created</span>
                          <span className="text-text-body">
                            {createdAtValue ? new Date(createdAtValue).toLocaleString() : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            id: embedDocId,
                            payload: { is_active: !active },
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${active
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-border text-text-heading bg-white"
                          }`}
                      >
                        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(embedDocId)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border bg-background-light/45 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="truncate text-xs text-text-body md:max-w-[70%]" title={publicUrl}>
                      {publicUrl}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(publicUrl, `url-${tokenValue}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-background-light"
                      >
                        {copiedKey === `url-${tokenValue}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {renderStripedSnippetRow("Embed snippet", codeSnippet, `code-${tokenValue}`, "light")}
                  {providedSnippet ? (
                    renderStripedSnippetRow("Provided embed code", providedSnippet, `provided-${tokenValue}`, "muted")
                  ) : null}
                  {renderStripedSnippetRow("Iframe snippet", iframeSnippet, `iframe-${tokenValue}`, "light")}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
