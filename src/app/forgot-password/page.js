"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthBrandLink from "@/components/auth/AuthBrandLink";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import FormField from "@/components/auth/FormField";
import SubmitButton from "@/components/auth/SubmitButton";
import AuthFooter from "@/components/auth/AuthFooter";
import { emailRegexSimple } from "@/utils/validation";
import { useForgotPassword } from "@/hooks/useAuthApi";
import { useAppDispatch } from "@/store";
import { setResetEmail } from "@/store/authSlice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loader, setLoader] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const forgotPasswordMutation = useForgotPassword();
  const isSubmittingRef = useRef(false);
  const isSubmitting = loader || forgotPasswordMutation.isLoading;

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = "Email cannot be blank";
    } else if (!emailRegexSimple.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isSubmittingRef.current || forgotPasswordMutation.isLoading) return;
    isSubmittingRef.current = true;

    setLoader(true);
    try {
      await forgotPasswordMutation.mutateAsync(email);
      const normalizedEmail = email.toLowerCase().trim();
      dispatch(setResetEmail(normalizedEmail));
      router.push(`/verify-reset-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      console.error("Forgot password error:", error);
      // Error toast: useForgotPassword onError already notifies the user.
    } finally {
      setLoader(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <AuthLayout>
      <div className="flex w-full min-h-0 flex-1 items-center bg-background px-5 py-4 sm:px-8 md:w-[48%] md:py-5 lg:px-12">
        <div className="mx-auto w-full max-w-[24rem] space-y-3">
          <AuthBrandLink />
          <Link
            href="/log-in"
            prefetch={false}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background-light/70 px-2.5 py-1 text-xs font-medium text-text-body transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>

          <AuthHeader
          title={emailSent ? "Check Your Email 📧" : "Forgot Password? 🔒"}
          subtitle={
            emailSent
              ? "We've sent password reset instructions to your email address."
              : "No worries! Enter your email and we'll send you reset instructions."
          }
        />

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              placeholder="Enter your email"
              icon={Mail}
              focusedField={focusedField}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />

            <div className="flex flex-col space-y-3 pt-2">
              <SubmitButton loading={isSubmitting}>
                Send Reset Instructions
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                If an account exists with <strong>{email}</strong>, you will
                receive an email with password reset instructions shortly.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                router.push(
                  `/verify-reset-otp?email=${encodeURIComponent(
                    email.toLowerCase().trim()
                  )}`
                )
              }
              className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
            >
              Verify OTP
            </motion.button>

            <button
              onClick={() => {
                setEmailSent(false);
              }}
              className="w-full text-sm text-text-body hover:text-primary transition-colors duration-200"
            >
              Didn&apos;t receive the email? Try again
            </button>
          </div>
        )}

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
