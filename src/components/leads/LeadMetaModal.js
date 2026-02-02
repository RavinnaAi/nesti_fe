import { X, Sparkles, User, Info, Target, ChevronDown, ChevronRight, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const formatLabel = (str) => {
    return String(str)
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const formatValue = (val) => {
    if (typeof val === "string") {
        return val.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
    return String(val);
};

const cleanLabel = (label, sectionTitle) => {
    // If it's a numeric index, don't show it as a label
    if (!isNaN(label)) return null;

    let cleaned = label.replace(/_/g, " ");
    const titleParts = sectionTitle.toLowerCase().split(" ");
    titleParts.forEach(part => {
        if (part.length > 2) {
            const regex = new RegExp(part, "gi");
            cleaned = cleaned.replace(regex, "");
        }
    });
    return formatLabel(cleaned.trim() || label);
};

const MetaRow = ({ label, value, sectionTitle }) => {
    const isSpecialValue = ["hot", "warm", "buy", "sell", "true", "active"].includes(String(value).toLowerCase());
    const isScore = !isNaN(value) && String(label).toLowerCase().includes("score");
    const displayLabel = cleanLabel(label, sectionTitle);

    return (
        <div className={`flex items-center justify-between py-2.5 px-3 hover:bg-gray-50/50 rounded-lg transition-colors group ${!displayLabel ? 'flex-row-reverse justify-end gap-3' : ''}`}>
            {displayLabel && (
                <span className="text-[12px] text-text-muted font-medium group-hover:text-text-heading transition-colors">
                    {displayLabel}
                </span>
            )}
            {!displayLabel && <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />}
            <div className={`flex items-center gap-2 ${!displayLabel ? 'flex-1' : ''}`}>
                {(isSpecialValue || isScore) ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${isScore ? "bg-indigo-500 border-indigo-400 text-white" : "bg-primary/90 border-primary/20 text-white"
                        }`}>
                        {formatValue(value)}
                    </span>
                ) : (
                    <span className="text-[12px] text-text-heading font-semibold break-all text-right">
                        {formatValue(value)}
                    </span>
                )}
            </div>
        </div>
    );
};

const MetaSection = ({ title, data, icon: Icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!data || typeof data !== "object" || Object.keys(data).length === 0) return null;

    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object");
    const nestedEntries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && typeof v === "object");

    if (entries.length === 0 && nestedEntries.length === 0) return null;

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/50 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg transition-colors shadow-sm bg-white border border-gray-100 ${isOpen ? 'text-primary' : 'text-gray-400'}`}>
                        {Icon ? <Icon size={14} /> : <Info size={14} />}
                    </div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-text-heading' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {formatLabel(title)}
                    </h4>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-300'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="ml-2 pl-4 border-l border-gray-100 space-y-2 py-2">
                            {entries.length > 0 && (
                                <div className="divide-y divide-gray-50/50 bg-gray-50/20 rounded-xl border border-gray-100/50 py-1">
                                    {entries.map(([key, value]) => (
                                        <MetaRow key={key} label={key} value={value} sectionTitle={title} />
                                    ))}
                                </div>
                            )}
                            {nestedEntries.map(([key, value]) => (
                                <MetaSection key={key} title={key} data={value} icon={ChevronRight} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function LeadMetaModal({ title, meta, onClose }) {
    if (!meta) return null;

    const topLevelSections = Object.entries(meta).filter(([, v]) => typeof v === "object" && v !== null);
    const flatEntries = Object.entries(meta).filter(([, v]) => typeof v !== "object" || v === null);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-heading tracking-tight leading-tight">{title}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Live Data Feed</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-95 shadow-sm hover:shadow-md"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="px-8 py-6 overflow-y-auto space-y-4 custom-scrollbar bg-white">
                    {flatEntries.length > 0 && (
                        <MetaSection title="Primary Details" data={Object.fromEntries(flatEntries)} icon={Info} defaultOpen={true} />
                    )}

                    {topLevelSections.map(([key, value]) => (
                        <MetaSection
                            key={key}
                            title={key}
                            data={value}
                            icon={key.toLowerCase().includes('ai') ? Sparkles : key.toLowerCase().includes('contact') ? User : Target}
                        />
                    ))}

                    {Object.keys(meta).length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <Hash size={40} className="text-gray-200 mb-2" />
                            <p className="text-sm text-text-muted font-medium">No records available.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
