"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  Mail,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

function VerifyResetOTPPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("idle"); // "idle" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [resendLoader, setResendLoader] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits for password reset
  const [email, setEmail] = useState("");

  const otpInputRefs = useRef([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get from localStorage (set by forgot password form)
      if (typeof window !== "undefined") {
        const storedEmail = localStorage.getItem("resetPasswordEmail");
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          // If no email found, redirect to forgot password
          toast.error("Please request a password reset first.");
          router.push("/forgot-password");
        }
      }
    }
  }, [searchParams, router]);

  const getOtpString = () => otp.join("").replace(/\D/g, "");
  const isOtpComplete = () => getOtpString().length === 6;

  const handleVerifyOTP = async () => {
    const code = getOtpString();

    if (!email) {
      toast.error("Email address missing. Please request a new password reset.");
      return;
    }
    if (code.length !== 6) {
      toast.error("OTP must be 6 digits.");
      return;
    }

    setVerifying(true);
    setVerificationStatus("idle");
    setErrorMessage("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

      if (!API_URL) {
        toast.error("API configuration error. Please contact support.");
        setVerificationStatus("error");
        setErrorMessage("API configuration error");
        return;
      }

      const fullUrl = `${API_URL}/api/auth/verify-reset-otp`;

      const payload = {
        email: email.toLowerCase().trim(),
        otp: code.trim(),
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

      if (!response.ok || !data?.success) {
        setVerificationStatus("error");
        setErrorMessage(
          data?.detail ||
            data?.message ||
            "Verification failed. Please try again."
        );
        toast.error(
          data?.detail || data?.message || "Invalid or expired OTP."
        );
        return;
      }

      setVerificationStatus("success");
      toast.success("OTP verified successfully! Redirecting to reset password...");

      // Redirect to reset password page with email and OTP
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&otp=${code}`
        );
      }, 1500);
    } catch (error) {
      console.error("Verify reset OTP error:", error);
      setVerificationStatus("error");
      setErrorMessage("Verification failed. Please try again.");
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email address missing. Please request a new password reset.");
      return;
    }

    setResendLoader(true);
    setResendSuccess(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const fullUrl = `${API_URL}/api/auth/forgot-password`;

      const payload = {
        email: email.toLowerCase().trim(),
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
        setResendSuccess(true);
        setOtp(["", "", "", "", "", ""]);
        toast.success("A new OTP has been sent to your email.");
        // Clear error state
        setVerificationStatus("idle");
        setErrorMessage("");
      } else {
        toast.error(
          data?.detail || "Failed to resend OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoader(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPBlur = (index) => {
    // Only verify if it's the last input (index 5) and all OTP digits are complete
    if (index === 5 && isOtpComplete() && !verifying) {
      handleVerifyOTP();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    // Backspace on empty -> go back
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    // Enter from any input -> submit if OTP is complete
    if (e.key === "Enter" && isOtpComplete() && !verifying) {
      e.preventDefault();
      handleVerifyOTP();
    }
    // Arrow navigation
    if (e.key === "ArrowLeft" && index > 0)
      otpInputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      otpInputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newOtp = ["", "", "", "", "", ""];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last or next empty
    const nextEmpty = newOtp.findIndex((v) => !v);
    if (nextEmpty !== -1) {
      otpInputRefs.current[nextEmpty]?.focus();
    } else {
      // If all digits are filled, focus the last input
      otpInputRefs.current[5]?.focus();
    }
  };

  const getSubtitle = () => {
    if (verificationStatus === "success") {
      return "Redirecting to reset password page...";
    }
    if (verificationStatus === "error") {
      return errorMessage || "Please check your OTP and try again.";
    }
    return email
      ? `Please enter the 6-digit code we sent to ${email}`
      : "Please enter the 6-digit code we sent to your email.";
  };

  return (
    <AuthLayout>
      {/* Left - Form Section */}
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
        {/* Back Button */}
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-text-body hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Forgot Password
        </Link>

        <div className="text-left space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-heading tracking-tight">
            Verify Reset Code
          </h1>
          <p className="text-sm sm:text-base text-text-body">{getSubtitle()}</p>
        </div>

        {/* Email Display */}
        {email && (
          <div className="flex items-center gap-2 p-3 bg-background-light/50 rounded-lg border border-border">
            <Mail className="text-primary" size={18} />
            <span className="text-sm text-text-heading">{email}</span>
          </div>
        )}

        {/* OTP Input Section */}
        {verificationStatus !== "success" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isOtpComplete() && !verifying) {
                  handleVerifyOTP();
                }
              }}
              className="space-y-4"
            >
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) {
                        otpInputRefs.current[index] = el;
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onBlur={() => handleOTPBlur(index)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={verifying}
                    className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      verificationStatus === "error"
                        ? "border-red-300 bg-red-50"
                        : digit
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background-light/50"
                    } disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary`}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {verificationStatus === "error" && errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="text-red-500" size={18} />
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              )}

              {/* Verify Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!isOtpComplete() || verifying}
                className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-xl flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {verifying ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Verify OTP"
                )}
              </motion.button>
            </form>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-text-body mb-2">
                Didn&apos;t receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={resendLoader || resendSuccess}
                className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoader ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="animate-spin" size={16} />
                    Sending...
                  </span>
                ) : resendSuccess ? (
                  "Code sent! Check your email."
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {verificationStatus === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="text-green-600" size={40} />
            </motion.div>
            <p className="text-lg font-semibold text-text-heading">
              OTP Verified Successfully!
            </p>
            <p className="text-sm text-text-body">
              Redirecting to reset password page...
            </p>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center text-sm text-text-body pt-2">
          Remember your password?{" "}
          <Link
            href="/log-in"
            className="text-primary font-semibold hover:text-primary-dark hover:underline transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>

      {/* Right - Visual Section */}
      <div className="w-full md:w-[55%] relative bg-gradient-to-br from-primary-light/20 via-primary/10 to-primary-dark/20 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-dark/15 rounded-full blur-3xl"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-heading mb-4">
              Secure Password Reset
              <br />
              <span className="text-primary">Verified</span>
            </h2>
            <p className="text-text-body text-base md:text-lg max-w-md mx-auto">
              Your account security is our priority
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 md:gap-8 w-full max-w-lg"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                50K+
              </div>
              <div className="text-xs md:text-sm text-text-body">Properties</div>
            </div>
            <div className="text-center border-x border-primary/30">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                100K+
              </div>
              <div className="text-xs md:text-sm text-text-body">
                Happy Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                500+
              </div>
              <div className="text-xs md:text-sm text-text-body">Agents</div>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-10 w-20 h-20 bg-background/40 backdrop-blur-sm rounded-2xl shadow-lg hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-10 w-16 h-16 bg-background/40 backdrop-blur-sm rounded-xl shadow-lg hidden lg:block"
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyResetOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyResetOTPPageInner />
    </Suspense>
  );
}
