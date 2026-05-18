"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nesti_prochat_unread";

function readPersisted() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(next) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next || {}));
  } catch {
    // ignore
  }
}

const initialState = {
  unreadByThread: readPersisted(), // { [threadId]: number }
};

const proChatSlice = createSlice({
  name: "proChat",
  initialState,
  reducers: {
    incrementUnread: (state, action) => {
      const threadId = String(action.payload?.threadId || "").trim();
      if (!threadId) return;
      const current = Number(state.unreadByThread?.[threadId] || 0);
      const next = { ...(state.unreadByThread || {}), [threadId]: Math.min(current + 1, 999) };
      state.unreadByThread = next;
      persist(next);
    },
    clearUnread: (state, action) => {
      const threadId = String(action.payload?.threadId || "").trim();
      if (!threadId) return;
      const next = { ...(state.unreadByThread || {}) };
      delete next[threadId];
      state.unreadByThread = next;
      persist(next);
    },
    clearAllUnread: (state) => {
      state.unreadByThread = {};
      persist({});
    },
    hydrateUnread: (state) => {
      state.unreadByThread = readPersisted();
    },
    pruneUnread: (state, action) => {
      const ids = Array.isArray(action.payload?.threadIds) ? action.payload.threadIds : [];
      const valid = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
      if (valid.size === 0) return;
      const current = state.unreadByThread || {};
      const next = {};
      let changed = false;
      for (const [key, value] of Object.entries(current)) {
        if (!valid.has(String(key))) {
          changed = true;
          continue;
        }
        const n = Number(value || 0);
        if (!Number.isFinite(n) || n <= 0) {
          changed = true;
          continue;
        }
        next[key] = Math.min(Math.floor(n), 999);
      }
      if (!changed) return;
      state.unreadByThread = next;
      persist(next);
    },
  },
});

export const { incrementUnread, clearUnread, clearAllUnread, hydrateUnread, pruneUnread } = proChatSlice.actions;
export default proChatSlice.reducer;

