"use client";

import { useMemo } from "react";

const chipCls = (active) =>
  `px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all whitespace-nowrap ${
    active
      ? "border-primary bg-primary/10 text-primary shadow-sm"
      : "border-border bg-background-light/60 text-text-heading hover:border-primary"
  }`;

export default function PreferencesStep({
  form,
  setFocusedField,
  handleChange,
  specializations,
  communicationChannels,
  preferredClients,
  toggleFromList,
  setSpecializations,
  setCommunicationChannels,
  setPreferredClients,
  specializationsList,
  communicationList,
  preferredClientsList,
  mode = "audience",
}) {
  const groupedLists = useMemo(() => ({
    specializationsList: specializationsList || [],
    communicationList: communicationList || [],
    preferredClientsList: preferredClientsList || [],
  }), [specializationsList, communicationList, preferredClientsList]);

  const renderChipList = (items, selected, setter) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const isActive = selected.includes(item);
        return (
          <button
            type="button"
            key={item}
            className={chipCls(isActive)}
            onClick={() => toggleFromList(item, setter)}
          >
            {item}
          </button>
        );
      })}
    </div>
  );

  if (mode === "audience") {
    return (
      <div className="space-y-4">
        <p className="text-[11px] text-text-muted">
          Define your expertise, how clients reach you, and who you serve best — in one place.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border/80 bg-background-light/30 p-3">
            <div>
              <p className="text-xs font-semibold text-text-heading">What are your specializations?</p>
              <p className="text-[11px] text-text-muted mt-0.5">Pick the areas you are most confident in.</p>
            </div>
            {renderChipList(groupedLists.specializationsList, specializations, setSpecializations)}
          </div>

          <div className="space-y-2 rounded-lg border border-border/80 bg-background-light/30 p-3">
            <div>
              <p className="text-xs font-semibold text-text-heading">How do you prefer to communicate?</p>
              <p className="text-[11px] text-text-muted mt-0.5">Choose channels you are most responsive on.</p>
            </div>
            {renderChipList(groupedLists.communicationList, communicationChannels, setCommunicationChannels)}
          </div>

          <div className="md:col-span-2 space-y-2 rounded-lg border border-border/80 bg-background-light/30 p-3">
            <div>
              <p className="text-xs font-semibold text-text-heading">Who are your ideal clients?</p>
              <p className="text-[11px] text-text-muted mt-0.5">Select the client types you serve best.</p>
            </div>
            {renderChipList(groupedLists.preferredClientsList, preferredClients, setPreferredClients)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-text-heading">Share a quick win story</p>
        <p className="text-[11px] text-text-muted mt-0.5">Mention a testimonial or success highlight.</p>
      </div>
      <textarea
        name="testimonial"
        value={form.testimonial}
        onChange={handleChange}
        onFocus={() => setFocusedField("testimonial")}
        onBlur={() => setFocusedField("")}
        rows={5}
        className="w-full rounded-md border border-border bg-background-light/50 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder="Client testimonial or success story"
      />
    </div>
  );
}
