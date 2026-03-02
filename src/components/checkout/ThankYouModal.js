"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ThankYouModal({ isOpen, onClose }) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/settings");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, router]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-2xl text-center"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="rounded-full bg-green-100 p-4 text-green-600">
                                <CheckCircle2 size={48} strokeWidth={2.5} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-text-heading mb-2">
                            Subscription Activated!
                        </h2>
                        <p className="text-text-body mb-8">
                            Thank you for subscribing to Nesti. Your account has been upgraded and you now have full access to all features.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => router.push("/settings")}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.98]"
                            >
                                Go to Settings Now
                                <ArrowRight size={18} />
                            </button>

                            <p className="text-xs text-text-muted">
                                Redirecting you to settings in <span className="font-bold text-primary">{countdown}s</span>...
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
