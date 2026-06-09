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
  onPropertyMatchSelect,
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
                  ) : !(
                      !isUser &&
                      Array.isArray(msg.propertyMatches) &&
                      msg.propertyMatches.length > 0
                    ) ? (
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
                {!isUser && Array.isArray(msg.propertyMatches) && msg.propertyMatches.length > 0 ? (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {msg.propertyMatchesContext === "sell" ? "Comparable properties" : "Matching properties"}
                    </p>
                    <ul className="space-y-2">
                      {msg.propertyMatches.map((p, pIdx) => {
                        const reasons = Array.isArray(p?.match_reasons)
                          ? p.match_reasons
                          : Array.isArray(p?.reasons_for_matching)
                            ? p.reasons_for_matching
                            : [];
                        const title = p?.title || "Property";
                        const location = p?.address || p?.location || "";
                        const showTypeInMeta =
                          p?.property_type && !String(title).toLowerCase().includes(String(p.property_type).toLowerCase());
                        const meta = [location, showTypeInMeta ? p.property_type : ""].filter(Boolean).join(" · ");
                        const priceLabel =
                          p?.price != null ? formatPrice(p.price) || `$${p.price}` : null;

                        return (
                          <li
                            key={`${p?.id || "pm"}-${pIdx}`}
                            className="rounded-xl border border-primary/10 bg-primary/[0.03] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="min-w-0 text-[12px] font-semibold leading-snug text-text-heading line-clamp-2">
                                {title}
                              </h4>
                              {priceLabel ? (
                                <span className="shrink-0 text-[12px] font-bold text-primary">{priceLabel}</span>
                              ) : null}
                            </div>
                            {meta ? (
                              <p className="mt-1 text-[10px] text-text-muted line-clamp-1">{meta}</p>
                            ) : null}
                            {reasons.length ? (
                              <p className="mt-1.5 text-[10px] font-medium text-primary/75">
                                {reasons.slice(0, 2).join(" · ")}
                              </p>
                            ) : null}
                            {p?.listing_url ? (
                              <a
                                href={p.listing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-[10px] font-semibold text-primary underline-offset-2 hover:underline"
                              >
                                View listing
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof onPropertyMatchSelect === "function") {
                                  onPropertyMatchSelect(p);
                                }
                                handleSend(buildPropertyPickMessage(p, msg.propertyMatchesContext || "buy"));
                              }}
                              className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                            >
                              Select property
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {msg.propertyMatchesNote ? (
                      <p className="mt-2 text-[10px] text-text-muted">{msg.propertyMatchesNote}</p>
                    ) : null}
                  </div>
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
