"use client";

function toFiniteMoneyNumber(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const cleaned = String(value).trim().replace(/[$,£€\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(n, currencyCode) {
  const cur = String(currencyCode || "USD").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur.length === 3 ? cur : "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(n);
}

function budgetTokenDisplay(value) {
  const token = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const map = {
    under_400k: { kind: "single", text: "Under $400K" },
    "400k_700k": { kind: "range", low: "$400K", high: "$700K" },
    "700k_1m": { kind: "range", low: "$700K", high: "$1M" },
    "1m_plus": { kind: "single", text: "$1M+" },
  };
  return map[token] || null;
}

/**
 * Structured budget for layout (ranges render with a clear separator).
 * `null` = no numeric budget.
 */
export function getBudgetDisplay(profile) {
  const p = profile?.property || {};
  const bp = profile?.budget_profile || {};
  const raw = p.budget ?? p.expected_price;
  const tokenShown =
    budgetTokenDisplay(raw) ||
    budgetTokenDisplay(bp.latest_budget_text);
  if (tokenShown) return tokenShown;

  if (bp && typeof bp === "object") {
    const min = toFiniteMoneyNumber(bp.min_budget);
    const max = toFiniteMoneyNumber(bp.max_budget);
    const cur = String(bp.currency || "USD").toUpperCase();
    if (min != null || max != null) {
      if (min != null && max != null && min === max) {
        return { kind: "single", text: formatMoney(min, cur) };
      }
      if (min != null && max != null) {
        return { kind: "range", low: formatMoney(min, cur), high: formatMoney(max, cur) };
      }
      if (min != null) {
        return { kind: "single", text: `${formatMoney(min, cur)}+` };
      }
      if (max != null) {
        return { kind: "single", text: `Up to ${formatMoney(max, cur)}` };
      }
    }
  }

  const single = toFiniteMoneyNumber(raw);
  if (single != null) {
    return { kind: "single", text: formatMoney(single, "USD") };
  }

  return null;
}

export function BudgetCell({ display, align = "end" }) {
  const amountClass =
    "font-heading text-xs font-semibold tabular-nums tracking-tight text-text-heading";
  const justify = align === "start" ? "justify-start" : "justify-end";
  if (!display) return null;
  if (display.kind === "range") {
    return (
      <span className={`inline-flex items-baseline ${justify} gap-x-1.5 ${amountClass}`}>
        <span className="whitespace-nowrap">{display.low}</span>
        <span
          className="select-none whitespace-nowrap text-[10px] font-semibold leading-none text-text-muted sm:text-[11px]"
          aria-hidden
        >
          –
        </span>
        <span className="whitespace-nowrap">{display.high}</span>
      </span>
    );
  }
  return <span className={`whitespace-nowrap ${amountClass}`}>{display.text}</span>;
}
