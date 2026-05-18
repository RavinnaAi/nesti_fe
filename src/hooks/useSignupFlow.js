"use client";

import { useState, useEffect } from "react";

const SIGNUP_DATA_KEY = "nesti_signup_data";

export function useSignupFlow() {
  const [signupData, setSignupData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SIGNUP_DATA_KEY);
        if (stored) {
          setSignupData(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error reading signup data:", error);
      }
    }
  }, []);

  const saveSignupData = (data) => {
    try {
      const dataToStore = {
        email: data.email?.toLowerCase().trim(),
        verificationToken: data.verificationToken || null,
        inviteToken: data.inviteToken || null,
        timestamp: Date.now(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(SIGNUP_DATA_KEY, JSON.stringify(dataToStore));
        setSignupData(dataToStore);
      }
    } catch (error) {
      console.error("Error saving signup data:", error);
    }
  };

  const getEmail = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(SIGNUP_DATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.email || null;
      }
    } catch (error) {
      console.error("Error reading email:", error);
    }
    return null;
  };

  const getVerificationToken = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(SIGNUP_DATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.verificationToken || null;
      }
    } catch (error) {
      console.error("Error reading verificationToken:", error);
    }
    return null;
  };

  const getInviteToken = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(SIGNUP_DATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.inviteToken || null;
      }
    } catch (error) {
      console.error("Error reading inviteToken:", error);
    }
    return null;
  };

  const clearSignupData = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(SIGNUP_DATA_KEY);
        setSignupData(null);
      }
    } catch (error) {
      console.error("Error clearing signup data:", error);
    }
  };

  return {
    signupData,
    saveSignupData,
    getEmail,
    getVerificationToken,
    getInviteToken,
    clearSignupData,
  };
}
