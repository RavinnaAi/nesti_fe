import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";
import { renderMessageSegments } from "@/components/chatbot/widget/chatWidgetTextUtils";

const getMessageMeta = (message) => {
  const role =
    message?.role ||
    message?.sender ||
    message?.message_role ||
    (message?.is_user ? "user" : message?.is_agent ? "assistant" : "assistant");
  const content = message?.content || message?.message || message?.text || "";
  const timestamp =
    message?.created_at || message?.createdAt || message?.timestamp || message?.sent_at || null;
  return { role, content, timestamp };
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const parseSelectedPropertyFromText = (content) => {
  const text = String(content || "").trim();
  const m = /^I selected this (property|comparable):\s*([\s\S]+?)\.\s*Please guide me on[\s\S]*$/i.exec(text);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const summary = String(m[2] || "").trim();
  if (!summary) return null;
  const cleanPart = (raw) =>
    String(raw || "")
      .replace(/\(\s*ref:\s*lead:[^)]+\)/gi, "")
      .replace(/\bref:\s*lead:[\w-]+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  const parts = summary
    .split("•")
    .map((p) => cleanPart(p))
    .filter(Boolean);
  if (!parts.length) return null;
  const [title, location, price] = parts;
  return { kind, title: title || "Selected property", location: location || "", price: price || "" };
};

const renderSelectedPropertyCard = (selected, isUser) => {
  if (!selected) return null;
  const caption = selected.kind === "comparable" ? "Selected comparable" : "Selected property";
  return (
    <div className={`space-y-1.5 rounded-xl border p-3 ${isUser ? "border-white/25 bg-white/10" : "border-primary/10 bg-primary/[0.03]"}`}>
      <p className={`text-[9px] font-semibold uppercase tracking-wide ${isUser ? "text-white/85" : "text-text-muted"}`}>{caption}</p>
      <div className="flex items-start justify-between gap-2">
        <p className={`min-w-0 flex-1 text-[12px] font-semibold leading-snug ${isUser ? "text-white" : "text-text-heading"}`}>
          {selected.title}
        </p>
        {selected.price ? (
          <span className={`shrink-0 text-[11px] font-bold ${isUser ? "text-white" : "text-primary"}`}>{selected.price}</span>
        ) : null}
      </div>
      {selected.location ? (
        <p className={`text-[10px] ${isUser ? "text-white/90" : "text-text-muted"}`}>{selected.location}</p>
      ) : null}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const { role, content, timestamp } = getMessageMeta(message);
  const isUser = role === "user" || role === "visitor";
  const parseConversationMarkdown = (text, linkClassName) =>
    parseInlineMarkdownLinks(text, linkClassName, {
      calendlyClassName:
        "mt-2 inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-[10px] font-semibold text-white no-underline shadow-sm transition hover:bg-primary/90",
    });
  const selectedProperty = parseSelectedPropertyFromText(content);
  const contentNodes = selectedProperty
    ? renderSelectedPropertyCard(selectedProperty, isUser)
    : renderMessageSegments(content || "—", "lead-convo", isUser, "agent", parseConversationMarkdown);
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-fit max-w-[min(62%,40rem)] overflow-hidden rounded-md px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${isUser ? "bg-primary text-white" : "bg-white border border-border/80 text-text-heading"
          }`}
      >
        <div className="text-[13px] leading-relaxed break-words space-y-1 [&_a]:underline [&_a]:font-semibold [&_span]:break-words">
          {contentNodes}
        </div>
        {timestamp ? (
          <p className={`text-[10px] mt-1 ${isUser ? "text-white/70" : "text-text-muted"}`}>
            {formatTime(timestamp)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
