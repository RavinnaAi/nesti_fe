"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_selected_plan_state";

const loadState = () => {
  if (typeof window === "undefined") return { plan: null };
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return { plan: null };
    const parsed = JSON.parse(stored);
    return { plan: parsed?.plan || null };
  } catch (error) {
    console.error("Error reading selected plan state:", error);
    return { plan: null };
  }
};

const persistState = (state) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: state.plan }));
  } catch (error) {
    console.error("Error saving selected plan state:", error);
  }
};

const selectedPlanSlice = createSlice({
  name: "selectedPlan",
  initialState: {
    plan: null,
    ...loadState(),
  },
  reducers: {
    setSelectedPlan: (state, action) => {
      state.plan = action.payload || null;
      persistState(state);
    },
    clearSelectedPlan: (state) => {
      state.plan = null;
      persistState(state);
    },
  },
});

export const { setSelectedPlan, clearSelectedPlan } = selectedPlanSlice.actions;
export default selectedPlanSlice.reducer;
