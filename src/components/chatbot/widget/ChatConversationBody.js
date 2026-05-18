"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import QuickReplyButtons from "@/components/chatbot/QuickReplyButtons";
import LeadProfileUserBubble from "@/components/chatbot/widget/LeadProfileUserBubble";
import {
  buildPropertyPickMessage,
  dedupeLawyerAssistantProse,
  formatPrice,
  formatTime,
  renderMessageSegments,
} from "@/components/chatbot/widget/chatWidgetTextUtils";
import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";

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
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background-light scrollbar-hide">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={`${msg.role}-${idx}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
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
                  isUser && msg.leadProfilePreview
                    ? "max-w-[min(92%,21rem)]"
                    : resolvedRole === "lawyer" && !isUser
                      ? "max-w-[min(96%,24rem)]"
                      : "max-w-[85%]"
                } rounded-2xl px-4 py-2.5 shadow-sm relative ${
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
                  ) : (
                    renderMessageSegments(
                      !isUser && resolvedRole === "lawyer"
                        ? dedupeLawyerAssistantProse(msg.content ?? "")
                        : msg.content ?? "",
                      idx,
                      isUser,
                      resolvedRole,
                      parseInlineMarkdownLinks
                    )
                  )}
                </div>
                <p
                  className={`text-[8px] mt-1 font-medium tracking-wide ${
                    isUser ? "text-white/70" : "text-text-muted text-right"
                  }`}
                >
                  {formatTime(msg.timestamp || new Date())}
                </p>

                {!isUser && idx === messages.length - 1 && quickReplies.length > 0 && (
                  <QuickReplyButtons options={quickReplies} onSelect={(opt) => handleSend(opt)} />
                )}
                {!isUser && Array.isArray(msg.propertyMatches) && msg.propertyMatches.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-border bg-background-light/70 p-2 space-y-1.5">
                    <div className="text-[10px] font-semibold text-text-heading">
                      {msg.propertyMatchesContext === "sell" ? "Comparable properties" : "Matching properties"}
                    </div>
                    {msg.propertyMatches.map((p, pIdx) => {
                      const reasons = Array.isArray(p?.match_reasons)
                        ? p.match_reasons
                        : Array.isArray(p?.reasons_for_matching)
                          ? p.reasons_for_matching
                          : [];
                      return (
                        <div
                          key={`${p?.id || "pm"}-${pIdx}`}
                          className="rounded-md border border-border bg-white p-2"
                        >
                          <div className="text-[10px] font-semibold text-text-heading">{p?.title || "Property"}</div>
                          <div className="text-[9px] text-text-muted mt-0.5">
                            {[p?.address || p?.location, p?.property_type].filter(Boolean).join(" • ")}
                          </div>
                          {p?.price != null ? (
                            <div className="text-[10px] font-semibold text-primary mt-1">
                              {formatPrice(p.price) || `$${p.price}`}
                            </div>
                          ) : null}
                          {reasons.length ? (
                            <div className="text-[9px] text-emerald-700 mt-1">
                              {reasons.slice(0, 2).join(" • ")}
                            </div>
                          ) : null}
                          {p?.listing_url ? (
                            <a
                              href={p.listing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-[9px] text-primary underline mt-1"
                            >
                              View listing
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleSend(buildPropertyPickMessage(p, msg.propertyMatchesContext || "buy"))}
                            className="mt-1.5 w-full rounded-md bg-primary text-white text-[9px] font-semibold px-2 py-1.5 hover:brightness-95 transition"
                          >
                            Select this property
                          </button>
                        </div>
                      );
                    })}
                    {msg.propertyMatchesNote ? (
                      <div className="text-[9px] text-text-muted">{msg.propertyMatchesNote}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {loading && leadFlowStep === "chat" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex justify-start items-center ${resolvedRole === "lawyer" ? "gap-0" : "gap-2"}`}
        >
          {resolvedRole !== "lawyer" ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse ${roleUi.accentBgLighter || "bg-primary/10"} ${roleUi.accentText || "text-primary"}`}
            >
              <MessageCircle size={14} />
            </div>
          ) : null}
          <div className="bg-white border border-border rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <div className="flex gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${roleUi.accentDot40 || "bg-primary/40"}`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${roleUi.accentDot60 || "bg-primary/60"}`}
              />
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roleUi.accentDotFull || "bg-primary"}`} />
            </div>
            <span className="text-[10px] font-medium text-text-muted italic">Nesti is thinking...</span>
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
