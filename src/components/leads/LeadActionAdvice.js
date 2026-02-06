import { Lightbulb, Sparkles, ArrowRight, MessageSquare, Calendar, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LeadActionAdvice({ aiMetadata }) {
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
        blue: "bg-blue-50 border-blue-100 text-blue-900",
        green: "bg-green-50 border-green-100 text-green-900",
        amber: "bg-amber-50 border-amber-100 text-amber-900",
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-900",
    };

    const iconColorStyles = {
        blue: "text-blue-600 bg-white",
        green: "text-green-600 bg-white",
        amber: "text-amber-600 bg-white",
        indigo: "text-indigo-600 bg-white",
    };

    const badgeStyles = {
        blue: "bg-blue-200 text-blue-800",
        green: "bg-green-200 text-green-800",
        amber: "bg-amber-200 text-amber-800",
        indigo: "bg-indigo-200 text-indigo-800",
    }

    const baseStyle = colorStyles[color] || colorStyles.indigo;
    const iconStyle = iconColorStyles[color] || iconColorStyles.indigo;
    const badgeStyle = badgeStyles[color] || badgeStyles.indigo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${baseStyle} relative overflow-hidden`}
        >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles size={64} />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className={`p-2 rounded-lg shadow-sm border border-black/5 ${iconStyle} shrink-0`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>

                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeStyle}`}>
                            {label}
                        </span>
                    </div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                        {title}
                        <ArrowRight size={14} className="opacity-50" />
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
