"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import AuthFooter from "@/components/auth/AuthFooter";
import { emailRegexSimple } from "@/utils/validation";
import { useLogin } from "@/hooks/useAuthApi";
import { useAppSelector } from "@/store";
import { captureInviteToken } from "@/lib/inviteClient";
import {
  getInviteAttribution,
  getOrCreateInviteSessionId,
  getOrCreateInviteVisitorId,
  saveInviteAttribution,
} from "@/lib/inviteAttributionStorage";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAppSelector((state) => state.auth.token);
  const [inviteToken, setInviteToken] = useState("");

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  useEffect(() => {
    const fromQuery =
      String(searchParams?.get("invite") || searchParams?.get("ref") || "").trim();
    if (fromQuery) {
      setInviteToken(fromQuery);
      saveInviteAttribution(fromQuery, {
        sourceChannel: String(searchParams?.get("channel") || "direct"),
        landingPath: typeof window !== "undefined" ? window.location.pathname : "/log-in",
      });
      return;
    }
    const persisted = getInviteAttribution();
    if (persisted?.token) setInviteToken(String(persisted.token).trim());
  }, [searchParams]);

  useEffect(() => {
    if (!inviteToken) return;
    captureInviteToken({
      token: inviteToken,
      payload: {
        session_id: getOrCreateInviteSessionId(),
        visitor_id: getOrCreateInviteVisitorId(),
        source_channel: "direct",
        source_referrer: typeof document !== "undefined" ? document.referrer || "" : "",
        landing_path: typeof window !== "undefined" ? window.location.pathname : "/log-in",
      },
    }).catch(() => {});
  }, [inviteToken]);

  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const loginMutation = useLogin();
  const isSubmitting = loginMutation.isLoading;

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
        invite_token: inviteToken || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to continue to your account"
        />

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

          <div className="text-right">
            <Link
              href="/forgot-password"
              prefetch={false}
              className="text-sm text-primary hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200 font-semibold"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <SubmitButton loading={isSubmitting}>Sign In</SubmitButton>
          </div>
        </form>

        <AuthFooter
          text="Don't have an account?"
          linkText="Sign Up"
          href="/sign-up"
        />
      </div>

      <AuthVisualSection variant="login" />
    </AuthLayout>
  );
}
