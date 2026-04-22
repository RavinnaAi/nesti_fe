"use client";

import { LEAD_WORKSPACE_TABS } from "@/lib/leadWorkspaceTabsMeta";

export { LEAD_WORKSPACE_TABS, LEAD_WORKSPACE_TAB_IDS } from "@/lib/leadWorkspaceTabsMeta";

const TABS = LEAD_WORKSPACE_TABS;

/** Optional actions (e.g. delete) aligned opposite the tab list on one toolbar row. */
export default function LeadsWorkspaceTabs({ activeTab, onChange, endSlot = null }) {
  return (
    <div className="flex flex-col gap-2 p-2 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between min-[720px]:gap-3">
      <div className="flex flex-wrap gap-2 min-w-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-2 rounded-md text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-sm"
                : "bg-background-light text-text-muted hover:text-text-heading"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {endSlot ? (
        <div className="flex shrink-0 items-center min-[720px]:pl-2 self-end min-[720px]:self-auto">
          {endSlot}
        </div>
      ) : null}
    </div>
  );
}
