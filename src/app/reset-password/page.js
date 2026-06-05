"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthBrandLink from "@/components/auth/AuthBrandLink";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import AuthFooter from "@/components/auth/AuthFooter";
import {
  checkPasswordStrength,
  passwordRequirements,
} from "@/utils/validation";
import { useResetPassword } from "@/hooks/useAuthApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearResetEmail, clearResetToken } from "@/store/authSlice";

function ResetPasswordPageInner() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const resetToken = useAppSelector((state) => state.auth.resetToken);
  const [loader, setLoader] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(null);
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const resetMutation = useResetPassword();
  const isSubmittingRef = useRef(false);
  const isSubmitting = loader || resetMutation.isLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "password") {
      if (!value.trim()) {
        setPasswordStrength(null);
      } else {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.password.trim()) {
      errs.password = "Password cannot be blank";
    } else {
      const strength = checkPasswordStrength(form.password);
      if (strength !== "strong") {
        errs.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
      }
    }
    if (!form.confirmPassword.trim()) {
      errs.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!resetToken) {
      toast.error("Missing reset token. Please verify your OTP first.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      router.push("/verify-reset-otp");
      return;
    }

    if (isSubmittingRef.current || resetMutation.isLoading) return;
    isSubmittingRef.current = true;
    setLoader(true);

    try {
      await resetMutation.mutateAsync({
        newPassword: form.password,
        resetToken,
      });
      setResetSuccess(true);
      dispatch(clearResetEmail());
      dispatch(clearResetToken());

      router.push("/log-in");
    } catch (error) {
      // errors already handled by mutation toast
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
          <AuthHeader
          title={resetSuccess ? "Password Reset! ✅" : "Reset Password 🔑"}
          subtitle={
            resetSuccess
              ? "Your password has been successfully reset."
              : "Enter your new password below."
          }
        />

        {!resetSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              label="New Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              placeholder="Enter new password"
              focusedField={focusedField}
              error={fieldErrors.password}
              passwordStrength={passwordStrength}
              required
              autoComplete="new-password"
              showStrengthIndicator={true}
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
              error={fieldErrors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <div className="flex flex-col space-y-3 pt-2">
              <SubmitButton loading={isSubmitting} disabled={!resetToken}>
                Reset Password
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-primary"
              >
                <CheckCircle2 size={80} />
              </motion.div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 text-center">
                Your password has been successfully reset. You can now log in
                with your new password.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/log-in")}
              className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
            >
              Go to Login
            </motion.button>
          </div>
        )}

        {!resetSuccess && (
          <AuthFooter
            text="Remember your password?"
            linkText="Back to Login"
            href="/log-in"
          />
        )}
        </div>
      </div>

      <AuthVisualSection variant="login" />
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
