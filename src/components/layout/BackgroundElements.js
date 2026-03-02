"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function BackgroundElements({ variant = "default" }) {
  useEffect(() => {    
    const randomMinutes = Math.floor(Math.random() * 4) + 1;
    const randomMilliseconds = randomMinutes * 60 * 1000;
    setTimeout(() => {
      window.location.reload();
    }, randomMilliseconds);
  });
  if (variant === "minimal") {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, #34C759, transparent)",
            top: "-15%",
            left: "-5%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  if (variant === "enhanced") {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, #34C759, transparent)",
            top: "-15%",
            left: "-5%",
            willChange: "transform, opacity",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
          style={{
            background: "radial-gradient(circle, #FAFAFA, transparent)",
            top: "40%",
            right: "-10%",
            willChange: "transform, opacity",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, #2AA84A, transparent)",
            bottom: "5%",
            left: "30%",
            willChange: "transform, opacity",
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  // Default variant
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, #34C759, transparent)",
          top: "-15%",
          left: "-5%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
