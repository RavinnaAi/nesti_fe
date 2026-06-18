"use client";
import { motion } from "framer-motion";

const mobileBlobBase =
  "absolute rounded-full pointer-events-none sm:hidden";
const desktopBlobBase =
  "absolute rounded-full blur-3xl pointer-events-none hidden sm:block";

export default function BackgroundElements({ variant = "default" }) {
  if (variant === "minimal") {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={`${mobileBlobBase} h-[320px] w-[320px] opacity-[0.14] blur-2xl`}
          style={{
            background: "radial-gradient(circle, #34C759, transparent)",
            top: "-10%",
            left: "-28%",
          }}
        />
        <motion.div
          className={`${desktopBlobBase} w-[800px] h-[800px] opacity-20`}
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
        <div
          className={`${mobileBlobBase} h-[340px] w-[340px] opacity-[0.14] blur-2xl`}
          style={{
            background: "radial-gradient(circle, #34C759, transparent)",
            top: "-10%",
            left: "-28%",
          }}
        />
        <div
          className={`${mobileBlobBase} h-[260px] w-[260px] opacity-[0.1] blur-2xl`}
          style={{
            background: "radial-gradient(circle, #FAFAFA, transparent)",
            top: "48%",
            right: "-34%",
          }}
        />
        <motion.div
          className={`${desktopBlobBase} w-[800px] h-[800px] opacity-20`}
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
          className={`${desktopBlobBase} w-[600px] h-[600px] opacity-15`}
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
          className={`${desktopBlobBase} w-[500px] h-[500px] opacity-10`}
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
      <div
        className={`${mobileBlobBase} h-[320px] w-[320px] opacity-[0.14] blur-2xl`}
        style={{
          background: "radial-gradient(circle, #34C759, transparent)",
          top: "-10%",
          left: "-28%",
        }}
      />
      <motion.div
        className={`${desktopBlobBase} w-[800px] h-[800px] opacity-20`}
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
