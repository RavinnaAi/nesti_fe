"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "react-toastify";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import RoleDropdown from "@/components/auth/RoleDropdown";
import NameFields from "@/components/auth/NameFields";
import SubmitButton from "@/components/auth/SubmitButton";
import Divider from "@/components/auth/Divider";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthFooter from "@/components/auth/AuthFooter";
import {
  emailRegex,
  checkPasswordStrength,
  passwordRequirements,
} from "@/utils/validation";
import { useSignupFlow } from "@/hooks/useSignupFlow";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loader, setLoader] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    country: "US",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { saveSignupData } = useSignupFlow();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === "email" ? value.toLowerCase() : value;
    setForm((prev) => ({ ...prev, [name]: v }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password") {
      if (!value.trim()) {
        setPasswordStrength(null);
      } else {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  const handleRoleChange = (value) => {
    setForm((prev) => ({ ...prev, role: value }));
    setFieldErrors((prev) => ({ ...prev, role: "" }));
  };

  const validate = () => {
    const errs = {};
    const { firstName, lastName, email, password, role } = form;
    if (!firstName.trim()) errs.firstName = "First name cannot be blank";
    if (!lastName.trim()) errs.lastName = "Last name cannot be blank";
    if (!email.trim()) {
      errs.email = "Email cannot be blank";
    } else if (/[A-Z]/.test(email)) {
      errs.email = "Email must not contain uppercase letters";
    } else if (!emailRegex.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password.trim()) {
      errs.password = "Password cannot be blank";
    } else {
      const strength = checkPasswordStrength(password);
      if (strength !== "strong") {
        errs.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
      }
    }
    if (!role) errs.role = "Please select a role";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoader(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     firstName: form.firstName.trim(),
      //     lastName: form.lastName.trim(),
      //     email: form.email.toLowerCase().trim(),
      //     password: form.password,
      //     role: form.role,
      //     country: form.country,
      //   }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Signup:", form);

      // Save email to localStorage for verification page
      saveSignupData({ email: form.email });

      // Show success toast
      toast.success("Registration successful! Please verify your email.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirect to verify email page
      router.push("/verify-email");
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Registration failed. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log("Google signup clicked");
  };

  return (
    <AuthLayout>
      {/* Left - Form Section */}
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
        <AuthHeader
          title="Sign Up for Nesti AI"
          subtitle="Create your account and start your free 14-day trial"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <NameFields
            firstName={form.firstName}
            lastName={form.lastName}
            onFirstNameChange={handleChange}
            onLastNameChange={handleChange}
            onFirstNameFocus={() => setFocusedField("firstName")}
            onLastNameFocus={() => setFocusedField("lastName")}
            onFirstNameBlur={() => setFocusedField("")}
            onLastNameBlur={() => setFocusedField("")}
            firstNameError={fieldErrors.firstName}
            lastNameError={fieldErrors.lastName}
            focusedField={focusedField}
          />

          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField("")}
            placeholder="Enter your email"
            icon={Mail}
            focusedField={focusedField}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <PasswordField
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField("")}
            placeholder="Enter your password"
            focusedField={focusedField}
            error={fieldErrors.password}
            passwordStrength={passwordStrength}
            required
            autoComplete="new-password"
            showStrengthIndicator={true}
            passwordRequirements={passwordRequirements}
          />

          <RoleDropdown
            value={form.role}
            onChange={handleRoleChange}
            onFocus={() => setFocusedField("role")}
            onBlur={() => setFocusedField("")}
            focusedField={focusedField}
            error={fieldErrors.role}
            required
          />

          {/* Submit Button */}
          <div className="flex flex-col space-y-3 pt-2">
            <SubmitButton loading={loader}>Create Account</SubmitButton>
          </div>

          <Divider />

          {/* Google Signup Button */}
          <GoogleButton onClick={handleGoogleSignup} loading={loader}>
            Sign up with Google
          </GoogleButton>
        </form>

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          href="/log-in"
        />
      </div>

      {/* Right - Visual Section */}
      <AuthVisualSection variant="signup" />
    </AuthLayout>
  );
}
