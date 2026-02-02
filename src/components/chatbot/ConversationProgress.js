export default function ConversationProgress({ step = 0 }) {
    const steps = ["Intro", "Intent", "Qualify", "Details", "Booking"];

    return (
        <div className="px-5 py-2 bg-white border-b border-border/50 flex items-center justify-between">
            {steps.map((label, idx) => (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`h-1 w-full rounded-full transition-all duration-500 ${idx <= step ? "bg-primary" : "bg-gray-100"
                        }`} />
                    <span className={`text-[9px] uppercase tracking-wider font-semibold ${idx <= step ? "text-primary" : "text-gray-300"
                        }`}>
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
