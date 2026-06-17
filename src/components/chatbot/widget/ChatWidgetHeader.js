"use client";

import { MessageCircle, X } from "lucide-react";

export default function ChatWidgetHeader({
  roleUi,
  resolvedRole,
  showHostAvatar,
  trimmedAvatarUrl,
  setHostAvatarBroken,
  displayTitle,
  headerSubtitle,
  inlineMode,
  setIsOpen,
}) {
  return (
    <div className={roleUi.headerClass}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showHostAvatar ? (
          <div
            className={`flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ${
              resolvedRole === "agent"
                ? "ring-border/30 bg-background-light"
                : "ring-white/20 bg-white/10"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trimmedAvatarUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setHostAvatarBroken(true)}
            />
          </div>
        ) : (
          <div className={roleUi.iconBubbleClass}>
            <MessageCircle size={18} aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`${roleUi.headerTitleClass} min-w-0 truncate`} role="heading" aria-level={3}>
              {displayTitle}
            </div>
          </div>
          {headerSubtitle ? <p className={`m-0 mt-0.5 ${roleUi.headerSubtitleClass}`}>{headerSubtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={roleUi.statusPillClass} title="This assistant is online and ready to chat.">
          <span className={roleUi.statusDotClass} />
          Online
        </span>
        {!inlineMode ? (
          <button
            onClick={() => setIsOpen(false)}
            className={roleUi.closeButtonClass}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
