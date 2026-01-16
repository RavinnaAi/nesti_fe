"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone } from "lucide-react";
import { toast } from "react-toastify";
import FormField from "@/components/auth/FormField";
import SubmitButton from "@/components/auth/SubmitButton";
import { useAppSelector } from "@/store";
import { useSavePersonalInfo } from "@/hooks/useProfileApi";

const validatePersonalInfo = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      errors.email = "Please enter a valid email";
    }
  }
  if (form.phone && form.phone.trim().length < 7) {
    errors.phone = "Phone should be at least 7 digits";
  }
  return errors;
};

export default function PersonalInfo() {
  const storedPersonal = useAppSelector((state) => state.profile.personalInfo);
  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const savePersonalInfo = useSavePersonalInfo();

  useEffect(() => {
    if (storedPersonal) {
      setForm((prev) => ({ ...prev, ...storedPersonal }));
    }
  }, [storedPersonal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePersonalInfo(form);
    if (Object.keys(errors).length) {
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    // console.log("savePersonalInfo", storedPersonal);
    const payload = {
      professional_type: storedPersonal.role,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    };

    setLoading(true);
    try {
      await savePersonalInfo.mutateAsync(payload);
    } catch (err) {
      console.error("Personal info update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-2xl bg-background-light border border-border shadow-sm" />
        <div className="space-y-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white shadow-sm text-sm font-semibold text-text-heading hover:border-primary hover:text-primary transition"
          >
            <User size={16} />
            Change Photo
          </button>
          <div className="text-xs text-text-muted">
            JPG, PNG or WEBP. Max 2MB
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="First Name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          onFocus={() => setFocusedField("firstName")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter first name"
          icon={User}
          focusedField={focusedField}
          required
        />
        <FormField
          label="Last Name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          onFocus={() => setFocusedField("lastName")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter last name"
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
          focusedField={focusedField}
          disabled
          className="bg-gray-100 cursor-not-allowed"
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
        />
      </div>

      <div className="pt-2">
        <SubmitButton loading={loading}>Save changes</SubmitButton>
      </div>
    </form>
  );
}
