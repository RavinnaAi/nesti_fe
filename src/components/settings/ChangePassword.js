"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import { useChangePassword } from "@/hooks/useAuthApi";
import {
  checkPasswordStrength,
  passwordRequirements,
} from "@/utils/validation";

export default function ChangePassword() {
  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const changePassword = useChangePassword();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") {
      setPasswordStrength(
        value.trim() ? checkPasswordStrength(value) : null
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword.trim()) {
      toast.error("Current password is required");
      return;
    }
    if (form.newPassword.trim().length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      await changePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStrength(null);
    } catch (error) {
      toast.error(error?.message || "Something went wrong. Please try again.");
      // toast handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-3"
      >
        <PasswordField
          label="Current Password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          onFocus={() => setFocusedField("currentPassword")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter current password"
          focusedField={focusedField}
          autoComplete="current-password"
          required
        />

        <PasswordField
          label="New Password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          onFocus={() => setFocusedField("newPassword")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter new password"
          focusedField={focusedField}
          autoComplete="new-password"
          required
          showStrengthIndicator
          passwordStrength={passwordStrength}
          passwordRequirements={passwordRequirements}
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          onFocus={() => setFocusedField("confirmPassword")}
          onBlur={() => setFocusedField("")}
          placeholder="Confirm new password"
          focusedField={focusedField}
          autoComplete="new-password"
          required
        />

        <div className="pt-2">
          <SubmitButton loading={loading}>Update password</SubmitButton>
        </div>
      </form>
    </div>
  );
}
