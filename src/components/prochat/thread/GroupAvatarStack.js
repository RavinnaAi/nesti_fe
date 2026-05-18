"use client";

import { initialsFor } from "@/components/prochat/thread/proChatThreadUtils";

export default function GroupAvatarStack({ members }) {
  const items = Array.isArray(members) ? members.filter(Boolean).slice(0, 3) : [];
  const base = 36; // h-9 / w-9
  const step = 14; // overlap step
  const w = base + Math.max(items.length - 1, 0) * step;
  if (items.length === 0) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-white shadow-sm ring-1 ring-primary/30">
        G
      </span>
    );
  }
  return (
    <span className="relative inline-block h-9" style={{ width: `${w}px` }}>
      {items.map((u, idx) => {
        const left = idx * step;
        const z = 10 - idx;
        return u?.profile_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={String(u?.id || idx)}
            src={u.profile_image}
            alt=""
            className="absolute top-0 h-9 w-9 rounded-xl object-cover ring-2 ring-white"
            style={{ left, zIndex: z }}
          />
        ) : (
          <span
            key={String(u?.id || idx)}
            className="absolute top-0 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-white ring-2 ring-white"
            style={{ left, zIndex: z }}
          >
            {initialsFor(u)}
          </span>
        );
      })}
    </span>
  );
}
