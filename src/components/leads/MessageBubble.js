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

export default function MessageBubble({ message }) {
  const { role, content, timestamp } = getMessageMeta(message);
  const isUser = role === "user" || role === "visitor";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser ? "bg-primary text-white" : "bg-white border border-border text-text-heading"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{content || "—"}</p>
        {timestamp ? (
          <p className={`text-[10px] mt-1 ${isUser ? "text-white/70" : "text-text-muted"}`}>
            {formatTime(timestamp)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
