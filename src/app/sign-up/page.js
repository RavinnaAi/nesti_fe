"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
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
import { useSignup, useGoogleSignup } from "@/hooks/useAuthApi";
import { useAppSelector } from "@/store";
import { captureInviteToken } from "@/lib/inviteClient";
import {
  getInviteAttribution,
  getOrCreateInviteSessionId,
  getOrCreateInviteVisitorId,
  saveInviteAttribution,
} from "@/lib/inviteAttributionStorage";

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAppSelector((state) => state.auth.token);
  const [inviteToken, setInviteToken] = useState("");

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  useEffect(() => {
    const wantsGoogleFlow = String(searchParams?.get("google") || "").trim() === "1";
    if (wantsGoogleFlow) {
      setIsGoogleSignupSelected(true);
    }

    const fromQuery =
      String(searchParams?.get("invite") || searchParams?.get("ref") || "").trim();
    if (fromQuery) {
      setInviteToken(fromQuery);
      saveInviteAttribution(fromQuery, {
        sourceChannel: String(searchParams?.get("channel") || "direct"),
        landingPath: typeof window !== "undefined" ? window.location.pathname : "/sign-up",
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
        landing_path: typeof window !== "undefined" ? window.location.pathname : "/sign-up",
      },
    }).catch(() => {});
  }, [inviteToken]);
  const [loader, setLoader] = useState(false);
  const [isGoogleSignupSelected, setIsGoogleSignupSelected] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { saveSignupData } = useSignupFlow();
  const signupMutation = useSignup();
  const googleSignupMutation = useGoogleSignup();
  const isGoogleFlowActive = isGoogleSignupSelected || googleSignupMutation.isPending;
  const isSubmitting = loader || signupMutation.isPending;
  const googleSignup = useGoogleLogin({
    flow: "implicit",
    onSuccess: (tokenResponse) => {
      googleSignupMutation.mutate(
        {
          token: tokenResponse.access_token,
          token_type: "access_token",
          role: form.role,
          invite_token: inviteToken || undefined,
        },
        {
          onSuccess: () => router.push("/dashboard"),
        }
      );
    },
    onError: () => {
      setIsGoogleSignupSelected(false);
      toast.error("Google signup failed. Please try again.");
    },
  });

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
      const data = await signupMutation.mutateAsync({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        role: form.role,
        invite_token: inviteToken || undefined,
      });

      // Persist email + verificationToken for the OTP verification step
      saveSignupData({
        email: form.email,
        verificationToken: data?.verificationToken || null,
        inviteToken: inviteToken || null,
      });

      // Redirect to verify email page
      router.push("/verify-email");
    } catch (err) {
      console.error("Signup error:", err);
    } finally {
      setLoader(false);
    }
  };

  const handleGoogleSignup = () => {
    setIsGoogleSignupSelected(true);
    if (!form.role) {
      setFieldErrors((prev) => ({ ...prev, role: "Please select a role" }));
      toast.error("Please select your role before continuing with Google.");
      return;
    }
    googleSignup();
  };

  return (
    <AuthLayout>
      {/* Left - Form Section */}
      <div className="flex w-full min-h-0 flex-1 items-center bg-background px-5 py-4 sm:px-8 md:w-[48%] md:py-5 lg:px-12">
        <div className="mx-auto w-full max-w-[24rem] space-y-3">
          <AuthHeader
            title="Create your Nesti account"
            subtitle="Set up your workspace in minutes. No card required."
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isGoogleFlowActive ? (
              <>
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
              </>
            ) : null}

            <RoleDropdown
            value={form.role}
            onChange={handleRoleChange}
            onFocus={() => setFocusedField("role")}
            onBlur={() => setFocusedField("")}
            focusedField={focusedField}
            error={fieldErrors.role}
            required
            />

            {!isGoogleFlowActive ? (
              <div className="flex flex-col space-y-2 pt-1">
                <SubmitButton loading={isSubmitting}>Create Account</SubmitButton>
              </div>
            ) : null}

            {!isGoogleFlowActive ? <Divider /> : null}

            <GoogleButton
              onClick={handleGoogleSignup}
              loading={googleSignupMutation.isPending}
            >
              Sign up with Google
            </GoogleButton>

            {isGoogleFlowActive ? (
              <button
                type="button"
                onClick={() => setIsGoogleSignupSelected(false)}
                className="w-full text-xs font-semibold text-text-muted hover:text-text-heading transition-colors"
              >
                Use email signup instead
              </button>
            ) : null}
          </form>

          <AuthFooter
            text="Already have an account?"
            linkText="Login"
            href="/log-in"
          />
        </div>
      </div>

      {/* Right - Visual Section */}
      <AuthVisualSection variant="signup" />
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  );
}
