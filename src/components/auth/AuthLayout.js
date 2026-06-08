"use client";

import { motion } from "framer-motion";

export default function AuthLayout({ children }) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 p-3 md:p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex h-full max-h-full w-full max-w-6xl flex-col overflow-y-auto rounded-[2rem] border border-border/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:max-h-[43rem] md:flex-row md:overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}
