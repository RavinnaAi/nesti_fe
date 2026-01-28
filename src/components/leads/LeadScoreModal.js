import { X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LeadScoreModal({ score, grade, reasons = [], breakdown = {}, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-heading">Score Analysis</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-text-muted transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-text-heading">{score}</div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${grade === "Hot" ? "bg-green-100 text-green-700" :
                                grade === "Warm" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-gray-100 text-gray-700"
                            }`}>
                            {grade} Lead
                        </div>
                        <p className="text-sm text-text-muted max-w-[250px] mx-auto">
                            Based on timeline, budget, and engagement signals detected in conversation.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Key Factors</h4>
                        <div className="space-y-2">
                            {reasons.length > 0 ? (
                                reasons.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background-light/50 border border-border/50">
                                        <Check size={16} className="text-green-600 mt-0.5" />
                                        <div className="text-sm text-text-heading">
                                            {reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-text-muted text-sm">
                                    <AlertCircle size={16} className="mt-0.5" />
                                    No specific positive signals detected yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Tip:</strong> Ask specifically about their timeline ("When are you looking to move?") or budget ("Have you been pre-approved?") to improve this score accuracy.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white border border-border text-sm font-medium hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
