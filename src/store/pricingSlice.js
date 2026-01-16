"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_pricing_state";

const loadState = () => {
  if (typeof window === "undefined") return { plans: [] };
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return { plans: [] };
    const parsed = JSON.parse(stored);
    return { plans: Array.isArray(parsed?.plans) ? parsed.plans : [] };
  } catch (error) {
    console.error("Error reading pricing state:", error);
    return { plans: [] };
  }
};

const persistState = (state) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ plans: state.plans }));
  } catch (error) {
    console.error("Error saving pricing state:", error);
  }
};

const pricingSlice = createSlice({
  name: "pricing",
  initialState: {
    plans: [],
    ...loadState(),
  },
  reducers: {
    setPlans: (state, action) => {
      state.plans = Array.isArray(action.payload) ? action.payload : [];
      persistState(state);
    },
  },
});

export const { setPlans } = pricingSlice.actions;
export default pricingSlice.reducer;
