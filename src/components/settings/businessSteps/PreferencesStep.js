"use client";

import { useMemo } from "react";

const buttonClasses = (active) =>
  `px-3 py-2 rounded-md border text-sm font-semibold transition-all ${active
    ? "border-primary bg-primary/10 text-primary shadow-sm"
    : "border-border bg-background-light/60 text-text-heading hover:border-primary"
  }`;

export default function PreferencesStep({
  form,
  focusedField,
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
  mode = "all",
}) {
  const groupedLists = useMemo(() => {
    const base = {
      specializationsList: specializationsList || [],
      communicationList: communicationList || [],
      preferredClientsList: preferredClientsList || [],
    };
    return base;
  }, [specializationsList, communicationList, preferredClientsList]);

  const showSpecializations =
    mode === "all" || mode === "specializations" || mode === "prefs";
  const showCommunication =
    mode === "all" || mode === "communication" || mode === "prefs";
  const showClients = mode === "all" || mode === "clients" || mode === "prefs";
  const showTestimonial =
    mode === "all" || mode === "testimonial" || mode === "prefs";

  const renderChipList = (items, selected, setter) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selected.includes(item);
        return (
          <button
            type="button"
            key={item}
            className={buttonClasses(isActive)}
            onClick={() => toggleFromList(item, setter)}
          >
            {item}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {showSpecializations ? (
        <div>
          <p className="text-sm font-semibold text-text-heading mb-1">
            What are your specializations?
          </p>
          <p className="text-xs text-text-muted mb-3">
            Pick the areas you’re most confident in.
          </p>
          {renderChipList(
            groupedLists.specializationsList,
            specializations,
            setSpecializations
          )}
        </div>
      ) : null}

      {showCommunication ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-heading mb-1">
            How do you prefer to communicate?
          </p>
          <p className="text-xs text-text-muted mb-3">
            Choose channels you’re most responsive on.
          </p>
          {renderChipList(
            groupedLists.communicationList,
            communicationChannels,
            setCommunicationChannels
          )}
        </div>
      ) : null}

      {showClients ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-heading mb-1">
            Who are your ideal clients?
          </p>
          <p className="text-xs text-text-muted mb-3">
            Select the client types you serve best.
          </p>
          {renderChipList(
            groupedLists.preferredClientsList,
            preferredClients,
            setPreferredClients
          )}
        </div>
      ) : null}

      {showTestimonial ? (
        <div>
          <p className="text-sm font-semibold text-text-heading mb-1">
            Share a quick win story.
          </p>
          <p className="text-xs text-text-muted mb-3">
            Mention a testimonial or success highlight.
          </p>
          <textarea
            name="testimonial"
            value={form.testimonial}
            onChange={handleChange}
            onFocus={() => setFocusedField("testimonial")}
            onBlur={() => setFocusedField("")}
            rows={4}
            className="w-full rounded-md border-2 border-border bg-background-light/50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Client testimonial or success story"
          />
        </div>
      ) : null}
    </div>
  );
}
