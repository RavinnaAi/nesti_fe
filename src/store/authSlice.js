"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_auth_state";
const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2;

const emptyState = {
  user: null,
  token: null,
  resetEmail: null,
  resetOtp: null,
  expiresAt: null,
};

const loadState = () => {
  if (typeof window === "undefined") return emptyState;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyState;
    const parsed = JSON.parse(stored);
    if (parsed?.expiresAt && Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return emptyState;
    }
    return { ...emptyState, ...parsed };
  } catch (error) {
    console.error("Error reading auth state:", error);
    return emptyState;
  }
};

const initialState = {
  ...emptyState,
  ...loadState(),
};

const persistState = (state) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        token: state.token,
        resetEmail: state.resetEmail,
        resetOtp: state.resetOtp,
        expiresAt: state.expiresAt,
      })
    );
  } catch (error) {
    console.error("Error saving auth state:", error);
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user || null;
      state.token = action.payload.token || null;
      state.expiresAt = Date.now() + TWO_DAYS_MS;
      persistState(state);
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      persistState(state);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.resetEmail = null;
      state.resetOtp = null;
      state.expiresAt = null;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    },
    setResetEmail: (state, action) => {
      state.resetEmail = action.payload || null;
      persistState(state);
    },
    clearResetEmail: (state) => {
      state.resetEmail = null;
      persistState(state);
    },
    setResetOtp: (state, action) => {
      state.resetOtp = action.payload || null;
      persistState(state);
    },
    clearResetOtp: (state) => {
      state.resetOtp = null;
      persistState(state);
    },
  },
});

export const {
  loginSuccess,
  updateProfile,
  logout,
  setResetEmail,
  clearResetEmail,
  setResetOtp,
  clearResetOtp,
} = authSlice.actions;
export default authSlice.reducer;
