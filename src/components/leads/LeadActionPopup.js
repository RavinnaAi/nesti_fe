import { Lightbulb, Sparkles, ArrowRight, MessageSquare, Calendar, UserCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LeadActionPopup({ aiMetadata, onClose }) {
    // If no metadata or no next_action, don't render anything
    if (!aiMetadata || !aiMetadata.next_action) return null;

    const getActionDetails = (action) => {
        switch (action) {
            case "continue":
                return {
                    icon: MessageSquare,
                    label: "Suggestion",
                    title: "Continue Conversation",
                    description: "Engage to gather more requirements and build rapport.",
                    color: "blue"
                };
            case "schedule_viewing":
            case "schedule_meeting":
                return {
                    icon: Calendar,
                    label: "Recommended",
                    title: "Schedule a Meeting",
                    description: "Propose a time for a viewing or consultation to move forward.",
                    color: "green"
                };
            case "qualify":
                return {
                    icon: UserCheck,
                    label: "Priority",
                    title: "Qualify Lead",
                    description: "Ask key questions to determine budget and timeline.",
                    color: "amber"
                };
            default:
                // Handle generic or unknown actions gracefully
                return {
                    icon: Lightbulb,
                    label: "Insight",
                    title: action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                    description: "Review conversation context for next steps.",
                    color: "indigo"
                };
        }
    };

    const { icon: Icon, label, title, description, color } = getActionDetails(aiMetadata.next_action);

    const colorStyles = {
        blue: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-blue-400/20",
        green: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400/20",
        amber: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border-amber-400/20",
        indigo: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 border-violet-400/20",
    };

    // Icons now use a semi-transparent white background to pop against the gradient
    const iconColorStyles = {
        blue: "bg-white/20 text-white border-white/20",
        green: "bg-white/20 text-white border-white/20",
        amber: "bg-white/20 text-white border-white/20",
        indigo: "bg-white/20 text-white border-white/20",
    };

    // Badges use a solid white or very light opacity to stand out
    const badgeStyles = {
        blue: "bg-white/20 text-white border border-white/20 backdrop-blur-sm",
        green: "bg-white/20 text-white border border-white/20 backdrop-blur-sm",
        amber: "bg-white/20 text-white border border-white/20 backdrop-blur-sm",
        indigo: "bg-white/20 text-white border border-white/20 backdrop-blur-sm",
    }

    const baseStyle = colorStyles[color] || colorStyles.indigo;
    const iconStyle = iconColorStyles[color] || iconColorStyles.indigo;
    const badgeStyle = badgeStyles[color] || badgeStyles.indigo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 right-6 z-50 w-96 rounded-md border p-4 shadow-xl ${baseStyle}`}
        >
            <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition"
            >
                <X size={16} className="text-white font-bold" />
            </button>

            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-md shadow-sm border border-black/5 ${iconStyle} shrink-0`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>

                <div className="space-y-1 flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeStyle}`}>
                            {label}
                        </span>
                    </div>
                    <h4 className="font-bold text-base text-white flex items-center gap-2">
                        {title}
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {/* Decorative sparkle */}
            <div className="absolute -bottom-4 -right-4 text-current opacity-5 pointer-events-none">
                <Sparkles size={80} />
            </div>
        </motion.div>
    );
}
