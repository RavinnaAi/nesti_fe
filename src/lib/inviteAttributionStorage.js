"use client";

const INVITE_ATTR_KEY = "nesti_invite_attribution";
const INVITE_SESSION_KEY = "nesti_invite_session_id";
const INVITE_VISITOR_KEY = "nesti_invite_visitor_id";

function nowMs() {
  return Date.now();
}

export function generateInviteId(prefix) {
  return `${prefix}_${nowMs()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateInviteSessionId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(INVITE_SESSION_KEY);
  if (existing) return existing;
  const next = generateInviteId("is");
  localStorage.setItem(INVITE_SESSION_KEY, next);
  return next;
}

export function getOrCreateInviteVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(INVITE_VISITOR_KEY);
  if (existing) return existing;
  const next = generateInviteId("iv");
  localStorage.setItem(INVITE_VISITOR_KEY, next);
  return next;
}

export function saveInviteAttribution(token, extras = {}) {
  if (typeof window === "undefined") return;
  const clean = String(token || "").trim();
  if (!clean) return;
  const payload = {
    token: clean,
    capturedAt: nowMs(),
    sourceChannel: extras.sourceChannel || "direct",
    landingPath: extras.landingPath || "",
    expiresAt: extras.expiresAt || nowMs() + 90 * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(INVITE_ATTR_KEY, JSON.stringify(payload));
}

export function getInviteAttribution() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INVITE_ATTR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    const exp = Number(parsed.expiresAt || 0);
    if (exp > 0 && exp < nowMs()) {
      localStorage.removeItem(INVITE_ATTR_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearInviteAttribution() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INVITE_ATTR_KEY);
}
