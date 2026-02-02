import { motion } from "framer-motion";

export default function QuickReplyButtons({ options = [], onSelect }) {
    if (!options || options.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 py-2">
            {options.map((option, idx) => (
                <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => onSelect(option)}
                    className="px-3 py-1.5 rounded-full bg-white border border-primary/20 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                    {option}
                </motion.button>
            ))}
        </div>
    );
}
