"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import Divider from "@/components/auth/Divider";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthFooter from "@/components/auth/AuthFooter";
import { emailRegexSimple } from "@/utils/validation";
import { toast } from "react-toastify";
import { useLogin, useGoogleLogin as useGoogleAuth } from "@/hooks/useAuthApi";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleAuth();

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: (tokenResponse) => {
      googleLoginMutation.mutate(
        {
          token: tokenResponse.access_token,
          token_type: "access_token",
        },
        {
          onSuccess: () => router.push("/dashboard"),
        }
      );
    },
    onError: () => toast.error("Google login failed. Please try again."),
  });
  const isSubmitting =
    loginMutation.isLoading || googleLoginMutation.isLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = "Email cannot be blank";
    } else if (!emailRegexSimple.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    if (!form.password.trim()) {
      errs.password = "Password cannot be blank";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (errs.email || errs.password) return;

    try {
      await loginMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <AuthLayout>
      {/* Left - Form Section */}
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to continue to your account"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            autoComplete="current-password"
          />

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              prefetch={false}
              className="text-sm text-primary hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200 font-semibold"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col space-y-3 pt-2">
            <SubmitButton loading={isSubmitting}>Sign In</SubmitButton>
          </div>

          <Divider />

          {/* Google Login Button */}
          <GoogleButton
            onClick={handleGoogleLogin}
            loading={googleLoginMutation.isLoading}
          >
            Sign in with Google
          </GoogleButton>
        </form>

        <AuthFooter
          text="Don't have an account?"
          linkText="Sign Up"
          href="/sign-up"
        />
      </div>

      {/* Right - Visual Section */}
      <AuthVisualSection variant="login" />
    </AuthLayout>
  );
}
