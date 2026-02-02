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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      className={`h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    >
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : children}
    </motion.button>
  );
}
