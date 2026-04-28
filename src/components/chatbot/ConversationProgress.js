"use client";

import StepSegmentBar from "./StepSegmentBar";

const DEFAULT_CHAT_PROGRESS_STEPS = [
  { key: "intro", label: "Intro" },
  { key: "intent", label: "Intent" },
  { key: "qualify", label: "Qualify" },
  { key: "details", label: "Details" },
  { key: "booking", label: "Booking" },
];

/**
 * @param {object} props
 * @param {number}  [props.step]
 * @param {{ key: string, label: string }[]} [props.steps] — optional; defaults to agent funnel (5 segments)
 * @param {string}  [props.activeBgClass]   — forwarded to StepSegmentBar
 * @param {string}  [props.activeTextClass] — forwarded to StepSegmentBar
 */
export default function ConversationProgress({ step = 0, steps, activeBgClass, activeTextClass }) {
  const list = steps?.length ? steps : DEFAULT_CHAT_PROGRESS_STEPS;
  const activeIndex = Math.min(Math.max(0, step), list.length - 1);

  return (
    <div className="w-full min-w-0 px-4 py-2 bg-white border-b border-border/50 shrink-0">
      <StepSegmentBar
        steps={list}
        activeIndex={activeIndex}
        activeBgClass={activeBgClass}
        activeTextClass={activeTextClass}
      />
    </div>
  );
}
