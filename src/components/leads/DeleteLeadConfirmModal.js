"use client";

import { Trash2 } from "lucide-react";

const DEFAULT_DESCRIPTION =
  "This will delete the lead, related conversation, and associated profile data when applicable. This action cannot be undone.";

export default function DeleteLeadConfirmModal({
  open,
  onCancel,
  onConfirm,
  isPending,
  description,
  title = "Delete lead?",
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
}) {
  if (!open) return null;

  const bodyText = description != null && String(description).trim() !== "" ? description : DEFAULT_DESCRIPTION;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-2xl p-5">
        <h3 className="text-base font-semibold text-text-heading">{title}</h3>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {bodyText}
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-2 text-xs font-semibold text-text-heading border border-border rounded-md hover:bg-background-light transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
