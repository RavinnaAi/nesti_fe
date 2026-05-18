"use client";

export const PROCHAT_ATTACHMENT_LIMITS = {
  images: 10,
  documents: 10,
};

export function displayName(u) {
  if (!u) return "Professional";
  const full = String(u.full_name || "").trim();
  if (full) return full;
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "Professional";
}

export function initialsFor(u) {
  const name = displayName(u);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";
}

export function displayRole(u) {
  const raw = String(u?.role || "").trim();
  if (!raw) return "Professional";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function safeUuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let v = n;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function isImageAttachment(a) {
  const mime = String(a?.mime_type || "").toLowerCase();
  // If backend provides a mime_type, trust it.
  // Cloudinary may return PDFs under resource_type "image" (and /image/upload URLs),
  // but PDFs should render as document chips (not <img> previews).
  if (mime) return mime.startsWith("image/");
  const rt = String(a?.resource_type || "").toLowerCase();
  if (rt === "image") return true;
  const url = String(a?.secure_url || a?.url || "").toLowerCase();
  return url.includes("/image/upload/");
}

export function countProChatAttachmentTypes(attachments) {
  return (Array.isArray(attachments) ? attachments : []).reduce(
    (acc, att) => {
      if (isImageAttachment(att)) acc.images += 1;
      else acc.documents += 1;
      return acc;
    },
    { images: 0, documents: 0 }
  );
}

export function validateProChatAttachmentLimits(attachments) {
  const counts = countProChatAttachmentTypes(attachments);
  if (counts.images > PROCHAT_ATTACHMENT_LIMITS.images) {
    return {
      ok: false,
      message: `You can attach up to ${PROCHAT_ATTACHMENT_LIMITS.images} images per message.`,
    };
  }
  if (counts.documents > PROCHAT_ATTACHMENT_LIMITS.documents) {
    return {
      ok: false,
      message: `You can attach up to ${PROCHAT_ATTACHMENT_LIMITS.documents} PDFs/documents per message.`,
    };
  }
  return { ok: true, counts };
}

export function prettyAttachmentName(a) {
  const mime = String(a?.mime_type || "").toLowerCase();
  const url = String(a?.secure_url || a?.url || "");
  const raw =
    String(a?.filename || "").trim() ||
    String(a?.original_filename || "").trim() ||
    (isImageAttachment(a) ? "Image" : "Attachment");
  const looksPdf =
    mime === "application/pdf" || raw.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf");
  if (looksPdf && !raw.toLowerCase().endsWith(".pdf")) return `${raw}.pdf`;
  return raw;
}
