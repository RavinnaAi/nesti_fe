"use client";

import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";

export default function LeadProfileUserBubble({ headline, paragraphs }) {
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
