"use client";

import { useEffect, useState } from "react";
import ChatWidget from "@/components/chatbot/ChatWidget";
import { resolveEmbedToken } from "@/lib/chatClient";

export default function ChatbotByTokenPage({ params }) {
  const token = params?.token;
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await resolveEmbedToken(token);
        if (mounted) setStatus("ok");
      } catch (err) {
        if (mounted) {
          setError(err?.message || "This chatbot link is not working.");
          setStatus("error");
        }
      }
    };
    if (token) run();
    return () => {
      mounted = false;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-text-body">Loading your chatbot…</div>
      </div>
    );
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
      <ChatWidget embedToken={token} defaultOpen allowLauncher={false} />
    </div>
  );
}
