"use client";

import { motion } from "framer-motion";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] py-8 sm:bg-gradient-to-br from-background-light/30 via-background to-background-light/30 px-0 md:px-8 lg:px-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-7xl md:rounded-[20px] lg:rounded-[20px] rounded-none lg:rounded-tl-[100px] md:rounded-tl-[100px] lg:rounded-br-[100px] md:rounded-br-[100px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
