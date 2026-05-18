"use client";

import { Flame, Sun, Snowflake, Sparkles, CircleHelp } from "lucide-react";

/** Normalize API grade + score into a display bucket (hot / warm / cold / interested / …). */
export function resolveDisplayLeadGrade(leadGrade, leadScore) {
  const grade = String(leadGrade || "").toLowerCase();
  if (grade === "interested") return "interested";
  if (grade === "lukewarm") return "interested";
  const scoreNum = Number(leadScore);
  if (grade === "warm" && Number.isFinite(scoreNum) && scoreNum < 60) return "interested";
  return grade || null;
}

export function displayLeadGradeLabel(grade) {
  if (!grade) return "";
  if (grade === "interested") return "INTERESTED";
  return String(grade).toUpperCase();
}

/** Pill styles shared by grade badge and score chip (per lead type). */
/** When there is no lead grade, color score by numeric bands only. */
export function leadScoreFallbackChipClasses(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "bg-blue-50 border border-blue-200 text-blue-700";
  if (n >= 70) return "bg-red-50 border border-red-200 text-red-700";
  if (n >= 40) return "bg-amber-50 border border-amber-200 text-amber-800";
  return "bg-red-100 border border-red-300 text-red-900";
}

/** Buy vs sell (matches chatbot `IntentBadge`: blue buyer, emerald seller). */
export function leadIntentChipClasses(intent) {
  const i = String(intent || "").trim().toLowerCase();
  const isSell =
    i === "sell" ||
    i === "seller" ||
    i.startsWith("sell") ||
    i.includes("seller") ||
    i === "listing";
  const isBuy =
    i === "buy" ||
    i === "buyer" ||
    i.startsWith("buy") ||
    i.includes("buyer") ||
    i === "purchase";
  if (isSell && !isBuy) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (isBuy) return "bg-blue-100 text-blue-800 border border-blue-200";
  if (isSell) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  return "border-border/60 bg-background-light/50 text-text-heading";
}

export function leadGradeChipClasses(grade) {
  switch (String(grade || "").toLowerCase()) {
    case "hot":
      return "bg-red-50 text-red-700 border border-red-200";
    case "warm":
      return "bg-amber-50 text-amber-800 border border-amber-200";
    case "interested":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "cold":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    default:
      return "bg-blue-50 text-blue-700 border border-blue-200";
  }
}

const GRADE_ICONS = {
  hot: Flame,
  warm: Sun,
  cold: Snowflake,
  interested: Sparkles,
};

export function LeadGradeIcon({ grade, size = 11, className = "" }) {
  const g = String(grade || "").toLowerCase();
  const Icon = GRADE_ICONS[g] || CircleHelp;
  return <Icon size={size} className={className} aria-hidden />;
}
