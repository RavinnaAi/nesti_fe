"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPersonalInfo, setBusinessInfo } from "@/store/profileSlice";

const PERSONAL_ENDPOINT = "/api/professionals";
const BUSINESS_ENDPOINT = "/api/professionals";

const toastError = (error) =>
  toast.error(error?.message || "Something went wrong. Please try again.");

export function useSavePersonalInfo() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: PERSONAL_ENDPOINT,
        method: "POST",
        data: payload,
        token,
      });
    },
    onSuccess: (data, variables) => {
      dispatch(setPersonalInfo(variables));
      toast.success(data?.message || "Profile updated successfully");
    },
    onError: toastError,
  });
}

export function useSaveBusinessInfo() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  return useMutation({
    mutationFn: (payload) => {
      if (!token) throw new Error("missing or invalid Authorization header");
      return apiClient({
        url: BUSINESS_ENDPOINT,
        method: "PUT",
        data: payload,
        token,
      });
    },
    onSuccess: (data, variables) => {
      dispatch(setBusinessInfo(variables));
      toast.success(data?.message || "Business info updated successfully");
    },
    onError: toastError,
  });
}
