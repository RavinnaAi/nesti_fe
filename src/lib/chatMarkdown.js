/**
 * Renders [label](https://...) as <a>; only http(s) URLs (same rule as node-backend/index.html).
 */
function parseBoldSegments(text, keyPrefix = "b") {
  const str = String(text ?? "");
  const boldRe = /\*\*([^*]+)\*\*/g;
  const out = [];
  let last = 0;
  let m;
  let k = 0;

  while ((m = boldRe.exec(str)) !== null) {
    if (m.index > last) out.push(str.slice(last, m.index));
    out.push(
      <strong key={`${keyPrefix}-strong-${k++}`} className="font-semibold">
        {m[1]}
      </strong>,
    );
    last = boldRe.lastIndex;
  }

  if (last < str.length) out.push(str.slice(last));
  return out.length ? out : str;
}

export function parseInlineMarkdownLinks(text, linkClassName, options = {}) {
  const str = String(text ?? "");
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  while ((m = linkRe.exec(str)) !== null) {
    if (m.index > last) out.push(...[].concat(parseBoldSegments(str.slice(last, m.index), `md-pre-${k}`)));
    const href = String(m[2] || "");
    const isCalendly = /https?:\/\/(?:[\w-]+\.)?calendly\.com\/\S+/i.test(href);
    const calendlyClassName =
      typeof options.calendlyClassName === "string" && options.calendlyClassName.trim()
        ? options.calendlyClassName
        : "mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary/90 no-underline";
    const resolvedClassName = isCalendly
      ? calendlyClassName
      : linkClassName;
    out.push(
      <a
        key={`md-${k++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={resolvedClassName}
      >
        {m[1]}
      </a>,
    );
    last = linkRe.lastIndex;
  }
  if (last < str.length) {
    out.push(...[].concat(parseBoldSegments(str.slice(last), `md-tail-${k}`)));
  }
  return out.length ? out : parseBoldSegments(str, "md-only");
}
