"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "react-toastify";
import { useGoogleLogin as useGoogleOAuthLogin } from "@react-oauth/google";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthBrandLink from "@/components/auth/AuthBrandLink";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import Divider from "@/components/auth/Divider";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthFooter from "@/components/auth/AuthFooter";
import { emailRegexSimple } from "@/utils/validation";
import { useGoogleLogin, useLogin } from "@/hooks/useAuthApi";
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const isSubmitting = isLoggingIn || loginMutation.isPending;

  const redirectToGoogleSignup = () => {
    const params = new URLSearchParams();
    params.set("google", "1");
    if (inviteToken) params.set("invite", inviteToken);
    router.push(`/sign-up?${params.toString()}`);
  };

  const googleLogin = useGoogleOAuthLogin({
    flow: "implicit",
    onSuccess: (tokenResponse) => {
      googleLoginMutation.mutate(
        {
          token: tokenResponse.access_token,
          token_type: "access_token",
          invite_token: inviteToken || undefined,
        },
        {
          onSuccess: () => router.push("/dashboard"),
          onError: (error) => {
            const msg = String(error?.message || "").toLowerCase();
            if (error?.status === 404 || msg.includes("no google account found")) {
              toast.info("No Google account found. Redirecting to Google signup...");
              redirectToGoogleSignup();
            }
          },
        }
      );
    },
    onError: () => toast.error("Google login failed. Please try again."),
  });

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

    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        invite_token: inviteToken || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setIsLoggingIn(false);
      console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <AuthLayout>
      <div className="flex w-full min-h-0 flex-1 items-center bg-background px-5 py-4 sm:px-8 md:w-[48%] md:py-5 lg:px-12">
        <div className="mx-auto w-full max-w-[24rem] space-y-3">
          <AuthBrandLink />
          <AuthHeader
            title="Sign in to Nesti"
            subtitle="Manage leads, clients, and follow-ups from one workspace."
          />

          <form onSubmit={handleSubmit} className="space-y-3">
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
                className="cursor-pointer text-sm font-semibold text-primary transition-all duration-200 hover:text-primary-dark hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="flex flex-col space-y-2 pt-1">
              <SubmitButton loading={isSubmitting}>Sign In</SubmitButton>
            </div>

            <Divider />

            <GoogleButton
              onClick={handleGoogleLogin}
              loading={googleLoginMutation.isPending}
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
      </div>

      <AuthVisualSection variant="login" />
    </AuthLayout>
  );
}
