"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import PasswordField from "@/components/auth/PasswordField";
import SubmitButton from "@/components/auth/SubmitButton";
import AuthFooter from "@/components/auth/AuthFooter";
import {
  checkPasswordStrength,
  passwordRequirements,
} from "@/utils/validation";

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loader, setLoader] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const otpParam = searchParams.get("otp") || searchParams.get("code");

    if (emailParam && otpParam) {
      setEmail(emailParam);
      setOtp(otpParam);
    } else {
      toast.error(
        "Invalid or missing reset information. Please verify your OTP first.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      // Redirect to verify OTP page
      setTimeout(() => {
        router.push("/verify-reset-otp");
      }, 2000);
    }
  }, [searchParams, router]);

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

    if (!email || !otp) {
      toast.error("Missing reset information. Please verify your OTP first.", {
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

    setLoader(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

      if (!API_URL) {
        toast.error("API configuration error. Please contact support.");
        return;
      }

      const fullUrl = `${API_URL}/api/auth/reset-password`;

      const payload = {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        newPassword: form.password,
      };

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (response.ok && data.success) {
        setResetSuccess(true);
        toast.success(
          data.message || "Your password has been reset successfully!",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Clear stored email from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("resetPasswordEmail");
        }

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/log-in");
        }, 3000);
      } else {
        throw new Error(data?.detail || data?.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(
        error?.message || "Something went wrong. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoader(false);
    }
  };

  return (
    <AuthLayout>
      {/* Left - Form Section */}
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
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
              <SubmitButton loading={loader} disabled={!email || !otp}>
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

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 text-center">
                Your password has been successfully reset. You can now log in
                with your new password.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/log-in")}
              className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-xl flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
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

      {/* Right - Visual Section */}
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
