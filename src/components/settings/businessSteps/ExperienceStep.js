"use client";

import { IdCard, Link2 } from "lucide-react";
import FormField from "@/components/auth/FormField";

const buttonClasses = (active) =>
  `px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
    active
      ? "border-primary bg-primary/10 text-primary shadow-sm"
      : "border-border bg-background-light/60 text-text-heading hover:border-primary"
  }`;

export default function ExperienceStep({
  form,
  focusedField,
  setFocusedField,
  handleChange,
  handleSelectChange,
}) {
  const renderOptionButtons = (name, options) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={`${name}-${opt.value}`}
          className={buttonClasses(form[name] === opt.value)}
          onClick={() => handleSelectChange(name, opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          How long have you been in the industry?
        </p>
        {renderOptionButtons("experience", [
          { value: "0-2", label: "0-2 years" },
          { value: "3-5", label: "3-5 years" },
          { value: "6-10", label: "6-10 years" },
          { value: "10+", label: "10+ years" },
        ])}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="License Number/Type"
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
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          What’s your yearly transaction volume?
        </p>
        {renderOptionButtons("transactionVolume", [
          { value: "1-10", label: "1-10 transactions" },
          { value: "11-25", label: "11-25 transactions" },
          { value: "26-50", label: "26-50 transactions" },
          { value: "50+", label: "50+ transactions" },
        ])}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Typical sale price range?
        </p>
        {renderOptionButtons("avgSalePrice", [
          { value: "0-300k", label: "Under $300K" },
          { value: "300-600k", label: "$300K - $600K" },
          { value: "600k-1m", label: "$600K - $1M" },
          { value: "1m+", label: "$1M+" },
        ])}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Typical response time?
        </p>
        {renderOptionButtons("responseTime", [
          { value: "1hour", label: "Within 1 hour" },
          { value: "sameday", label: "Same day" },
          { value: "24hours", label: "Within 24 hours" },
          { value: "48hours", label: "Within 48 hours" },
        ])}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Availability
        </p>
        {renderOptionButtons("availability", [
          { value: "business", label: "Business hours only" },
          { value: "extended", label: "Extended hours (evenings)" },
          { value: "weekends", label: "Weekends included" },
          { value: "247", label: "24/7 availability" },
        ])}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Client support style
        </p>
        {renderOptionButtons("supportLevel", [
          { value: "full", label: "Full support" },
          { value: "moderate", label: "Moderate guidance" },
          { value: "minimal", label: "Minimal / self-guided" },
        ])}
      </div>
    </div>
  );
}
