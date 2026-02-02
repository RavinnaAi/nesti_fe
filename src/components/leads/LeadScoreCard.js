import { motion } from "framer-motion";
import { Flame, Info, TrendingUp, DollarSign, Clock, MessageCircle } from "lucide-react";
import { useState } from "react";
import LeadScoreModal from "./LeadScoreModal";

const MetricBar = ({ label, value, icon: Icon, color = "bg-primary" }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 text-text-secondary">
        {Icon && <Icon size={12} />}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{Math.round(value)}%</span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

export default function LeadScoreCard({ score = 0, grade = "cold", breakdown = {}, reasons = [] }) {
  const [showModal, setShowModal] = useState(false);

  const scoreNum = parseInt(score) || 0;

  let color = "text-blue-700 border-blue-700";
  let bgColor = "bg-blue-200";
  let label = "Cold";

  if (scoreNum >= 70) {
    color = "text-red-700 border-red-700";
    bgColor = "bg-red-200";
    label = "Hot";
  } else if (scoreNum >= 40) {
    color = "text-yellow-700 border-yellow-700";
    bgColor = "bg-yellow-200";
    label = "Warm";
  }

  // Calculate circumference for circle
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreNum / 100) * circumference;

  return (
    <>
      <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-text-heading flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Lead Score
            </div>
            <p className="text-xs text-text-muted mt-1">
              AI-calculated conversion probability
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 rounded-md bg-white border border-primary/20 text-primary hover:bg-primary/5 transition-colors shadow-sm"
          >
            <Info size={16} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-100"
              />
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeLinecap="round"
                className={color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${color.split(" ")[0]}`}>{scoreNum}</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${bgColor} ${color.split(" ")[0]}`}>
              <Flame size={12} />
              {label} Lead
            </div>

            <div className="text-xs text-text-muted">
              {reasons.length > 0 ? (
                <span>Driven by: <span className="font-medium text-text-heading">{reasons.slice(0, 2).map(r => r.replace(/_/g, " ")).join(", ")}</span></span>
              ) : (
                "Not enough data for detailed analysis"
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <MetricBar
            label="Timeline Urgency"
            value={breakdown.timeline || 0}
            icon={Clock}
            color={breakdown.timeline > 60 ? "bg-green-500" : "bg-primary"}
          />
          <MetricBar
            label="Financial Readiness"
            value={breakdown.budget || 0}
            icon={DollarSign}
            color={breakdown.budget > 60 ? "bg-green-500" : "bg-primary"}
          />
          <MetricBar
            label="Engagement"
            value={breakdown.engagement || 0}
            icon={MessageCircle}
            color={breakdown.engagement > 60 ? "bg-green-500" : "bg-primary"}
          />
        </div>
      </div>

      {showModal && (
        <LeadScoreModal
          score={scoreNum}
          grade={label}
          reasons={reasons}
          breakdown={breakdown}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
