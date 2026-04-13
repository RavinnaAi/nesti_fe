/**
 * Renders [label](https://...) as <a>; only http(s) URLs (same rule as node-backend/index.html).
 */
export function parseInlineMarkdownLinks(text, linkClassName) {
  const str = String(text ?? "");
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  while ((m = linkRe.exec(str)) !== null) {
    if (m.index > last) {
      out.push(str.slice(last, m.index));
    }
    out.push(
      <a
        key={`md-${k++}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {m[1]}
      </a>,
    );
    last = m.lastIndex;
  }
  if (last < str.length) {
    out.push(str.slice(last));
  }
  return out.length ? out : str;
}
