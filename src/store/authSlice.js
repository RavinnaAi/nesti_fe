"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_auth_state";
const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2;

/**
 * Auth is persisted in localStorage (not sessionStorage) so new tabs opened from links
 * (e.g. target="_blank") share the same session. sessionStorage is per-tab only.
 */
function readRawPersistedAuth() {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    return raw;
  } catch {
    return null;
  }
}

const emptyState = {
  user: null,
  token: null,
  resetEmail: null,
  resetToken: null,
  expiresAt: null,
};

const loadState = () => {
  if (typeof window === "undefined") return emptyState;
  try {
    const stored = readRawPersistedAuth();
    if (!stored) return emptyState;
    const parsed = JSON.parse(stored);
    if (parsed?.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
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
    const payload = JSON.stringify({
      user: state.user,
      token: state.token,
      resetEmail: state.resetEmail,
      resetToken: state.resetToken,
      expiresAt: state.expiresAt,
    });
    localStorage.setItem(STORAGE_KEY, payload);
    sessionStorage.removeItem(STORAGE_KEY);
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
      state.resetToken = null;
      state.expiresAt = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
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
    setResetToken: (state, action) => {
      state.resetToken = action.payload || null;
      persistState(state);
    },
    clearResetToken: (state) => {
      state.resetToken = null;
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
  setResetToken,
  clearResetToken,
} = authSlice.actions;
export default authSlice.reducer;
