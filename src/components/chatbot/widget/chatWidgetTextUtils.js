"use client";

const BULLET_LINE_RE = /^(-|\*|•)\s+/;

export const formatTime = (date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
};

export const buildPropertyPickMessage = (property, context = "buy") => {
  const matchedLead = property?.matched_lead ?? property?.matchedLead;
  const sellerName =
    String(property?.matched_contact?.full_name || property?.matched_contact?.fullName || "").trim() ||
    String(property?.title || "").split("·")[0]?.trim() ||
    "";
  const title = sellerName || String(property?.title || "").trim();
  const place = String(
    matchedLead?.property_location ||
      matchedLead?.propertyLocation ||
      property?.address ||
      property?.location ||
      "",
  ).trim();
  const budgetRaw = matchedLead?.property_budget ?? matchedLead?.propertyBudget;
  const price =
    budgetRaw != null && String(budgetRaw).trim() !== ""
      ? String(budgetRaw).trim()
      : property?.price != null
        ? formatPrice(property.price) || `$${property.price}`
        : "";
  const summary = [title, place, price].filter(Boolean).join(" • ");

  if (context === "sell") {
    return summary
      ? `I selected this comparable: ${summary}. Please guide me on pricing strategy and next steps.`
      : "I selected this comparable. Please guide me on pricing strategy and next steps.";
  }
  return summary
    ? `I selected this property: ${summary}. Please guide me on viewing and next steps.`
    : "I selected this property. Please guide me on viewing and next steps.";
};

const isBulletLine = (trimmed) => Boolean(trimmed && BULLET_LINE_RE.test(trimmed));
const stripBulletMarker = (trimmed) => trimmed.replace(BULLET_LINE_RE, "");

function jaccardWordSimilarity(a, b) {
  const wordsA = new Set(String(a).toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const wordsB = new Set(String(b).toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  let inter = 0;
  for (const w of wordsA) if (wordsB.has(w)) inter += 1;
  const union = wordsA.size + wordsB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function areProseBlocksRedundant(a, b) {
  const na = String(a).toLowerCase().replace(/\s+/g, " ").trim();
  const nb = String(b).toLowerCase().replace(/\s+/g, " ").trim();
  if (na.length < 28 || nb.length < 28) return false;
  if (jaccardWordSimilarity(na, nb) >= 0.45) return true;
  const snip = 56;
  if (na.includes(nb.slice(0, Math.min(snip, nb.length))) || nb.includes(na.slice(0, Math.min(snip, na.length))))
    return true;
  return false;
}

export function dedupeLawyerAssistantProse(raw) {
  const blocks = String(raw ?? "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocks.length < 2) return String(raw ?? "");
  const out = [blocks[0]];
  for (let i = 1; i < blocks.length; i += 1) {
    const cur = blocks[i];
    const prev = out[out.length - 1];
    if (areProseBlocksRedundant(prev, cur)) {
      if (cur.length > prev.length) out[out.length - 1] = cur;
      continue;
    }
    out.push(cur);
  }
  return out.join("\n\n");
}

const segmentMessageLines = (raw) => {
  const lines = String(raw ?? "").split("\n");
  const segments = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      segments.push({ type: "blank" });
      i += 1;
      continue;
    }
    if (isBulletLine(trimmed)) {
      const bulletLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t || !isBulletLine(t)) break;
        bulletLines.push(lines[i]);
        i += 1;
      }
      segments.push({ type: "bullets", lines: bulletLines });
    } else {
      const textLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t || isBulletLine(t)) break;
        textLines.push(lines[i]);
        i += 1;
      }
      segments.push({ type: "text", lines: textLines });
    }
  }
  return segments;
};

export const renderMessageSegments = (content, msgIdx, isUser, widgetRole, parseInlineMarkdownLinks) => {
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
          </div>
        );
      }
      continue;
    }
    if (seg.type === "bullets") {
      const listClassName = !isUser
        ? "my-1.5 rounded-xl border border-border/80 bg-gradient-to-b from-emerald-50/40 to-background-light/95 px-3 py-2.5 space-y-2 shadow-sm"
        : "my-1 space-y-1.5";
      const bulletRows = [];
      for (let bi = 0; bi < seg.lines.length; bi += 1) {
        const line = seg.lines[bi];
        const inner = stripBulletMarker(line.trim());
        bulletRows.push(
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
      }
      nodes.push(
        <div key={`msg-${msgIdx}-bl-${k++}`} className={listClassName}>
          {bulletRows}
        </div>
      );
    }
  }

  return nodes.length ? nodes : null;
};
