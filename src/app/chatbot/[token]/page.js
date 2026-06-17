"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatWidget from "@/components/chatbot/ChatWidget";
import { resolveEmbedToken } from "@/lib/chatClient";
import { normalizeWidgetRole } from "@/lib/chatWidgetRoleUi";

export default function ChatbotByTokenPage() {
  const params = useParams();
  const rawToken = params?.token;
  const token = typeof rawToken === "string" ? rawToken : Array.isArray(rawToken) ? rawToken[0] : "";

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  /** Resolved from embed (and server falls back to host professional_type when embed.widget_role is unset). */
  const [widgetRole, setWidgetRole] = useState(null);
  /** Optional label from embed settings; otherwise ChatWidget uses role defaults (agent / mortgage / legal). */
  const [titleOverride, setTitleOverride] = useState("");
  const [hostAvatarUrl, setHostAvatarUrl] = useState("");
  const [hostDisplayName, setHostDisplayName] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const json = await resolveEmbedToken(token);
        if (!mounted) return;
        setWidgetRole(normalizeWidgetRole(json?.widget_role));
        const settings =
          json?.widget_settings && typeof json.widget_settings === "object" ? json.widget_settings : {};
        const configuredName = String(settings.display_name ?? settings.displayName ?? "").trim();
        const resolvedHostName = String(json?.host_display_name ?? "").trim();
        // Keep widget title consistent with professional profile display name.
        // Use embed-configured label only as a fallback when host name is unavailable.
        setTitleOverride(resolvedHostName || configuredName);
        setHostDisplayName(resolvedHostName);
        setHostAvatarUrl(String(json?.profile_image ?? "").trim());
        setStatus("ok");
      } catch (err) {
        if (mounted) {
          setError(err?.message || "This chatbot link is not working.");
          setStatus("error");
        }
      }
    };
    if (token) run();
    else if (mounted) {
      setError("Missing chat link token.");
      setStatus("error");
    }
    return () => {
      mounted = false;
    };
  }, [token]);

  if (status === "loading") {
    return null;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-md border border-border bg-white shadow-sm p-6 text-center space-y-3">
          <div className="text-lg font-semibold text-text-heading">Link not available</div>
          <p className="text-sm text-text-body">
            {error || "This link is not working anymore. Please contact the sender."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatWidget
        embedToken={token}
        widgetRole={widgetRole ?? "agent"}
        title={titleOverride || undefined}
        hostAvatarUrl={hostAvatarUrl}
        hostDisplayName={hostDisplayName}
        defaultOpen={false}
        allowLauncher
      />
    </div>
  );
}
