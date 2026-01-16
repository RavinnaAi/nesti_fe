"use client";

export default function ChatbotEmbed() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-2">
          Embed Code
        </div>
        <p className="text-sm text-text-body mb-3">
          Copy and paste this snippet into your website before the closing
          <code className="px-1 py-0.5 mx-1 bg-background-light rounded">{"</body>"}</code>
          tag.
        </p>
        <pre className="text-xs bg-background-light rounded-xl p-3 border border-border overflow-x-auto">
{`<script src="https://cdn.example.com/chatbot.js"></script>
<script>
  initChatbot({ apiKey: "YOUR_KEY" });
</script>`}
        </pre>
        <button className="mt-3 inline-flex items-center px-4 py-2 text-sm font-semibold text-primary rounded-lg border border-primary/30 hover:bg-primary/5 transition">
          Copy code
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-text-heading mb-1">
          Status
        </div>
        <div className="text-xs text-text-body">
          Last synced: 5 minutes ago
        </div>
      </div>
    </div>
  );
}
