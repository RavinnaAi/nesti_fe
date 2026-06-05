"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { CheckCircle2, XCircle, Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthBrandLink from "@/components/auth/AuthBrandLink";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import { useVerifyResetOTP, useForgotPassword } from "@/hooks/useAuthApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { setResetToken, setResetEmail } from "@/store/authSlice";

function VerifyResetOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email")?.trim().toLowerCase() || "";
  const dispatch = useAppDispatch();
  const resetEmail = useAppSelector((state) => state.auth.resetEmail);
  const resetToken = useAppSelector((state) => state.auth.resetToken);
  const [verificationStatus, setVerificationStatus] = useState("idle"); // "idle" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", ""]); // 5 digits — matches backend randomOtp()
  const [email, setEmail] = useState("");
  const otpInputRefs = useRef([]);
  const isVerifyingRef = useRef(false);
  const isResendingRef = useRef(false);
  const hasNavigatedToResetRef = useRef(false);
  const verifyResetMutation = useVerifyResetOTP();
  const resendMutation = useForgotPassword();
  const verifying =
    verifyResetMutation.isPending || verifyResetMutation.isLoading;

  // Resolve email from Redux and/or ?email= (prefer query when present for deterministic flow).
  useEffect(() => {
    const fromStore = resetEmail?.trim().toLowerCase() || "";
    const fromQuery = emailParam;
    const resolved = fromQuery || fromStore;

    if (resolved) {
      setEmail(resolved);
      if (fromQuery && fromStore !== fromQuery) {
        dispatch(setResetEmail(fromQuery));
      }
      return;
    }

    toast.error("Please request a password reset first.", {
      toastId: "verify-reset-otp-no-email",
    });
    router.replace("/forgot-password");
  }, [resetEmail, emailParam, router, dispatch]);

  // Navigate only after reset token is committed (avoids racing useAuthGuard / double client navigations)
  useEffect(() => {
    if (
      verificationStatus !== "success" ||
      !resetToken ||
      hasNavigatedToResetRef.current
    ) {
      return;
    }
    hasNavigatedToResetRef.current = true;
    router.replace("/reset-password");
  }, [verificationStatus, resetToken, router]);

  const getOtpString = () => otp.join("").replace(/\D/g, "");
  const isOtpComplete = () => getOtpString().length === 5;

  const handleVerifyOTP = async () => {
    const code = getOtpString();

    if (!email) {
      toast.error(
        "Email address missing. Please request a new password reset."
      );
      return;
    }
    if (code.length !== 5) {
      toast.error("OTP must be 5 digits.");
      return;
    }
    if (isVerifyingRef.current || verifying) return;
    isVerifyingRef.current = true;

    setVerificationStatus("idle");
    setErrorMessage("");

    try {
      const data = await verifyResetMutation.mutateAsync({
        email,
        otp: code,
      });
      dispatch(setResetToken(data?.resetToken || null));
      setVerificationStatus("success");
    } catch (error) {
      setVerificationStatus("error");
      setErrorMessage(
        error?.message || "Verification failed. Please try again."
      );
    } finally {
      isVerifyingRef.current = false;
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error(
        "Email address missing. Please request a new password reset."
      );
      return;
    }
    if (
      isResendingRef.current ||
      resendMutation.isPending ||
      resendMutation.isLoading
    )
      return;
    isResendingRef.current = true;

    setResendSuccess(false);

    try {
      await resendMutation.mutateAsync(email);
      setResendSuccess(true);
      setOtp(["", "", "", "", ""]);
      setVerificationStatus("idle");
      setErrorMessage("");
    } catch (error) {
      // errors handled by mutation toast
    } finally {
      isResendingRef.current = false;
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 4) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (
      e.key === "Enter" &&
      isOtpComplete() &&
      !verifying &&
      !isVerifyingRef.current
    ) {
      e.preventDefault();
      handleVerifyOTP();
    }
    if (e.key === "ArrowLeft" && index > 0)
      otpInputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 4)
      otpInputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 5);
    if (!pastedData) return;

    const newOtp = ["", "", "", "", ""];
    pastedData.split("").forEach((char, i) => {
      if (i < 5) newOtp[i] = char;
    });
    setOtp(newOtp);

    const nextEmpty = newOtp.findIndex((v) => !v);
    if (nextEmpty !== -1) {
      otpInputRefs.current[nextEmpty]?.focus();
    } else {
      otpInputRefs.current[4]?.focus();
    }
  };

  const getSubtitle = () => {
    if (verificationStatus === "success") {
      return "Redirecting to reset password page...";
    }
    if (verificationStatus === "error") {
      return errorMessage || "Please check your OTP and try again.";
    }
    // Email is shown in the card below — don’t repeat it in the subtitle.
    return "Please enter the 5-digit code we sent to your email.";
  };

  return (
    <AuthLayout>
      <div className="flex w-full min-h-0 flex-1 items-center bg-background px-5 py-4 sm:px-8 md:w-[48%] md:py-5 lg:px-12">
        <div className="mx-auto w-full max-w-[24rem] space-y-3">
          <AuthBrandLink />
          <Link
            href="/forgot-password"
            prefetch={false}
            className="inline-flex items-center gap-2 text-xs text-text-body hover:text-primary transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            Back to Forgot Password
          </Link>

          <AuthHeader
            title="Verify Reset Code"
            subtitle={getSubtitle()}
          />

        {email && (
          <div className="flex items-center gap-2 p-3 bg-background-light/50 rounded-md border border-border">
            <Mail className="text-primary" size={18} />
            <span className="text-sm text-text-heading">{email}</span>
          </div>
        )}

        {verificationStatus !== "success" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isOtpComplete() && !verifying && !isVerifyingRef.current) {
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
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={verifying}
                    className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
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

              {verificationStatus === "error" && errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <XCircle className="text-red-500" size={18} />
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!isOtpComplete() || verifying}
                className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {verifying ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Verify OTP"
                )}
              </motion.button>
            </form>

            <div className="text-center">
              <p className="text-sm text-text-body mb-2">
                Didn&apos;t receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={
                  resendMutation.isPending ||
                  resendMutation.isLoading ||
                  resendSuccess
                }
                className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendMutation.isPending || resendMutation.isLoading ? (
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

        {verificationStatus === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-md flex items-center justify-center"
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

        <div className="text-center text-sm text-text-body pt-2">
          Remember your password?{" "}
          <Link
            href="/log-in"
            prefetch={false}
            className="text-primary font-semibold hover:text-primary-dark hover:underline transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
        </div>
      </div>

      <AuthVisualSection variant="login" />
    </AuthLayout>
  );
}

export default function VerifyResetOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyResetOTPContent />
    </Suspense>
  );
}
