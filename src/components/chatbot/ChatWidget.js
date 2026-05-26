"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import {
  clearChatSession,
  fetchChatPropertyMatches,
  getOrCreateSessionId,
  getVisitorId,
  postChatScorePreview,
  resetChatIdentity,
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
  agentFinalRequiredFields,
  getAgentStartPayload,
  getRolePreflightStartPayload,
  hasBasicContact,
  missingDraftFields,
} from "@/components/chatbot/widget/roleChatStrategy";
import { attachSellerImagesToAgentFormContact } from "@/components/chatbot/widget/agentSellerImageUpload";

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
  const lastOutboundUserTextRef = useRef("");
  const latestCalendlyLinkRef = useRef("");

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
        if (!showPropertyMatchesInChat) return;
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
    [addMessage, embedToken, sessionId, useAgentLeadForm, visitorId, leadFormContact, showPropertyMatchesInChat, setError],
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
    async ({ opening, summary, leadProfilePreview, formContact, fetchPropertyMatchesAfterReply = false }) => {
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
    },
    [applyChatPayload, embedToken, resolvedRole, sessionId, visitorId]
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

    if (!hasBasicContact(leadDraft)) {
      setFormValidationError("Please add your name, phone, and email to continue.");
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
    if (chosenIntent === "sell" && sellerPropertyImageFiles.length) {
      try {
        setLoading(true);
        const uploadResult = await attachSellerImagesToAgentFormContact({
          intent: chosenIntent,
          formContact,
          embedToken,
          sessionId,
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
      fetchPropertyMatchesAfterReply: chosenIntent === "buy",
    });
  };

  const handleStartChatFromRolePreflight = async () => {
    if (!sessionId || !embedToken || loading || !useRolePreflight) return;

    if (!hasBasicContact(rolePreflightDraft)) {
      setFormValidationError("Please add your name, phone, and email to continue.");
      return;
    }
    if (
      resolvedRole === "lawyer" &&
      missingDraftFields(rolePreflightDraft, LAWYER_PREFLIGHT_REQUIRED_FIELDS).length
    ) {
      setFormValidationError("Please complete all lawyer intake fields to continue.");
      return;
    }
    setFormValidationError("");

    const { formContact, opening, summary, leadProfilePreview, professionalType } =
      getRolePreflightStartPayload(resolvedRole, rolePreflightDraft);
    void postChatScorePreview({ formContact, professionalType });
    await runPreparedChatStart({ opening, summary, leadProfilePreview, formContact });
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
      if (!hasBasicContact(leadDraft)) {
        setFormValidationError("Please fill in your name, phone, and email.");
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

  const headerSubtitle =
    useAgentLeadForm && leadFlowStep !== "chat"
      ? ""
      : useRolePreflight && leadFlowStep === "details"
        ? ""
        : useRolePreflight && leadFlowStep === "chat"
          ? ""
          : displaySubtitleBase;

  const header = (
    <ChatWidgetHeader
      roleUi={roleUi}
      resolvedRole={resolvedRole}
      showHostAvatar={showHostAvatar}
      trimmedAvatarUrl={trimmedAvatarUrl}
      setHostAvatarBroken={setHostAvatarBroken}
      displayTitle={displayTitle}
      roleBadgeLabel={roleBadgeLabel}
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
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className={`fixed bottom-6 right-6 z-[10050] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl ${roleUi.launcherClass}`}
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
