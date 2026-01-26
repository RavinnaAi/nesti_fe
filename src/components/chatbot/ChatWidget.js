"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, X, MessageCircle, Loader2, RotateCcw } from "lucide-react";
import {
  clearChatSession,
  getOrCreateSessionId,
  getVisitorId,
  sendChatMessage,
  setVisitorId,
} from "@/lib/chatClient";

const formatTime = (date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChatWidget({
  embedToken,
  defaultOpen = true,
  allowLauncher = true,
  launcherLabel = "Open chat",
  title = "Real Estate Assistant",
  subtitle = "Online • Ready to help",
  inlineMode = false,
  initialGreeting = "Hello! How can I help with your real estate journey today?",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [visitorId, setVisitorIdState] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    const vid = getVisitorId();
    if (vid) setVisitorIdState(vid);
  }, []);

  useEffect(() => {
    if (!initialGreeting || messages.length) return;
    setMessages([
      {
        role: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      },
    ]);
  }, [initialGreeting, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !embedToken || !sessionId) return;
    const text = input.trim();
    setInput("");
    addMessage("user", text);
    setLoading(true);
    setError("");
    try {
      const response = await sendChatMessage({
        message: text,
        sessionId,
        embedToken,
        visitorId,
      });
      const reply = response?.data?.response || response?.response;
      const returnedVisitor = response?.data?.meta?.visitorId || response?.visitorId;
      if (returnedVisitor && !visitorId) {
        setVisitorId(returnedVisitor);
        setVisitorIdState(returnedVisitor);
      }
      addMessage("assistant", reply || "Thanks! How else can I help?");
    } catch (err) {
      const msg = err?.message || "Sorry, something went wrong. Please try again.";
      setError(msg);
      addMessage("assistant", msg);
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
    } catch (err) {
      setError(err?.message || "Unable to clear conversation.");
    }
  };

  const disabledSend = !input.trim() || loading || !embedToken;

  const header = (
    <div className="bg-white border-b border-border px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <MessageCircle size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-text-heading">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
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

  const body = (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background-light">

      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={`${msg.role}-${idx}-${msg.timestamp?.toString?.() || ""}`}
            className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <MessageCircle size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isUser
                ? "bg-primary text-white"
                : "bg-white border border-border text-text-heading"
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-[10px] mt-1 ${isUser ? "text-white/70" : "text-text-muted"
                  }`}
              >
                {formatTime(msg.timestamp || new Date())}
              </p>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex justify-start items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MessageCircle size={14} />
          </div>
          <div className="bg-white border border-border rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="text-sm text-text-muted">Typing...</span>
          </div>
        </div>
      )}

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

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
          onKeyPress={handleKeyPress}
          placeholder={embedToken ? "Type your message..." : "Embed token missing"}
          disabled={loading || !embedToken}
          className="flex-1 px-4 py-2 border border-border rounded-xl bg-background-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabledSend}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
          aria-label="Send message"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>

      {messages.length > 0 && (
        <button
          onClick={handleClear}
          className="text-xs text-text-muted hover:text-text-heading mt-2 transition inline-flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Clear conversation
        </button>
      )}
    </div>
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
        <div
          className={`${inlineMode
            ? "relative w-full h-[600px] max-h-[70vh]"
            : "fixed bottom-6 right-6 w-[420px] max-w-[96vw] h-[640px] max-h-[80vh] z-50"
            } bg-transparent rounded-3xl shadow-2xl flex flex-col border border-border overflow-hidden`}
        >
          {header}
          {body}
          {footer}
        </div>
      )}
    </>
  );
}
