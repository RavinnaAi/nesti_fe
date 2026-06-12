"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import QuickReplyButtons from "@/components/chatbot/QuickReplyButtons";
import LeadProfileUserBubble from "@/components/chatbot/widget/LeadProfileUserBubble";
import ChatPropertyMatchCards from "@/components/chatbot/widget/ChatPropertyMatchCards";
import {
  dedupeLawyerAssistantProse,
  formatTime,
  renderMessageSegments,
} from "@/components/chatbot/widget/chatWidgetTextUtils";
import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";
import {
  getChatMatchBedsBaths,
  getChatMatchBudgetLabel,
  getChatMatchLocation,
  getChatMatchPartyName,
  getChatMatchType,
} from "@/lib/chatPropertyMatchDisplay";

export default function ChatConversationBody({
  messages,
  roleUi,
  resolvedRole,
  showHostAvatar,
  trimmedAvatarUrl,
  setHostAvatarBroken,
  quickReplies,
  handleSend,
  loading,
  leadFlowStep,
  error,
  messagesEndRef,
  onPropertyMatchSelect,
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background-light scrollbar-hide">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const hasPropertyMatchCards =
            !isUser &&
            Array.isArray(msg.propertyMatches) &&
            (msg.propertyMatches.length > 0 || msg.propertyMatchesEmpty);
          const userSelectedProperty =
            isUser && msg.selectedProperty && typeof msg.selectedProperty === "object"
              ? msg.selectedProperty
              : null;
          return (
            <motion.div
              key={`${msg.role}-${idx}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2 ${
                hasPropertyMatchCards ? "w-full" : ""
              }`}
            >
              {!isUser && showHostAvatar ? (
                <div
                  className={`w-8 h-8 rounded-full shrink-0 overflow-hidden border ${roleUi.accentBorder || "border-primary/20"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trimmedAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setHostAvatarBroken(true)}
                  />
                </div>
              ) : !isUser && resolvedRole !== "lawyer" ? (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${roleUi.accentBgLighter || "bg-primary/10"} ${roleUi.accentText || "text-primary"} ${roleUi.accentBorder || "border-primary/20"}`}
                >
                  <MessageCircle size={14} />
                </div>
              ) : null}
              <div
                className={`${
                  hasPropertyMatchCards
                    ? "w-full max-w-full flex-1"
                    : isUser && msg.leadProfilePreview
                      ? "max-w-[min(92%,21rem)]"
                      : resolvedRole === "lawyer" && !isUser
                        ? "max-w-[min(96%,24rem)]"
                        : "max-w-[85%]"
                } rounded-2xl px-4 py-2.5 min-h-[3rem] shadow-sm relative ${
                  isUser ? `${roleUi.accentBg || "bg-primary"} text-white` : "bg-white border border-border text-text-heading"
                }`}
              >
                <div
                  className="text-[13px] leading-relaxed break-words space-y-1 [&_a]:underline [&_a]:font-semibold"
                  {...(isUser && msg.leadProfilePreview
                    ? { "aria-label": msg.content ?? "Your profile summary" }
                    : {})}
                >
                  {isUser && msg.leadProfilePreview ? (
                    <LeadProfileUserBubble
                      headline={msg.leadProfilePreview.headline}
                      paragraphs={msg.leadProfilePreview.paragraphs}
                    />
                  ) : userSelectedProperty ? (
                    <div className="space-y-1.5 rounded-xl border border-white/25 bg-white/10 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-white/85">Selected property</p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-white">
                          {getChatMatchPartyName(userSelectedProperty) || "Property"}
                        </p>
                        {getChatMatchBudgetLabel(userSelectedProperty) ? (
                          <span className="shrink-0 text-[11px] font-bold text-white">
                            {getChatMatchBudgetLabel(userSelectedProperty)}
                          </span>
                        ) : null}
                      </div>
                      {getChatMatchLocation(userSelectedProperty) ? (
                        <p className="text-[10px] text-white/90">{getChatMatchLocation(userSelectedProperty)}</p>
                      ) : null}
                      {(() => {
                        const detailLine = [
                          getChatMatchType(userSelectedProperty),
                          getChatMatchBedsBaths(userSelectedProperty),
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        if (!detailLine) return null;
                        return <p className="text-[10px] text-white/90">{detailLine}</p>;
                      })()}
                    </div>
                  ) : !hasPropertyMatchCards ? (
                    renderMessageSegments(
                      !isUser && resolvedRole === "lawyer"
                        ? dedupeLawyerAssistantProse(msg.content ?? "")
                        : msg.content ?? "",
                      idx,
                      isUser,
                      resolvedRole,
                      parseInlineMarkdownLinks
                    )
                  ) : null}
                </div>
                {hasPropertyMatchCards ? (
                  <ChatPropertyMatchCards
                    matches={msg.propertyMatches}
                    context={msg.propertyMatchesContext || "buy"}
                    displayMode={msg.propertyMatchesDisplayMode || "matches"}
                    note={msg.propertyMatchesNote}
                    empty={Boolean(msg.propertyMatchesEmpty)}
                    onPropertyMatchSelect={onPropertyMatchSelect}
                    onSelectProperty={handleSend}
                  />
                ) : null}

                {!isUser && idx === messages.length - 1 && quickReplies.length > 0 && (
                  <QuickReplyButtons options={quickReplies} onSelect={(opt) => handleSend(opt)} />
                )}

                <p
                  className={`text-[8px] mt-1 font-medium tracking-wide ${
                    isUser ? "text-white/70" : "text-text-muted text-right"
                  }`}
                >
                  {formatTime(msg.timestamp || new Date())}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {loading && leadFlowStep === "chat" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start items-center gap-2"
        >
          {trimmedAvatarUrl ? (
            <div
              className={`w-8 h-8 rounded-full shrink-0 overflow-hidden border ${roleUi.accentBorder || "border-primary/20"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trimmedAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setHostAvatarBroken(true)}
              />
            </div>
          ) : resolvedRole !== "lawyer" ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse ${roleUi.accentBgLighter || "bg-primary/10"} ${roleUi.accentText || "text-primary"}`}
            >
              <MessageCircle size={14} />
            </div>
          ) : null}
          <div className="bg-white border border-border rounded-2xl px-4 py-3 flex items-center shadow-sm">
            <div className="flex gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${roleUi.accentDot40 || "bg-primary/40"}`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${roleUi.accentDot60 || "bg-primary/60"}`}
              />
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roleUi.accentDotFull || "bg-primary"}`} />
            </div>
          </div>
        </motion.div>
      )}

      {error ? (
        <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>
      ) : null}

      <div ref={messagesEndRef} />
    </div>
  );
}
