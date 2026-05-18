"use client";

import { Award, MapPin } from "lucide-react";
import FormField from "@/components/auth/FormField";

const chipCls = (active) =>
  `px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all whitespace-nowrap ${
    active
      ? "border-primary bg-primary/10 text-primary shadow-sm"
      : "border-border bg-background-light/60 text-text-heading hover:border-primary"
  }`;

function OptionRow({ label, name, options, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-text-heading">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            type="button"
            key={`${name}-${opt.value}`}
            className={chipCls(value === opt.value)}
            onClick={() => onChange(name, opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StyleMetricsStep({
  form,
  focusedField,
  setFocusedField,
  handleChange,
  handleSelectChange,
}) {
  return (
    <div className="w-full space-y-5">
      {/* Option groups in 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <OptionRow
          label="Negotiation style"
          name="negotiationStyle"
          value={form.negotiationStyle}
          onChange={handleSelectChange}
          options={[
            { value: "aggressive", label: "Aggressive" },
            { value: "collaborative", label: "Collaborative" },
            { value: "educator", label: "Educator" },
            { value: "analytical", label: "Analytical" },
          ]}
        />
        <OptionRow
          label="Sales approach"
          name="salesApproach"
          value={form.salesApproach}
          onChange={handleSelectChange}
          options={[
            { value: "relationship", label: "Relationship" },
            { value: "results", label: "Results" },
            { value: "coaching", label: "Coaching" },
            { value: "consultative", label: "Consultative" },
          ]}
        />
        <OptionRow
          label="Energy style"
          name="energyStyle"
          value={form.energyStyle}
          onChange={handleSelectChange}
          options={[
            { value: "high-energy", label: "High-energy" },
            { value: "calm", label: "Calm" },
            { value: "structured", label: "Structured" },
            { value: "creative", label: "Creative" },
          ]}
        />
        <OptionRow
          label="Personality tag"
          name="personalityTag"
          value={form.personalityTag}
          onChange={handleSelectChange}
          options={[
            { value: "educator", label: "Educator" },
            { value: "negotiator", label: "Negotiator" },
            { value: "low-pressure", label: "Low-pressure" },
            { value: "relationship-builder", label: "Relationship Builder" },
          ]}
        />
      </div>

      {/* Text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <FormField
          label="Awards or Recognitions"
          name="awards"
          value={form.awards}
          onChange={handleChange}
          onFocus={() => setFocusedField("awards")}
          onBlur={() => setFocusedField("")}
          placeholder="Awards or recognitions"
          icon={Award}
          focusedField={focusedField}
        />
        <FormField
          label="Target Neighborhoods"
          name="targetNeighborhoods"
          value={form.targetNeighborhoods}
          onChange={handleChange}
          onFocus={() => setFocusedField("targetNeighborhoods")}
          onBlur={() => setFocusedField("")}
          placeholder="Areas where you want more leads"
          icon={MapPin}
          focusedField={focusedField}
        />
      </div>
    </div>
  );
}
