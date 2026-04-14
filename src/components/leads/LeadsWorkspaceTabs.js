"use client";

const TABS = [
  { id: "lead_profile", label: "Lead Profile" },
  { id: "lead_details", label: "Lead Details" },
  { id: "conversation", label: "Conversation" },
  { id: "actions", label: "Actions" },
  { id: "property_matches", label: "Property Matches" },
  { id: "nurture", label: "Nurture Email" },
  { id: "others", label: "Others" },
];

export default function LeadsWorkspaceTabs({ activeTab, onChange }) {
  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-2">
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
