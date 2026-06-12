"use client";

import { useEffect, useRef } from "react";
import { Inbox, Info } from "lucide-react";
import MessageBubble from "@/components/leads/MessageBubble";
import { SkeletonBlock } from "@/components/ui/ContentSkeletons";

export default function LeadsConversationTab({
  selectedConversation,
  messageMeta,
  messagesQuery,
  messages,
  formatMetaEntries,
  onOpenMeta,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!messages.length || messagesQuery.isLoading) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, messagesQuery.isLoading, selectedConversation?.id]);

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-4 space-y-3">
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

          <div
            ref={scrollRef}
            className="h-[65vh] min-h-[460px] max-h-[calc(100vh-11rem)] overflow-y-auto rounded-md border border-border/60 bg-background-light/30 p-3 space-y-2.5 scroll-smooth"
          >
            {messagesQuery.isPending || messagesQuery.isLoading ? (
              <div className="space-y-2.5" aria-busy="true" aria-label="Loading conversation">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const inbound = idx % 2 === 0;
                  return (
                    <div
                      key={`conversation-skeleton-${idx}`}
                      className={`flex ${inbound ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-xl border border-border/50 bg-white/80 p-2.5 shadow-sm ${
                          inbound ? "rounded-bl-md" : "rounded-br-md"
                        }`}
                      >
                        <SkeletonBlock className="h-3 w-20" />
                        <SkeletonBlock className="mt-1.5 h-3 w-56 max-w-[92%]" />
                        <SkeletonBlock className="mt-1.5 h-3 w-40 max-w-[72%]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : messagesQuery.isError ? (
              <div className="text-sm text-red-600">Failed to load messages.</div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center px-3 py-6">
                <div className="w-full max-w-sm rounded-xl border border-border/70 bg-white/80 px-5 py-6 text-center shadow-sm">
                  <span className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Inbox size={16} />
                  </span>
                  <p className="text-sm font-semibold text-text-heading">No messages yet</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Conversation messages will appear here once this lead starts chatting.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={`${index}-${message?.id || "msg"}`} message={message} />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center px-3 py-6">
          <div className="w-full max-w-sm rounded-xl border border-border/70 bg-background-light/40 px-5 py-6 text-center shadow-sm">
            <span className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Info size={16} />
            </span>
            <p className="text-sm font-semibold text-text-heading">Choose a lead to load conversation</p>
            <p className="mt-1 text-xs text-text-muted">
              Select a lead from the table to view its full chat history here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
