"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, MessageCircle, RotateCcw } from "lucide-react";
import {
  clearChatSession,
  fetchChatPropertyMatches,
  getOrCreateSessionId,
  getVisitorId,
  postChatScorePreview,
  resetChatIdentity,
  sendChatMessage,
  setVisitorId,
} from "@/lib/chatClient";
import { motion, AnimatePresence } from "framer-motion";
import QuickReplyButtons from "./QuickReplyButtons";
import ConversationProgress from "./ConversationProgress";
import AgentLeadOnboarding from "./AgentLeadOnboarding";
import RolePreflightLeadForm from "./RolePreflightLeadForm";
import {
  agentUserSummaryLine,
  buildAgentFormContactOverride,
  buildAgentFormData,
  buildAgentOpeningMessage,
  buildLeadProfileNarrative,
  emptyAgentLeadDraft,
  LEAD_STEP_LABELS,
  PRE_CHAT_STEPS,
  widgetRoleToChatAgentType,
} from "./agentLeadCapture";
import {
  buildLawyerFormContact,
  buildLawyerFormData,
  buildLawyerLeadProfileNarrative,
  buildLawyerOpeningMessage,
  buildMortgageFormContact,
  buildMortgageFormData,
  buildMortgageLeadProfileNarrative,
  buildMortgageOpeningMessage,
  emptyPreflightDraftForRole,
  LAWYER_PREFLIGHT_HEADER_LABELS,
  MORTGAGE_PREFLIGHT_HEADER_LABELS,
  ROLE_LIVE_CHAT_PROGRESS_STEPS,
  rolePreflightUserSummaryLine,
} from "./rolePreflightCapture";
import {
  getChatWidgetRolePresentation,
  getWidgetRoleShortLabel,
  normalizeWidgetRole,
} from "@/lib/chatWidgetRoleUi";
import { parseInlineMarkdownLinks } from "@/lib/chatMarkdown";
const formatTime = (date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
};

/** Compact first user message: white copy, bold labels, paragraph flow (no form grid). */
function LeadProfileUserBubble({ headline, paragraphs }) {
  const linkClass = "text-white underline font-semibold decoration-white/80";
  return (
    <div className="text-left text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-white m-0 mb-2 opacity-95">
        {headline}
      </p>
      <div className="space-y-2 text-[12px] leading-[1.55] text-white font-normal [&_strong]:text-white [&_strong]:font-semibold">
        {paragraphs.map((md, i) => (
          <p key={i} className="m-0">
            {parseInlineMarkdownLinks(md, linkClass)}
          </p>
        ))}
      </div>
    </div>
  );
}

const buildPropertyPickMessage = (property, context = "buy") => {
  const title = String(property?.title || "").trim();
  const place = String(property?.address || property?.location || "").trim();
  const price = property?.price != null ? (formatPrice(property.price) || `$${property.price}`) : "";
  const summary = [title, place, price].filter(Boolean).join(" • ");
  const refId = property?.id ? ` (ref: ${property.id})` : "";

  if (context === "sell") {
    return summary
      ? `I selected this comparable: ${summary}${refId}. Please guide me on pricing strategy and next steps.`
      : `I selected this comparable${refId}. Please guide me on pricing strategy and next steps.`;
  }
  return summary
    ? `I selected this property: ${summary}${refId}. Please guide me on viewing and next steps.`
    : `I selected this property${refId}. Please guide me on viewing and next steps.`;
};

const isDetailsConfirmationMessage = (text) => {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return false;
  const exact = new Set([
    "yes",
    "y",
    "yep",
    "yeah",
    "sure",
    "correct",
    "confirmed",
    "looks good",
    "all good",
    "perfect",
    "right",
    "ok",
    "okay",
    "agreed",
    "approved",
    "go ahead",
    "please proceed",
  ]);
  if (exact.has(t)) return true;
  return (
    /details?.*(correct|right|good|fine|ok|okay|perfect|great|accurate)/.test(t) ||
    /(everything|all(\s+the)?\s+details?).*(correct|right|good|fine|ok|okay|perfect|great)/.test(t) ||
    /(looks?|seems?).*(correct|right|good|fine|perfect|great)/.test(t) ||
    /(confirm|confirmed).*(details?|information|info)/.test(t) ||
    /\b(entered\s+)?details?\s+(are|is)\s+(perfect|correct|right|good|fine|accurate)\b/.test(t) ||
    /\b(that'?s|it'?s)\s+(all\s+)?(correct|right|perfect|accurate|good|fine)\b/.test(t) ||
    /\b(all|everything)\s+(is|sounds?|looks?)\s+(correct|good|perfect|fine)\b/.test(t) ||
    /\b(no\s+)?changes?\s+(needed|required)\b/.test(t) ||
    /\b(that'?s|sounds?|looks?)\s+(perfect|great|good)\b/.test(t) ||
    /\b(spot\s+on|exactly|precisely)\b/.test(t)
  );
};

const BULLET_LINE_RE = /^(-|\*|•)\s+/;

const isBulletLine = (trimmed) => Boolean(trimmed && BULLET_LINE_RE.test(trimmed));

const stripBulletMarker = (trimmed) => trimmed.replace(BULLET_LINE_RE, "");

function jaccardWordSimilarity(a, b) {
  const wordsA = new Set(String(a).toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const wordsB = new Set(String(b).toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  let inter = 0;
  for (const w of wordsA) if (wordsB.has(w)) inter += 1;
  const union = wordsA.size + wordsB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function areProseBlocksRedundant(a, b) {
  const na = String(a).toLowerCase().replace(/\s+/g, " ").trim();
  const nb = String(b).toLowerCase().replace(/\s+/g, " ").trim();
  if (na.length < 28 || nb.length < 28) return false;
  if (jaccardWordSimilarity(na, nb) >= 0.45) return true;
  const snip = 56;
  if (na.includes(nb.slice(0, Math.min(snip, nb.length))) || nb.includes(na.slice(0, Math.min(snip, na.length))))
    return true;
  return false;
}

/** Collapse near-duplicate paragraphs from the assistant (common with closing / legal copy). */
function dedupeLawyerAssistantProse(raw) {
  const blocks = String(raw ?? "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocks.length < 2) return String(raw ?? "");
  const out = [blocks[0]];
  for (let i = 1; i < blocks.length; i += 1) {
    const cur = blocks[i];
    const prev = out[out.length - 1];
    if (areProseBlocksRedundant(prev, cur)) {
      if (cur.length > prev.length) out[out.length - 1] = cur;
      continue;
    }
    out.push(cur);
  }
  return out.join("\n\n");
}

/** Splits message into prose blocks, blank spacers, and consecutive markdown-style bullet runs. */
const segmentMessageLines = (raw) => {
  const lines = String(raw ?? "").split("\n");
  const segments = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      segments.push({ type: "blank" });
      i++;
      continue;
    }
    if (isBulletLine(trimmed)) {
      const bulletLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        if (!isBulletLine(t)) break;
        bulletLines.push(lines[i]);
        i++;
      }
      segments.push({ type: "bullets", lines: bulletLines });
    } else {
      const textLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        if (isBulletLine(t)) break;
        textLines.push(lines[i]);
        i++;
      }
      segments.push({ type: "text", lines: textLines });
    }
  }
  return segments;
};

const renderMessageSegments = (content, msgIdx, isUser, widgetRole = "agent") => {
  const linkClass = isUser ? "text-white underline" : "text-primary";
  const segments = segmentMessageLines(content);
  const nodes = [];
  let k = 0;

  for (const seg of segments) {
    if (seg.type === "blank") {
      nodes.push(<div key={`msg-${msgIdx}-sp-${k++}`} className="h-2" />);
      continue;
    }
    if (seg.type === "text") {
      for (const line of seg.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        nodes.push(
          <div key={`msg-${msgIdx}-tx-${k++}`}>
            <span>{parseInlineMarkdownLinks(line, linkClass)}</span>
          </div>,
        );
      }
      continue;
    }
    if (seg.type === "bullets") {
      const lawyerAssistant = !isUser && widgetRole === "lawyer";
      const listClassName = lawyerAssistant
        ? "my-1.5 rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-2 space-y-1.5"
        : !isUser
          ? "my-1.5 rounded-xl border border-border/80 bg-gradient-to-b from-emerald-50/40 to-background-light/95 px-3 py-2.5 space-y-2 shadow-sm"
          : "my-1 space-y-1.5";
      nodes.push(
        <div key={`msg-${msgIdx}-bl-${k++}`} className={listClassName}>
          {seg.lines.map((line, bi) => {
            const trimmed = line.trim();
            const inner = stripBulletMarker(trimmed);
            return (
              <div key={`msg-${msgIdx}-b-${bi}`} className="flex gap-2.5 items-start text-left">
                <span
                  className={`mt-0.5 shrink-0 w-5 text-center text-[13px] font-semibold leading-relaxed ${
                    isUser ? "text-white/90" : lawyerAssistant ? "text-indigo-600" : "text-primary"
                  }`}
                  aria-hidden
                >
                  •
                </span>
                <span className="flex-1 min-w-0 leading-relaxed">
                  {parseInlineMarkdownLinks(inner, linkClass)}
                </span>
              </div>
            );
          })}
        </div>,
      );
    }
  }

  return nodes.length ? nodes : null;
};

export default function ChatWidget({
  embedToken,
  widgetRole,
  defaultOpen = true,
  allowLauncher = true,
  launcherLabel,
  title,
  subtitle,
  inlineMode = false,
  initialGreeting,
  /** Public HTTPS URL for embed owner avatar (from /api/embed/resolve or session). */
  hostAvatarUrl = "",
  /** Fallback header name when `title` is not set (e.g. professional full name). */
  hostDisplayName = "",
}) {
  const resolvedRole = normalizeWidgetRole(widgetRole);
  const roleUi = getChatWidgetRolePresentation(resolvedRole);
  const roleBadgeLabel = getWidgetRoleShortLabel(resolvedRole);
  const trimmedHostName = hostDisplayName != null && String(hostDisplayName).trim() ? String(hostDisplayName).trim() : "";
  const displayTitle =
    title != null && String(title).trim()
      ? String(title).trim()
      : trimmedHostName || roleUi.defaultTitle;
  const displaySubtitleBase =
    subtitle != null && String(subtitle).trim()
      ? String(subtitle).trim()
      : roleUi.defaultSubtitle;
  const displayGreeting =
    initialGreeting != null && String(initialGreeting).trim()
      ? String(initialGreeting).trim()
      : roleUi.defaultGreeting;
  const effectiveLauncherLabel = launcherLabel ?? roleUi.launcherAriaLabel;
  const useAgentLeadForm = resolvedRole === "agent";
  const useRolePreflight = resolvedRole === "lawyer" || resolvedRole === "mortgage_broker";

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== "undefined" ? getOrCreateSessionId() : "",
  );
  const [visitorId, setVisitorIdState] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const lastPropertyMatchesSignatureRef = useRef("");
  const shouldFetchMatchesOnNextAssistantReplyRef = useRef(false);
  const lastOutboundUserTextRef = useRef("");
  const latestCalendlyLinkRef = useRef("");

  const [leadFlowStep, setLeadFlowStep] = useState(() => {
    if (resolvedRole === "agent") return "intent";
    if (resolvedRole === "lawyer" || resolvedRole === "mortgage_broker") return "details";
    return "chat";
  });
  const [chosenIntent, setChosenIntent] = useState(null);
  const [leadDraft, setLeadDraft] = useState(() => emptyAgentLeadDraft());
  const [rolePreflightDraft, setRolePreflightDraft] = useState(() =>
    emptyPreflightDraftForRole(resolvedRole),
  );
  const [formValidationError, setFormValidationError] = useState("");
  const [leadFormContact, setLeadFormContact] = useState(null);
  const [rolePreflightStepIndex, setRolePreflightStepIndex] = useState(0);
  const [hostAvatarBroken, setHostAvatarBroken] = useState(false);
  const trimmedAvatarUrl = hostAvatarUrl != null && String(hostAvatarUrl).trim() ? String(hostAvatarUrl).trim() : "";
  const showHostAvatar = Boolean(trimmedAvatarUrl && !hostAvatarBroken);

  useEffect(() => {
    setHostAvatarBroken(false);
  }, [trimmedAvatarUrl]);

  useEffect(() => {
    const r = normalizeWidgetRole(widgetRole);
    if (r === "lawyer" || r === "mortgage_broker") {
      setLeadFlowStep("details");
      setRolePreflightDraft(emptyPreflightDraftForRole(r));
      setRolePreflightStepIndex(0);
    } else if (r !== "agent") {
      setLeadFlowStep("chat");
    }
  }, [widgetRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (resolvedRole === "lawyer") {
      const { sessionId: nextSid } = resetChatIdentity();
      setSessionId(nextSid);
      setVisitorIdState("");
      return;
    }
    const sid = getOrCreateSessionId();
    setSessionId((prev) => (String(prev || "").trim() ? prev : sid));
    const vid = getVisitorId();
    if (vid) setVisitorIdState(vid);
  }, [resolvedRole]);

  useEffect(() => {
    if (useAgentLeadForm && leadFlowStep !== "chat") return;
    if (useRolePreflight && leadFlowStep !== "chat") return;
    if (!displayGreeting || messages.length) return;
    setMessages([
      {
        role: "assistant",
        content: displayGreeting,
        timestamp: new Date(),
      },
    ]);
  }, [useAgentLeadForm, useRolePreflight, leadFlowStep, displayGreeting, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, leadFlowStep]);

  const addMessage = useCallback((role, content, extras = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date(),
        ...extras,
      },
    ]);
  }, []);

  const appendPropertyMatchesMessage = useCallback(
    async ({ currentVisitorId, formContactSnapshot }) => {
      if (!embedToken || !sessionId || !useAgentLeadForm) return;
      try {
        const payload = await fetchChatPropertyMatches({
          sessionId,
          embedToken,
          visitorId: currentVisitorId || visitorId,
          formContact: formContactSnapshot || leadFormContact || undefined,
          page: 1,
          limit: 5,
        });
        const meta = payload?.meta || {};
        const matches = Array.isArray(meta.property_matches) ? meta.property_matches : [];
        const signature = [
          String(meta.property_matches_context || ""),
          String(meta.pagination?.total || matches.length),
          matches
            .map((m) => String(m?.id || `${m?.title || ""}-${m?.listing_url || ""}`))
            .join("|"),
        ].join("::");
        if (signature === lastPropertyMatchesSignatureRef.current) return;
        lastPropertyMatchesSignatureRef.current = signature;
        // No second bubble when there are no matches — the main assistant reply already covers next steps / booking.
        if (!matches.length) return;
        addMessage(
          "assistant",
          meta.property_matches_context === "sell"
            ? "Here are comparable properties based on your details:"
            : "Here are properties that may match your request:",
          {
            propertyMatches: matches,
            propertyMatchesContext: meta.property_matches_context || null,
            propertyMatchesNote: meta.property_matches_note || null,
          },
        );
      } catch (err) {
        setError(err?.message || "Property matches could not be loaded.");
      }
    },
    [addMessage, embedToken, sessionId, useAgentLeadForm, visitorId, leadFormContact, setError],
  );

  const applyChatPayload = useCallback(
    (payload, currentVisitorId, formContactSnapshot = null) => {
      const meta = payload?.meta || {};
      const reply = payload?.reply ?? payload?.response;
      const intent = meta.intent ?? payload?.intent;
      const action = meta.next_action ?? payload?.next_action;
      const extracted = payload?.extracted_data || meta.extracted_data || {};

      if (intent === "buy" || intent === "sell") setStep(1);
      if (extracted?.budget || extracted?.timeline) setStep(2);
      if (action === "collect_contact") setStep(3);
      if (action === "offer_booking") setStep(4);

      if (action === "collect_contact") {
        setQuickReplies(["Share email", "Share phone", "Maybe later"]);
      } else {
        setQuickReplies([]);
      }

      const returnedVisitor =
        meta.visitorId || payload?.visitor_id || payload?.visitorId || meta.visitor_id;
      const visitorForMatches = String(currentVisitorId || returnedVisitor || "").trim();
      if (returnedVisitor && !currentVisitorId) {
        setVisitorId(returnedVisitor);
        setVisitorIdState(returnedVisitor);
      }
      if (meta.calendly_link && typeof meta.calendly_link === "string") {
        latestCalendlyLinkRef.current = meta.calendly_link;
      }

      addMessage("assistant", reply || "Thanks! How else can I help?");
      const wantsMatchesAfterConfirm =
        shouldFetchMatchesOnNextAssistantReplyRef.current ||
        (Boolean(meta.property_matches_available) &&
          isDetailsConfirmationMessage(lastOutboundUserTextRef.current));
      if (wantsMatchesAfterConfirm) {
        shouldFetchMatchesOnNextAssistantReplyRef.current = false;
        appendPropertyMatchesMessage({
          currentVisitorId: visitorForMatches,
          formContactSnapshot,
        });
      }
    },
    [addMessage, appendPropertyMatchesMessage],
  );

  const handleSend = async (overrideText = null) => {
    const text = overrideText || input.trim();
    if (!text || loading || !embedToken || !sessionId) return;

    if (!overrideText) setInput("");
    lastOutboundUserTextRef.current = text;
    addMessage("user", text);
    shouldFetchMatchesOnNextAssistantReplyRef.current = isDetailsConfirmationMessage(text);
    setLoading(true);
    setError("");
    setQuickReplies([]);

    try {
      const response = await sendChatMessage({
        message: text,
        sessionId,
        embedToken,
        visitorId,
        agentType: widgetRoleToChatAgentType(resolvedRole),
        formContact: leadFormContact || undefined,
      });

      const payload = response?.data || response;
      applyChatPayload(payload, visitorId, leadFormContact);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleStartChatFromForm = async () => {
    if (!chosenIntent || !sessionId || !embedToken || loading) return;

    const name = leadDraft.name.trim();
    const phone = leadDraft.phone.trim();
    const email = leadDraft.email.trim();
    if (!name || !phone || !email) {
      setFormValidationError("Please add your name, phone, and email to continue.");
      return;
    }
    const requiredFields =
      chosenIntent === "buy"
        ? [
            "location",
            "budget",
            "property_type",
            "beds",
            "baths",
            "must_have_features",
            "parking_required",
            "backyard_needed",
            "school_district_important",
            "timeline",
            "mortgage_status",
            "realtor_status",
            "motivation_reason",
            "viewing_readiness",
            "living_situation",
            "urgency_readiness",
            "preferred_contact_method",
            "best_time_to_contact",
          ]
        : [
            "address",
            "price",
            "property_type",
            "beds",
            "baths",
            "must_have_features",
            "parking_required",
            "backyard_needed",
            "timeline",
            "mortgage_status",
            "realtor_status",
            "motivation_reason",
            "viewing_readiness",
            "living_situation",
            "urgency_readiness",
            "preferred_contact_method",
            "best_time_to_contact",
          ];
    const missing = requiredFields.filter((key) => {
      const value = leadDraft?.[key];
      return value == null || String(value).trim() === "";
    });
    if (missing.length) {
      setFormValidationError("Please complete all onboarding fields to start chat.");
      return;
    }
    setFormValidationError("");

    const formData = buildAgentFormData(chosenIntent, leadDraft);
    const formContact = buildAgentFormContactOverride(formData);
    const opening = buildAgentOpeningMessage(chosenIntent, formData);
    const summary = agentUserSummaryLine(chosenIntent, formData);
    const leadProfilePreview = buildLeadProfileNarrative(chosenIntent, formData);

    setLeadFormContact(formContact);
    setLeadFlowStep("chat");
    setMessages([
      {
        role: "user",
        content: summary,
        leadProfilePreview,
        timestamp: new Date(),
      },
    ]);
    setLoading(true);
    setError("");
    setQuickReplies([]);
    lastOutboundUserTextRef.current = opening;
    shouldFetchMatchesOnNextAssistantReplyRef.current = false;
    lastPropertyMatchesSignatureRef.current = "";

    try {
      const response = await sendChatMessage({
        message: opening,
        sessionId,
        embedToken,
        visitorId,
        agentType: widgetRoleToChatAgentType(resolvedRole),
        formContact,
      });
      const payload = response?.data || response;
      applyChatPayload(payload, visitorId, formContact);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleStartChatFromRolePreflight = async () => {
    if (!sessionId || !embedToken || loading || !useRolePreflight) return;

    const name = rolePreflightDraft.name.trim();
    const phone = rolePreflightDraft.phone.trim();
    const email = rolePreflightDraft.email.trim();
    if (!name || !phone || !email) {
      setFormValidationError("Please add your name, phone, and email to continue.");
      return;
    }
    if (resolvedRole === "lawyer") {
      const requiredLawyerFields = [
        "address",
        "transaction_stage",
        "closing_timeline",
        "transaction_type",
        "property_value",
        "mortgage_status",
        "realtor_involved",
        "first_time_buyer",
        "legal_services_needed",
        "preferred_contact_method",
        "best_time_to_contact",
      ];
      const missing = requiredLawyerFields.filter((key) => {
        const value = rolePreflightDraft?.[key];
        return value == null || String(value).trim() === "";
      });
      if (missing.length) {
        setFormValidationError("Please complete all lawyer intake fields to continue.");
        return;
      }
    }
    setFormValidationError("");

    const formData =
      resolvedRole === "lawyer" ? buildLawyerFormData(rolePreflightDraft) : buildMortgageFormData(rolePreflightDraft);
    const formContact =
      resolvedRole === "lawyer"
        ? buildLawyerFormContact(rolePreflightDraft)
        : buildMortgageFormContact(rolePreflightDraft);
    const opening =
      resolvedRole === "lawyer" ? buildLawyerOpeningMessage(formData) : buildMortgageOpeningMessage(formData);
    const summary = rolePreflightUserSummaryLine(resolvedRole, rolePreflightDraft);
    const leadProfilePreview =
      resolvedRole === "lawyer"
        ? buildLawyerLeadProfileNarrative(rolePreflightDraft)
        : buildMortgageLeadProfileNarrative(rolePreflightDraft);

    const professionalType = resolvedRole === "lawyer" ? "lawyer" : "mortgage_broker";
    void postChatScorePreview({ formContact, professionalType });

    setLeadFormContact(formContact);
    setLeadFlowStep("chat");
    setMessages([
      {
        role: "user",
        content: summary,
        leadProfilePreview,
        timestamp: new Date(),
      },
    ]);
    setLoading(true);
    setError("");
    setQuickReplies([]);
    lastOutboundUserTextRef.current = opening;
    shouldFetchMatchesOnNextAssistantReplyRef.current = false;
    lastPropertyMatchesSignatureRef.current = "";

    try {
      const response = await sendChatMessage({
        message: opening,
        sessionId,
        embedToken,
        visitorId,
        agentType: widgetRoleToChatAgentType(resolvedRole),
        formContact,
      });
      const payload = response?.data || response;
      applyChatPayload(payload, visitorId, formContact);
    } catch (err) {
      setError(err?.message || "Request failed.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleRolePreflightFormCancel = () => {
    setFormValidationError("");
    setRolePreflightDraft(emptyPreflightDraftForRole(resolvedRole));
    setRolePreflightStepIndex(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    try {
      await clearChatSession(sessionId);
      setMessages([]);
      setLeadFormContact(null);
      setStep(0);
      setQuickReplies([]);
      lastOutboundUserTextRef.current = "";
      shouldFetchMatchesOnNextAssistantReplyRef.current = false;
      lastPropertyMatchesSignatureRef.current = "";
      if (useAgentLeadForm) {
        setLeadFlowStep("intent");
        setChosenIntent(null);
        setLeadDraft(emptyAgentLeadDraft());
        setFormValidationError("");
      } else if (useRolePreflight) {
        setLeadFlowStep("details");
        setRolePreflightDraft(emptyPreflightDraftForRole(resolvedRole));
        setRolePreflightStepIndex(0);
        setFormValidationError("");
      }
    } catch (err) {
      setError(err?.message || "Unable to clear conversation.");
    }
  };

  /** Clears server thread, new session + visitor, full reset (agent = back to step 1). */
  const handleStartNewRequest = async () => {
    if (!sessionId) return;
    setError("");
    setFormValidationError("");
    try {
      await clearChatSession(sessionId);
    } catch (_err) {
      /* still reset locally */
    }
    const { sessionId: nextSid } = resetChatIdentity();
    setSessionId(nextSid);
    setVisitorIdState("");
    setMessages([]);
    setLeadFormContact(null);
    setStep(0);
    setQuickReplies([]);
    setInput("");
    lastOutboundUserTextRef.current = "";
    shouldFetchMatchesOnNextAssistantReplyRef.current = false;
    lastPropertyMatchesSignatureRef.current = "";
    if (useAgentLeadForm) {
      setLeadFlowStep("intent");
      setChosenIntent(null);
      setLeadDraft(emptyAgentLeadDraft());
    } else if (useRolePreflight) {
      setLeadFlowStep("details");
      setRolePreflightDraft(emptyPreflightDraftForRole(resolvedRole));
      setRolePreflightStepIndex(0);
    }
  };

  const onboardingGoBack = useCallback(() => {
    setFormValidationError("");
    if (leadFlowStep === "contact") setLeadFlowStep("intent");
    else if (leadFlowStep === "property") setLeadFlowStep("contact");
    else if (leadFlowStep === "qualify") setLeadFlowStep("property");
    else if (leadFlowStep === "reach") setLeadFlowStep("qualify");
  }, [leadFlowStep]);

  const onboardingGoForward = useCallback(() => {
    setFormValidationError("");
    const missingAgentFields = (fields) =>
      fields.filter((key) => {
        const value = leadDraft?.[key];
        return value == null || String(value).trim() === "";
      });
    if (leadFlowStep === "intent") {
      if (!chosenIntent) {
        setFormValidationError("Please select whether you are buying or selling.");
        return;
      }
      setLeadFlowStep("contact");
      return;
    }
    if (leadFlowStep === "contact") {
      const name = leadDraft.name.trim();
      const phone = leadDraft.phone.trim();
      const email = leadDraft.email.trim();
      if (!name || !phone || !email) {
        setFormValidationError("Please fill in your name, phone, and email.");
        return;
      }
      setLeadFlowStep("property");
      return;
    }
    if (leadFlowStep === "property") {
      const requiredFields =
        chosenIntent === "buy"
          ? [
              "location",
              "budget",
              "property_type",
              "beds",
              "baths",
              "must_have_features",
              "parking_required",
              "backyard_needed",
              "school_district_important",
            ]
          : [
              "address",
              "price",
              "property_type",
              "beds",
              "baths",
              "must_have_features",
              "parking_required",
              "backyard_needed",
            ];
      if (missingAgentFields(requiredFields).length) {
        setFormValidationError("Please complete all property details before continuing.");
        return;
      }
      setLeadFlowStep("qualify");
      return;
    }
    if (leadFlowStep === "qualify") {
      if (
        missingAgentFields([
          "timeline",
          "mortgage_status",
          "realtor_status",
          "motivation_reason",
          "viewing_readiness",
          "living_situation",
          "urgency_readiness",
        ]).length
      ) {
        setFormValidationError("Please complete all qualification details before continuing.");
        return;
      }
      setLeadFlowStep("reach");
      return;
    }
    if (leadFlowStep === "reach") {
      if (missingAgentFields(["preferred_contact_method", "best_time_to_contact"]).length) {
        setFormValidationError("Please complete all contact preference fields.");
      }
    }
  }, [leadFlowStep, chosenIntent, leadDraft]);

  const disabledSend = !input.trim() || loading || !embedToken;
  const showConversationProgress =
    useAgentLeadForm && leadFlowStep === "chat" && Boolean(leadFormContact);
  const showRoleChatProgress =
    useRolePreflight && resolvedRole !== "lawyer" && leadFlowStep === "chat" && Boolean(leadFormContact);

  const headerSubtitle =
    useAgentLeadForm && leadFlowStep !== "chat"
      ? (() => {
          const i = PRE_CHAT_STEPS.indexOf(leadFlowStep);
          const n = i >= 0 ? i + 1 : 1;
          const label = LEAD_STEP_LABELS[leadFlowStep] || "";
          return `Step ${n} of ${PRE_CHAT_STEPS.length} · ${label}`;
        })()
      : useRolePreflight && leadFlowStep === "details"
        ? (() => {
            const labels =
              resolvedRole === "lawyer" ? LAWYER_PREFLIGHT_HEADER_LABELS : MORTGAGE_PREFLIGHT_HEADER_LABELS;
            const label = labels[rolePreflightStepIndex] || "";
            return `Step ${rolePreflightStepIndex + 1} of 3 · ${label}`;
          })()
        : useRolePreflight && leadFlowStep === "chat"
          ? ""
          : displaySubtitleBase;

  const header = (
    <div className={roleUi.headerClass}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showHostAvatar ? (
          <div
            className={`flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ${
              resolvedRole === "agent"
                ? "ring-border/30 bg-background-light"
                : "ring-white/20 bg-white/10"
            }`}
          >
            <img
              src={trimmedAvatarUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setHostAvatarBroken(true)}
            />
          </div>
        ) : (
          <div className={roleUi.iconBubbleClass}>
            <MessageCircle size={18} aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Use div, not h3: globals.css applies text-text-heading to all headings and can override role header colors. */}
            <div className={`${roleUi.headerTitleClass} min-w-0`} role="heading" aria-level={3}>
              {displayTitle}
            </div>
            <span className={roleUi.headerRoleBadgeClass}>{roleBadgeLabel}</span>
          </div>
          {headerSubtitle ? (
            <p className={`m-0 mt-0.5 ${roleUi.headerSubtitleClass}`}>{headerSubtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={roleUi.statusPillClass}
          title="This assistant is online and ready to chat."
        >
          <span className={roleUi.statusDotClass} />
          Online
        </span>
        {!inlineMode ? (
          <button
            onClick={() => setIsOpen(false)}
            className={roleUi.closeButtonClass}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );

  const chatBody = (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background-light scrollbar-hide">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={`${msg.role}-${idx}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              {!isUser && showHostAvatar ? (
                <div
                  className={`w-8 h-8 rounded-full shrink-0 overflow-hidden border ${roleUi.accentBorder || "border-primary/20"}`}
                >
                  <img
                    src={trimmedAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setHostAvatarBroken(true)}
                  />
                </div>
              ) : !isUser && resolvedRole !== "lawyer" ? (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${roleUi.accentBgLighter || "bg-primary/10"} ${roleUi.accentText || "text-primary"} ${roleUi.accentBorder || "border-primary/20"}`}>
                  <MessageCircle size={14} />
                </div>
              ) : null}
              <div
                className={`${
                  isUser && msg.leadProfilePreview ? "max-w-[min(92%,21rem)]" : resolvedRole === "lawyer" && !isUser ? "max-w-[min(96%,24rem)]" : "max-w-[85%]"
                } rounded-2xl px-4 py-2.5 shadow-sm relative ${
                  isUser
                    ? `${roleUi.accentBg || "bg-primary"} text-white`
                    : "bg-white border border-border text-text-heading"
                }`}
              >
                <div
                  className="text-[13px] leading-relaxed break-words space-y-1 [&_a]:underline [&_a]:font-semibold"
                  {...(isUser && msg.leadProfilePreview
                    ? { "aria-label": msg.content ?? "Your profile summary" }
                    : {})}
                >
                  {isUser && msg.leadProfilePreview ? (
                    <LeadProfileUserBubble
                      headline={msg.leadProfilePreview.headline}
                      paragraphs={msg.leadProfilePreview.paragraphs}
                    />
                  ) : (
                    renderMessageSegments(
                      !isUser && resolvedRole === "lawyer"
                        ? dedupeLawyerAssistantProse(msg.content ?? "")
                        : (msg.content ?? ""),
                      idx,
                      isUser,
                      resolvedRole,
                    )
                  )}
                </div>
                <p
                  className={`text-[8px] mt-1 font-medium tracking-wide ${
                    isUser ? "text-white/70" : "text-text-muted text-right"
                  }`}
                >
                  {formatTime(msg.timestamp || new Date())}
                </p>

                {!isUser && idx === messages.length - 1 && quickReplies.length > 0 && (
                  <QuickReplyButtons options={quickReplies} onSelect={(opt) => handleSend(opt)} />
                )}
                {!isUser && Array.isArray(msg.propertyMatches) && msg.propertyMatches.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-border bg-background-light/70 p-2 space-y-1.5">
                    <div className="text-[10px] font-semibold text-text-heading">
                      {msg.propertyMatchesContext === "sell"
                        ? "Comparable properties"
                        : "Matching properties"}
                    </div>
                    {msg.propertyMatches.map((p, pIdx) => {
                      const reasons = Array.isArray(p?.match_reasons)
                        ? p.match_reasons
                        : Array.isArray(p?.reasons_for_matching)
                          ? p.reasons_for_matching
                          : [];
                      return (
                        <div
                          key={`${p?.id || "pm"}-${pIdx}`}
                          className="rounded-md border border-border bg-white p-2"
                        >
                          <div className="text-[10px] font-semibold text-text-heading">
                            {p?.title || "Property"}
                          </div>
                          <div className="text-[9px] text-text-muted mt-0.5">
                            {[p?.address || p?.location, p?.property_type].filter(Boolean).join(" • ")}
                          </div>
                          {p?.price != null ? (
                            <div className="text-[10px] font-semibold text-primary mt-1">
                              {formatPrice(p.price) || `$${p.price}`}
                            </div>
                          ) : null}
                          {reasons.length ? (
                            <div className="text-[9px] text-emerald-700 mt-1">
                              {reasons.slice(0, 2).join(" • ")}
                            </div>
                          ) : null}
                          {p?.listing_url ? (
                            <a
                              href={p.listing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-[9px] text-primary underline mt-1"
                            >
                              View listing
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              handleSend(buildPropertyPickMessage(p, msg.propertyMatchesContext || "buy"))
                            }
                            className="mt-1.5 w-full rounded-md bg-primary text-white text-[9px] font-semibold px-2 py-1.5 hover:brightness-95 transition"
                          >
                            Select this property
                          </button>
                        </div>
                      );
                    })}
                    {msg.propertyMatchesNote ? (
                      <div className="text-[9px] text-text-muted">{msg.propertyMatchesNote}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {loading && leadFlowStep === "chat" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex justify-start items-center ${resolvedRole === "lawyer" ? "gap-0" : "gap-2"}`}
        >
          {resolvedRole !== "lawyer" ? (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse ${roleUi.accentBgLighter || "bg-primary/10"} ${roleUi.accentText || "text-primary"}`}>
              <MessageCircle size={14} />
            </div>
          ) : null}
          <div className="bg-white border border-border rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <div className="flex gap-1">
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${roleUi.accentDot40 || "bg-primary/40"}`}></span>
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${roleUi.accentDot60 || "bg-primary/60"}`}></span>
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roleUi.accentDotFull || "bg-primary"}`}></span>
            </div>
            <span className="text-[10px] font-medium text-text-muted italic">Nesti is thinking...</span>
          </div>
        </motion.div>
      )}

      {error ? <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div> : null}

      <div ref={messagesEndRef} />
    </div>
  );

  const showPreflightChatResetRow =
    useRolePreflight && leadFlowStep === "chat" && messages.length > 0;

  const footer = (
    <div className="border-t border-border bg-white">
      <div className="p-4 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={embedToken ? "Type your message..." : "Embed token missing"}
          disabled={!embedToken}
          className={`flex-1 px-4 py-2 border border-border rounded-xl bg-background-light shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${roleUi.accentRingFocus || "focus:ring-primary/25 focus:border-primary"}`}
        />
        <button
          onClick={() => handleSend()}
          disabled={disabledSend}
          className={`px-4 py-2 text-white rounded-xl transition disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center shadow-sm disabled:hover:brightness-100 ${roleUi.accentBg || "bg-primary"} ${roleUi.accentBgHover || "hover:brightness-95"}`}
          aria-label={loading ? "Waiting for reply…" : "Send message"}
          aria-busy={loading}
        >
          <Send size={20} aria-hidden />
        </button>
      </div>

      {showPreflightChatResetRow ? (
        <div className="shrink-0 border-t border-border/60 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleStartNewRequest}
            className="text-[11px] font-medium text-text-muted hover:text-text-heading px-2 py-1.5 rounded-lg transition"
            title="Start a new request with a fresh form and chat"
          >
            Start new request
          </button>
        </div>
      ) : messages.length > 0 ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={useAgentLeadForm || useRolePreflight ? handleStartNewRequest : handleClear}
            className="text-xs text-text-muted hover:text-text-heading transition inline-flex items-center gap-1"
          >
            <RotateCcw size={12} aria-hidden />
            {useAgentLeadForm || useRolePreflight ? "Start new request" : "Clear conversation"}
          </button>
        </div>
      ) : null}
    </div>
  );

  const showRolePreflightPanel = useRolePreflight && leadFlowStep === "details";

  const mainPanel =
    useAgentLeadForm && leadFlowStep !== "chat" ? (
      <AgentLeadOnboarding
        step={leadFlowStep}
        chosenIntent={chosenIntent}
        onChooseIntent={(v) => {
          setFormValidationError("");
          setChosenIntent(v);
        }}
        draft={leadDraft}
        onFieldChange={(field, value) => setLeadDraft((d) => ({ ...d, [field]: value }))}
        onBack={onboardingGoBack}
        onForward={onboardingGoForward}
        onStartChat={handleStartChatFromForm}
        onStartOver={handleStartNewRequest}
        validationError={formValidationError}
      />
    ) : showRolePreflightPanel ? (
      <RolePreflightLeadForm
        role={resolvedRole}
        roleUi={roleUi}
        draft={rolePreflightDraft}
        onFieldChange={(field, value) =>
          setRolePreflightDraft((d) => ({ ...d, [field]: value }))
        }
        onStartChat={handleStartChatFromRolePreflight}
        onStartOver={handleRolePreflightFormCancel}
        preflightStepIndex={rolePreflightStepIndex}
        onStepBack={() => setRolePreflightStepIndex((i) => Math.max(0, i - 1))}
        onStepNext={() => setRolePreflightStepIndex((i) => Math.min(2, i + 1))}
        validationError={formValidationError}
        loading={loading}
        embedTokenMissing={!embedToken}
      />
    ) : (
      <>
        {showConversationProgress || showRoleChatProgress ? (
          <ConversationProgress
            step={showRoleChatProgress ? 1 : step}
            steps={showRoleChatProgress ? ROLE_LIVE_CHAT_PROGRESS_STEPS : undefined}
            activeBgClass={roleUi.accentBgLight}
            activeTextClass={roleUi.accentTextBold}
          />
        ) : null}
        {chatBody}
        {footer}
      </>
    );

  return (
    <>
      {allowLauncher && !inlineMode && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl ${roleUi.launcherClass}`}
          aria-label={effectiveLauncherLabel}
        >
          <MessageCircle size={24} className="shrink-0" aria-hidden />
        </button>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${
            inlineMode
              ? "relative w-full h-[600px] max-h-[70vh]"
              : "fixed bottom-6 right-6 w-[420px] max-w-[96vw] h-[640px] max-h-[85vh] z-50"
          } bg-transparent rounded-[2rem] shadow-2xl flex flex-col border border-border overflow-hidden backdrop-blur-sm`}
        >
          <div className="flex flex-col h-full min-h-0">
            {header}
            {mainPanel}
          </div>
        </motion.div>
      )}
    </>
  );
}
