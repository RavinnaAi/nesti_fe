"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, MessageCircle, Loader2, RotateCcw } from "lucide-react";
import {
  clearChatSession,
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

export default function ChatWidget({
  embedToken,
  widgetRole,
  defaultOpen = true,
  allowLauncher = true,
  launcherLabel = "Open chat",
  title = "Real Estate Assistant",
  subtitle = "Online • Ready to help",
  inlineMode = false,
  initialGreeting = "Hello! How can I help with your real estate journey today?",
}) {
  const resolvedRole = widgetRole || "agent";
  const useAgentLeadForm = resolvedRole === "agent";

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [visitorId, setVisitorIdState] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);

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
    const sid = getOrCreateSessionId();
    setSessionId(sid);
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

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const applyChatPayload = useCallback(
    (payload, currentVisitorId) => {
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
      if (returnedVisitor && !currentVisitorId) {
        setVisitorId(returnedVisitor);
        setVisitorIdState(returnedVisitor);
      }

      addMessage("assistant", reply || "Thanks! How else can I help?");
    },
    [addMessage],
  );

  const handleSend = async (overrideText = null) => {
    const text = overrideText || input.trim();
    if (!text || loading || !embedToken || !sessionId) return;

    if (!overrideText) setInput("");
    addMessage("user", text);
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
      applyChatPayload(payload, visitorId);
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

    setLeadFormContact(formContact);
    setLeadFlowStep("chat");
    setMessages([{ role: "user", content: summary, timestamp: new Date() }]);
    setLoading(true);
    setError("");
    setQuickReplies([]);

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
      applyChatPayload(payload, visitorId);
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
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Online
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-background-light rounded-lg transition text-text-heading"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
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
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                  isUser
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-text-heading"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed [&_a]:underline [&_a]:font-semibold break-words">
                  {parseInlineMarkdownLinks(
                    msg.content,
                    isUser ? "text-white underline" : "text-primary",
                  )}
                </p>
                <p
                  className={`text-[9px] mt-1 font-medium tracking-wide ${
                    isUser ? "text-white/70" : "text-text-muted text-right"
                  }`}
                >
                  {formatTime(msg.timestamp || new Date())}
                </p>

                {!isUser && idx === messages.length - 1 && quickReplies.length > 0 && (
                  <QuickReplyButtons options={quickReplies} onSelect={(opt) => handleSend(opt)} />
                )}
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
            <span className="text-[11px] font-medium text-text-muted italic">Nesti is thinking...</span>
          </div>
        </motion.div>
      )}

      {error ? <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div> : null}

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
          disabled={loading || !embedToken}
          className="flex-1 px-4 py-2 border border-border rounded-xl bg-background-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={disabledSend}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
          aria-label="Send message"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
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
        {leadFlowStep === "chat" ? <ConversationProgress step={step} /> : null}
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
