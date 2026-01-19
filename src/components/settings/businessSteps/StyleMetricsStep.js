"use client";

import { BarChart2, Layers, Star, Award, MapPin } from "lucide-react";
import FormField from "@/components/auth/FormField";

const buttonClasses = (active) =>
  `px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
    active
      ? "border-primary bg-primary/10 text-primary shadow-sm"
      : "border-border bg-background-light/60 text-text-heading hover:border-primary"
  }`;

export default function StyleMetricsStep({
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
          What’s your negotiation style?
        </p>
        {renderOptionButtons("negotiationStyle", [
          { value: "aggressive", label: "Aggressive advocate" },
          { value: "collaborative", label: "Collaborative win-win" },
          { value: "educator", label: "Educator / guide" },
          { value: "analytical", label: "Analytical / data-driven" },
        ])}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Sales approach
        </p>
        {renderOptionButtons("salesApproach", [
          { value: "relationship", label: "Relationship-focused" },
          { value: "results", label: "Results-focused" },
          { value: "coaching", label: "Coaching / educational" },
          { value: "consultative", label: "Consultative" },
        ])}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Energy style
        </p>
        {renderOptionButtons("energyStyle", [
          { value: "high-energy", label: "High-energy & enthusiastic" },
          { value: "calm", label: "Calm & methodical" },
          { value: "structured", label: "Structured & organized" },
          { value: "creative", label: "Creative & flexible" },
        ])}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-heading">
          Personality tag
        </p>
        {renderOptionButtons("personalityTag", [
          { value: "educator", label: "Educator" },
          { value: "negotiator", label: "Negotiator" },
          { value: "low-pressure", label: "Low-pressure" },
          { value: "relationship-builder", label: "Relationship Builder" },
        ])}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Transactions This Year"
          name="transactionsThisYear"
          value={form.transactionsThisYear}
          onChange={handleChange}
          onFocus={() => setFocusedField("transactionsThisYear")}
          onBlur={() => setFocusedField("")}
          placeholder="Number of transactions this year"
          icon={BarChart2}
          focusedField={focusedField}
        />
        <FormField
          label="Total Career Transactions"
          name="careerTransactions"
          value={form.careerTransactions}
          onChange={handleChange}
          onFocus={() => setFocusedField("careerTransactions")}
          onBlur={() => setFocusedField("")}
          placeholder="Total career transactions"
          icon={Layers}
          focusedField={focusedField}
        />
        <FormField
          label="Client Rating"
          name="clientRating"
          value={form.clientRating}
          onChange={handleChange}
          onFocus={() => setFocusedField("clientRating")}
          onBlur={() => setFocusedField("")}
          placeholder="e.g. 4.8 / 5"
          icon={Star}
          focusedField={focusedField}
        />
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
