"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, X } from "lucide-react";
import {
  displayName,
  formatBytes,
  initialsFor,
  isImageAttachment,
  prettyAttachmentName,
} from "@/components/prochat/thread/proChatThreadUtils";

function forceAttachmentDownloadUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  // Cloudinary: force browser download via attachment header.
  if (raw.includes("/image/upload/")) {
    return raw.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  if (raw.includes("/raw/upload/")) {
    return raw.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }
  return raw;
}

function isEmojiOnlyMessage(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  const withoutEmoji = text.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]/gu, "");
  return withoutEmoji.length === 0;
}

function normalizeUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function splitMessageWithLinks(text) {
  const source = String(text || "");
  if (!source) return [];
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const chunks = [];
  let lastIdx = 0;
  let match;
  while ((match = urlRegex.exec(source)) !== null) {
    const start = match.index;
    const end = start + String(match[0]).length;
    if (start > lastIdx) {
      chunks.push({ type: "text", value: source.slice(lastIdx, start) });
    }
    chunks.push({ type: "link", value: String(match[0]) });
    lastIdx = end;
  }
  if (lastIdx < source.length) {
    chunks.push({ type: "text", value: source.slice(lastIdx) });
  }
  return chunks;
}

export default function ThreadMessagesList({
  messages,
  myUserId,
  isGroup,
  membersById,
  otherUser,
}) {
  const [previewSlider, setPreviewSlider] = useState(null);

  const closePreview = () => setPreviewSlider(null);
  const goPrev = () =>
    setPreviewSlider((prev) => {
      if (!prev || !Array.isArray(prev.items) || prev.items.length < 2) return prev;
      const nextIndex = (prev.index - 1 + prev.items.length) % prev.items.length;
      return { ...prev, index: nextIndex };
    });
  const goNext = () =>
    setPreviewSlider((prev) => {
      if (!prev || !Array.isArray(prev.items) || prev.items.length < 2) return prev;
      const nextIndex = (prev.index + 1) % prev.items.length;
      return { ...prev, index: nextIndex };
    });

  useEffect(() => {
    if (!previewSlider) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePreview();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewSlider]);

  const triggerDownload = async (url, filename = "attachment") => {
    const link = String(url || "").trim();
    if (!/^https?:\/\//i.test(link)) return;
    const a = document.createElement("a");
    a.href = link;
    a.download = filename || "attachment";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!messages.length) return null;

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        {messages.map((m) => {
          const mine = myUserId && String(m.sender_user_id) === String(myUserId);
          const senderForRow = mine
            ? null
            : m?.sender || membersById.get(String(m.sender_user_id)) || (isGroup ? null : otherUser);
          const attachments = Array.isArray(m?.attachments) ? m.attachments : [];
          const emojiOnly = isEmojiOnlyMessage(m?.body);
          const imageAtts = attachments.filter((a) => isImageAttachment(a));
          const docAtts = attachments.filter((a) => !isImageAttachment(a));
          const imageGridClass =
            imageAtts.length <= 1
              ? "grid-cols-1"
              : imageAtts.length === 2
                ? "grid-cols-2"
                : imageAtts.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-4";
          const imageItems = imageAtts
            .map((item) => {
              const itemUrl = item?.open_url || item?.secure_url || item?.url;
              if (!itemUrl) return null;
              return {
                url: itemUrl,
                downloadUrl: item?.download_url || forceAttachmentDownloadUrl(itemUrl),
                filename: prettyAttachmentName(item),
              };
            })
            .filter(Boolean);
          return (
            <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[min(760px,92%)] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine ? (
                  <div className="hidden shrink-0 sm:block">
                    {senderForRow?.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={senderForRow.profile_image}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white"
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.10] text-[10px] font-bold text-primary-dark shadow-sm ring-2 ring-white">
                        {initialsFor(senderForRow || { full_name: "Group" })}
                      </span>
                    )}
                  </div>
                ) : null}
                <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && isGroup ? (
                    <div className="mb-1 px-1 text-[11px] font-semibold text-text-muted">
                      {displayName(senderForRow)}
                    </div>
                  ) : null}
                  <div
                    className={`w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm shadow-sm ring-1 ${
                      mine
                        ? "bg-gradient-to-br from-primary to-primary-dark text-white ring-primary/20 rounded-br-md"
                        : "bg-white text-text-heading ring-border/70 rounded-bl-md"
                    }`}
                  >
                    {m.body ? (
                      <p
                        className={`whitespace-pre-wrap break-words leading-relaxed ${
                          emojiOnly ? "text-2xl leading-snug tracking-wide" : ""
                        }`}
                      >
                        {splitMessageWithLinks(m.body).map((part, idx) =>
                          part.type === "link" ? (
                            <a
                              key={`msg-link-${idx}`}
                              href={normalizeUrl(part.value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline underline-offset-2 break-all ${
                                mine ? "text-white hover:text-white/90" : "text-primary hover:text-primary-dark"
                              }`}
                            >
                              {part.value}
                            </a>
                          ) : (
                            <span key={`msg-text-${idx}`}>{part.value}</span>
                          )
                        )}
                      </p>
                    ) : null}
                    {attachments.length ? (
                      <div className={`${m.body ? "mt-2" : ""} flex flex-col gap-2`}>
                        {!m.body ? (
                          <div className={`text-[11px] font-semibold ${mine ? "text-white/90" : "text-text-muted"}`}>
                            {attachments.length === 1 ? "Attachment" : "Attachments"}
                          </div>
                        ) : null}
                        {imageAtts.length ? (
                          <div
                            className={`inline-grid gap-2 ${imageGridClass}`}
                          >
                            {imageAtts.map((a, idx) => {
                              const url = a?.open_url || a?.secure_url || a?.url;
                              if (!url) return null;
                              const filename = prettyAttachmentName(a);
                              return (
                                <button
                                  key={`${url}_${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setPreviewSlider((() => {
                                      const clickedIndex = imageItems.findIndex((item) => item.url === url);
                                      return {
                                        items: imageItems,
                                        index: clickedIndex >= 0 ? clickedIndex : 0,
                                      };
                                    })())
                                  }
                                  className={`group relative overflow-hidden rounded-xl ring-1 ${
                                    mine ? "ring-white/15" : "ring-border/70"
                                  } h-[96px] w-[96px] sm:h-[120px] sm:w-[120px]`}
                                  aria-label={`Preview ${filename}`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={filename} className="h-full w-full object-cover" />
                                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/40 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                    Preview
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        {docAtts.map((a, idx) => {
                          const url = a?.open_url || a?.secure_url || a?.url;
                          const downloadUrl = a?.download_url || forceAttachmentDownloadUrl(url);
                          const filename = prettyAttachmentName(a);
                          const bytes = formatBytes(a?.bytes);
                          if (!url) return null;
                          return (
                            <div
                              key={`${url}_${idx}`}
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ring-1 transition ${
                                mine
                                  ? "bg-white/15 ring-white/25 hover:bg-white/20"
                                  : "bg-background-light/70 ring-border/70 hover:bg-background-light"
                              }`}
                              role="button"
                              tabIndex={0}
                              onClick={() => void triggerDownload(downloadUrl, filename)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  void triggerDownload(downloadUrl, filename);
                                }
                              }}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`grid h-9 w-9 place-items-center rounded-lg ${
                                    mine ? "bg-white/10 text-white" : "bg-white text-primary"
                                  }`}
                                >
                                  <FileText size={16} />
                                </span>
                                <div className="min-w-0">
                                  <div
                                    className={`truncate text-[13px] font-semibold ${
                                      mine ? "text-white" : "text-text-heading"
                                    }`}
                                  >
                                    {filename}
                                  </div>
                                  <div className={`text-[11px] ${mine ? "text-white/80" : "text-text-muted"}`}>
                                    {bytes ||
                                      (String(a?.mime_type || "").toLowerCase() === "application/pdf"
                                        ? "PDF"
                                        : String(a?.mime_type || "").replace(/^application\//, "")) ||
                                      "Document"}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void triggerDownload(downloadUrl, filename);
                                }}
                                className={`${mine ? "text-white/90" : "text-text-muted"} rounded-md p-1 hover:bg-black/5`}
                                aria-label={`Download ${filename}`}
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-1 px-1 text-[10px] text-text-muted">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {previewSlider?.items?.length ? (
        <div
          className="fixed inset-y-0 left-0 right-0 z-[80] flex items-center justify-center bg-background-light/80 p-3 backdrop-blur-[1px] sm:p-6 lg:left-60"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePreview();
          }}
        >
          <div className="mx-auto flex h-[78vh] min-h-[420px] max-h-[760px] w-[min(1120px,96vw)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
              <div className="min-w-0 truncate text-xs font-semibold text-text-heading sm:text-sm">
                {previewSlider.items[previewSlider.index]?.filename || "Image preview"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void triggerDownload(
                      previewSlider.items[previewSlider.index]?.downloadUrl ||
                        previewSlider.items[previewSlider.index]?.url,
                      previewSlider.items[previewSlider.index]?.filename || "image"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-text-heading transition hover:bg-background-light"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold text-text-muted transition hover:bg-background-light hover:text-text-heading"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-background-light/70 p-2 sm:p-4">
              {previewSlider.items.length > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-white/95 p-2 text-text-heading shadow transition hover:bg-background-light"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSlider.items[previewSlider.index]?.url}
                alt={previewSlider.items[previewSlider.index]?.filename || "Image preview"}
                className="h-full w-full object-contain"
              />
              {previewSlider.items.length > 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-white/95 p-2 text-text-heading shadow transition hover:bg-background-light"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              ) : null}
              {previewSlider.items.length > 1 ? (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-white/95 px-2 py-1 text-[10px] font-semibold text-text-heading shadow-sm">
                  {previewSlider.index + 1} / {previewSlider.items.length}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
