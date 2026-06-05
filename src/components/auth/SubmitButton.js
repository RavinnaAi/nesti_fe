"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function SubmitButton({
  children,
  loading = false,
  disabled = false,
  className = "",
  onClick,
  type = "submit",
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      className={`flex h-11 w-full cursor-pointer flex-col items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-dark text-sm font-bold text-white shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 ${className}`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </motion.button>
  );
}
