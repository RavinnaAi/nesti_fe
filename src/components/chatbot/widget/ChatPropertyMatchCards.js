"use client";

import {
  getChatMatchBedsBaths,
  getChatMatchBudgetLabel,
  getChatMatchLocation,
  getChatMatchPartyName,
  getChatMatchType,
  getChatPropertyMatchesSectionLabel,
} from "@/lib/chatPropertyMatchDisplay";
import { buildPropertyPickMessage } from "@/components/chatbot/widget/chatWidgetTextUtils";

export default function ChatPropertyMatchCards({
  matches = [],
  context = "buy",
  displayMode = "matches",
  note = null,
  empty = false,
  onPropertyMatchSelect,
  onSelectProperty,
}) {
  const sectionLabel = getChatPropertyMatchesSectionLabel(context, displayMode);

  return (
    <div className="mt-3 w-full border-t border-border/50 pt-3">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{sectionLabel}</p>
      {empty ? (
        <p className="text-[11px] leading-relaxed text-text-muted">
          {note || "No matching options are available yet. Your agent can share more with you directly."}
        </p>
      ) : null}
      <ul className="w-full space-y-2">
        {matches.map((item, idx) => {
          const partyName = getChatMatchPartyName(item);
          const location = getChatMatchLocation(item);
          const budget = getChatMatchBudgetLabel(item);
          const propertyType = getChatMatchType(item);
          const bedsBaths = getChatMatchBedsBaths(item);
          const propertyLine = [propertyType, bedsBaths].filter(Boolean).join(" · ");

          return (
            <li
              key={`${item?.id || "pm"}-${idx}`}
              className="w-full rounded-xl border border-primary/10 bg-primary/[0.03] p-3"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <h4 className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-text-heading line-clamp-2">
                  {partyName}
                </h4>
                {budget ? (
                  <span className="shrink-0 text-[12px] font-bold text-primary">{budget}</span>
                ) : null}
              </div>

              {location ? <p className="mt-1 text-[10px] text-text-muted line-clamp-2">{location}</p> : null}
              {propertyLine ? (
                <p className="mt-1 text-[10px] font-medium text-text-heading/80">{propertyLine}</p>
              ) : null}

              {item?.listing_url ? (
                <a
                  href={item.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[10px] font-semibold text-primary underline-offset-2 hover:underline"
                >
                  View listing
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (typeof onPropertyMatchSelect === "function") {
                    onPropertyMatchSelect(item);
                  }
                  if (typeof onSelectProperty === "function") {
                    onSelectProperty({
                      text: buildPropertyPickMessage(item, context),
                      selectedProperty: item,
                      selectedPropertyContext: context,
                    });
                  }
                }}
                className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                {context === "sell" ? "Select comparable" : "I'm interested"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
