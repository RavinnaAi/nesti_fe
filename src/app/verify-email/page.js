"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Loader2,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthBrandLink from "@/components/auth/AuthBrandLink";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthVisualSection from "@/components/auth/AuthVisualSection";
import { useSignupFlow } from "@/hooks/useSignupFlow";
import { useVerifyEmail, useResendVerification } from "@/hooks/useAuthApi";
import { useAppSelector } from "@/store";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState(
    "idle" // "idle" | "success" | "error"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [email, setEmail] = useState("");

  const otpInputRefs = useRef([]);
  const isVerifyingRef = useRef(false); // prevents duplicate submissions
  const {
    getEmail,
    getVerificationToken,
    getInviteToken,
    saveSignupData,
    clearSignupData,
  } = useSignupFlow();
  const verifyEmailMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  const verifying = verifyEmailMutation.isPending || verifyEmailMutation.isLoading;
  const token = useAppSelector((state) => state.auth.token);

  // Once token lands in Redux (set by useVerifyEmail onSuccess), navigate to dashboard
  useEffect(() => {
    if (token && verificationStatus === "success") {
      router.push("/dashboard");
    }
  }, [token, verificationStatus, router]);

  useEffect(() => {
    const storedEmail = getEmail();
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/sign-up");
    }
  }, [getEmail, router]);

  const getOtpString = () => otp.join("").replace(/\D/g, "");
  const isOtpComplete = () => getOtpString().length === 5;

  const handleVerifyOTP = async () => {
    // Guard against duplicate calls (blur + form submit firing together)
    if (isVerifyingRef.current) return;

    const code = getOtpString();

    if (!email) {
      toast.error("Email address missing. Please sign up again.");
      return;
    }
    if (code.length !== 5) {
      toast.error("OTP must be 5 digits.");
      return;
    }

    isVerifyingRef.current = true;
    setVerificationStatus("idle");
    setErrorMessage("");

    try {
      const verificationToken = getVerificationToken();
      await verifyEmailMutation.mutateAsync({
        otp: code,
        verificationToken,
        invite_token: getInviteToken() || undefined,
      });
      clearSignupData();
      setVerificationStatus("success"); // triggers the useEffect above to navigate
    } catch (error) {
      const msg = error?.message || "Verification failed. Please try again.";
      // If already verified (duplicate key), treat as success and send to login
      if (msg.toLowerCase().includes("already verified")) {
        toast.info("Account already verified. Please log in.");
        clearSignupData();
        router.push("/log-in");
        return;
      }
      setVerificationStatus("error");
      setErrorMessage(msg);
    } finally {
      isVerifyingRef.current = false;
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
      return;
    }

    setResendSuccess(false);
    try {
      const verificationToken = getVerificationToken();
      const data = await resendMutation.mutateAsync({
        email,
        verificationToken,
      });
      if (data?.verificationToken) {
        saveSignupData({
          email,
          verificationToken: data.verificationToken,
          inviteToken: getInviteToken() || null,
        });
      }
      setResendSuccess(true);
    } catch (error) {
      // errors handled via mutation toast
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 4) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPBlur = (index) => {
    // Only trigger on the last digit, only when complete, never if already in-flight
    if (index === 4 && isOtpComplete() && !verifying && !isVerifyingRef.current) {
      handleVerifyOTP();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    // Backspace on empty -> go back
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    // Enter from any input -> submit if OTP is complete
    if (e.key === "Enter" && isOtpComplete() && !verifying && !isVerifyingRef.current) {
      e.preventDefault();
      handleVerifyOTP();
    }
    // Arrow navigation
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

    // Focus last or next empty
    const nextEmpty = newOtp.findIndex((v) => !v);
    if (nextEmpty !== -1) {
      otpInputRefs.current[nextEmpty]?.focus();
    } else {
      // If all digits are filled, focus the last input
      otpInputRefs.current[4]?.focus();
    }
  };

  return (
    <AuthLayout>
      <div className="flex w-full min-h-0 flex-1 items-center bg-background px-5 py-4 sm:px-8 md:w-[48%] md:py-5 lg:px-12">
        <div className="mx-auto w-full max-w-[24rem] space-y-3">
          <AuthBrandLink />
          <AuthHeader
            title="Verify Your Email"
            subtitle="Please enter the 5-digit code we sent to your email."
          />

          <div className="space-y-4">
          {/* OTP Form */}
          {verificationStatus === "idle" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isOtpComplete() && !verifying) {
                  handleVerifyOTP();
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-heading">
                  Enter Verification Code
                </label>
                <p className="text-xs text-text-body mb-4">
                  We sent a 5-digit code to {email || "your email"}.
                </p>

                <div
                  className="flex gap-3 justify-center"
                  onPaste={handlePaste}
                >
                  {[0, 1, 2, 3, 4].map((index) => (
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
                      value={otp[index] || ""}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onBlur={() => handleOTPBlur(index)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-border rounded-md text-center text-2xl font-semibold text-text-heading transition-all duration-200 hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none bg-background-light/50 hover:bg-white"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={verifying || !isOtpComplete()}
                className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {verifying ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Verify Email"
                )}
              </motion.button>

              <p className="text-center text-sm text-text-body">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendMutation.isLoading}
                  className="text-primary font-semibold hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200 disabled:opacity-50"
                >
                  {resendMutation.isLoading ? "Sending..." : "Resend"}
                </button>
              </p>
            </form>
          )}

          {/* Success */}
          {verificationStatus === "success" && (
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
                  Your email has been successfully verified! Redirecting to your dashboard...
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard")}
                className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
              >
                Go to Dashboard
              </motion.button>
            </div>
          )}

          {/* Error */}
          {verificationStatus === "error" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-red-500"
                >
                  <XCircle size={80} />
                </motion.div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 text-center">
                  {errorMessage ||
                    "We couldn't verify your email. The code may have expired or is invalid."}
                </p>
              </div>

              {!resendSuccess ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={resendMutation.isLoading}
                    onClick={handleResendVerification}
                    className="h-14 w-full bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {resendMutation.isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      "Resend Verification Email"
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/sign-up")}
                    className="h-14 w-full bg-background border-2 border-border rounded-md flex justify-center items-center cursor-pointer hover:border-primary hover:shadow-lg hover:bg-background-light/50 transition-all duration-300"
                  >
                    <span className="text-sm font-semibold text-text-heading">
                      Back to Sign Up
                    </span>
                  </motion.button>
                </>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail size={20} className="text-green-700" />
                    <p className="text-sm text-green-700 font-semibold">
                      Email Sent!
                    </p>
                  </div>
                  <p className="text-xs text-green-600 text-center">
                    Please check your inbox and enter the new code.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Links */}
        {verificationStatus !== "idle" && (
          <div className="text-center text-sm text-text-body pt-4 space-y-2">
            {verificationStatus === "success" ? (
              <p>
                Already logged in?{" "}
                <Link
                  href="/dashboard/feed"
                  className="text-primary font-semibold hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              </p>
            ) : (
              <p>
                Need help?{" "}
                <Link
                  href="/contact"
                  className="text-primary font-semibold hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200"
                >
                  Contact Support
                </Link>
              </p>
            )}
          </div>
        )}
        </div>
      </div>

      <AuthVisualSection variant="signup" />
    </AuthLayout>
  );
}
