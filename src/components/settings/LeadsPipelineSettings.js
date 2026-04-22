"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_VISIBLE_PIPELINE_KEYS,
  PIPELINE_SIDEBAR_ITEMS,
  readVisiblePipelineKeys,
  writeVisiblePipelineKeys,
} from "@/lib/leadPipelineConfig";

const PIPELINE_KEYS_SET = new Set(PIPELINE_SIDEBAR_ITEMS.map((i) => i.key));

export default function LeadsPipelineSettings() {
  const [keys, setKeys] = useState(DEFAULT_VISIBLE_PIPELINE_KEYS);

  useEffect(() => {
    setKeys(readVisiblePipelineKeys());
  }, []);

  const toggle = (key) => {
    setKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      const dedup = [...new Set(next.filter((k) => PIPELINE_KEYS_SET.has(k)))];
      writeVisiblePipelineKeys(dedup.length > 0 ? dedup : DEFAULT_VISIBLE_PIPELINE_KEYS);
      return readVisiblePipelineKeys();
    });
  };

  const reset = () => {
    writeVisiblePipelineKeys(DEFAULT_VISIBLE_PIPELINE_KEYS);
    setKeys(readVisiblePipelineKeys());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-heading">Leads pipeline (sidebar)</h2>
        <p className="mt-1 text-sm text-text-muted leading-relaxed max-w-2xl">
          Choose which pipeline views appear in the sidebar right after{" "}
          <span className="font-medium text-text-heading">Leads</span>, under{" "}
          <span className="font-medium text-text-heading">Pipeline</span> (same style as Settings).
          Click a view to filter your list; changing a lead’s stage in{" "}
          <span className="font-medium text-text-heading">Lead profile</span> moves it to the matching
          view after refresh.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background-light/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Visible shortcuts
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PIPELINE_SIDEBAR_ITEMS.map((item) => {
            const on = keys.includes(item.key);
            return (
              <li key={item.key}>
                <label
                  className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 cursor-pointer transition ${
                    on ? "border-primary/30 bg-primary/[0.06]" : "border-border/80 bg-white hover:bg-background-light/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary/30"
                    checked={on}
                    onChange={() => toggle(item.key)}
                  />
                  <span className="text-sm font-medium text-text-heading">{item.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-text-muted">
          Use the main <span className="font-medium text-text-heading">Leads</span> item above to open
          the full list without a pipeline filter.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}
