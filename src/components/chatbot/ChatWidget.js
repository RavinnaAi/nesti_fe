"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, MessageCircle, RotateCcw } from "lucide-react";
import {
  clearChatSession,
  fetchChatPropertyMatches,
  getOrCreateSessionId,
  getVisitorId,
  resetChatIdentity,
  sendChatMessage,
  setVisitorId,
} from "@/lib/chatClient";
import { motion, AnimatePresence } from "framer-motion";
import QuickReplyButtons from "./QuickReplyButtons";
import ConversationProgress from "./ConversationProgress";
import AgentLeadOnboarding from "./AgentLeadOnboarding";
import {
  agentUserSummaryLine,
  buildAgentFormContactOverride,
  buildAgentFormData,
  buildAgentOpeningMessage,
  buildLeadProfileNarrative,
  emptyAgentLeadDraft,
  LEAD_STEP_LABELS,
  PRE_CHAT_STEPS,
  widgetRoleToChatAgentType,
} from "./agentLeadCapture";
import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";
const formatTime = (date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
};

/** Compact first user message: white copy, bold labels, paragraph flow (no form grid). */
function LeadProfileUserBubble({ headline, paragraphs }) {
  const linkClass = "text-white underline font-semibold decoration-white/80";
  return (
    <div className="text-left text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-white m-0 mb-2 opacity-95">
        {headline}
      </p>
      <div className="space-y-2 text-[12px] leading-[1.55] text-white font-normal [&_strong]:text-white [&_strong]:font-semibold">
        {paragraphs.map((md, i) => (
          <p key={i} className="m-0">
            {parseInlineMarkdownLinks(md, linkClass)}
          </p>
        ))}
      </div>
    </div>
  );
}

const buildPropertyPickMessage = (property, context = "buy") => {
  const title = String(property?.title || "").trim();
  const place = String(property?.address || property?.location || "").trim();
  const price = property?.price != null ? (formatPrice(property.price) || `$${property.price}`) : "";
  const summary = [title, place, price].filter(Boolean).join(" • ");
  const refId = property?.id ? ` (ref: ${property.id})` : "";

  if (context === "sell") {
    return summary
      ? `I selected this comparable: ${summary}${refId}. Please guide me on pricing strategy and next steps.`
      : `I selected this comparable${refId}. Please guide me on pricing strategy and next steps.`;
  }
  return summary
    ? `I selected this property: ${summary}${refId}. Please guide me on viewing and next steps.`
    : `I selected this property${refId}. Please guide me on viewing and next steps.`;
};

const isDetailsConfirmationMessage = (text) => {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return false;
  const exact = new Set([
    "yes",
    "y",
    "yep",
    "yeah",
    "sure",
    "correct",
    "confirmed",
    "looks good",
    "all good",
    "perfect",
    "right",
    "ok",
    "okay",
    "agreed",
    "approved",
    "go ahead",
    "please proceed",
  ]);
  if (exact.has(t)) return true;
  return (
    /details?.*(correct|right|good|fine|ok|okay|perfect|great|accurate)/.test(t) ||
    /(everything|all(\s+the)?\s+details?).*(correct|right|good|fine|ok|okay|perfect|great)/.test(t) ||
    /(looks?|seems?).*(correct|right|good|fine|perfect|great)/.test(t) ||
    /(confirm|confirmed).*(details?|information|info)/.test(t) ||
    /\b(entered\s+)?details?\s+(are|is)\s+(perfect|correct|right|good|fine|accurate)\b/.test(t) ||
    /\b(that'?s|it'?s)\s+(all\s+)?(correct|right|perfect|accurate|good|fine)\b/.test(t) ||
    /\b(all|everything)\s+(is|sounds?|looks?)\s+(correct|good|perfect|fine)\b/.test(t) ||
    /\b(no\s+)?changes?\s+(needed|required)\b/.test(t) ||
    /\b(that'?s|sounds?|looks?)\s+(perfect|great|good)\b/.test(t) ||
    /\b(spot\s+on|exactly|precisely)\b/.test(t)
  );
};

const BULLET_LINE_RE = /^(-|\*|•)\s+/;

const isBulletLine = (trimmed) => Boolean(trimmed && BULLET_LINE_RE.test(trimmed));

const stripBulletMarker = (trimmed) => trimmed.replace(BULLET_LINE_RE, "");

/** Splits message into prose blocks, blank spacers, and consecutive markdown-style bullet runs. */
const segmentMessageLines = (raw) => {
  const lines = String(raw ?? "").split("\n");
  const segments = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      segments.push({ type: "blank" });
      i++;
      continue;
    }
    if (isBulletLine(trimmed)) {
      const bulletLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        if (!isBulletLine(t)) break;
        bulletLines.push(lines[i]);
        i++;
      }
      segments.push({ type: "bullets", lines: bulletLines });
    } else {
      const textLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        if (isBulletLine(t)) break;
        textLines.push(lines[i]);
        i++;
      }
      segments.push({ type: "text", lines: textLines });
    }
  }
  return segments;
};

const renderMessageSegments = (content, msgIdx, isUser) => {
  const linkClass = isUser ? "text-white underline" : "text-primary";
  const segments = segmentMessageLines(content);
  const nodes = [];
  let k = 0;

  for (const seg of segments) {
    if (seg.type === "blank") {
      nodes.push(<div key={`msg-${msgIdx}-sp-${k++}`} className="h-2" />);
      continue;
    }
    if (seg.type === "text") {
      for (const line of seg.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        nodes.push(
          <div key={`msg-${msgIdx}-tx-${k++}`}>
            <span>{parseInlineMarkdownLinks(line, linkClass)}</span>
          </div>,
        );
      }
      continue;
    }
    if (seg.type === "bullets") {
      const listClassName = !isUser
        ? "my-1.5 rounded-xl border border-border/80 bg-gradient-to-b from-emerald-50/40 to-background-light/95 px-3 py-2.5 space-y-2 shadow-sm"
        : "my-1 space-y-1.5";
      nodes.push(
        <div key={`msg-${msgIdx}-bl-${k++}`} className={listClassName}>
          {seg.lines.map((line, bi) => {
            const trimmed = line.trim();
            const inner = stripBulletMarker(trimmed);
            return (
              <div key={`msg-${msgIdx}-b-${bi}`} className="flex gap-2.5 items-start text-left">
                <span
                  className={`mt-0.5 shrink-0 w-5 text-center text-[13px] font-semibold leading-relaxed ${
                    isUser ? "text-white/90" : "text-primary"
                  }`}
                  aria-hidden
                >
                  •
                </span>
                <span className="flex-1 min-w-0 leading-relaxed">
                  {parseInlineMarkdownLinks(inner, linkClass)}
                </span>
              </div>
            );
          })}
        </div>,
      );
    }
  }

  return nodes.length ? nodes : null;
};

export default function ChatWidget({
  embedToken,
  widgetRole,
  defaultOpen = true,
  allowLauncher = true,
  launcherLabel = "Open chat",
  title = "Real Estate Assistant",
  subtitle = "Ready to help • Secure chat",
  inlineMode = false,
  initialGreeting = "Hello! How can I help with your real estate journey today?",
}) {
  const resolvedRole = widgetRole || "agent";
  const useAgentLeadForm = resolvedRole === "agent";

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== "undefined" ? getOrCreateSessionId() : "",
  );
  const [visitorId, setVisitorIdState] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const lastPropertyMatchesSignatureRef = useRef("");
  const shouldFetchMatchesOnNextAssistantReplyRef = useRef(false);
  const lastOutboundUserTextRef = useRef("");
  const latestCalendlyLinkRef = useRef("");

  const [leadFlowStep, setLeadFlowStep] = useState(() =>
    resolvedRole !== "agent" ? "chat" : "intent",
  );
  const [chosenIntent, setChosenIntent] = useState(null);
  const [leadDraft, setLeadDraft] = useState(() => emptyAgentLeadDraft());
  const [formValidationError, setFormValidationError] = useState("");
  const [leadFormContact, setLeadFormContact] = useState(null);

  useEffect(() => {
    if (widgetRole && widgetRole !== "agent") {
      setLeadFlowStep("chat");
    }
  }, [widgetRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = getOrCreateSessionId();
    setSessionId((prev) => (String(prev || "").trim() ? prev : sid));
    const vid = getVisitorId();
    if (vid) setVisitorIdState(vid);
  }, []);

  useEffect(() => {
    if (useAgentLeadForm && leadFlowStep !== "chat") return;
    if (!initialGreeting || messages.length) return;
    setMessages([
      {
        role: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      },
    ]);
  }, [useAgentLeadForm, leadFlowStep, initialGreeting, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, leadFlowStep]);

  const addMessage = useCallback((role, content, extras = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date(),
        ...extras,
      },
    ]);
  }, []);

  const appendPropertyMatchesMessage = useCallback(
    async ({ currentVisitorId, formContactSnapshot }) => {
      if (!embedToken || !sessionId || !useAgentLeadForm) return;
      try {
        const payload = await fetchChatPropertyMatches({
          sessionId,
          embedToken,
          visitorId: currentVisitorId || visitorId,
          formContact: formContactSnapshot || leadFormContact || undefined,
          page: 1,
          limit: 5,
        });
        const meta = payload?.meta || {};
        const matches = Array.isArray(meta.property_matches) ? meta.property_matches : [];
        const signature = [
          String(meta.property_matches_context || ""),
          String(meta.pagination?.total || matches.length),
          matches
            .map((m) => String(m?.id || `${m?.title || ""}-${m?.listing_url || ""}`))
            .join("|"),
        ].join("::");
        if (signature === lastPropertyMatchesSignatureRef.current) return;
        lastPropertyMatchesSignatureRef.current = signature;
        // No second bubble when there are no matches — the main assistant reply already covers next steps / booking.
        if (!matches.length) return;
        addMessage(
          "assistant",
          meta.property_matches_context === "sell"
            ? "Here are comparable properties based on your details:"
            : "Here are properties that may match your request:",
          {
            propertyMatches: matches,
            propertyMatchesContext: meta.property_matches_context || null,
            propertyMatchesNote: meta.property_matches_note || null,
          },
        );
      } catch (err) {
        setError(err?.message || "Property matches could not be loaded.");
      }
    },
    [addMessage, embedToken, sessionId, useAgentLeadForm, visitorId, leadFormContact, setError],
  );

  const applyChatPayload = useCallback(
    (payload, currentVisitorId, formContactSnapshot = null) => {
      const meta = payload?.meta || {};
      const reply = payload?.reply ?? payload?.response;
      const intent = meta.intent ?? payload?.intent;
      const action = meta.next_action ?? payload?.next_action;
      const extracted = payload?.extracted_data || meta.extracted_data || {};

      if (intent === "buy" || intent === "sell") setStep(1);
      if (extracted?.budget || extracted?.timeline) setStep(2);
      if (action === "collect_contact") setStep(3);
      if (action === "offer_booking") setStep(4);

      if (action === "collect_contact") {
        setQuickReplies(["Share email", "Share phone", "Maybe later"]);
      } else {
        setQuickReplies([]);
      }

      const returnedVisitor =
        meta.visitorId || payload?.visitor_id || payload?.visitorId || meta.visitor_id;
      const visitorForMatches = String(currentVisitorId || returnedVisitor || "").trim();
      if (returnedVisitor && !currentVisitorId) {
        setVisitorId(returnedVisitor);
        setVisitorIdState(returnedVisitor);
      }
      if (meta.calendly_link && typeof meta.calendly_link === "string") {
        latestCalendlyLinkRef.current = meta.calendly_link;
      }

      addMessage("assistant", reply || "Thanks! How else can I help?");
      const wantsMatchesAfterConfirm =
        shouldFetchMatchesOnNextAssistantReplyRef.current ||
        (Boolean(meta.property_matches_available) &&
          isDetailsConfirmationMessage(lastOutboundUserTextRef.current));
      if (wantsMatchesAfterConfirm) {
        shouldFetchMatchesOnNextAssistantReplyRef.current = false;
        appendPropertyMatchesMessage({
          currentVisitorId: visitorForMatches,
          formContactSnapshot,
        });
      }
    },
    [addMessage, appendPropertyMatchesMessage, leadFormContact, sessionId],
  );

  const handleSend = async (overrideText = null) => {
    const text = overrideText || input.trim();
    if (!text || loading || !embedToken || !sessionId) return;

    if (!overrideText) setInput("");
    lastOutboundUserTextRef.current = text;
    addMessage("user", text);
    shouldFetchMatchesOnNextAssistantReplyRef.current = isDetailsConfirmationMessage(text);
    setLoading(true);
    setError("");
    setQuickReplies([]);

    try {
      const response = await sendChatMessage({
        message: text,
        sessionId,
        embedToken,
        visitorId,
        agentType: widgetRoleToChatAgentType(resolvedRole),
        formContact: leadFormContact || undefined,
      });

      const payload = response?.data || response;
      applyChatPayload(payload, visitorId, leadFormContact);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleStartChatFromForm = async () => {
    if (!chosenIntent || !sessionId || !embedToken || loading) return;

    const name = leadDraft.name.trim();
    const phone = leadDraft.phone.trim();
    const email = leadDraft.email.trim();
    if (!name || !phone || !email) {
      setFormValidationError("Please add your name, phone, and email to continue.");
      return;
    }
    setFormValidationError("");

    const formData = buildAgentFormData(chosenIntent, leadDraft);
    const formContact = buildAgentFormContactOverride(formData);
    const opening = buildAgentOpeningMessage(chosenIntent, formData);
    const summary = agentUserSummaryLine(chosenIntent, formData);
    const leadProfilePreview = buildLeadProfileNarrative(chosenIntent, formData);

    setLeadFormContact(formContact);
    setLeadFlowStep("chat");
    setMessages([
      {
        role: "user",
        content: summary,
        leadProfilePreview,
        timestamp: new Date(),
      },
    ]);
    setLoading(true);
    setError("");
    setQuickReplies([]);
    lastOutboundUserTextRef.current = opening;
    shouldFetchMatchesOnNextAssistantReplyRef.current = false;
    lastPropertyMatchesSignatureRef.current = "";

    try {
      const response = await sendChatMessage({
        message: opening,
        sessionId,
        embedToken,
        visitorId,
        agentType: widgetRoleToChatAgentType(resolvedRole),
        formContact,
      });
      const payload = response?.data || response;
      applyChatPayload(payload, visitorId, formContact);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    try {
      await clearChatSession(sessionId);
      setMessages([]);
      setLeadFormContact(null);
      setStep(0);
      setQuickReplies([]);
      lastOutboundUserTextRef.current = "";
      shouldFetchMatchesOnNextAssistantReplyRef.current = false;
      lastPropertyMatchesSignatureRef.current = "";
      if (useAgentLeadForm) {
        setLeadFlowStep("intent");
        setChosenIntent(null);
        setLeadDraft(emptyAgentLeadDraft());
        setFormValidationError("");
      }
    } catch (err) {
      setError(err?.message || "Unable to clear conversation.");
    }
  };

  /** Clears server thread, new session + visitor, full reset (agent = back to step 1). */
  const handleStartNewRequest = async () => {
    if (!sessionId) return;
    setError("");
    setFormValidationError("");
    try {
      await clearChatSession(sessionId);
    } catch (_err) {
      /* still reset locally */
    }
    const { sessionId: nextSid } = resetChatIdentity();
    setSessionId(nextSid);
    setVisitorIdState("");
    setMessages([]);
    setLeadFormContact(null);
    setStep(0);
    setQuickReplies([]);
    setInput("");
    lastOutboundUserTextRef.current = "";
    shouldFetchMatchesOnNextAssistantReplyRef.current = false;
    lastPropertyMatchesSignatureRef.current = "";
    if (useAgentLeadForm) {
      setLeadFlowStep("intent");
      setChosenIntent(null);
      setLeadDraft(emptyAgentLeadDraft());
    }
  };

  const onboardingGoBack = useCallback(() => {
    setFormValidationError("");
    if (leadFlowStep === "contact") setLeadFlowStep("intent");
    else if (leadFlowStep === "property") setLeadFlowStep("contact");
    else if (leadFlowStep === "qualify") setLeadFlowStep("property");
    else if (leadFlowStep === "reach") setLeadFlowStep("qualify");
  }, [leadFlowStep]);

  const onboardingGoForward = useCallback(() => {
    setFormValidationError("");
    if (leadFlowStep === "intent") {
      if (!chosenIntent) {
        setFormValidationError("Please select whether you are buying or selling.");
        return;
      }
      setLeadFlowStep("contact");
      return;
    }
    if (leadFlowStep === "contact") {
      const name = leadDraft.name.trim();
      const phone = leadDraft.phone.trim();
      const email = leadDraft.email.trim();
      if (!name || !phone || !email) {
        setFormValidationError("Please fill in your name, phone, and email.");
        return;
      }
      setLeadFlowStep("property");
      return;
    }
    if (leadFlowStep === "property") {
      setLeadFlowStep("qualify");
      return;
    }
    if (leadFlowStep === "qualify") {
      setLeadFlowStep("reach");
    }
  }, [leadFlowStep, chosenIntent, leadDraft]);

  const disabledSend = !input.trim() || loading || !embedToken;
  const showConversationProgress =
    leadFlowStep === "chat" && (!useAgentLeadForm || !leadFormContact);

  const headerSubtitle =
    useAgentLeadForm && leadFlowStep !== "chat"
      ? (() => {
          const i = PRE_CHAT_STEPS.indexOf(leadFlowStep);
          const n = i >= 0 ? i + 1 : 1;
          const label = LEAD_STEP_LABELS[leadFlowStep] || "";
          return `Step ${n} of ${PRE_CHAT_STEPS.length} · ${label}`;
        })()
      : subtitle;

  const header = (
    <div className="bg-white border-b border-border px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <MessageCircle size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-text-heading">{title}</h3>
          <p className="text-xs text-text-muted">{headerSubtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
          title="Assistant is available. Messages use HTTPS; realtime agent alerts use Socket.IO only in your logged-in dashboard."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Available
        </span>
        {!inlineMode ? (
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-background-light rounded-lg transition text-text-heading"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );

  const chatBody = (
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
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <MessageCircle size={14} />
                </div>
              )}
              <div
                className={`${
                  isUser && msg.leadProfilePreview ? "max-w-[min(92%,21rem)]" : "max-w-[85%]"
                } rounded-2xl px-4 py-2.5 shadow-sm relative ${
                  isUser
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-text-heading"
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
                    renderMessageSegments(msg.content ?? "", idx, isUser)
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
                      {msg.propertyMatchesContext === "sell"
                        ? "Comparable properties"
                        : "Matching properties"}
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
                          <div className="text-[10px] font-semibold text-text-heading">
                            {p?.title || "Property"}
                          </div>
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
                            onClick={() =>
                              handleSend(buildPropertyPickMessage(p, msg.propertyMatchesContext || "buy"))
                            }
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
          className="flex justify-start items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
            <MessageCircle size={14} />
          </div>
          <div className="bg-white border border-border rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
            </div>
            <span className="text-[10px] font-medium text-text-muted italic">Nesti is thinking...</span>
          </div>
        </motion.div>
      )}

      {error ? <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div> : null}

      <div ref={messagesEndRef} />
    </div>
  );

  const footer = (
    <div className="p-4 border-t border-border bg-white">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={embedToken ? "Type your message..." : "Embed token missing"}
          disabled={!embedToken}
          className="flex-1 px-4 py-2 border border-border rounded-xl bg-background-light shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={disabledSend}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-95 transition disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center shadow-sm disabled:hover:brightness-100"
          aria-label={loading ? "Waiting for reply…" : "Send message"}
          aria-busy={loading}
        >
          <Send size={20} aria-hidden />
        </button>
      </div>

      {messages.length > 0 && (
        <button
          onClick={useAgentLeadForm ? handleStartNewRequest : handleClear}
          className="text-xs text-text-muted hover:text-text-heading mt-2 transition inline-flex items-center gap-1"
        >
          <RotateCcw size={12} />
          {useAgentLeadForm ? "Start new request" : "Clear conversation"}
        </button>
      )}
    </div>
  );

  const mainPanel =
    useAgentLeadForm && leadFlowStep !== "chat" ? (
      <AgentLeadOnboarding
        step={leadFlowStep}
        chosenIntent={chosenIntent}
        onChooseIntent={(v) => {
          setFormValidationError("");
          setChosenIntent(v);
        }}
        draft={leadDraft}
        onFieldChange={(field, value) => setLeadDraft((d) => ({ ...d, [field]: value }))}
        onBack={onboardingGoBack}
        onForward={onboardingGoForward}
        onStartChat={handleStartChatFromForm}
        onStartOver={handleStartNewRequest}
        validationError={formValidationError}
      />
    ) : (
      <>
        {showConversationProgress ? <ConversationProgress step={step} /> : null}
        {chatBody}
        {footer}
      </>
    );

  return (
    <>
      {allowLauncher && !inlineMode && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white z-50 hover:scale-110"
          aria-label={launcherLabel}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${
            inlineMode
              ? "relative w-full h-[600px] max-h-[70vh]"
              : "fixed bottom-6 right-6 w-[420px] max-w-[96vw] h-[640px] max-h-[85vh] z-50"
          } bg-transparent rounded-[2rem] shadow-2xl flex flex-col border border-border overflow-hidden backdrop-blur-sm`}
        >
          <div className="flex flex-col h-full min-h-0">
            {header}
            {mainPanel}
          </div>
        </motion.div>
      )}
    </>
  );
}
