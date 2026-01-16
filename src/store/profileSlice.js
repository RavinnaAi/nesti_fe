"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_profile_state";

const loadState = () => {
  if (typeof window === "undefined")
    return { personalInfo: null, businessInfo: null };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading profile state:", error);
  }
  return { personalInfo: null, businessInfo: null };
};

const initialState = {
  personalInfo: null,
  businessInfo: null,
  ...loadState(),
};

const persistState = (state) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        personalInfo: state.personalInfo,
        businessInfo: state.businessInfo,
      })
    );
  } catch (error) {
    console.error("Error saving profile state:", error);
  }
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setPersonalInfo: (state, action) => {
      state.personalInfo = { ...(state.personalInfo || {}), ...action.payload };
      persistState(state);
    },
    setBusinessInfo: (state, action) => {
      state.businessInfo = { ...(state.businessInfo || {}), ...action.payload };
      persistState(state);
    },
    clearProfile: (state) => {
      state.personalInfo = null;
      state.businessInfo = null;
      persistState(state);
    },
  },
});

export const { setPersonalInfo, setBusinessInfo, clearProfile } =
  profileSlice.actions;
export default profileSlice.reducer;
