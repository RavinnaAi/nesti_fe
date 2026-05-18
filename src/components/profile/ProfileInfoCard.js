"use client";

import { motion } from "framer-motion";

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function FieldValue({ label, value }) {
  const empty = value === undefined || value === null || value === "";
  if (empty && value !== 0) {
    return <span className="text-xs italic text-slate-400">Not provided</span>;
  }
  const str = String(value);

  if (label === "Full Name") {
    return (
      <p className="text-sm font-semibold leading-snug text-slate-800 [overflow-wrap:anywhere]">
        {str}
      </p>
    );
  }

  if (label === "Email" && str.includes("@")) {
    return (
      <a
        href={`mailto:${str}`}
        className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-primary hover:decoration-primary [overflow-wrap:anywhere]"
      >
        {str}
      </a>
    );
  }

  const looksLikeUrl =
    /^https?:\/\//i.test(str) ||
    (label === "Website" && (str.includes(".") || str.includes("/"))) ||
    (label === "Calendly" && (str.includes(".") || str.includes("/")));

  if (looksLikeUrl && str.length > 0) {
    let href = str;
    if (!/^https?:\/\//i.test(href)) href = `https://${href.replace(/^\/+/, "")}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary/90 underline decoration-primary/30 underline-offset-2 transition hover:text-primary hover:decoration-primary [overflow-wrap:anywhere]"
      >
        {str}
      </a>
    );
  }

  return (
    <p className="text-sm font-medium leading-snug text-slate-800 [overflow-wrap:anywhere]">
      {str}
    </p>
  );
}

export const InfoCard = ({ children, delay = 0 }) => (
  <motion.div
    variants={cardVariants}
    initial="initial"
    animate="animate"
    transition={{ duration: 0.3, delay }}
    className="bg-transparent"
  >
    {children}
  </motion.div>
);

export const InfoGrid = ({ items, className = "", compact = false, columns = 2 }) => (
  <div className={`grid ${columns === 3 ? "grid-cols-3" : "grid-cols-2"} ${compact ? "gap-1.5" : "gap-2"} ${className}`.trim()}>
    {items.map(({ label, value, icon: Icon, colSpan }) => (
      <div
        key={label}
        className={`flex items-center ${compact ? "gap-2 rounded-lg px-2.5 py-2" : "gap-2.5 rounded-xl px-3 py-2.5"} border border-slate-100 bg-slate-50 transition hover:border-slate-200 hover:bg-white ${
          colSpan === 3 ? "col-span-3" : colSpan === 2 ? "col-span-2" : ""
        }`}
      >
        {Icon ? (
          <div className={`flex shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ${compact ? "h-6 w-6" : "h-7 w-7"}`}>
            <Icon size={compact ? 12 : 14} strokeWidth={2} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`${compact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-[0.1em] text-slate-400`}>{label}</p>
          <FieldValue label={label} value={value} />
        </div>
      </div>
    ))}
  </div>
);

export const ChipList = ({ label, items, colorClass }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={`${label}-${item}`}
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              colorClass || "border-primary/15 bg-primary/[0.06] text-primary/80"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
