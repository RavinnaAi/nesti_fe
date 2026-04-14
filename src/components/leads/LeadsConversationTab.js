"use client";

import { Info } from "lucide-react";
import MessageBubble from "@/components/leads/MessageBubble";

export default function LeadsConversationTab({
  selectedConversation,
  messageMeta,
  messagesQuery,
  messages,
  formatMetaEntries,
  onOpenMeta,
}) {
  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-text-heading">Conversation</div>
        <p className="text-xs text-text-muted">
          {selectedConversation
            ? "Latest messages and lead metadata"
            : "Select a lead to view messages"}
        </p>
      </div>

      {selectedConversation ? (
        <>
          {formatMetaEntries(messageMeta).length > 0 ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-indigo-50 border border-indigo-100/50">
              <div className="text-xs font-bold text-indigo-700/80 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Latest AI Message Insights
              </div>
              <button
                onClick={() => onOpenMeta("Latest AI Message Insights", messageMeta)}
                className="p-1.5 rounded-md bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <Info size={14} />
              </button>
            </div>
          ) : null}

          <div className="h-[390px] overflow-y-auto rounded-md border border-border/60 bg-background-light/30 p-3 space-y-2.5 scroll-smooth">
            {messagesQuery.isLoading ? (
              <div className="text-sm text-text-muted">Loading messages...</div>
            ) : messagesQuery.isError ? (
              <div className="text-sm text-red-600">Failed to load messages.</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-text-muted">No messages yet.</div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={`${index}-${message?.id || "msg"}`} message={message} />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-text-muted">Choose a lead to load the conversation.</div>
      )}
    </div>
  );
}
