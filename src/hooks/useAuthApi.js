"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { clearInviteAttribution } from "@/lib/inviteAttributionStorage";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginSuccess, updateProfile } from "@/store/authSlice";
import { logoutAndClearAll } from "@/store/actions";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

const warmProfileInBackground = ({ token, dispatch }) => {
  if (!token) return;
  apiClient({
    url: API_ENDPOINTS.auth.profile,
    method: "GET",
    token,
  })
    .then((profileData) => {
      if (profileData?.user) {
        dispatch(updateProfile(profileData.user));
      }
    })
    .catch(() => {
      // non-fatal; guard/query retry paths handle this
    });
};

// ─── Signup ──────────────────────────────────────────────────────────────────
// POST /auth/signup
// Body: { email, password, first_name, last_name, role }
// Response: { success, message, verificationToken }
export function useSignup() {
  return useMutation({
    mutationFn: (payload) =>
      apiClient({
        url: API_ENDPOINTS.auth.signup,
        method: "POST",
        data: {
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email?.toLowerCase().trim(),
          password: payload.password,
          role: payload.role,
          invite_token: payload.invite_token || undefined,
        },
      }),
    onError: toastError,
  });
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
// POST /auth/verify-email
// Body: { otp }
// Header: Authorization: <verificationToken> (raw JWT, no Bearer prefix)
// Response: { success, message, token }  — token is the session JWT
export function useVerifyEmail() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ otp, verificationToken, invite_token }) =>
      apiClient({
        url: API_ENDPOINTS.auth.verifyEmail,
        method: "POST",
        data: {
          otp: String(otp).trim(),
          invite_token: invite_token || undefined,
        },
        token: verificationToken,
        rawToken: true,
      }),
    onSuccess: (data, variables) => {
      if (variables?.invite_token) {
        clearInviteAttribution();
      }
      if (data?.token) {
        // 1. Store the session token in Redux + localStorage (shared across tabs)
        dispatch(loginSuccess({ user: null, token: data.token }));

        // 2. Warm profile in background; do not block navigation on this request.
        apiClient({
          url: API_ENDPOINTS.auth.profile,
          method: "GET",
          token: data.token,
        })
          .then((profileData) => {
            if (profileData?.user) {
              dispatch(updateProfile(profileData.user));
            }
          })
          .catch(() => {
            // non-fatal; useAuthGuard/useProfileQuery will retry
          });

        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
      toast.success(data?.message || "Email verified successfully!");
    },
    onError: toastError,
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// Response: { success, token }  — no user object; profile fetched separately
export function useLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiClient({
        url: API_ENDPOINTS.auth.login,
        method: "POST",
        data: {
          email: payload.email?.toLowerCase().trim(),
          password: payload.password,
          invite_token: payload.invite_token || undefined,
        },
      }),
    onSuccess: (data, variables) => {
      const token = data.token || null;
      dispatch(loginSuccess({ user: null, token }));
      if (variables?.invite_token) {
        clearInviteAttribution();
      }

      // Warm profile in background; do not block navigation on this request.
      if (token) {
        apiClient({
          url: API_ENDPOINTS.auth.profile,
          method: "GET",
          token,
        })
          .then((profileData) => {
            if (profileData?.user) {
              dispatch(updateProfile(profileData.user));
            }
          })
          .catch(() => {
            // non-fatal; useAuthGuard/useProfileQuery will retry
          });
      }

      toast.success(data?.message || "Logged in successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Body: { email }
// Response: { success, message }
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email) =>
      apiClient({
        url: API_ENDPOINTS.auth.forgotPassword,
        method: "POST",
        data: { email: email.toLowerCase().trim() },
      }),
    onSuccess: (data) => {
      toast.dismiss("forgot-password-error");
      toast.success(
        data?.message ||
          "Password reset instructions have been sent to your email.",
        { toastId: "forgot-password-success" }
      );
    },
    onError: (error) => {
      toast.dismiss("forgot-password-success");
      const msg =
        error?.status === 404
          ? error?.message || "No account found with that email address."
          : error?.message || "Something went wrong. Please try again.";
      toast.error(msg, { toastId: "forgot-password-error" });
    },
  });
}

// ─── Verify Reset OTP ─────────────────────────────────────────────────────────
// POST /auth/verify-reset-otp
// Body: { email, otp }
// Response: { success, message, resetToken }
export function useVerifyResetOTP() {
  return useMutation({
    mutationFn: ({ email, otp }) =>
      apiClient({
        url: API_ENDPOINTS.auth.verifyResetOTP,
        method: "POST",
        data: { email: email.toLowerCase().trim(), otp: String(otp).trim() },
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "OTP verified successfully!", {
        toastId: "verify-reset-otp-success",
      });
    },
    onError: toastError,
  });
}

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /auth/reset-password
// Body: { newPassword }
// Header: Authorization: Bearer <resetToken>
// Response: { success, message }
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ newPassword, resetToken }) =>
      apiClient({
        url: API_ENDPOINTS.auth.resetPassword,
        method: "POST",
        data: { newPassword },
        token: resetToken,
        rawToken: true,
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Password reset successfully!", {
        toastId: "reset-password-success",
      });
    },
    onError: toastError,
  });
}

// ─── Change Password ──────────────────────────────────────────────────────────
// POST /auth/change-password
// Body: { currentPassword, newPassword }  (camelCase per backend Joi schema)
// Header: Authorization: Bearer <session token>
export function useChangePassword() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      apiClient({
        url: API_ENDPOINTS.auth.changePassword,
        method: "POST",
        data: { currentPassword, newPassword },
        token,
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Password updated successfully!");
    },
    onError: toastError,
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────
// GET /auth/profile
// Header: Authorization: Bearer <session token>
// Response: { success, user, professionalProfile }
export function useProfileQuery() {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();

  const query = useQuery({
    queryKey: ["profile"],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    queryFn: () =>
      apiClient({
        url: API_ENDPOINTS.auth.profile,
        method: "GET",
        token,
      }),
    onError: (error) => {
      toastError(error);
      const status = error?.status;
      // Only invalid/expired session should clear auth. 403 here would be unexpected for GET /auth/profile;
      // other features return 403 for role/rules and must not log the user out.
      if (status === 401) {
        dispatch(logoutAndClearAll());
      }
    },
  });

  // Keep Redux auth.user in sync so plan-based UI gates update immediately.
  useEffect(() => {
    if (query.data?.user) {
      dispatch(updateProfile(query.data.user));
    }
  }, [query.data, dispatch]);

  return query;
}

// ─── Google Auth (stubs — backend not yet implemented) ────────────────────────
export function useGoogleLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credential) =>
      apiClient({
        url: API_ENDPOINTS.auth.google,
        method: "POST",
        data: credential,
      }),
    onSuccess: (data, variables) => {
      const token = data.token || null;
      dispatch(loginSuccess({ user: null, token }));
      if (variables?.invite_token) {
        clearInviteAttribution();
      }
      warmProfileInBackground({ token, dispatch });
      toast.success(data?.message || "Logged in with Google!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

export function useGoogleSignup() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credential) =>
      apiClient({
        url: API_ENDPOINTS.auth.googleSignup,
        method: "POST",
        data: credential,
      }),
    onSuccess: (data, variables) => {
      const token = data.token || null;
      dispatch(loginSuccess({ user: null, token }));
      if (variables?.invite_token) {
        clearInviteAttribution();
      }
      warmProfileInBackground({ token, dispatch });
      toast.success(data?.message || "Signed up with Google!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

// ─── Resend Verification (stub — backend not yet implemented) ─────────────────
export function useResendVerification() {
  return useMutation({
    mutationFn: (input) => {
      const email =
        typeof input === "string"
          ? input
          : String(input?.email || "").trim();
      const verificationToken =
        typeof input === "object" ? input?.verificationToken || "" : "";
      return apiClient({
        url: API_ENDPOINTS.auth.resendVerification,
        method: "POST",
        data: {
          email: email.toLowerCase().trim(),
          verification_token: verificationToken || undefined,
        },
      });
    },
    onSuccess: (data) => {
      toast.success(
        data?.message || "Verification email sent. Please check your inbox."
      );
    },
    onError: toastError,
  });
}

// ─── Check Email (stub — backend not yet implemented) ────────────────────────
export function useCheckEmail() {
  return useMutation({
    mutationFn: (email) =>
      apiClient({
        url: API_ENDPOINTS.auth.checkEmail,
        method: "POST",
        data: { email: email.toLowerCase().trim() },
      }),
    onError: toastError,
  });
}

// ─── Public Profile (stub — backend not yet implemented) ─────────────────────
export function usePublicProfile(email) {
  const normalized = email?.toLowerCase().trim();
  return useQuery({
    queryKey: ["public-profile", normalized],
    enabled: Boolean(normalized),
    queryFn: () =>
      apiClient({
        url: `${API_ENDPOINTS.auth.publicProfile}?email=${encodeURIComponent(normalized)}`,
        method: "GET",
      }),
    onError: toastError,
  });
}
