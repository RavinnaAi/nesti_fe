import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Sparkles, X, ArrowRight } from "lucide-react";

export default function NewLeadPopup({ lead, onClose, onView }) {
    if (!lead) return null;

    const score = lead.leadScore || lead.lead_score || 0;
    const grade = (lead.leadGrade || lead.lead_grade || "cold").toLowerCase();

    const config = {
        hot: {
            color: "from-red-500 to-red-700",
            icon: Flame,
            label: "HOT LEAD!",
            glow: "shadow-red-500/50",
            secondary: "text-red-100"
        },
        warm: {
            color: "from-yellow-500 to-yellow-600",
            icon: Sparkles,
            label: "WARM LEAD!",
            glow: "shadow-yellow-500/50",
            secondary: "text-yellow-100"
        },
        cold: {
            color: "from-blue-500 to-blue-600",
            icon: Star,
            label: "NEW LEAD!",
            glow: "shadow-blue-500/50",
            secondary: "text-blue-100"
        }
    };

    const { color, icon: Icon, label, glow, secondary } = config[grade] || config.cold;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className={`relative w-full max-w-sm rounded-[2.5rem] p-1 bg-gradient-to-br ${color} ${glow} shadow-2xl overflow-hidden`}
            >
                {/* Animated Background Sparkles Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.7, 0.3],
                                rotate: [0, 90, 0]
                            }}
                            transition={{
                                duration: 3 + i,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute w-20 h-20 bg-white/10 rounded-full blur-2xl"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`
                            }}
                        />
                    ))}
                </div>

                <div className="relative bg-white/10 backdrop-blur-sm rounded-[2.3rem] p-8 text-white text-center space-y-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"
                    >
                        <X size={20} />
                    </button>

                    <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mx-auto w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden group"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition`} />
                        <Icon size={48} className={`relative z-10 ${grade === 'hot' ? 'text-orange-600' : grade === 'warm' ? 'text-primary' : 'text-primary-dark'}`} />
                    </motion.div>

                    <div className="space-y-1">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm font-black tracking-[0.2em] opacity-80"
                        >
                            {label}
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-bold"
                        >
                            Success!
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`p-4 rounded-2xl bg-black/10 border border-white/10 space-y-1`}
                    >
                        <div className="text-lg font-semibold">{lead.name || "A new visitor"}</div>
                        <div className={`text-sm ${secondary}`}>
                            {lead.intent && lead.intent !== "unspecified"
                              ? `Interested in ${lead.intent}`
                              : "Just started a conversation"}
                        </div>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            onView(lead.id);
                            onClose();
                        }}
                        className="w-full h-14 bg-white text-gray-900 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 group transition-colors hover:bg-gray-50"
                    >
                        Engage Now
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
