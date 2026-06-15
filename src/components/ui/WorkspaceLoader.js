"use client";

import Image from "next/image";

export default function WorkspaceLoader({
  label = "Loading workspace...",
  sublabel = "Preparing your tools and data",
  fullHeight = true,
  className = "",
}) {
  return (
    <div
      className={`${fullHeight ? "min-h-screen" : "min-h-full"} flex w-full items-center justify-center px-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-primary/15 bg-white/85 px-8 py-9 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="relative mx-auto mb-4 grid h-14 w-14 place-items-center">
          <span className="absolute inset-0 rounded-2xl border-2 border-primary/20" aria-hidden />
          <span
            className="absolute inset-[4px] animate-spin rounded-xl border-2 border-primary/45 border-t-primary"
            aria-hidden
          />
          <span className="relative z-[1] grid h-9 w-9 place-items-center rounded-lg overflow-hidden">
            <Image
              src="/logo/logo.png"
              alt="Nesti AI logo"
              width={36}
              height={36}
              className="h-9 w-9 object-cover"
            />
          </span>
        </div>
        <p className="text-sm font-semibold text-text-heading">{label}</p>
        <p className="mt-1 text-xs text-text-muted">{sublabel}</p>
      </div>
    </div>
  );
}
