"use client";

import { IdCard, Link2 } from "lucide-react";
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

export default function ExperienceStep({
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
          label="Industry experience"
          name="experience"
          value={form.experience}
          onChange={handleSelectChange}
          options={[
            { value: "0-2", label: "0–2 yrs" },
            { value: "3-5", label: "3–5 yrs" },
            { value: "6-10", label: "6–10 yrs" },
            { value: "10+", label: "10+ yrs" },
          ]}
        />
        <OptionRow
          label="Yearly transaction volume"
          name="transactionVolume"
          value={form.transactionVolume}
          onChange={handleSelectChange}
          options={[
            { value: "1-10", label: "1–10" },
            { value: "11-25", label: "11–25" },
            { value: "26-50", label: "26–50" },
            { value: "50+", label: "50+" },
          ]}
        />
        <OptionRow
          label="Typical sale price"
          name="avgSalePrice"
          value={form.avgSalePrice}
          onChange={handleSelectChange}
          options={[
            { value: "0-300k", label: "< $300K" },
            { value: "300-600k", label: "$300–600K" },
            { value: "600k-1m", label: "$600K–1M" },
            { value: "1m+", label: "$1M+" },
          ]}
        />
        <OptionRow
          label="Response time"
          name="responseTime"
          value={form.responseTime}
          onChange={handleSelectChange}
          options={[
            { value: "1hour", label: "< 1 hr" },
            { value: "sameday", label: "Same day" },
            { value: "24hours", label: "< 24 hrs" },
            { value: "48hours", label: "< 48 hrs" },
          ]}
        />
        <OptionRow
          label="Availability"
          name="availability"
          value={form.availability}
          onChange={handleSelectChange}
          options={[
            { value: "business", label: "Business hrs" },
            { value: "extended", label: "Extended" },
            { value: "weekends", label: "Weekends" },
            { value: "247", label: "24/7" },
          ]}
        />
        <OptionRow
          label="Client support style"
          name="supportLevel"
          value={form.supportLevel}
          onChange={handleSelectChange}
          options={[
            { value: "full", label: "Full support" },
            { value: "moderate", label: "Moderate" },
            { value: "minimal", label: "Minimal" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          label="Average home price (USD)"
          name="avgHomePrice"
          type="number"
          value={form.avgHomePrice}
          onChange={handleChange}
          onFocus={() => setFocusedField("avgHomePrice")}
          onBlur={() => setFocusedField("")}
          placeholder="e.g. 800000"
          focusedField={focusedField}
        />
        <FormField
          label="Commission rate (%)"
          name="commissionRatePercent"
          type="number"
          value={form.commissionRatePercent}
          onChange={handleChange}
          onFocus={() => setFocusedField("commissionRatePercent")}
          onBlur={() => setFocusedField("")}
          placeholder="e.g. 2.5"
          focusedField={focusedField}
        />
      </div>

      {/* Text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <FormField
          label="License Number / Type"
          name="licenseNumber"
          value={form.licenseNumber}
          onChange={handleChange}
          onFocus={() => setFocusedField("licenseNumber")}
          onBlur={() => setFocusedField("")}
          placeholder="License Number"
          icon={IdCard}
          focusedField={focusedField}
          required
        />
        <FormField
          label="Social Media Links"
          name="socialMedia"
          value={form.socialMedia}
          onChange={handleChange}
          onFocus={() => setFocusedField("socialMedia")}
          onBlur={() => setFocusedField("")}
          placeholder="LinkedIn, Instagram, etc."
          icon={Link2}
          focusedField={focusedField}
        />
      </div>
    </div>
  );
}
