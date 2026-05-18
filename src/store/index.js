"use client";

import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import pricingReducer from "./pricingSlice";
import selectedPlanReducer from "./selectedPlanSlice";
import proChatReducer from "./proChatSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      pricing: pricingReducer,
      selectedPlan: selectedPlanReducer,
      proChat: proChatReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });

export const store = makeStore();

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
