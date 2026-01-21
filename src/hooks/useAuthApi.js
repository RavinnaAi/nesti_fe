"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginSuccess, updateProfile } from "@/store/authSlice";
import { logoutAndClearAll } from "@/store/actions";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

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

export function useSignup() {
  return useMutation({
    mutationFn: (payload) =>
      apiClient({
        url: API_ENDPOINTS.auth.signup,
        method: "POST",
        data: {
          ...payload,
          email: payload.email?.toLowerCase().trim(),
        },
      }),
    onError: toastError,
  });
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiClient({
        url: API_ENDPOINTS.auth.login,
        method: "POST",
        data: {
          ...payload,
          email: payload.email?.toLowerCase().trim(),
        },
      }),
    onSuccess: (data) => {
      dispatch(
        loginSuccess({
          user: data.user || data.data || null,
          token: data.token || data.accessToken || data.data?.token || null,
        })
      );
      toast.success(data?.message || "Logged in successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

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
    onSuccess: (data) => {
      dispatch(
        loginSuccess({
          user: data.user || data.data || null,
          token: data.token || data.accessToken || data.data?.token || null,
        })
      );
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
    onSuccess: (data) => {
      dispatch(
        loginSuccess({
          user: data.user || data.data || null,
          token: data.token || data.accessToken || data.data?.token || null,
        })
      );
      toast.success(data?.message || "Signed up with Google!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: toastError,
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email) =>
      apiClient({
        url: API_ENDPOINTS.auth.resendVerification,
        method: "POST",
        data: { email: email.toLowerCase().trim() },
      }),
    onSuccess: (data) => {
      toast.success(
        data?.message || "Verification email sent. Please check your inbox."
      );
    },
    onError: toastError,
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: ({ email, token }) =>
      apiClient({
        url: API_ENDPOINTS.auth.verifyEmail,
        method: "POST",
        data: { email: email.toLowerCase().trim(), token: token.trim() },
      }),
    onSuccess: (data) => {
      toast.success(
        data?.message || "Email verified successfully. You can now log in."
      );
    },
    onError: toastError,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email) =>
      apiClient({
        url: API_ENDPOINTS.auth.forgotPassword,
        method: "POST",
        data: { email: email.toLowerCase().trim() },
      }),
    onSuccess: (data) => {
      toast.success(
        data?.message ||
          "Password reset instructions have been sent to your email."
      );
    },
    onError: toastError,
  });
}

export function useVerifyResetOTP() {
  return useMutation({
    mutationFn: ({ email, otp }) =>
      apiClient({
        url: API_ENDPOINTS.auth.verifyResetOTP,
        method: "POST",
        data: { email: email.toLowerCase().trim(), otp: otp.trim() },
      }),
    onSuccess: (data) => {
      toast.success(
        data?.message || "OTP verified successfully! Redirecting to reset..."
      );
    },
    onError: toastError,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email, otp, newPassword }) =>
      apiClient({
        url: API_ENDPOINTS.auth.resetPassword,
        method: "POST",
        data: {
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword,
        },
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Password reset successfully!");
    },
    onError: toastError,
  });
}

export function useChangePassword() {
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      apiClient({
        url: "/auth/change-password",
        method: "POST",
        data: {
          current_password: currentPassword,
          new_password: newPassword,
        },
        token,
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Password updated successfully!");
    },
    onError: toastError,
  });
}

export function useProfileQuery() {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ["profile"],
    enabled: Boolean(token),
    queryFn: () =>
      apiClient({
        url: API_ENDPOINTS.auth.profile,
        method: "GET",
        token,
      }),
    onSuccess: (data) => {
      if (data?.user || data?.data) {
        dispatch(updateProfile(data.user || data.data));
      }
    },
    onError: (error) => {
      toastError(error);
      // optional auto logout on unauthorized
      if (error?.message?.toLowerCase().includes("unauthorized")) {
        dispatch(logoutAndClearAll());
      }
    },
  });
}

export function usePublicProfile(email) {
  const normalized = email?.toLowerCase().trim();
  return useQuery({
    queryKey: ["public-profile", normalized],
    enabled: Boolean(normalized),
    queryFn: () =>
      apiClient({
        url: `${API_ENDPOINTS.auth.publicProfile}?email=${encodeURIComponent(
          normalized
        )}`,
        method: "GET",
      }),
    onError: toastError,
  });
}
