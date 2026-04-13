"use client";

import StepSegmentBar from "./StepSegmentBar";

const CHAT_PROGRESS_STEPS = [
  { key: "intro", label: "Intro" },
  { key: "intent", label: "Intent" },
  { key: "qualify", label: "Qualify" },
  { key: "details", label: "Details" },
  { key: "booking", label: "Booking" },
];

export default function ConversationProgress({ step = 0 }) {
  const activeIndex = Math.min(Math.max(0, step), CHAT_PROGRESS_STEPS.length - 1);

  return (
    <div className="px-5 py-3 bg-white border-b border-border/50 shrink-0">
      <StepSegmentBar steps={CHAT_PROGRESS_STEPS} activeIndex={activeIndex} />
    </div>
  );
}
