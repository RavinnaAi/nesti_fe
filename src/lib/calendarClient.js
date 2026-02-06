"use client";

import { apiClient, API_ENDPOINTS } from "@/lib/api";

const AUTH_STORAGE_KEY = "nesti_auth_state";

const getStoredAuthToken = () => {
    if (typeof window === "undefined") return "";
    try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        // Alternatively check localStorage if sessionStorage is empty, or use the one from redux persistence if available
        // But adhering to chatClient pattern:
        if (!stored) return "";
        const parsed = JSON.parse(stored);
        return parsed?.token || "";
    } catch (_err) {
        return "";
    }
};

export async function connectCalendar(provider, token) {
    const authToken = token || getStoredAuthToken();
    return apiClient({
        url: API_ENDPOINTS.calendar.connect(provider),
        method: "GET",
        token: authToken,
    });
}

export async function fetchCalendarStatus(token) {
    const authToken = token || getStoredAuthToken();
    return apiClient({
        url: API_ENDPOINTS.calendar.status,
        method: "GET",
        token: authToken,
    });
}

export async function disconnectCalendar(provider, token) {
    const authToken = token || getStoredAuthToken();
    return apiClient({
        url: API_ENDPOINTS.calendar.disconnect(provider),
        method: "DELETE",
        token: authToken,
    });
}

export async function fetchBookings(token) {
    const authToken = token || getStoredAuthToken();
    return apiClient({
        url: API_ENDPOINTS.calendar.bookings,
        method: "GET",
        token: authToken,
    });
}
