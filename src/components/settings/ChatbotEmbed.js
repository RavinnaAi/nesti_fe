"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, RefreshCw, Link as LinkIcon, Trash2, Pause, Play } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAppSelector } from "@/store";
import dynamic from "next/dynamic";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

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

const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget"), { ssr: false });

export default function ChatbotEmbed() {
  const { token } = useAppSelector((state) => state.auth);
  // Basic chatbot embedding is available on free trial + Basic/Pro subscriptions.
  const { hasFeature } = useFeatureAccess();
  const canUseChatbot = hasFeature(FEATURES.CHATBOT_BASIC);
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [previewToken, setPreviewToken] = useState("");
  const [previewWidgetRole, setPreviewWidgetRole] = useState("agent");

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
    mutationFn: (displayName) =>
      apiClient({
        url: API_ENDPOINTS.embed.generate,
        method: "POST",
        data: displayName
          ? { widget_settings: { display_name: String(displayName).trim() } }
          : {},
        token,
      }),
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

  if (!canUseChatbot) {
    return (
      <div className="rounded-md border border-border bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-semibold text-text-heading mb-1">Embed Chatbot</div>
        <p className="text-sm text-text-body">
          Chatbot embeds are part of the paid Nesti plans.{" "}
          <span className="font-semibold">Upgrade your subscription</span> on the Subscription tab to unlock this
          feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!embeds.length ? (
        <div className="rounded bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-heading mb-1">
              Generate New Embed Link
            </div>
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
      ) : null}

      <div className="rounded bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-text-heading">Your Embed Links</div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
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
            No embed links yet. Generate one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {embeds.map((embed) => {
              const embedDocId = embed?._id || embed?.id;
              const tokenValue = embed?.unique_token || embed?.token;
              const origin = getSiteOrigin() || API_BASE;
              const publicUrl = `${origin}/chatbot/${tokenValue}`;
              const codeSnippet = renderEmbedSnippet(embed);
              const iframeSnippet = `<iframe src="${publicUrl}" style="width:100%;height:100%;border:none;"></iframe>`;
              const providedSnippet = embed?.embed_code || "";
              const active = embed?.is_active !== false;

              return (
                <div
                  key={`embed-${embedDocId || tokenValue}`}
                  className=" flex flex-col gap-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-text-heading">
                        {embed?.widget_settings?.display_name || "Website Chatbot"}
                      </div>
                      <div className="text-xs text-text-muted">
                        Token: {tokenValue} • Created:{" "}
                        {embed?.created_at
                          ? new Date(embed.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            id: embedDocId,
                            payload: { is_active: !active },
                          })
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border transition ${active
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
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="text-xs text-text-body break-all">{publicUrl}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(publicUrl, `url-${tokenValue}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-border hover:bg-background-light transition"
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
                        onClick={() => {
                          setPreviewToken(tokenValue);
                          setPreviewWidgetRole(embed?.widget_role || "agent");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition"
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-text-heading mb-1">
                      Embed snippet
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <pre className="text-[11px] bg-white rounded-md p-3 border border-border overflow-x-auto flex-1">
                        {codeSnippet}
                      </pre>
                      <button
                        type="button"
                        style={{ height: "-webkit-fill-available" }}
                        onClick={() => handleCopy(codeSnippet, `code-${tokenValue}`)}
                        className="inline-flex items-center h-full justify-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-border hover:bg-background-light transition self-start"
                      >
                        {copiedKey === `code-${tokenValue}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {providedSnippet ? (
                    <div>
                      <div className="text-xs font-semibold text-text-heading mb-1">
                        Provided embed code
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <pre className="text-[11px] bg-white rounded-md p-3 border border-border overflow-x-auto flex-1">
                          {providedSnippet}
                        </pre>
                        <button
                          type="button"
                          style={{ height: "-webkit-fill-available" }}
                          onClick={() => handleCopy(providedSnippet, `provided-${tokenValue}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-border hover:bg-background-light transition self-start"
                        >
                          {copiedKey === `provided-${tokenValue}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-xs font-semibold text-text-heading mb-1">
                      Iframe snippet
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <pre className="text-[11px] bg-white rounded-md p-3 border border-border overflow-x-auto flex-1">
                        {iframeSnippet}
                      </pre>
                      <button
                        type="button"
                        style={{ height: "-webkit-fill-available" }}
                        onClick={() => handleCopy(iframeSnippet, `iframe-${tokenValue}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border border-border hover:bg-background-light transition self-start"
                      >
                        {copiedKey === `iframe-${tokenValue}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewToken && (
        <div className="rounded bg-primary-dark/10 shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between ">
            <div>
              <div className="text-sm font-semibold text-text-heading">Live Preview</div>
              <div className="text-xs text-text-muted">
                Embed token: <span className="font-mono">{previewToken}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewToken("");
                setPreviewWidgetRole("agent");
              }}
              className="text-xs text-text-muted hover:text-text-heading"
            >
              Close preview
            </button>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-heading mb-2">
              Iframe embed (production-style)
            </div>
            <div className="w-full h-[480px] rounded-md border border-border overflow-hidden bg-white">
              <iframe
                title="Chatbot iframe preview"
                src={`${getSiteOrigin()}/chatbot/${previewToken}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-heading mb-2">
              In-page widget (dev)
            </div>
            <div className="relative w-full min-h-[400px] bg-transparent rounded overflow-hidden border border-dashed border-border/60">
              <ChatWidget
                embedToken={previewToken}
                widgetRole={previewWidgetRole}
                defaultOpen
                allowLauncher={false}
                title="Chatbot Preview"
                subtitle="Public embed experience"
                inlineMode
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
