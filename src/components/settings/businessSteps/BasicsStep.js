"use client";

import { User, Mail, Globe2, MapPin, Building2 } from "lucide-react";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import FormField from "@/components/auth/FormField";
import SelectDropdown from "@/components/ui/SelectDropdown";

export default function BasicsStep({
  form,
  focusedField,
  setFocusedField,
  handleChange,
  handleSelectChange,
}) {
  return (
    <div className="w-full space-y-4">
      <p className="text-[11px] leading-relaxed text-text-muted">
        Professional type, name, and phone come from your account and cannot be changed here. Your{" "}
        <span className="font-medium text-text-body">company</span>,{" "}
        <span className="font-medium text-text-body">website</span>, and{" "}
        <span className="font-medium text-text-body">location</span> save automatically as you type.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <SelectDropdown
          label="Professional Type"
          placeholder="Select type"
          required
          value={form.professionalType}
          disabled
          className="bg-gray-100 cursor-not-allowed"
          onChange={(val) => handleSelectChange("professionalType", val)}
          onFocus={() => setFocusedField("professionalType")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "agent", label: "Agent" },
            { value: "lawyer", label: "Lawyer" },
            { value: "mortgage_broker", label: "Mortgage Broker" },
          ]}
        />
        <FormField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          onFocus={() => setFocusedField("fullName")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter full name"
          icon={User}
          focusedField={focusedField}
          required
          disabled
          className="!bg-gray-100 !cursor-not-allowed"
        />
        <FormField
          label="Company / brokerage name"
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          onFocus={() => setFocusedField("companyName")}
          onBlur={() => setFocusedField("")}
          placeholder="Your team or brokerage"
          icon={Building2}
          focusedField={focusedField}
          required
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField("")}
          placeholder="you@example.com"
          icon={Mail}
          disabled
          className="!bg-gray-100 !cursor-not-allowed"
          focusedField={focusedField}
          required
        />
        <PhoneNumberField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={() => {}}
          required
          disabled
          className="!bg-gray-100 !cursor-not-allowed"
        />
        <FormField
          label="Website"
          name="website"
          value={form.website}
          onChange={handleChange}
          onFocus={() => setFocusedField("website")}
          onBlur={() => setFocusedField("")}
          placeholder="https://example.com"
          icon={Globe2}
          focusedField={focusedField}
        />
        <FormField
          label="Location"
          name="location"
          value={form.location}
          onChange={handleChange}
          onFocus={() => setFocusedField("location")}
          onBlur={() => setFocusedField("")}
          placeholder="City/Neighborhoods You Serve"
          icon={MapPin}
          focusedField={focusedField}
          required
        />
      </div>
    </div>
  );
}
