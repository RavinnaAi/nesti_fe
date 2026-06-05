"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/store";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Mail, Pause, Pencil, Play, Save, Send, Trash2, X } from "lucide-react";
import {
  clearBulkNurtureDrafts,
  fetchBulkNurtureJob,
  fetchLatestBulkNurtureJob,
  pauseBulkNurtureDraftJob,
  resumeBulkNurtureDraftJob,
  startBulkNurtureDraftJob,
  startBulkNurtureSendJob,
  updateBulkNurtureDraftItem,
} from "@/lib/chatClient";

const BULK_JOB_POLL_MS = 3000;

function resolveProfessionalRole(user, businessInfo) {
  const role = String(user?.role || businessInfo?.professionalType || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (role === "lawyer") return "lawyer";
  if (role === "mortgage_broker") return "mortgage_broker";
  return "agent";
}

const BULK_FOLLOWUP_EMPTY_STATE = {
  agent: {
    title: "Prepare client follow-ups",
    description:
      "Generate personalized nurture drafts for clients with emails on file. Each draft uses saved client context, matched property listings, a meeting-preparation checklist, and your nurture email template.",
    tags: ["OpenAI-written copy", "Property listings included", "Meeting prep checklist", "Editable before sending"],
    generateLabel: "Generate follow-ups",
    generatingLabel: "Generating follow-ups...",
  },
  lawyer: {
    title: "Prepare client follow-ups",
    description:
      "Generate professional follow-up drafts for clients with emails on file. Each draft references transaction stage, closing timeline, legal next steps, and a meeting-preparation checklist from saved client context.",
    tags: ["Attorney-office tone", "Transaction-focused", "Meeting prep checklist", "Editable before sending"],
    generateLabel: "Generate follow-ups",
    generatingLabel: "Generating follow-ups...",
  },
  mortgage_broker: {
    title: "Prepare client follow-ups",
    description:
      "Generate financing-focused follow-up drafts for clients with emails on file. Each draft uses saved client context, pre-approval status, mortgage timeline details, and a meeting-preparation checklist.",
    tags: ["Financing-focused tone", "Pre-approval aware", "Meeting prep checklist", "Editable before sending"],
    generateLabel: "Generate follow-ups",
    generatingLabel: "Generating follow-ups...",
  },
};

function isBulkJobStillActive(job) {
  if (!job) return false;
  if (["completed", "failed", "paused"].includes(String(job.status || ""))) return false;
  const progress = job.progress || {};
  const total = Number(progress.total || 0);
  const completed = Number(progress.completed || 0);
  if (total > 0 && completed >= total) return false;
  return ["queued", "running"].includes(String(job.status || ""));
}
const BULK_ITEMS_PAGE_SIZE = 10;
const BULK_SEND_POLL_LIMIT = 50;
const BULK_NO_DRAFTS_HINT_KEY = "nesti_bulk_followups_no_drafts";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function listingsPreviewDocument(html) {
  const source = String(html || "").trim();
  const empty = `<!DOCTYPE html><html><body style="margin:0;padding:20px;font-family:Inter,Arial,sans-serif;color:#64748b;background:#ffffff;">No listing table is available for this draft.</body></html>`;
  if (!source) return empty;

  const headingIndex = source.search(/<h2[^>]*>\s*Recommended listings\s*<\/h2>/i);
  if (headingIndex === -1) return empty;

  const afterHeading = source.slice(headingIndex);
  const footerIndex = afterHeading.search(/<p[^>]*>\s*This message was prepared by/i);
  const listingHtml = (footerIndex === -1 ? afterHeading : afterHeading.slice(0, footerIndex)).trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { padding: 18px; font-family: Inter, Poppins, Segoe UI, Arial, sans-serif; color: #334155; }
    table { max-width: 100%; }
    h2 { margin-top: 0 !important; }
  </style>
</head>
<body>${listingHtml}</body>
</html>`;
}

function stripGeneratedListingsFromBody(body) {
  const lines = String(body || "").replace(/\r\n/g, "\n").split("\n");
  const cleaned = [];
  let skippingListings = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const looksLikeListingLine =
      /^[-*]\s+.+\$\s*[\d,]+/i.test(trimmed) ||
      /^[-*]\s+.+\s+-\s+\$[\d,]+/i.test(trimmed);
    const startsListingBlock =
      /here are (a few|some|several).*(properties|listings)/i.test(trimmed) ||
      /properties to consider\s*:?$/i.test(trimmed) ||
      /please review the listings below\.?$/i.test(trimmed) ||
      /please review the recommended listings\.?$/i.test(trimmed);

    if (startsListingBlock) {
      const normalizedIntro = line.replace(/here are.*$/i, "Please review the recommended listings.").trim();
      cleaned.push(normalizedIntro || "Please review the recommended listings.");
      skippingListings = true;
      continue;
    }

    if (skippingListings && (looksLikeListingLine || !trimmed)) continue;
    if (looksLikeListingLine) continue;
    if (skippingListings) {
      skippingListings = false;
      cleaned.push(line);
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export default function BulkFollowupWorkspace({ token }) {
  const user = useAppSelector((state) => state.auth.user);
  const businessInfo = useAppSelector((state) => state.profile.businessInfo);
  const professionalRole = useMemo(
    () => resolveProfessionalRole(user, businessInfo),
    [user, businessInfo],
  );
  const isAgentProfessional = professionalRole === "agent";
  const emptyStateCopy = BULK_FOLLOWUP_EMPTY_STATE[professionalRole] || BULK_FOLLOWUP_EMPTY_STATE.agent;

  const [items, setItems] = useState([]);
  const [restoreChecked, setRestoreChecked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BULK_NO_DRAFTS_HINT_KEY) === "1";
  });
  const [busy, setBusy] = useState(false);
  const [busyMode, setBusyMode] = useState("");
  const [busyLabel, setBusyLabel] = useState("");
  const [generatingAction, setGeneratingAction] = useState("generate");
  const [jobError, setJobError] = useState("");
  const [draftJobId, setDraftJobId] = useState("");
  const [draftJobStatus, setDraftJobStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState("");
  const [editingBusyId, setEditingBusyId] = useState("");
  const [editingSubject, setEditingSubject] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [editingError, setEditingError] = useState("");
  const [editingTab, setEditingTab] = useState("message");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: BULK_ITEMS_PAGE_SIZE,
    total: 0,
    total_pages: 1,
    has_prev_page: false,
    has_next_page: false,
  });
  const activeJobRef = useRef("");
  const pageRef = useRef(1);

  const totalPages = Math.max(1, Number(pagination.total_pages || 1));
  const currentPage = Math.min(Number(page || 1), totalPages);
  const paginatedItems = items;
  const readyCount = items.filter((item) => item.status === "ready").length;
  const hasDrafts = Number(pagination.total || items.length || 0) > 0;
  const editingItem = items.find((item) => item.id === editingId);
  const isGenerating = busy && busyMode === "generating";
  const isSending = busy && busyMode === "sending";
  const isClearing = busy && busyMode === "clearing";
  const isPausing = busy && busyMode === "pausing";
  const isPaused = draftJobStatus === "paused";
  const canPauseJob = Boolean(draftJobId) && ["queued", "running"].includes(draftJobStatus);
  const canResumeJob = Boolean(draftJobId) && draftJobStatus === "paused";

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  useEffect(() => {
    if (!isAgentProfessional && editingTab === "listings") {
      setEditingTab("message");
    }
  }, [isAgentProfessional, editingTab]);

  const beginEdit = (item) => {
    setEditingId(item.id);
    setEditingSubject(item.subject || "");
    setEditingBody(stripGeneratedListingsFromBody(item.body || ""));
    setEditingError("");
    setEditingTab("message");
    setJobError("");
  };

  const cancelEdit = () => {
    if (editingBusyId) return;
    setEditingId("");
    setEditingSubject("");
    setEditingBody("");
    setEditingError("");
    setEditingTab("message");
  };

  const goToPage = (nextPage) => {
    const safePage = Math.min(Math.max(Number(nextPage) || 1, 1), totalPages);
    pageRef.current = safePage;
    setPage(safePage);
  };

  const applyDraftJob = useCallback((job) => {
    const jobItems = Array.isArray(job?.items)
      ? job.items.filter((item) => {
          if (item.status === "sent" || item.status === "error") return false;
          if (job?.status === "paused") return item.status === "ready";
          return true;
        })
      : [];
    setItems(jobItems);
    setDraftJobStatus(job?.status || "");
    setPagination((prev) => ({
      page: pageRef.current,
      limit: BULK_ITEMS_PAGE_SIZE,
      total: Number(job?.pagination?.total ?? jobItems.length),
      total_pages: Number(job?.pagination?.total_pages ?? prev.total_pages ?? 1),
      has_prev_page: Boolean(job?.pagination?.has_prev_page ?? pageRef.current > 1),
      has_next_page: Boolean(job?.pagination?.has_next_page ?? false),
    }));
  }, []);

  const applySendJob = useCallback((job) => {
    const sendItems = Array.isArray(job?.items) ? job.items : [];
    const statusById = new Map(sendItems.map((item) => [String(item.id), item]));
    const jobDone = job?.status === "completed" || job?.status === "failed";

    setItems((prev) => {
      const base = prev.length
        ? prev
        : sendItems.map((item) => ({ ...item, selected: false, previewHtml: "" }));

      return base
        .map((item) => {
          const remote = statusById.get(String(item.id));
          if (!remote) {
            if (item.status === "sending") {
              return { ...item, status: "sent", error: "" };
            }
            return item;
          }
          return {
            ...item,
            selected: remote.status === "sent" ? false : item.selected,
            status: remote.status,
            error: remote.error || "",
          };
        })
        .filter((item) => {
          if (item.status === "error") return false;
          if (jobDone && item.status === "sent") return false;
          return true;
        });
    });
  }, []);

  const updateJobLabel = useCallback((prefix, job) => {
    const progress = job?.progress || {};
    const total = Number(progress.total || 0);
    const completed = Number(progress.completed || 0);
    setBusyLabel(total > 0 ? `${prefix} ${completed} of ${total}...` : `${prefix}...`);
  }, []);

  const pollJob = useCallback(async ({ jobId, applyJob, label, pollPage, pollLimit }) => {
    let job = null;
    while (activeJobRef.current === jobId) {
      await sleep(BULK_JOB_POLL_MS);
      if (activeJobRef.current !== jobId) break;
      const data = await fetchBulkNurtureJob({
        token,
        jobId,
        page: pollPage ?? pageRef.current,
        limit: pollLimit ?? BULK_ITEMS_PAGE_SIZE,
      });
      if (activeJobRef.current !== jobId) break;
      job = data?.job || null;
      if (job) {
        applyJob(job);
        updateJobLabel(label, job);
      }
      if (!isBulkJobStillActive(job)) break;
    }
    if (activeJobRef.current === jobId && !isBulkJobStillActive(job)) {
      activeJobRef.current = "";
    }
    if (job?.status === "failed") {
      throw new Error(job.error || "Bulk job failed.");
    }
    return job;
  }, [token, updateJobLabel]);

  const applyJobByType = useCallback((job) => {
    if (job?.type === "bulk_nurture_send") {
      applySendJob(job);
      updateJobLabel("Sending", job);
      return { applyJob: applySendJob, label: "Sending" };
    }
    applyDraftJob(job);
    updateJobLabel("Generating", job);
    return { applyJob: applyDraftJob, label: "Generating" };
  }, [applyDraftJob, applySendJob, updateJobLabel]);

  useEffect(() => {
    if (!token) {
      setRestoreChecked(true);
      return undefined;
    }
    const hasNoDraftsHint =
      typeof window !== "undefined" && window.localStorage.getItem(BULK_NO_DRAFTS_HINT_KEY) === "1";
    setRestoreChecked(hasNoDraftsHint);
    let cancelled = false;

    async function restoreLatestJob() {
      if (activeJobRef.current) return;
      try {
        const data = await fetchLatestBulkNurtureJob({
          token,
          type: "bulk_nurture_draft",
          page: pageRef.current,
          limit: BULK_ITEMS_PAGE_SIZE,
        });
        if (cancelled) return;
        const job = data?.job;
        setRestoreChecked(Boolean(data?.restore_state?.restore_checked));
        if (!job?.id) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(BULK_NO_DRAFTS_HINT_KEY, "1");
          }
          return;
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(BULK_NO_DRAFTS_HINT_KEY);
        }

        setDraftJobId(job.id);
        setDraftJobStatus(job.status || "");
        const { applyJob, label } = applyJobByType(job);

        if (isBulkJobStillActive(job)) {
          activeJobRef.current = job.id;
          setBusy(true);
          setBusyMode(job.type === "bulk_nurture_send" ? "sending" : "generating");
          if (job.type !== "bulk_nurture_send") setGeneratingAction("generate");
          setJobError("");
          await pollJob({ jobId: job.id, applyJob, label });
          if (!cancelled) {
            setBusy(false);
            setBusyMode("");
            setBusyLabel("");
            setRestoreChecked(true);
          }
        } else {
          activeJobRef.current = "";
          setRestoreChecked(true);
        }
      } catch (err) {
        if (!cancelled) {
          activeJobRef.current = "";
          setBusy(false);
          setBusyMode("");
          setBusyLabel("");
          setRestoreChecked(true);
          setJobError(err?.message || "Could not restore the bulk follow-up job.");
        }
      }
    }

    restoreLatestJob();

    return () => {
      cancelled = true;
      activeJobRef.current = "";
    };
  }, [token, applyJobByType, pollJob]);

  useEffect(() => {
    if (!token || !draftJobId) return undefined;
    if (activeJobRef.current) return undefined;
    pageRef.current = page;
    let cancelled = false;
    async function loadPage() {
      try {
        const data = await fetchBulkNurtureJob({
          token,
          jobId: draftJobId,
          page: pageRef.current,
          limit: BULK_ITEMS_PAGE_SIZE,
        });
        if (!cancelled && data?.job) {
          applyDraftJob(data.job);
        }
      } catch (_err) {}
    }
    loadPage();
    return () => {
      cancelled = true;
    };
  }, [token, draftJobId, page, applyDraftJob]);

  const generateDrafts = async () => {
    const jobKey = `draft-${Date.now()}`;
    activeJobRef.current = jobKey;
    setBusy(true);
    setBusyMode("generating");
    setGeneratingAction(items.length > 0 ? "regenerate" : "generate");
    setJobError("");
    setBusyLabel("Starting backend job...");
    try {
      const data = await startBulkNurtureDraftJob({ token });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(BULK_NO_DRAFTS_HINT_KEY);
      }
      const job = data?.job;
      if (!job?.id) throw new Error("Could not start bulk follow-up job.");
      activeJobRef.current = job.id;
      setDraftJobId(job.id);
      setDraftJobStatus(job.status || "");
      pageRef.current = 1;
      setPage(1);
      applyDraftJob(job);
      updateJobLabel("Generating", job);
      await pollJob({ jobId: job.id, applyJob: applyDraftJob, label: "Generating" });
    } catch (err) {
      const message = err?.message || "Could not generate follow-ups.";
      setJobError(message);
      setItems((prev) => prev.filter((item) => item.status !== "error"));
    } finally {
      setBusy(false);
      setBusyMode("");
      setBusyLabel("");
    }
  };

  const clearDrafts = async () => {
    if (!draftJobId) return;
    activeJobRef.current = "";
    setBusy(true);
    setBusyMode("clearing");
    setJobError("");
    setBusyLabel("Deleting bulk drafts...");
    try {
      const data = await clearBulkNurtureDrafts({
        token,
        jobId: draftJobId,
        page: 1,
        limit: BULK_ITEMS_PAGE_SIZE,
      });
      pageRef.current = 1;
      setPage(1);
      if (data?.job) {
        applyDraftJob(data.job);
        setDraftJobStatus(data.job.status || "");
      } else {
        setItems([]);
        setPagination({
          page: 1,
          limit: BULK_ITEMS_PAGE_SIZE,
          total: 0,
          total_pages: 1,
          has_prev_page: false,
          has_next_page: false,
        });
        setDraftJobId("");
        setDraftJobStatus("");
        setRestoreChecked(true);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(BULK_NO_DRAFTS_HINT_KEY, "1");
        }
      }
      cancelEdit();
    } catch (err) {
      setJobError(err?.message || "Could not delete bulk drafts.");
    } finally {
      setBusy(false);
      setBusyMode("");
      setBusyLabel("");
    }
  };

  const pauseDraftJob = async () => {
    if (!draftJobId) return;
    activeJobRef.current = "";
    setDraftJobStatus("paused");
    setItems((prev) => {
      const readyItems = prev.filter((item) => item.status === "ready");
      const total = readyItems.length;
      const totalPages = Math.max(1, Math.ceil(total / BULK_ITEMS_PAGE_SIZE));
      const safePage = Math.min(pageRef.current, totalPages);
      pageRef.current = safePage;
      setPage(safePage);
      setPagination((paginationPrev) => ({
        ...paginationPrev,
        page: safePage,
        total,
        total_pages: totalPages,
        has_prev_page: safePage > 1,
        has_next_page: safePage < totalPages,
      }));
      return readyItems;
    });
    setBusy(true);
    setBusyMode("pausing");
    setJobError("");
    setBusyLabel("Pausing generation...");
    try {
      const data = await pauseBulkNurtureDraftJob({
        token,
        jobId: draftJobId,
        page: pageRef.current,
        limit: BULK_ITEMS_PAGE_SIZE,
      });
      if (data?.job) applyDraftJob(data.job);
    } catch (err) {
      setJobError(err?.message || "Could not pause draft generation.");
    } finally {
      setBusy(false);
      setBusyMode("");
      setBusyLabel("");
    }
  };

  const resumeDraftJob = async () => {
    if (!draftJobId) return;
    const jobKey = draftJobId;
    activeJobRef.current = jobKey;
    setBusy(true);
    setBusyMode("generating");
    setGeneratingAction("generate");
    setJobError("");
    setBusyLabel("Resuming generation...");
    try {
      const data = await resumeBulkNurtureDraftJob({
        token,
        jobId: draftJobId,
        page: pageRef.current,
        limit: BULK_ITEMS_PAGE_SIZE,
      });
      const job = data?.job;
      if (!job?.id) throw new Error("Could not resume draft generation.");
      activeJobRef.current = job.id;
      applyDraftJob(job);
      updateJobLabel("Generating", job);
      if (isBulkJobStillActive(job)) {
        await pollJob({ jobId: job.id, applyJob: applyDraftJob, label: "Generating" });
      }
    } catch (err) {
      activeJobRef.current = "";
      setJobError(err?.message || "Could not resume draft generation.");
    } finally {
      setBusy(false);
      setBusyMode("");
      setBusyLabel("");
    }
  };

  const saveDraftEdit = async () => {
    if (!draftJobId || !editingId) return;
    const subject = editingSubject.trim();
    const body = editingBody.trim();
    if (!subject || !body) {
      setEditingError("Subject and body are required before saving.");
      return;
    }
    setJobError("");
    setEditingError("");
    setEditingBusyId(editingId);
    try {
      const data = await updateBulkNurtureDraftItem({
        token,
        jobId: draftJobId,
        itemId: editingId,
        subject,
        body,
        page: pageRef.current,
        limit: BULK_ITEMS_PAGE_SIZE,
      });
      if (data?.job) applyDraftJob(data.job);
      updateItem(editingId, { subject, body, status: "ready", error: "" });
      cancelEdit();
    } catch (err) {
      setEditingError(err?.message || "Could not save draft edits.");
    } finally {
      setEditingBusyId("");
    }
  };

  const sendSelected = async () => {
    const jobKey = `send-${Date.now()}`;
    activeJobRef.current = jobKey;
    setBusy(true);
    setBusyMode("sending");
    setJobError("");
    setBusyLabel("Starting send job...");
    try {
      if (!draftJobId) throw new Error("Generate or restore persisted drafts before sending.");
      const data = await startBulkNurtureSendJob({
        token,
        sourceJobId: draftJobId,
        sendAll: true,
      });
      const job = data?.job;
      if (!job?.id) throw new Error("Could not start bulk send job.");
      activeJobRef.current = job.id;
      applySendJob(job);
      updateJobLabel("Sending", job);
      await pollJob({
        jobId: job.id,
        applyJob: applySendJob,
        label: "Sending",
        pollPage: 1,
        pollLimit: BULK_SEND_POLL_LIMIT,
      });
      const latestDraft = await fetchLatestBulkNurtureJob({
        token,
        type: "bulk_nurture_draft",
        page: pageRef.current,
        limit: BULK_ITEMS_PAGE_SIZE,
      });
      if (latestDraft?.job) applyDraftJob(latestDraft.job);
    } catch (err) {
      const message = err?.message || "Could not send selected follow-ups.";
      setJobError(message);
      setItems((prev) =>
        prev.map((item) =>
          item.status === "queued" || item.status === "sending"
            ? { ...item, status: "ready", error: "" }
            : item,
        ),
      );
    } finally {
      setBusy(false);
      setBusyMode("");
      setBusyLabel("");
    }
  };

  return (
    <>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-text-heading">Review generated drafts</p>
          <p className="mt-0.5 text-xs text-text-muted">Edit drafts before sending them to clients.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>{readyCount} ready on this page</span>
            <span>{Number(pagination.total || 0)} drafts total</span>
            {isPaused ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                Paused
              </span>
            ) : null}
          </div>
          {hasDrafts ? (
            <button
              type="button"
              onClick={clearDrafts}
              disabled={busy && !isGenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete all drafts
            </button>
          ) : null}
          {canPauseJob ? (
            <button
              type="button"
              onClick={pauseDraftJob}
              disabled={isPausing || isSending || isClearing}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {isPausing ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
              Pause
            </button>
          ) : canResumeJob ? (
            <button
              type="button"
              onClick={resumeDraftJob}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/[0.06] disabled:opacity-60"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Resume
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/35 p-5">
        {!restoreChecked ? (
          <div className="rounded-xl border border-dashed border-border bg-background-light/50 px-4 py-10 text-center">
            <Loader2 className="mx-auto animate-spin text-primary" size={30} />
            <p className="mt-2 text-sm font-semibold text-text-heading">Restoring saved follow-ups...</p>
            <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-text-muted">
              Checking for drafts already generated by the backend.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-primary/[0.025] to-primary/[0.08] px-6 py-12 text-center shadow-sm shadow-slate-900/[0.03]">
            <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-white text-primary shadow-sm">
              <Mail size={24} />
            </div>
            <p className="relative mt-4 text-base font-bold text-text-heading">{emptyStateCopy.title}</p>
            <p className="relative mx-auto mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              {emptyStateCopy.description}
            </p>
            <div className="relative mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-text-muted">
              {emptyStateCopy.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-white px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={generateDrafts}
              disabled={busy}
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
            >
              {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              {isGenerating ? emptyStateCopy.generatingLabel : emptyStateCopy.generateLabel}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/80 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Mail className="mt-0.5 shrink-0 text-primary" size={16} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text-heading">{item.name}</span>
                      <span className="block truncate text-xs text-text-muted">{item.email || item.error}</span>
                      {item.subject ? (
                        <span className="mt-1 block truncate text-xs font-medium text-text-heading">{item.subject}</span>
                      ) : null}
                      {item.error ? <span className="mt-1 block text-xs text-red-600">{item.error}</span> : null}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "ready" ? (
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        disabled={isSending || isClearing || Boolean(editingBusyId)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-text-heading hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                    ) : null}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        item.status === "error"
                          ? "border-red-100 bg-red-50 text-red-600"
                          : item.status === "sent"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : item.status === "sending"
                              ? "border-amber-100 bg-amber-50 text-amber-700"
                              : item.status === "ready"
                                ? "border-primary/15 bg-primary/[0.06] text-primary"
                                : "border-border bg-slate-50 text-text-muted"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-text-muted">
            {busy ? busyLabel : jobError || "Clients need an email. If chat context is missing, available properties are used."}
          </p>
          {Number(pagination.total || 0) > BULK_ITEMS_PAGE_SIZE ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 font-semibold text-text-heading transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              <span>
                Page <span className="font-semibold text-text-heading">{currentPage}</span> of{" "}
                <span className="font-semibold text-text-heading">{totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 font-semibold text-text-heading transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {items.length ? (
            <button
              type="button"
              onClick={generateDrafts}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-heading hover:bg-slate-50 disabled:opacity-60"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              {isGenerating
                ? generatingAction === "regenerate"
                  ? "Regenerating..."
                  : "Generating..."
                : "Regenerate"}
            </button>
          ) : null}
          {hasDrafts ? (
            <button
              type="button"
              onClick={sendSelected}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
            >
              {isSending ? <Loader2 size={14} className="animate-spin" /> : readyCount === 0 && items.length > 0 ? <CheckCircle2 size={14} /> : <Send size={14} />}
              Send all ready
            </button>
          ) : null}
        </div>
      </div>
    </section>
    {editingItem ? (
      <div className="fixed inset-y-0 left-0 right-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-6 pt-20 backdrop-blur-sm lg:left-60">
        <div className="flex max-h-[74vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-slate-950/20">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-heading">Edit follow-up draft</p>
              <p className="mt-1 truncate text-xs text-text-muted">
                {editingItem.name} · {editingItem.email}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={Boolean(editingBusyId)}
              className="rounded-lg p-1.5 text-text-muted transition hover:bg-slate-100 hover:text-text-heading disabled:opacity-50"
              aria-label="Close edit draft"
            >
              <X size={17} />
            </button>
          </div>

          {isAgentProfessional ? (
          <div className="border-b border-border bg-white px-5 py-2.5">
            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1">
              {[
                ["message", "Email text"],
                ["listings", "Recommended listings"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEditingTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    editingTab === tab
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-muted hover:bg-white hover:text-text-heading"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 px-5 py-4">
            {!isAgentProfessional || editingTab === "message" ? (
              <>
                <label className="block text-xs font-semibold text-text-heading" htmlFor="bulk-draft-subject">
                  Subject
                </label>
                <input
                  id="bulk-draft-subject"
                  value={editingSubject}
                  onChange={(e) => setEditingSubject(e.target.value)}
                  disabled={Boolean(editingBusyId)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-heading outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  placeholder="Subject"
                />

                <label className="mt-4 block text-xs font-semibold text-text-heading" htmlFor="bulk-draft-body">
                  Email body
                </label>
                <textarea
                  id="bulk-draft-body"
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  disabled={Boolean(editingBusyId)}
                  rows={12}
                  className="mt-1.5 min-h-[240px] w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm leading-6 text-text-heading outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  placeholder="Email body"
                />
              </>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-xs font-semibold text-text-heading">Recommended listings</p>
                  <p className="text-[11px] text-text-muted">
                    These are generated from the email preview and cannot be edited here.
                  </p>
                </div>
                <iframe
                  key={`${editingItem.id}-listings`}
                  title="Draft listing table preview"
                  srcDoc={listingsPreviewDocument(editingItem.previewHtml)}
                  className="h-[390px] w-full border-0 bg-white"
                />
              </div>
            )}

            {editingError ? (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {editingError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-5 py-3">
            <p className="text-xs text-text-muted">
              {isAgentProfessional
                ? "Only the subject and email text can be edited. Listings are generated from the preview."
                : "Only the subject and email text can be edited."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={Boolean(editingBusyId)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-heading hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={13} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraftEdit}
                disabled={Boolean(editingBusyId)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
              >
                {editingBusyId ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingBusyId ? "Saving..." : "Save draft"}
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
