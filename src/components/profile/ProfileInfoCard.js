"use client";

import { motion } from "framer-motion";

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const InfoCard = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.div
    variants={cardVariants}
    initial="initial"
    animate="animate"
    transition={{ duration: 0.4, delay }}
    className="bg-white p-2 space-y-3"
  >
    {/* <div className="flex items-center gap-2">
      {Icon ? <Icon size={18} className="text-primary-dark" /> : null}
      <h2 className="text-lg font-semibold text-text-heading">{title}</h2>
    </div> */}
    {children}
  </motion.div>
);

export const InfoGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {items.map(({ label, value, icon: Icon }) => (
      <div
        key={label}
        className="flex items-start gap-3 rounded-xl border border-border/70 bg-background-light/60 px-4 py-3 shadow-sm shadow-primary/10"
      >
        {Icon ? <Icon size={18} className="text-primary mt-0.5" /> : null}
        <div className="space-y-1">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">
            {label}
          </p>
          <p className="text-sm font-medium text-text-heading">
            {value || "—"}
          </p>
        </div>
      </div>
    ))}
  </div>
);

export const ChipList = ({ label, items }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-text-muted font-semibold">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${label}-${item}`}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-dark text-white shadow-sm shadow-primary/20"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
