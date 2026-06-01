"use client";

import { uploadSellerPropertyImages } from "@/lib/chatClient";

const DEFAULT_MESSAGES = {
  missingImages: "Please upload at least one property image to create a seller lead.",
  missingSession: "Missing chatbot session.",
  emptyUpload: "Please upload at least one property image to create a seller lead.",
  uploadFailed: "Property images could not be uploaded. Please try again.",
};

/**
 * Reuse the existing chat uploader for agent seller-intent submissions.
 * Returns untouched formContact for non-seller intents.
 */
export async function attachSellerImagesToAgentFormContact({
  intent,
  formContact,
  embedToken,
  sessionId,
  propertyImageFiles,
  messages = {},
}) {
  if (intent !== "sell") {
    return { formContact, uploadedImages: [] };
  }

  const msg = { ...DEFAULT_MESSAGES, ...(messages || {}) };
  const files = Array.from(propertyImageFiles || [])
    .filter(Boolean)
    .slice(0, 8);

  if (!files.length) {
    throw new Error(msg.missingImages);
  }
  if (!String(embedToken || "").trim() || !String(sessionId || "").trim()) {
    throw new Error(msg.missingSession);
  }

  let uploaded = null;
  try {
    uploaded = await uploadSellerPropertyImages({
      embedToken,
      sessionId,
      files,
    });
  } catch (error) {
    throw new Error(error?.message || msg.uploadFailed);
  }

  const uploadedImages = Array.isArray(uploaded?.images) ? uploaded.images : [];
  if (!uploadedImages.length) {
    throw new Error(msg.emptyUpload);
  }

  return {
    formContact: {
      ...(formContact || {}),
      property_images: uploadedImages,
    },
    uploadedImages,
  };
}
