"use client";

import { RotateCcw, Send } from "lucide-react";

export default function ChatWidgetFooter({
  input,
  setInput,
  handleKeyPress,
  embedToken,
  roleUi,
  handleSend,
  disabledSend,
  loading,
  showPreflightChatResetRow,
  handleStartNewRequest,
  messagesLength,
  useAgentLeadForm,
  useRolePreflight,
  handleClear,
}) {
  return (
    <div className="border-t border-border bg-white">
      <div className="p-4 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={embedToken ? "Type your message..." : "Embed token missing"}
          disabled={!embedToken}
          className={`flex-1 px-4 py-2 border border-border rounded-xl bg-background-light shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${roleUi.accentRingFocus || "focus:ring-primary/25 focus:border-primary"}`}
        />
        <button
          onClick={() => handleSend()}
          disabled={disabledSend}
          className={`px-4 py-2 text-white rounded-xl transition disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center shadow-sm disabled:hover:brightness-100 ${roleUi.accentBg || "bg-primary"} ${roleUi.accentBgHover || "hover:brightness-95"}`}
          aria-label={loading ? "Waiting for reply…" : "Send message"}
          aria-busy={loading}
        >
          <Send size={20} aria-hidden />
        </button>
      </div>

      {showPreflightChatResetRow ? (
        <div className="shrink-0 border-t border-border/60 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleStartNewRequest}
            className="text-[11px] font-medium text-text-muted hover:text-text-heading px-2 py-1.5 rounded-lg transition"
            title="Start a new request with a fresh form and chat"
          >
            Start new request
          </button>
        </div>
      ) : messagesLength > 0 ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={useAgentLeadForm || useRolePreflight ? handleStartNewRequest : handleClear}
            className="text-xs text-text-muted hover:text-text-heading transition inline-flex items-center gap-1"
          >
            <RotateCcw size={12} aria-hidden />
            {useAgentLeadForm || useRolePreflight ? "Start new request" : "Clear conversation"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
