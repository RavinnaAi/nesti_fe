"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import {
  clearChatSession,
  fetchChatSessionMessages,
  mapServerChatMessagesToWidget,
  fetchChatPropertyMatches,
  getOrCreateSessionId,
  getVisitorId,
  postChatScorePreview,
  persistChatSessionId,
  resetChatIdentity,
  resolveChatSessionId,
  selectChatPropertyMatch,
  sendChatMessage,
  setVisitorId,
} from "@/lib/chatClient";
import { motion } from "framer-motion";
import ConversationProgress from "./ConversationProgress";
import AgentLeadOnboarding from "./AgentLeadOnboarding";
import RolePreflightLeadForm from "./RolePreflightLeadForm";
import {
  emptyAgentLeadDraft,
  widgetRoleToChatAgentType,
} from "./agentLeadCapture";
import {
  emptyPreflightDraftForRole,
  ROLE_LIVE_CHAT_PROGRESS_STEPS,
} from "./rolePreflightCapture";
import {
  getChatWidgetRolePresentation,
  getWidgetRoleShortLabel,
  normalizeWidgetRole,
} from "@/lib/chatWidgetRoleUi";
import ChatWidgetHeader from "@/components/chatbot/widget/ChatWidgetHeader";
import ChatConversationBody from "@/components/chatbot/widget/ChatConversationBody";
import ChatWidgetFooter from "@/components/chatbot/widget/ChatWidgetFooter";
import {
  AGENT_PROPERTY_STEP_REQUIRED,
  AGENT_QUALIFY_STEP_REQUIRED,
  AGENT_REACH_STEP_REQUIRED,
  LAWYER_PREFLIGHT_REQUIRED_FIELDS,
  MORTGAGE_PREFLIGHT_REQUIRED_FIELDS,
  agentFinalRequiredFields,
  getAgentStartPayload,
  getBasicContactValidationError,
  getRolePreflightStartPayload,
  missingDraftFields,
} from "@/components/chatbot/widget/roleChatStrategy";
import { attachSellerImagesToAgentFormContact } from "@/components/chatbot/widget/agentSellerImageUpload";
import {
  assistantAnnouncingOptionCards,
  assistantOfferedAvailableOptions,
  isAvailableOptionsConsentMessage,
  isAvailableOptionsRequestMessage,
  isPropertyMatchesRequestMessage,
} from "@/lib/chatPropertyMatchesIntent";
import {
  assistantMessageHasPropertyMatches,
  stripPropertyListingFromReply,
} from "@/lib/chatReplySanitize";

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
  /** Pre-populate the agent lead draft (for property inquiry from public pages). */
  prefillLeadDraft = null,
  /** Pre-select intent ("buy" | "sell") skipping the intent step. */
  prefillIntent = null,
  /** Public profile inquiries should not reuse an older browser chat session. */
  freshSessionOnMount = false,
  /** Called when the widget's X button is clicked so parent state can sync. */
  onClose = null,
  showPropertyMatchesInChat = true,
}) {
  const [mounted, setMounted] = useState(false);
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
  const launcherPillText = `Chat with ${roleBadgeLabel}`;
  const useAgentLeadForm = resolvedRole === "agent";
  const useRolePreflight = resolvedRole === "lawyer" || resolvedRole === "mortgage_broker";

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== "undefined"
      ? freshSessionOnMount
        ? resetChatIdentity().sessionId
        : getOrCreateSessionId()
      : "",
  );
  const [visitorId, setVisitorIdState] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const lastPropertyMatchesSignatureRef = useRef("");
  const shouldFetchMatchesOnNextAssistantReplyRef = useRef(false);
  const pendingOptionsOfferRef = useRef(false);
  const lastOutboundUserTextRef = useRef("");
  const latestCalendlyLinkRef = useRef("");
  const sessionHistoryLoadedRef = useRef(false);

  const [leadFlowStep, setLeadFlowStep] = useState(() => {
    if (resolvedRole === "agent") return prefillIntent ? "contact" : "intent";
    if (resolvedRole === "lawyer" || resolvedRole === "mortgage_broker") return "details";
    return "chat";
  });
  const [chosenIntent, setChosenIntent] = useState(() => prefillIntent || null);
  const [leadDraft, setLeadDraft] = useState(() =>
    prefillLeadDraft ? { ...emptyAgentLeadDraft(), ...prefillLeadDraft } : emptyAgentLeadDraft()
  );

  // Apply prefill whenever the parent changes the property being inquired about
  const prevPrefillKeyRef = useRef(null);
  useEffect(() => {
    if (!prefillLeadDraft) return;
    const key = JSON.stringify(prefillLeadDraft);
    if (key === prevPrefillKeyRef.current) return;
    prevPrefillKeyRef.current = key;
    setLeadDraft((d) => ({ ...d, ...prefillLeadDraft }));
    if (prefillIntent) {
      setChosenIntent(prefillIntent);
      setLeadFlowStep("contact");
    }
  }, [prefillLeadDraft, prefillIntent]);
  const [sellerPropertyImageFiles, setSellerPropertyImageFiles] = useState([]);
  const [rolePreflightDraft, setRolePreflightDraft] = useState(() =>
    emptyPreflightDraftForRole(resolvedRole),
  );
  const [formValidationError, setFormValidationError] = useState("");
  const [leadFormContact, setLeadFormContact] = useState(null);
  const [rolePreflightStepIndex, setRolePreflightStepIndex] = useState(0);
  const [hostAvatarBroken, setHostAvatarBroken] = useState(false);
  const trimmedAvatarUrl = hostAvatarUrl != null && String(hostAvatarUrl).trim() ? String(hostAvatarUrl).trim() : "";
  const showHostAvatar = Boolean(trimmedAvatarUrl && !hostAvatarBroken);
  const launcherInitials = String(displayTitle || roleUi.defaultTitle || "N")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "N";

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (freshSessionOnMount) {
      const vid = getVisitorId();
      if (vid) setVisitorIdState(vid);
      return;
    }
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
  }, [resolvedRole, freshSessionOnMount]);

  useEffect(() => {
    sessionHistoryLoadedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!embedToken || !sessionId || freshSessionOnMount) return;
    if (leadFlowStep !== "chat") return;
    if (sessionHistoryLoadedRef.current) return;
    sessionHistoryLoadedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchChatSessionMessages({ sessionId, embedToken });
        if (cancelled) return;
        const rows = mapServerChatMessagesToWidget(res?.messages);
        setMessages((prev) => {
          if (prev.length > 0) return prev;
          if (rows.length > 0) return rows;
          if (displayGreeting) {
            return [
              {
                role: "assistant",
                content: displayGreeting,
                timestamp: new Date(),
              },
            ];
          }
          return prev;
        });
      } catch {
        if (!cancelled) {
          setMessages((prev) => {
            if (prev.length > 0) return prev;
            if (!displayGreeting) return prev;
            return [
              {
                role: "assistant",
                content: displayGreeting,
                timestamp: new Date(),
              },
            ];
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embedToken, sessionId, leadFlowStep, freshSessionOnMount, displayGreeting]);

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

  const beginFreshIntakeSession = useCallback(() => {
    const { sessionId: nextSid } = resetChatIdentity();
    setSessionId(nextSid);
    setVisitorIdState("");
    return nextSid;
  }, []);

  const applyChatPayload = useCallback(
    async (payload, currentVisitorId, formContactSnapshot = null, sessionIdOverride = "") => {
      const activeSessionId = String(sessionIdOverride || sessionId || "").trim();
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

      const lastUserText = lastOutboundUserTextRef.current;
      const hadPendingOptionsOffer = pendingOptionsOfferRef.current;
      const userJustAskedForOptions = isAvailableOptionsRequestMessage(lastUserText);
      const userJustAskedForMatches = isPropertyMatchesRequestMessage(lastUserText);
      const userAcceptedOptionsOffer = isAvailableOptionsConsentMessage(lastUserText, {
        afterOptionsOffer: hadPendingOptionsOffer,
      });
      const assistantShowsOptionCards = assistantAnnouncingOptionCards(reply);
      const userWantsPropertyCards =
        userJustAskedForOptions || userJustAskedForMatches || userAcceptedOptionsOffer;
      const wantsMatchesAfterConfirm =
        shouldFetchMatchesOnNextAssistantReplyRef.current ||
        Boolean(meta.refetch_property_matches) ||
        (Boolean(meta.property_matches_available) &&
          (userWantsPropertyCards ||
            (assistantShowsOptionCards && (hadPendingOptionsOffer || userAcceptedOptionsOffer))));
      const replacePriorMatchCards =
        userJustAskedForOptions ||
        userJustAskedForMatches ||
        userAcceptedOptionsOffer ||
        Boolean(meta.refetch_property_matches) ||
        (assistantShowsOptionCards && hadPendingOptionsOffer);

      let matches = [];
      let matchesMeta = {};
      let propertyMatchesDisplayMode = "matches";

      if (wantsMatchesAfterConfirm && useAgentLeadForm && embedToken && activeSessionId) {
        shouldFetchMatchesOnNextAssistantReplyRef.current = false;
        try {
          const fetchMatches = (matchMode) =>
            fetchChatPropertyMatches({
              sessionId: activeSessionId,
              embedToken,
              visitorId: visitorForMatches || visitorId,
              formContact: formContactSnapshot || leadFormContact || undefined,
              page: 1,
              limit: 5,
              matchMode,
            });

          if ((userJustAskedForOptions || userAcceptedOptionsOffer) && !userJustAskedForMatches) {
            const strictPayload = await fetchMatches("strict");
            const strictMeta = strictPayload?.meta || {};
            const strictMatches = Array.isArray(strictMeta.property_matches)
              ? strictMeta.property_matches
              : [];
            if (strictMatches.length > 0) {
              matchesMeta = strictMeta;
              matches = strictMatches;
              propertyMatchesDisplayMode = "matches";
            } else {
              const relaxedPayload = await fetchMatches("relaxed");
              matchesMeta = relaxedPayload?.meta || {};
              matches = Array.isArray(matchesMeta.property_matches) ? matchesMeta.property_matches : [];
              propertyMatchesDisplayMode = "options";
            }
          } else {
            const matchPayload = await fetchMatches("strict");
            matchesMeta = matchPayload?.meta || {};
            matches = Array.isArray(matchesMeta.property_matches) ? matchesMeta.property_matches : [];
            propertyMatchesDisplayMode = "matches";
          }

          const signature = [
            propertyMatchesDisplayMode,
            String(matchesMeta.property_matches_context || ""),
            String(matchesMeta.pagination?.total || matches.length),
            matches
              .map((m) => String(m?.id || `${m?.title || ""}-${m?.listing_url || ""}`))
              .join("|"),
          ].join("::");
          if (!replacePriorMatchCards && signature === lastPropertyMatchesSignatureRef.current) {
            matches = [];
          } else {
            lastPropertyMatchesSignatureRef.current = signature;
          }
        } catch (err) {
          setError(err?.message || "Property matches could not be loaded.");
        }
      }

      const fetchedPropertyMatches = Boolean(
        wantsMatchesAfterConfirm && useAgentLeadForm && embedToken && activeSessionId,
      );
      const showMatchCards = Boolean(showPropertyMatchesInChat && fetchedPropertyMatches);
      let displayReply = String(reply || "Thanks! How else can I help?");
      if (wantsMatchesAfterConfirm || showMatchCards) {
        displayReply = stripPropertyListingFromReply(displayReply);
      }
      if (showMatchCards && !displayReply.trim()) {
        displayReply = "";
      }

      const assistantExtras = {
        ...(showMatchCards
          ? {
              propertyMatches: matches,
              propertyMatchesContext: matchesMeta.property_matches_context || "buy",
              propertyMatchesDisplayMode,
              propertyMatchesNote:
                matchesMeta.property_matches_note ||
                (matches.length === 0
                  ? "No matching options are available yet. Your agent can share more with you directly."
                  : null),
              propertyMatchesEmpty: matches.length === 0,
            }
          : {}),
      };

      if (assistantOfferedAvailableOptions(reply)) {
        pendingOptionsOfferRef.current = true;
      } else if (!userWantsPropertyCards) {
        pendingOptionsOfferRef.current = false;
      }

      if (showMatchCards) {
        pendingOptionsOfferRef.current = false;
      }

      if (showMatchCards || replacePriorMatchCards) {
        setMessages((prev) => {
          const withoutOldMatchCards = prev.filter((m) => !assistantMessageHasPropertyMatches(m));
          return [
            ...withoutOldMatchCards,
            {
              role: "assistant",
              content: displayReply,
              timestamp: new Date(),
              ...assistantExtras,
            },
          ];
        });
        return;
      }

      addMessage("assistant", displayReply, assistantExtras);
    },
    [
      addMessage,
      embedToken,
      sessionId,
      useAgentLeadForm,
      visitorId,
      leadFormContact,
      showPropertyMatchesInChat,
      setError,
    ],
  );

  const handlePropertyMatchSelect = useCallback(
    async (property) => {
      if (!embedToken || !sessionId || !property) return;
      try {
        await selectChatPropertyMatch({ sessionId, embedToken, property });
      } catch (err) {
        setError(err?.message || "Selected property could not be saved.");
      }
    },
    [embedToken, sessionId],
  );

  const runPreparedChatStart = useCallback(
    async ({
      opening,
      summary,
      leadProfilePreview,
      formContact,
      fetchPropertyMatchesAfterReply = false,
      sessionIdOverride = "",
    }) => {
      const activeSessionId = String(sessionIdOverride || sessionId || "").trim();
      if (!activeSessionId) return;
      sessionHistoryLoadedRef.current = true;
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
      shouldFetchMatchesOnNextAssistantReplyRef.current = Boolean(fetchPropertyMatchesAfterReply);
      pendingOptionsOfferRef.current = false;
      lastPropertyMatchesSignatureRef.current = "";

      try {
        const response = await sendChatMessage({
          message: opening,
          sessionId: activeSessionId,
          embedToken,
          visitorId,
          agentType: widgetRoleToChatAgentType(resolvedRole),
          formContact,
          forceNewLead: true,
        });
        const payload = response?.data || response;
        const nextSessionId = resolveChatSessionId(payload, activeSessionId);
        if (nextSessionId && nextSessionId !== activeSessionId) {
          setSessionId(nextSessionId);
          persistChatSessionId(nextSessionId);
        }
        await applyChatPayload(payload, visitorId, formContact, nextSessionId || activeSessionId);
      } catch (err) {
        if (err?.code !== "PLAN_LIMIT_REACHED") {
          setError(err?.message || "Request failed.");
        }
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    },
    [applyChatPayload, embedToken, resolvedRole, sessionId, visitorId]
  );

  const handleSend = async (overrideText = null) => {
    const overridePayload =
      overrideText && typeof overrideText === "object" && !Array.isArray(overrideText)
        ? overrideText
        : null;
    const text = overridePayload ? String(overridePayload.text || "").trim() : overrideText || input.trim();
    if (!text || loading || !embedToken || !sessionId) return;

    if (!overrideText) setInput("");
    lastOutboundUserTextRef.current = text;
    addMessage("user", text, {
      ...(overridePayload?.selectedProperty ? { selectedProperty: overridePayload.selectedProperty } : {}),
      ...(overridePayload?.selectedPropertyContext
        ? { selectedPropertyContext: overridePayload.selectedPropertyContext }
        : {}),
    });
    const consentAfterOptionsOffer = isAvailableOptionsConsentMessage(text, {
      afterOptionsOffer: pendingOptionsOfferRef.current,
    });
    const wantsMatchesOnReply =
      isAvailableOptionsRequestMessage(text) ||
      isPropertyMatchesRequestMessage(text) ||
      consentAfterOptionsOffer;
    shouldFetchMatchesOnNextAssistantReplyRef.current = wantsMatchesOnReply;
    if (wantsMatchesOnReply) {
      lastPropertyMatchesSignatureRef.current = "";
    }
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
      await applyChatPayload(payload, visitorId, leadFormContact);
    } catch (err) {
      if (err?.code !== "PLAN_LIMIT_REACHED") {
        setError(err?.message || "Request failed.");
      }
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleStartChatFromForm = async () => {
    if (!chosenIntent || !sessionId || !embedToken || loading) return;

    const contactError = getBasicContactValidationError(leadDraft);
    if (contactError) {
      setFormValidationError(contactError);
      return;
    }
    if (missingDraftFields(leadDraft, agentFinalRequiredFields(chosenIntent)).length) {
      setFormValidationError("Please complete all onboarding fields to start chat.");
      return;
    }
    if (chosenIntent === "sell" && !sellerPropertyImageFiles.length) {
      setFormValidationError("Please upload at least one property image to create a seller lead.");
      return;
    }
    setFormValidationError("");

    const { formContact, opening, summary, leadProfilePreview } = getAgentStartPayload(
      chosenIntent,
      leadDraft
    );
    let nextFormContact = formContact;
    const activeSessionId = beginFreshIntakeSession();
    if (chosenIntent === "sell" && sellerPropertyImageFiles.length) {
      try {
        setLoading(true);
        const uploadResult = await attachSellerImagesToAgentFormContact({
          intent: chosenIntent,
          formContact,
          embedToken,
          sessionId: activeSessionId,
          propertyImageFiles: sellerPropertyImageFiles,
          messages: {
            missingImages: "Please upload at least one property image to create a seller lead.",
            emptyUpload: "Please upload at least one property image to create a seller lead.",
            uploadFailed: "Property images could not be uploaded. Please try again.",
          },
        });
        nextFormContact = uploadResult.formContact;
        setLeadDraft((d) => ({ ...d, property_images: uploadResult.uploadedImages }));
      } catch (err) {
        setFormValidationError(err?.message || "Property images could not be uploaded. Please try again.");
        setLoading(false);
        return;
      }
    }
    await runPreparedChatStart({
      opening,
      summary,
      leadProfilePreview,
      formContact: nextFormContact,
      fetchPropertyMatchesAfterReply: false,
      sessionIdOverride: activeSessionId,
    });
  };

  const handleStartChatFromRolePreflight = async () => {
    if (!sessionId || !embedToken || loading || !useRolePreflight) return;

    const contactError = getBasicContactValidationError(rolePreflightDraft, {
      requireAddress: resolvedRole === "lawyer" || resolvedRole === "mortgage_broker",
    });
    if (contactError) {
      setFormValidationError(contactError);
      return;
    }
    if (
      resolvedRole === "lawyer" &&
      missingDraftFields(rolePreflightDraft, LAWYER_PREFLIGHT_REQUIRED_FIELDS).length
    ) {
      setFormValidationError("Please complete all lawyer intake fields to continue.");
      return;
    }
    if (
      resolvedRole === "mortgage_broker" &&
      missingDraftFields(rolePreflightDraft, MORTGAGE_PREFLIGHT_REQUIRED_FIELDS).length
    ) {
      setFormValidationError("Please complete all mortgage intake fields to continue.");
      return;
    }
    setFormValidationError("");
    const activeSessionId = beginFreshIntakeSession();

    const { formContact, opening, summary, leadProfilePreview, professionalType } =
      getRolePreflightStartPayload(resolvedRole, rolePreflightDraft);
    void postChatScorePreview({ formContact, professionalType });
    await runPreparedChatStart({
      opening,
      summary,
      leadProfilePreview,
      formContact,
      sessionIdOverride: activeSessionId,
    });
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

  const resetConversationState = useCallback(
    ({ resetInput = false } = {}) => {
      sessionHistoryLoadedRef.current = false;
      setMessages([]);
      setLeadFormContact(null);
      setStep(0);
      setQuickReplies([]);
      lastOutboundUserTextRef.current = "";
      shouldFetchMatchesOnNextAssistantReplyRef.current = false;
      lastPropertyMatchesSignatureRef.current = "";
      setFormValidationError("");
      if (resetInput) setInput("");
      if (useAgentLeadForm) {
        setLeadFlowStep("intent");
        setChosenIntent(null);
        setLeadDraft(emptyAgentLeadDraft());
        setSellerPropertyImageFiles([]);
      } else if (useRolePreflight) {
        setLeadFlowStep("details");
        setRolePreflightDraft(emptyPreflightDraftForRole(resolvedRole));
        setRolePreflightStepIndex(0);
      }
    },
    [resolvedRole, useAgentLeadForm, useRolePreflight]
  );

  const handleClear = async () => {
    if (!sessionId) return;
    try {
      await clearChatSession(sessionId);
      resetConversationState();
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
    setSellerPropertyImageFiles([]);
    resetConversationState({ resetInput: true });
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
    if (leadFlowStep === "intent") {
      if (!chosenIntent) {
        setFormValidationError("Please select whether you are buying or selling.");
        return;
      }
      setLeadFlowStep("contact");
      return;
    }
    if (leadFlowStep === "contact") {
      const contactError = getBasicContactValidationError(leadDraft);
      if (contactError) {
        setFormValidationError(contactError);
        return;
      }
      setLeadFlowStep("property");
      return;
    }
    if (leadFlowStep === "property") {
      if (missingDraftFields(leadDraft, AGENT_PROPERTY_STEP_REQUIRED[chosenIntent === "sell" ? "sell" : "buy"]).length) {
        setFormValidationError("Please complete all property details before continuing.");
        return;
      }
      setLeadFlowStep("qualify");
      return;
    }
    if (leadFlowStep === "qualify") {
      if (missingDraftFields(leadDraft, AGENT_QUALIFY_STEP_REQUIRED).length) {
        setFormValidationError("Please complete all qualification details before continuing.");
        return;
      }
      setLeadFlowStep("reach");
      return;
    }
    if (leadFlowStep === "reach") {
      if (missingDraftFields(leadDraft, AGENT_REACH_STEP_REQUIRED).length) {
        setFormValidationError("Please complete all contact preference fields.");
      }
    }
  }, [leadFlowStep, chosenIntent, leadDraft]);

  const disabledSend = !input.trim() || loading || !embedToken;
  const showConversationProgress = false;
  const showRoleChatProgress =
    useRolePreflight &&
    resolvedRole !== "lawyer" &&
    resolvedRole !== "mortgage_broker" &&
    leadFlowStep === "chat" &&
    Boolean(leadFormContact);

  const headerSubtitle = displaySubtitleBase;

  const header = (
    <ChatWidgetHeader
      roleUi={roleUi}
      resolvedRole={resolvedRole}
      showHostAvatar={showHostAvatar}
      trimmedAvatarUrl={trimmedAvatarUrl}
      setHostAvatarBroken={setHostAvatarBroken}
      displayTitle={displayTitle}
      headerSubtitle={headerSubtitle}
      inlineMode={inlineMode}
      setIsOpen={(val) => { setIsOpen(val); if (!val) onClose?.(); }}
    />
  );

  const chatBody = (
    <ChatConversationBody
      messages={messages}
      roleUi={roleUi}
      resolvedRole={resolvedRole}
      showHostAvatar={showHostAvatar}
      trimmedAvatarUrl={trimmedAvatarUrl}
      setHostAvatarBroken={setHostAvatarBroken}
      quickReplies={quickReplies}
      handleSend={handleSend}
      loading={loading}
      leadFlowStep={leadFlowStep}
      error={error}
      messagesEndRef={messagesEndRef}
      onPropertyMatchSelect={handlePropertyMatchSelect}
    />
  );

  const showPreflightChatResetRow =
    useRolePreflight && leadFlowStep === "chat" && messages.length > 0;

  const footer = (
    <ChatWidgetFooter
      input={input}
      setInput={setInput}
      handleKeyPress={handleKeyPress}
      embedToken={embedToken}
      roleUi={roleUi}
      handleSend={handleSend}
      disabledSend={disabledSend}
      loading={loading}
      showPreflightChatResetRow={showPreflightChatResetRow}
      handleStartNewRequest={handleStartNewRequest}
      messagesLength={messages.length}
      useAgentLeadForm={useAgentLeadForm}
      useRolePreflight={useRolePreflight}
      handleClear={handleClear}
    />
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
        propertyImageFiles={sellerPropertyImageFiles}
        onPropertyImageFilesChange={setSellerPropertyImageFiles}
        propertyImagesUploading={loading}
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

  const floatingWidget = (
    <>
      {allowLauncher && !inlineMode && !isOpen && (
        <div className="fixed bottom-6 right-6 z-[10050] flex flex-col items-end gap-2">
          <button
            onClick={() => setIsOpen(true)}
            type="button"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-text-heading shadow-lg ring-1 ring-slate-200 transition hover:shadow-xl"
            aria-label={effectiveLauncherLabel}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            {launcherPillText}
          </button>
          <button
            onClick={() => setIsOpen(true)}
            type="button"
            className="h-14 w-14 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              padding: "2px",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
            }}
            aria-label={effectiveLauncherLabel}
          >
            <span className="relative block h-full w-full overflow-hidden rounded-full bg-white">
              {showHostAvatar ? (
                <Image
                  src={trimmedAvatarUrl}
                  alt={displayTitle || "Professional"}
                  fill
                  sizes="64px"
                  className="object-cover object-center"
                  onError={() => setHostAvatarBroken(true)}
                />
              ) : (
                <span
                  className={`flex h-full w-full items-center justify-center text-base font-bold text-white ${roleUi.launcherClass}`}
                  aria-hidden
                >
                  {launcherInitials || <MessageCircle size={20} className="shrink-0" />}
                </span>
              )}
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${
            inlineMode
              ? "relative w-full h-full"
              : "fixed bottom-6 right-6 z-[10050] w-[420px] max-w-[96vw] h-[640px] max-h-[85vh]"
          } bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden`}
        >
          <div className="flex flex-col h-full min-h-0">
            {header}
            {mainPanel}
          </div>
        </motion.div>
      )}
    </>
  );

  if (!inlineMode && mounted) {
    return createPortal(floatingWidget, document.body);
  }

  return floatingWidget;
}
