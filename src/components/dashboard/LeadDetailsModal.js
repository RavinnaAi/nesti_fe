
import { motion } from "framer-motion";
import {
    X,
    Mail,
    CheckCircle2,
    XCircle,
    Activity,
    Globe
} from "lucide-react";

export default function LeadDetailsModal({ lead, onClose }) {
    if (!lead) return null;

    // We assume 'lead' already contains the meta information merged in, 
    // or we can safely access properties if they match the flattened structure 
    // we plan to pass from the parent.

    // Helper to ensure we access properties whether they are direct or inside a meta object
    // mimicking the getLeadMeta logic from page.js if we don't pass fully processed data.
    // HOWEVER, the plan is to pass processed data. Let's make this component display what it gets.

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lead Snapshot</div>
                        <h3 className="text-2xl font-bold text-gray-900">{lead.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Mail size={14} />
                            {lead.email || "No email captured"}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {lead.isMatched === true ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 border border-green-200 text-xs font-bold shadow-sm">
                                <CheckCircle2 size={12} strokeWidth={2.5} />
                                Matched
                            </span>
                        ) : lead.isMatched === false ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold shadow-sm">
                                <XCircle size={12} strokeWidth={2.5} />
                                Mismatched
                            </span>
                        ) : null}

                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {/* Score */}
                        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score</span>
                            <span className="text-3xl font-bold text-primary">{lead.leadScore || "0"}</span>
                        </div>

                        {/* Grade */}
                        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grade</span>
                            <span className={`px-3 py-1 rounded-md text-lg font-bold uppercase tracking-wide ${String(lead.leadGrade).toLowerCase() === 'hot'
                                    ? 'bg-red-100 text-red-700'
                                    : String(lead.leadGrade).toLowerCase() === 'warm'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                {lead.leadGrade || "—"}
                            </span>
                        </div>

                        {/* Intent */}
                        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Intent</span>
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-primary" />
                                <span
                                    className={`px-2 py-0.5 rounded-md text-lg font-bold uppercase tracking-wide ${
                                        !lead.intent || String(lead.intent).toLowerCase() === "unspecified"
                                            ? "text-gray-600"
                                            : String(lead.intent).toLowerCase() === "buy"
                                              ? "text-green-700"
                                              : "text-orange-700"
                                    }`}
                                >
                                    {lead.intent && String(lead.intent).toLowerCase() !== "unspecified"
                                        ? lead.intent
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg border border-gray-100 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Contact Info</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium text-gray-900">{lead.email || "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="font-medium text-gray-900">{lead.phone || "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-medium text-gray-900">{lead.location || lead.city || "—"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border border-gray-100 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Status & Meta</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Channel</span>
                                    <span className="font-medium text-gray-900 capitalize inline-flex items-center gap-1">
                                        <Globe size={12} /> {lead.channel || "Web"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Qualified</span>
                                    <span className={`font-bold ${lead.qualified ? 'text-green-600' : 'text-gray-400'}`}>
                                        {lead.qualified ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">ID</span>
                                    <span className="font-medium text-gray-900 text-xs font-mono">{lead.id ? String(lead.id).substring(0, 8) : '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                    {/* Add more actions here like 'Edit', 'Delete', 'Email' later */}
                </div>
            </motion.div>
        </div>
    );
}
