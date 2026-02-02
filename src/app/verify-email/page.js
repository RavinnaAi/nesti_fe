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
  Home,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import { useSignupFlow } from "@/hooks/useSignupFlow";
import { useVerifyEmail, useResendVerification } from "@/hooks/useAuthApi";

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
  const { getEmail, clearSignupData } = useSignupFlow();
  const verifyEmailMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  const verifying = verifyEmailMutation.isLoading;

  useEffect(() => {
    const storedEmail = getEmail();
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect to signup
      // toast.error("Please sign up first.");
      router.push("/sign-up");
    }
  }, [getEmail, router]);

  const getOtpString = () => otp.join("").replace(/\D/g, "");
  const isOtpComplete = () => getOtpString().length === 5;

  const handleVerifyOTP = async () => {
    const code = getOtpString();

    if (!email) {
      toast.error("Email address missing. Please sign up again.");
      return;
    }
    if (code.length !== 5) {
      toast.error("OTP must be 5 digits.");
      return;
    }

    setVerificationStatus("idle");
    setErrorMessage("");

    try {
      await verifyEmailMutation.mutateAsync({
        email,
        token: code,
      });
      setVerificationStatus("success");
      // Clear signup data after successful verification
      clearSignupData();

      // Redirect to login after a moment
      router.push("/log-in");
    } catch (error) {
      setVerificationStatus("error");
      setErrorMessage(
        error?.message || "Verification failed. Please try again."
      );
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
      return;
    }

    setResendSuccess(false);
    try {
      await resendMutation.mutateAsync(email);
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
    // Only verify if it's the last input (index 4) and all OTP digits are complete
    if (index === 4 && isOtpComplete() && !verifying) {
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
      {/* Left - Form Section */}
      <div className="w-full md:w-[45%] px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 space-y-6 bg-background">
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
                  Your email has been successfully verified! You can now log in
                  to your account.
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

      {/* Right - Visual Section */}
      <div className="w-full md:w-[55%] relative bg-gradient-to-br from-primary-light/20 via-primary/10 to-primary-dark/20 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-md blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-dark/15 rounded-md blur-3xl"
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
              Your Dream Home
              <br />
              <span className="text-primary">Awaits</span>
            </h2>
            <p className="text-text-body text-base md:text-lg max-w-md mx-auto">
              Join thousands of users finding their perfect property
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-6 md:gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <Home className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Find Homes
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <TrendingUp className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Track Market
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <Shield className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Secure Deals
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 md:gap-8 w-full max-w-lg"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                50K+
              </div>
              <div className="text-xs md:text-sm text-text-body">
                Properties
              </div>
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
            className="absolute top-20 right-10 w-20 h-20 bg-background/40 backdrop-blur-sm rounded-md shadow-lg hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-10 w-16 h-16 bg-background/40 backdrop-blur-sm rounded-md shadow-lg hidden lg:block"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
