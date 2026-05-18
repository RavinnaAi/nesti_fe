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

const normalizeMessageText = (value) => {
  const text = String(value || "—");
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // Convert markdown-like bullets to a cleaner bullet glyph.
      const withoutListMarker = trimmed.replace(/^-+\s*/, "• ");
      // Remove markdown bold markers while keeping the text.
      return withoutListMarker.replace(/\*\*(.*?)\*\*/g, "$1");
    })
    .join("\n");
};

export default function MessageBubble({ message }) {
  const { role, content, timestamp } = getMessageMeta(message);
  const isUser = role === "user" || role === "visitor";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[72%] rounded-md px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${isUser ? "bg-primary text-white" : "bg-white border border-border/80 text-text-heading"
          }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
          {normalizeMessageText(content)}
        </p>
        {timestamp ? (
          <p className={`text-[10px] mt-1 ${isUser ? "text-white/70" : "text-text-muted"}`}>
            {formatTime(timestamp)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
