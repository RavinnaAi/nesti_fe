"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Send, Smile, X } from "lucide-react";
import {
  formatBytes,
  isImageAttachment,
  prettyAttachmentName,
  safeUuid,
  validateProChatAttachmentLimits,
} from "@/components/prochat/thread/proChatThreadUtils";

export default function ThreadComposer({
  token,
  threadId,
  draft,
  setDraft,
  composerRef,
  fileInputRef,
  draftAttachments,
  setDraftAttachments,
  uploadingAttachments,
  setUploadingAttachments,
  onUploadAttachment,
  onSendMessage,
  onEmitTyping,
  typingTimeoutRef,
  lastTypingSentAt,
  autosizeComposer,
  toast,
  disabled = false,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPanelRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (!emojiOpen) return;
    const onPointerDown = (e) => {
      const target = e.target;
      if (emojiPanelRef.current?.contains(target) || emojiButtonRef.current?.contains(target)) return;
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [emojiOpen]);

  const insertEmoji = (emojiData) => {
    const emoji = String(emojiData?.emoji || "").trim();
    if (!emoji) return;
    const el = composerRef.current;
    const start = Number(el?.selectionStart ?? draft.length);
    const end = Number(el?.selectionEnd ?? draft.length);
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
    setDraft(next);
    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      el?.focus?.();
      try {
        el?.setSelectionRange?.(pos, pos);
      } catch {
        // ignore selection errors on unsupported inputs
      }
      autosizeComposer();
    });
  };

  return (
    <>
      {(draftAttachments.length > 0 || uploadingAttachments.length > 0) ? (
        <div className="mb-2 rounded-xl border border-border/70 bg-white/80 p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
            <span>Attachments</span>
            <span>{draftAttachments.length ? `${draftAttachments.length} selected` : ""}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {uploadingAttachments.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-medium text-text-heading shadow-sm"
              >
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="max-w-[220px] truncate">{u.name}</span>
              </span>
            ))}
            {draftAttachments.map((a, idx) => {
              const url = a?.secure_url || a?.url;
              const filename = prettyAttachmentName(a);
              const bytes = formatBytes(a?.bytes);
              return (
                <span
                  key={`${url || "att"}_${idx}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-medium text-text-heading shadow-sm"
                >
                  <span className="text-primary">
                    {isImageAttachment(a) ? <ImageIcon size={14} /> : <FileText size={14} />}
                  </span>
                  <span className="max-w-[220px] truncate">{filename}</span>
                  {bytes ? <span className="text-text-muted">{bytes}</span> : null}
                  <button
                    type="button"
                    onClick={() => setDraftAttachments((prev) => prev.filter((_, pIdx) => pIdx !== idx))}
                    className="grid h-5 w-5 place-items-center rounded-full text-text-muted hover:bg-background-light hover:text-text-heading"
                    aria-label="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="relative w-full">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          disabled={disabled}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            // allow re-selecting same file
            e.target.value = "";
            if (!token || !threadId) return;
            if (files.length < 1) return;
            for (const file of files) {
              const proposed = [
                ...draftAttachments,
                ...uploadingAttachments,
                { mime_type: file.type, filename: file.name },
              ];
              const limit = validateProChatAttachmentLimits(proposed);
              if (!limit.ok) {
                toast.error(limit.message);
                continue;
              }
              const id = safeUuid();
              setUploadingAttachments((prev) => [
                ...prev,
                { id, name: file.name, mime: file.type, bytes: file.size, status: "uploading" },
              ]);
              try {
                const resp = await onUploadAttachment({ token, id: threadId, file });
                const att = resp?.attachment;
                if (!att?.secure_url && !att?.url) {
                  throw new Error("Upload failed");
                }
                setDraftAttachments((prev) => [...prev, att]);
              } catch (err) {
                toast.error(err?.message || "Could not upload attachment");
              } finally {
                setUploadingAttachments((prev) => prev.filter((x) => x.id !== id));
              }
            }
          }}
        />
        <textarea
          ref={composerRef}
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            autosizeComposer();
            const now = Date.now();
            // throttle typing "true" to avoid spamming
            if (now - lastTypingSentAt.current > 700) {
              lastTypingSentAt.current = now;
              onEmitTyping(true);
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => onEmitTyping(false), 1100);
          }}
          rows={1}
          placeholder="Type a message…"
          className="min-h-[52px] w-full resize-none rounded-2xl border border-border bg-white py-[15px] pl-[6.25rem] pr-14 text-sm leading-[20px] text-text-heading shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSendMessage();
            }
          }}
        />
        <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <button
            type="button"
            className="pointer-events-auto grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white text-text-muted shadow-sm transition hover:bg-background-light hover:text-text-heading"
            onClick={() => !disabled && fileInputRef.current?.click?.()}
            disabled={disabled}
            aria-label="Add attachment"
          >
            <Paperclip size={16} />
          </button>
          <button
            ref={emojiButtonRef}
            type="button"
            className="pointer-events-auto grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white text-text-muted shadow-sm transition hover:bg-background-light hover:text-text-heading disabled:opacity-60"
            onClick={() => !disabled && setEmojiOpen((v) => !v)}
            disabled={disabled}
            aria-label="Add emoji"
            aria-expanded={emojiOpen}
          >
            <Smile size={16} />
          </button>
        </div>
        {emojiOpen ? (
          <div
            ref={emojiPanelRef}
            className="absolute bottom-[calc(100%+0.5rem)] left-3 z-50 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-2xl shadow-black/15"
          >
            <EmojiPicker
              onEmojiClick={insertEmoji}
              width={320}
              height={380}
              lazyLoadEmojis
              previewConfig={{ showPreview: false }}
            />
          </div>
        ) : null}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => void onSendMessage()}
            disabled={disabled || (!draft.trim() && draftAttachments.length < 1) || uploadingAttachments.length > 0}
            aria-label="Send message"
            className="pointer-events-auto grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
