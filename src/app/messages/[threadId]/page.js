"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Settings2,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/store";
import { getSocketOrigin } from "@/lib/api";
import {
  addProChatGroupMembers,
  deleteProChatGroupThread,
  fetchProChatGroupRejoinRequests,
  fetchProChatThreadById,
  fetchProChatThreadMessages,
  leaveProChatGroup,
  removeProChatGroupMember,
  requestProChatGroupRejoin,
  resolveProChatGroupRejoinRequest,
  updateProChatGroupThread,
  uploadProChatThreadAttachment,
} from "@/lib/proChatClient";
import { clearUnread } from "@/store/proChatSlice";
import { fetchProfessionals } from "@/lib/professionalsClient";
import GroupAvatarStack from "@/components/prochat/thread/GroupAvatarStack";
import GroupSettingsModal from "@/components/prochat/thread/GroupSettingsModal";
import ThreadMessagesList from "@/components/prochat/thread/ThreadMessagesList";
import ThreadComposer from "@/components/prochat/thread/ThreadComposer";
import {
  displayName,
  displayRole,
  initialsFor,
  safeUuid,
  validateProChatAttachmentLimits,
} from "@/components/prochat/thread/proChatThreadUtils";

export default function ProMessagesThreadPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const threadId = String(params?.threadId || "").trim();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { token, user: authUser } = useAppSelector((s) => s.auth);
  const myUserId = String(authUser?.id || authUser?._id || "").trim();

  const threadQuery = useQuery({
    queryKey: ["prochat-thread", token, threadId],
    enabled: Boolean(token && threadId),
    queryFn: () => fetchProChatThreadById({ token, id: threadId }),
    refetchOnWindowFocus: true,
  });

  const messagesQuery = useQuery({
    queryKey: ["prochat-messages", token, threadId, 1],
    enabled: Boolean(token && threadId),
    queryFn: () => fetchProChatThreadMessages({ token, id: threadId, page: 1, limit: 50 }),
  });

  const thread = threadQuery.data?.thread || null;
  const isGroup = String(thread?.thread_type || "dm") === "group";
  const isGroupCreator = Boolean(isGroup && myUserId && String(thread?.created_by || "") === String(myUserId));
  const canReply = Boolean(thread?.can_reply !== false);
  const rejoinRequestStatus = String(thread?.rejoin_request_status || "").trim();
  const otherUser = threadQuery.data?.other_user || null;
  const members = useMemo(
    () => (Array.isArray(threadQuery.data?.members) ? threadQuery.data.members : []),
    [threadQuery.data?.members]
  );
  const membersById = useMemo(() => {
    const m = new Map();
    for (const u of members) {
      const id = String(u?.id || "").trim();
      if (id) m.set(id, u);
    }
    return m;
  }, [members]);
  const participantIdSet = useMemo(() => {
    const ids = Array.isArray(thread?.participants) ? thread.participants.map((p) => String(p)) : [];
    return new Set(ids.filter(Boolean));
  }, [thread?.participants]);

  const headerTitle = useMemo(() => {
    if (isGroup) return String(thread?.title || "").trim() || "Group chat";
    return displayName(otherUser);
  }, [isGroup, thread?.title, otherUser]);

  const headerSubtitle = useMemo(() => {
    if (isGroup) {
      const n = Number(thread?.member_count || thread?.participants?.length || members.length || 0);
      return `${Number.isFinite(n) && n > 0 ? n : members.length} members`;
    }
    return displayRole(otherUser);
  }, [isGroup, thread?.member_count, thread?.participants, members.length, otherUser]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("members"); // members | add
  const [titleDraft, setTitleDraft] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedAdd, setSelectedAdd] = useState(() => new Map()); // id -> professional
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [draftAttachments, setDraftAttachments] = useState([]); // Cloudinary metadata objects
  const [uploadingAttachments, setUploadingAttachments] = useState([]); // { id, name, mime, bytes, status }

  useEffect(() => {
    if (!settingsOpen) return;
    setSettingsTab("members");
    setTitleDraft(String(thread?.title || "").trim());
    setMemberSearch("");
    setSelectedAdd(new Map());
  }, [settingsOpen, thread?.title]);

  // If user isn't the creator, never allow landing on the "Add members" tab
  // (still keeps Members + Leave available).
  useEffect(() => {
    if (!settingsOpen) return;
    if (!isGroupCreator && settingsTab === "add") {
      setSettingsTab("members");
    }
  }, [settingsOpen, isGroupCreator, settingsTab]);

  const profQuery = useQuery({
    queryKey: ["prochat-group-add-search", token, memberSearch],
    enabled: Boolean(token) && settingsOpen && isGroup,
    queryFn: () => fetchProfessionals({ token, search: memberSearch, all: true }),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
  const profItems = Array.isArray(profQuery.data?.items) ? profQuery.data.items : [];
  const rejoinRequestsQuery = useQuery({
    queryKey: ["prochat-group-rejoin-requests", token, threadId],
    enabled: Boolean(token && threadId && isGroup && isGroupCreator),
    queryFn: () => fetchProChatGroupRejoinRequests({ token, id: threadId }),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
  const rejoinRequests = Array.isArray(rejoinRequestsQuery.data?.items)
    ? rejoinRequestsQuery.data.items
    : [];

  const toggleAddSelect = (p) => {
    const id = String(p?.id || "").trim();
    if (!id) return;
    setSelectedAdd((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, p);
      return next;
    });
  };

  const selectedAddIds = useMemo(() => Array.from(selectedAdd.keys()), [selectedAdd]);

  const refreshThread = () => {
    queryClient.invalidateQueries({ queryKey: ["prochat-thread", token, threadId] });
    queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
  };

  const saveTitle = async () => {
    if (!token || !threadId) return;
    if (!isGroupCreator) {
      toast.error("You are not authorized to rename this group.");
      return;
    }
    try {
      setSaving(true);
      await updateProChatGroupThread({ token, id: threadId, title: titleDraft });
      refreshThread();
      toast.success("Group updated");
    } catch (e) {
      const status = e?.status;
      if (Number(status) === 403) {
        toast.error("You are not authorized to rename this group.");
      } else {
        toast.error(e?.message || "Could not update group");
      }
    } finally {
      setSaving(false);
    }
  };

  const addMembers = async () => {
    if (!token || !threadId) return;
    if (selectedAddIds.length < 1) return;
    if (!isGroupCreator) {
      toast.error("You are not authorized to add members to this group.");
      return;
    }
    try {
      setSaving(true);
      await addProChatGroupMembers({ token, id: threadId, participant_ids: selectedAddIds });
      setSelectedAdd(new Map());
      setMemberSearch("");
      setSettingsTab("members");
      refreshThread();
      toast.success("Members added");
    } catch (e) {
      const msg = e?.message || "Could not add members";
      const status = e?.status;
      if (Number(status) === 403) {
        toast.error("You are not authorized to add members to this group.");
      } else {
        toast.error(status ? `${msg} (${status})` : msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId) => {
    if (!token || !threadId) return;
    if (!isGroupCreator) {
      toast.error("You are not authorized to remove members from this group.");
      return;
    }
    try {
      setSaving(true);
      await removeProChatGroupMember({ token, id: threadId, userId });
      refreshThread();
      toast.success("Member removed");
    } catch (e) {
      const status = e?.status;
      if (Number(status) === 403) {
        toast.error("You are not authorized to remove members from this group.");
      } else {
        toast.error(e?.message || "Could not remove member");
      }
    } finally {
      setSaving(false);
    }
  };

  const leaveGroup = async () => {
    if (!token || !threadId) return;
    try {
      setSaving(true);
      await leaveProChatGroup({ token, id: threadId });
      toast.success("You left the group");
      refreshThread();
      queryClient.invalidateQueries({ queryKey: ["prochat-group-rejoin-requests", token, threadId] });
    } catch (e) {
      toast.error(e?.message || "Could not leave group");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!token || !threadId) return;
    if (!isGroupCreator) {
      toast.error("Only the group creator can delete this group.");
      return;
    }
    try {
      setSaving(true);
      await deleteProChatGroupThread({ token, id: threadId });
      toast.success("Group deleted");
      queryClient.removeQueries({ queryKey: ["prochat-thread", token, threadId] });
      queryClient.removeQueries({ queryKey: ["prochat-messages", token, threadId] });
      queryClient.invalidateQueries({ queryKey: ["prochat-threads"] });
      setSettingsOpen(false);
      router.push("/conversations");
    } catch (e) {
      const status = e?.status;
      if (Number(status) === 403) {
        toast.error("Only the group creator can delete this group.");
      } else {
        toast.error(e?.message || "Could not delete group");
      }
    } finally {
      setSaving(false);
    }
  };

  const requestRejoin = async () => {
    if (!token || !threadId) return;
    try {
      setSaving(true);
      await requestProChatGroupRejoin({ token, id: threadId });
      toast.success("Rejoin request sent to the group creator.");
      refreshThread();
    } catch (e) {
      toast.error(e?.message || "Could not send rejoin request");
    } finally {
      setSaving(false);
    }
  };

  const resolveRejoinRequest = async (userId, action) => {
    if (!token || !threadId || !userId) return;
    try {
      setSaving(true);
      await resolveProChatGroupRejoinRequest({ token, id: threadId, userId, action });
      toast.success(action === "approve" ? "Rejoin request approved." : "Rejoin request rejected.");
      refreshThread();
      queryClient.invalidateQueries({ queryKey: ["prochat-group-rejoin-requests", token, threadId] });
    } catch (e) {
      toast.error(e?.message || "Could not resolve request");
    } finally {
      setSaving(false);
    }
  };

  const [draft, setDraft] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentAt = useRef(0);

  const messages = useMemo(() => {
    const fromApi = Array.isArray(messagesQuery.data?.items) ? messagesQuery.data.items : [];
    const merged = [...fromApi];
    const seen = new Set(merged.map((m) => String(m.id)));
    for (const m of liveMessages) {
      const id = String(m?.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(m);
    }
    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return merged;
  }, [messagesQuery.data?.items, liveMessages]);

  const getScrollEl = () => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.clientHeight > 8) return el;
    if (typeof document === "undefined") return null;
    return document.scrollingElement || document.documentElement || null;
  };

  const scrollToBottom = (behavior = "auto") => {
    const el = getScrollEl();
    if (!el) return;
    const top = el.scrollHeight;
    try {
      el.scrollTo({ top, behavior });
    } catch {
      el.scrollTop = top;
    }
  };

  useLayoutEffect(() => {
    // Layout-safe auto scroll: sometimes the outer <main> is the scroller.
    // Run after DOM updates so scrollHeight is correct.
    scrollToBottom(messagesQuery.isLoading ? "auto" : "smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    if (threadId) dispatch(clearUnread({ threadId }));
  }, [dispatch, threadId]);

  useEffect(() => {
    // Ensure textarea height matches persisted draft (e.g. on fast refresh/back nav).
    requestAnimationFrame(() => autosizeComposer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (!token || !threadId) return;
    const origin = getSocketOrigin();
    if (!origin) return;
    const sessionToken = String(token).trim().replace(/^Bearer\s+/i, "");

    const socket = io(origin, {
      path: "/socket.io",
      auth: { token: sessionToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("prochat:join", { thread_id: threadId }, (ack) => {
        if (!ack?.success) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[prochat] join failed", ack);
          }
        }
      });
    });
    socket.on("disconnect", () => setConnected(false));

    const onMsg = (m) => {
      if (!m || String(m.thread_id) !== String(threadId)) return;
      setLiveMessages((prev) => {
        if (prev.some((x) => String(x?.id) === String(m.id))) return prev;
        return [...prev, m];
      });
    };
    socket.on("prochat:message", onMsg);

    const onTyping = (payload) => {
      if (!payload || String(payload.thread_id) !== String(threadId)) return;
      if (myUserId && String(payload.user_id) === String(myUserId)) return;
      setOtherTyping(Boolean(payload.is_typing));
    };
    socket.on("prochat:typing", onTyping);

    socket.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[prochat] connect_error", err?.message || err);
      }
    });

    return () => {
      socket.off("prochat:message", onMsg);
      socket.off("prochat:typing", onTyping);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, threadId, myUserId]);

  const emitTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit("prochat:typing", { thread_id: threadId, is_typing: Boolean(isTyping) });
  };

  const autosizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    // Slightly taller max so normal long messages don't show an inner scrollbar immediately.
    const MAX = 240; // px (keeps UI stable)
    try {
      el.style.height = "0px";
      const next = Math.min(el.scrollHeight || 0, MAX);
      el.style.height = `${Math.max(next, 52)}px`;
      el.style.overflowY = (el.scrollHeight || 0) > MAX ? "auto" : "hidden";
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    if (!canReply) {
      toast.info("You cannot reply in this group until your rejoin request is approved.");
      return;
    }
    const text = String(draft || "").trim();
    const atts = Array.isArray(draftAttachments) ? draftAttachments : [];
    const hasUploads = Array.isArray(uploadingAttachments) && uploadingAttachments.length > 0;
    if (hasUploads) {
      toast.info("Please wait for attachments to finish uploading.");
      return;
    }
    if (!text && atts.length < 1) return;
    const attachmentLimit = validateProChatAttachmentLimits(atts);
    if (!attachmentLimit.ok) {
      toast.error(attachmentLimit.message);
      return;
    }
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error("Chat not connected yet. Try again.");
      return;
    }
    const client_id = safeUuid();
    const prevAtts = atts;
    setDraft("");
    setDraftAttachments([]);
    requestAnimationFrame(() => autosizeComposer());
    socket.emit("prochat:send", { thread_id: threadId, body: text, client_id, attachments: prevAtts }, (ack) => {
      if (!ack?.success) {
        toast.error(ack?.message || "Could not send message");
        setDraft(text);
        setDraftAttachments(prevAtts);
        return;
      }
      const m = ack?.message;
      if (m) {
        setLiveMessages((prev) => {
          if (prev.some((x) => String(x?.id) === String(m.id))) return prev;
          return [...prev, m];
        });
      }
      requestAnimationFrame(() => scrollToBottom("smooth"));
    });
  };

  if (!isAuthenticated) return null;

  const settingsModal = (
    <GroupSettingsModal
      open={settingsOpen}
      isGroup={isGroup}
      isGroupCreator={isGroupCreator}
      saving={saving}
      titleDraft={titleDraft}
      setTitleDraft={setTitleDraft}
      settingsTab={settingsTab}
      setSettingsTab={setSettingsTab}
      memberSearch={memberSearch}
      setMemberSearch={setMemberSearch}
      profQuery={profQuery}
      profItems={profItems}
      selectedAdd={selectedAdd}
      selectedAddIds={selectedAddIds}
      participantIdSet={participantIdSet}
      membersById={membersById}
      members={members}
      myUserId={myUserId}
      onClose={() => setSettingsOpen(false)}
      onSaveTitle={saveTitle}
      onToggleAddSelect={toggleAddSelect}
      onAddMembers={addMembers}
      onRemoveMember={removeMember}
      onLeaveGroup={leaveGroup}
            onDeleteGroup={deleteGroup}
      rejoinRequests={rejoinRequests}
      onResolveRejoinRequest={resolveRejoinRequest}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <div className="fixed left-0 right-0 top-[calc(4rem+env(safe-area-inset-top))] z-40 border-b border-border/70 bg-white/95 shadow-sm backdrop-blur lg:left-60">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-heading shadow-sm transition hover:bg-background-light"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-start gap-2">
              {isGroup ? (
                <GroupAvatarStack members={members} />
              ) : otherUser?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.profile_image}
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/60"
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.10] text-xs font-bold text-primary-dark ring-1 ring-primary/15">
                  {initialsFor(otherUser)}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text-heading">{headerTitle}</div>
                <div className="text-[11px] text-text-muted">
                  {headerSubtitle}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {isGroup && canReply && !isGroupCreator ? (
                <button
                  type="button"
                  onClick={() => void leaveGroup()}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  aria-label="Leave group"
                >
                  <LogOut size={14} />
                  Leave
                </button>
              ) : null}
              {isGroup && isGroupCreator ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-muted shadow-sm transition hover:bg-background-light hover:text-text-heading"
                  aria-label="Group settings"
                >
                  <Settings2 size={16} />
                </button>
              ) : null}
              {!isGroup && <span aria-hidden />}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-44 pt-[136px] sm:px-6 sm:pb-52 sm:pt-[140px]"
      >
        {threadQuery.isLoading || messagesQuery.isLoading ? (
          <p className="py-6 text-center text-xs text-text-muted">Loading messages…</p>
        ) : threadQuery.isError ? (
          <p className="py-6 text-center text-xs text-red-600">
            {threadQuery.error?.message || "Could not load this chat."}
          </p>
        ) : messages.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            {!canReply && isGroup ? "You left this group. Request rejoin to send messages." : "No messages yet. Say hello."}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <ThreadMessagesList
              messages={messages}
              myUserId={myUserId}
              isGroup={isGroup}
              membersById={membersById}
              otherUser={otherUser}
            />
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 z-40 px-3 sm:px-6 lg:left-60 bottom-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="w-full rounded-2xl border border-border/70 bg-white/95 p-3 shadow-[0_12px_50px_rgba(15,23,42,0.10)] backdrop-blur sm:p-4">
          {isGroup && !canReply ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background-light/70 px-3 py-2">
              <div className="text-xs text-text-muted">
                {rejoinRequestStatus === "pending"
                  ? "Rejoin request pending approval from group creator."
                  : "You left this group and cannot reply right now."}
              </div>
              <button
                type="button"
                onClick={() => void requestRejoin()}
                disabled={saving || rejoinRequestStatus === "pending"}
                className="inline-flex h-8 items-center rounded-lg border border-primary/20 bg-primary/[0.06] px-3 text-xs font-bold text-primary-dark transition hover:bg-primary/[0.10] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rejoinRequestStatus === "pending" ? "Requested" : "Request rejoin"}
              </button>
            </div>
          ) : null}
          {otherTyping ? (
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/15">
                {isGroup ? "…" : initialsFor(otherUser)}
              </span>
              <span className="truncate">{isGroup ? "Someone is typing" : `${headerTitle} is typing`}</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:120ms]" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:240ms]" />
              </span>
            </div>
          ) : null}

          <ThreadComposer
            token={token}
            threadId={threadId}
            draft={draft}
            setDraft={setDraft}
            composerRef={composerRef}
            fileInputRef={fileInputRef}
            draftAttachments={draftAttachments}
            setDraftAttachments={setDraftAttachments}
            uploadingAttachments={uploadingAttachments}
            setUploadingAttachments={setUploadingAttachments}
            onUploadAttachment={uploadProChatThreadAttachment}
            onSendMessage={sendMessage}
            onEmitTyping={emitTyping}
            typingTimeoutRef={typingTimeoutRef}
            lastTypingSentAt={lastTypingSentAt}
            autosizeComposer={autosizeComposer}
            toast={toast}
            disabled={!canReply}
          />
        </div>
      </div>
      {settingsModal}
    </div>
  );
}

