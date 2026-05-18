"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Plus, Trash2, Users, X } from "lucide-react";
import { displayName, initialsFor } from "@/components/prochat/thread/proChatThreadUtils";

export default function GroupSettingsModal({
  open,
  isGroup,
  isGroupCreator,
  saving,
  titleDraft,
  setTitleDraft,
  settingsTab,
  setSettingsTab,
  memberSearch,
  setMemberSearch,
  profQuery,
  profItems,
  selectedAdd,
  selectedAddIds,
  participantIdSet,
  membersById,
  members,
  myUserId,
  onClose,
  onSaveTitle,
  onToggleAddSelect,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  rejoinRequests,
  onResolveRejoinRequest,
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!open || !isGroup || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-black/15">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="text-sm font-bold text-text-heading">Group settings</div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/70 bg-white text-text-muted hover:bg-background-light"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="text-xs font-semibold text-text-muted shrink-0 sm:w-28">Group name</div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  placeholder="Group chat"
                  disabled={!isGroupCreator || saving}
                  className="h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => void onSaveTitle()}
                  disabled={!isGroupCreator || saving}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background-light p-1">
              <button
                type="button"
                onClick={() => setSettingsTab("members")}
                className={`h-9 flex-1 rounded-lg text-sm font-bold transition ${
                  settingsTab === "members"
                    ? "bg-white text-text-heading shadow-sm"
                    : "text-text-muted hover:text-text-heading"
                }`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("add")}
                disabled={!isGroupCreator}
                className={`h-9 flex-1 rounded-lg text-sm font-bold transition ${
                  settingsTab === "add"
                    ? "bg-white text-text-heading shadow-sm"
                    : "text-text-muted hover:text-text-heading"
                } ${!isGroupCreator ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Add members
              </button>
            </div>

            <div className="transition-all duration-200">
              {settingsTab === "add" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background-light px-3 py-2">
                    <Plus size={16} className="text-text-muted" />
                    <input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search professionals…"
                      disabled={!isGroupCreator || saving}
                      className="h-8 w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border/70">
                    {profQuery.isLoading ? (
                      <div className="flex items-center justify-center py-8 text-text-muted">
                        <Loader2 size={20} className="animate-spin" />
                      </div>
                    ) : profItems.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-text-muted">No results</div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {profItems.map((p) => {
                          const id = String(p?.id || "").trim();
                          const isSelected = selectedAdd.has(id);
                          const already = participantIdSet.has(id) || membersById.has(id);
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                disabled={!isGroupCreator || already || saving}
                                onClick={() => onToggleAddSelect(p)}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                                  already || !isGroupCreator ? "opacity-50" : "hover:bg-primary/[0.04]"
                                }`}
                              >
                                {p?.profile_image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.profile_image}
                                    alt=""
                                    className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/70"
                                  />
                                ) : (
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                                    {initialsFor(p)}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-bold text-text-heading">{displayName(p)}</div>
                                  <div className="mt-0.5 truncate text-xs text-text-muted">{p?.email || ""}</div>
                                </div>
                                <span
                                  className={`grid h-8 w-8 place-items-center rounded-lg border ${
                                    already
                                      ? "border-border/70 bg-white text-text-muted"
                                      : isSelected
                                        ? "border-primary/30 bg-primary/[0.10] text-primary-dark"
                                        : "border-border/70 bg-white text-text-muted"
                                  }`}
                                  aria-hidden
                                >
                                  {already ? null : isSelected ? <Check size={16} /> : null}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void onAddMembers()}
                    disabled={!isGroupCreator || saving || selectedAddIds.length < 1}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] text-sm font-bold text-primary-dark transition hover:bg-primary/[0.10] disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                    Add selected ({selectedAddIds.length})
                  </button>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto rounded-xl border border-border/70">
                  <ul className="divide-y divide-border/60">
                    {members.map((u) => {
                      const id = String(u?.id || "").trim();
                      const isMe = myUserId && id && String(id) === String(myUserId);
                      return (
                        <li key={id}>
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            {u?.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.profile_image}
                                alt=""
                                className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/70"
                              />
                            ) : (
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                                {initialsFor(u)}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-text-heading">
                                {displayName(u)} {isMe ? "(You)" : ""}
                              </div>
                              <div className="mt-0.5 truncate text-xs text-text-muted">{u?.email || ""}</div>
                            </div>
                            {isMe ? (
                              <button
                                type="button"
                                onClick={() => void onLeaveGroup()}
                                disabled={saving}
                                className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                              >
                                <Trash2 size={14} />
                                Leave
                              </button>
                            ) : isGroupCreator ? (
                              <button
                                type="button"
                                onClick={() => void onRemoveMember(id)}
                                disabled={saving}
                                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-bold text-text-heading hover:bg-background-light disabled:opacity-60"
                              >
                                <Trash2 size={14} className="text-text-muted" />
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            {!isGroupCreator ? (
              <div className="text-xs text-text-muted">
                Only the <span className="font-semibold text-text-heading">group creator</span> can rename or
                manage members.
              </div>
            ) : null}
            {isGroupCreator ? (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-red-700">Delete group</div>
                    <div className="mt-0.5 text-xs text-red-600">
                      Permanently deletes this group and all messages.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={saving}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    Delete group
                  </button>
                </div>
              </div>
            ) : null}
            {isGroupCreator && Array.isArray(rejoinRequests) && rejoinRequests.length > 0 ? (
              <div className="rounded-xl border border-border/70 bg-background-light/50 p-3">
                <div className="mb-2 text-xs font-semibold text-text-heading">
                  Rejoin requests ({rejoinRequests.length})
                </div>
                <ul className="space-y-2">
                  {rejoinRequests.map((r) => {
                    const uid = String(r?.user_id || "").trim();
                    const u = r?.user;
                    return (
                      <li key={uid} className="flex items-center gap-3 rounded-lg border border-border/70 bg-white p-2.5">
                        {u?.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.profile_image}
                            alt=""
                            className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/70"
                          />
                        ) : (
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                            {initialsFor(u)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-text-heading">{displayName(u)}</div>
                          <div className="mt-0.5 truncate text-xs text-text-muted">{u?.email || ""}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void onResolveRejoinRequest(uid, "approve")}
                            className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void onResolveRejoinRequest(uid, "reject")}
                            className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        {confirmDeleteOpen ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-4 shadow-2xl shadow-black/20">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
                  <Trash2 size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-text-heading">Delete this group?</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    This will permanently delete the group, all messages, and related group data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  disabled={saving}
                  className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text-heading hover:bg-background-light disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteGroup()}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete group
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
