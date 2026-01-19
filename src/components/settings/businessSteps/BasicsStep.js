"use client";

import { User, Mail, Phone, Globe2, MapPin } from "lucide-react";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          { value: "broker", label: "Mortgage Broker" },
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
      <FormField
        label="Phone"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        onFocus={() => setFocusedField("phone")}
        onBlur={() => setFocusedField("")}
        placeholder="+1 555 000 0000"
        icon={Phone}
        focusedField={focusedField}
        required
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
  );
}
