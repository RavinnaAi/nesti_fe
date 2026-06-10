"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, CheckCircle2, MessageCircle, X, XCircle } from "lucide-react";
import {
  LeadGradeIcon,
  displayLeadGradeLabel,
  leadGradeChipClasses,
  leadIntentChipClasses,
  leadScoreFallbackChipClasses,
  resolveDisplayLeadGrade,
} from "@/lib/leadGradeUi";
import LeadsDetailsTab from "@/components/leads/LeadsDetailsTab";
import InquiredPropertyOverview from "@/components/leads/InquiredPropertyOverview";
import {
  hasInquiredPropertyContext,
  inquiredPropertyDisplayAddress,
  inquiredPropertyFromLead,
} from "@/lib/inquiredPropertyUtils";
import LeadsProfileTab from "@/components/leads/LeadsProfileTab";
import {
  extractMeta,
  formatMetaEntries,
  getConversationMeta,
  getPropertyMatchesCopy,
} from "@/lib/leadsPageUtils";

export default function LeadsPropertyMatchesTab({
  selectedConversation,
  lead = null,
  propertyMatches = [],
  propertyMatchesQuery,
  propertyMatchesPayload = null,
  inquiredProperty = null,
  inquiredSellerLeadDetail = null,
  inquiredSellerConversation = null,
  inquiredSellerLeadQuery = null,
}) {
  const [selectedMatch, setSelectedMatch] = useState(null); // { match, idx }
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  const inquiredMode = hasInquiredPropertyContext(lead);
  const inquiredPropertySnapshot = inquiredProperty || inquiredPropertyFromLead(lead);
  const matchesCopy = getPropertyMatchesCopy(lead, propertyMatchesPayload);
  const selectedLeadKey = String(selectedConversation?.id || selectedConversation?.lead_match_id || "");
  useEffect(() => {
    setSelectedMatch(null);
  }, [selectedLeadKey]);

  useEffect(() => {
    setPage(1);
  }, [selectedLeadKey, propertyMatches.length]);

  const inquiredSellerConversationMeta = extractMeta(inquiredSellerConversation);

  useEffect(() => {
    if (!selectedMatch) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSelectedMatch(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedMatch]);

  const readable = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const raw = String(value).replace(/_/g, " ").trim();
    if (!raw) return "—";
    if (raw.includes("@") || /^\+?[\d\s\-()]+$/.test(raw)) return raw;
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const KeyValue = ({ label, value, compact = false, className = "", valueClassName }) => (
    <div
      className={`rounded-md border border-border/60 bg-background-light/50 ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      } ${className}`.trim()}
    >
      <div
        className={`uppercase tracking-wide text-text-muted ${compact ? "text-[9px] leading-tight" : "text-[10px]"}`}
      >
        {label}
      </div>
      <div
        className={`font-normal text-text-heading mt-0.5 ${
          compact ? "text-[11px] leading-snug" : "text-xs"
        } ${valueClassName ?? "break-words"}`}
      >
        {readable(value)}
      </div>
    </div>
  );

  const ModalKeyValue = (props) => <KeyValue {...props} compact />;

  /** Backend often sets title to generic "Buyer inquiry" for seller-side buyer matches; prefer concrete listing lines. */
  const GENERIC_PROPERTY_LABELS = /^(buyer inquiry|seller inquiry|listing inquiry)$/i;

  /** Slim API: listing fields live under `matched_lead` (snake_case or camelCase). */
  const getMatchedLeadRaw = (item) => {
    const ml = item?.matched_lead ?? item?.matchedLead;
    return ml && typeof ml === "object" ? ml : null;
  };

  const getMatchedLead = (item) => {
    const ml = getMatchedLeadRaw(item);
    if (!ml) return null;
    const normalized = {
      intent: ml.intent ?? null,
      preferred_contact_method: ml.preferred_contact_method ?? ml.preferredContactMethod ?? null,
      best_time_to_contact: ml.best_time_to_contact ?? ml.bestTimeToContact ?? null,
      property_location: ml.property_location ?? ml.propertyLocation ?? null,
      property_budget: ml.property_budget ?? ml.propertyBudget ?? null,
      property_timeline: ml.property_timeline ?? ml.propertyTimeline ?? null,
      property_type: ml.property_type ?? ml.propertyType ?? null,
      bedrooms: ml.bedrooms ?? null,
      bathrooms: ml.bathrooms ?? null,
      mortgage_status: ml.mortgage_status ?? ml.mortgageStatus ?? null,
      realtor_status: ml.realtor_status ?? ml.realtorStatus ?? null,
      motivation_reason: ml.motivation_reason ?? ml.motivationReason ?? null,
      viewing_readiness: ml.viewing_readiness ?? ml.viewingReadiness ?? null,
      living_situation: ml.living_situation ?? ml.livingSituation ?? null,
      urgency_readiness: ml.urgency_readiness ?? ml.urgencyReadiness ?? null,
    };
    const has = Object.values(normalized).some((v) => v != null && String(v).trim() !== "");
    return has ? normalized : null;
  };

  const parseMaxBudgetFromString = (raw) => {
    if (raw == null || raw === "") return null;
    const nums = String(raw).match(/\d[\d,]*/g);
    if (!nums?.length) return null;
    const values = nums
      .map((n) => parseInt(n.replace(/,/g, ""), 10))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (!values.length) return null;
    return Math.max(...values);
  };

  const formatPriceLabel = (price) => {
    if (price == null || price === "") return null;
    const n = Number(price);
    if (Number.isFinite(n) && n > 0) return `$${n.toLocaleString("en-US")}`;
    return `$${price}`;
  };

  const getMatchNumericBudget = (item) => {
    const ml = getMatchedLead(item);
    if (ml?.property_budget != null && ml.property_budget !== "") {
      const fromBudget = parseMaxBudgetFromString(ml.property_budget);
      if (fromBudget != null) return fromBudget;
    }
    if (item?.price != null && item.price !== "") {
      const n = Number(item.price);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };

  const getMatchLocation = (item) => {
    const fromMl = String(getMatchedLead(item)?.property_location || "").trim();
    if (fromMl) return fromMl;
    const loc = item?.location;
    if (loc != null && String(loc).trim() !== "") return String(loc).trim();
    return null;
  };

  const getMatchPrice = (item) => getMatchNumericBudget(item);

  const getMatchBeds = (item) => {
    const v = getMatchedLead(item)?.bedrooms ?? item?.bedrooms;
    if (v == null || v === "") return null;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : v;
  };

  const getMatchBaths = (item) => {
    const v = getMatchedLead(item)?.bathrooms ?? item?.bathrooms;
    if (v == null || v === "") return null;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : v;
  };

  const getMatchType = (item) => {
    const t = getMatchedLead(item)?.property_type ?? item?.property_type;
    return t != null && String(t).trim() !== "" ? String(t).trim() : null;
  };

  const getListingHeading = (item, idx) => {
    if (!item) return `${matchesCopy.matchFallback} ${idx + 1}`;
    const loc = getMatchLocation(item) || "";
    const price = getMatchNumericBudget(item);
    const typ = getMatchType(item) || "";
    const parts = [];
    if (loc) parts.push(loc);
    const priceLabel = formatPriceLabel(price);
    if (priceLabel) parts.push(priceLabel);
    if (typ) parts.push(String(typ).replace(/_/g, " "));
    if (parts.length) return parts.join(" · ");
    const headline = String(item.match_headline ?? item.matchHeadline ?? "").trim();
    if (headline) return headline;
    const addr = item.address || item.property_name;
    if (addr) return String(addr);
    const t = item.title || item.name;
    if (t && !GENERIC_PROPERTY_LABELS.test(String(t).trim())) return String(t);
    return `${matchesCopy.matchFallback} ${idx + 1}`;
  };

  /** One-line listing summary for cards (replaces bulky 2×2 KeyValue grid). */
  const getMatchSummaryInline = (item, idx) => {
    const base = getListingHeading(item, idx);
    const br = getMatchBeds(item);
    const ba = getMatchBaths(item);
    if (br == null && ba == null) return base;
    const bedParts = [];
    if (br != null) bedParts.push(`${readable(br)} bd`);
    if (ba != null) bedParts.push(`${readable(ba)} ba`);
    const bedStr = bedParts.join(" / ");
    return bedStr ? `${base} · ${bedStr}` : base;
  };

  const getLeadListMeta = (conversation) => {
    if (!conversation) {
      return {
        leadScore: null,
        leadGrade: null,
        intent: null,
        channel: null,
        qualified: null,
        isMatched: null,
        timeline: null,
        budget: null,
        location: null,
      };
    }
    const leadScore = conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score ?? null;
    const leadGrade = conversation?.lead_grade ?? conversation?.leadGrade ?? null;
    const intent = conversation?.intent ?? conversation?.lead_intent ?? conversation?.intent_label ?? null;
    const channel = conversation?.channel ?? conversation?.source ?? null;
    const qualified = conversation?.is_qualified ?? conversation?.isQualified ?? null;
    const signals = conversation?.signals || conversation?.meta?.signals || conversation?.metadata?.signals || {};
    const timeline = conversation?.timeline || signals?.timeline || null;
    const budget = conversation?.budget || signals?.budget || null;
    const location =
      conversation?.location || conversation?.city || signals?.location || null;
    let isMatched = conversation?.is_matched ?? conversation?.matched ?? null;
    if (isMatched === null) {
      const matchStatus = conversation?.match_status;
      if (matchStatus === "matched" || matchStatus === true) isMatched = true;
      else {
        isMatched =
          conversation?.meta?.is_matched ??
          conversation?.meta?.matched ??
          conversation?.metadata?.is_matched ??
          conversation?.metadata?.matched ??
          null;
      }
    }
    return { leadScore, leadGrade, intent, channel, qualified, isMatched, timeline, budget, location };
  };

  const getMatchScore = (item) => item?.match_score ?? item?.matchScore ?? item?.score ?? null;
  const getMatchReasons = (item) => {
    const r = item?.reasons_for_matching ?? item?.reasonsForMatching ?? item?.match_reasons ?? item?.matchReasons;
    return Array.isArray(r) ? r : [];
  };

  const offerSuggestionText = (match, idx) => {
    if (!match) return "—";
    const title = getListingHeading(match, idx);
    const location = readable(getMatchLocation(match) || "");
    const price = getMatchNumericBudget(match);
    const budgetRaw = getMatchedLead(match)?.property_budget;
    const pricePhrase = price
      ? ` at $${price}`
      : budgetRaw
        ? ` (budget ${budgetRaw})`
        : "";
    const cta =
      propertyMatchesPayload?.next_steps?.booking_cta ||
      "Offer two clear options for next steps and a specific time to talk.";
    return `This property looks like a strong fit for your criteria: ${title}${location !== "—" ? ` in ${location}` : ""}${pricePhrase}. ${cta}`;
  };

  const matchRowId = (match, idx) => String(match?.id ?? match?._id ?? idx);

  const toggleMatch = (match, idx) => {
    const id = matchRowId(match, idx);
    setSelectedMatch((cur) => (cur && matchRowId(cur.match, cur.idx) === id ? null : { match, idx }));
  };

  const totalPages = Math.max(1, Math.ceil(propertyMatches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedMatches = propertyMatches.slice(pageStart, pageEnd);

  const contact = lead?.contact && typeof lead.contact === "object" ? lead.contact : {};
  const property = lead?.property && typeof lead.property === "object" ? lead.property : {};
  const qualification = lead?.qualification && typeof lead.qualification === "object" ? lead.qualification : {};

  const leadDisplayName =
    contact.full_name || selectedConversation?.name || selectedConversation?.visitor_name || null;
  const leadEmail =
    contact.email || selectedConversation?.email || selectedConversation?.visitor_email || null;
  const leadPhone =
    contact.phone || selectedConversation?.phone || selectedConversation?.visitor_phone || null;
  const budgetRaw = property.budget;
  const budgetDisplay =
    budgetRaw != null && budgetRaw !== ""
      ? typeof budgetRaw === "number"
        ? `$${budgetRaw}`
        : String(budgetRaw).trim().startsWith("$")
          ? String(budgetRaw).trim()
          : `$${budgetRaw}`
      : null;

  const listMeta = getLeadListMeta(selectedConversation);

  const matchPartySectionLabel = (source) => {
    if (source === "buyer_lead") return "Matched buyer";
    if (source === "seller_lead") return "Matched seller";
    return "Matched contact";
  };

  const hasMatchedContactFields = (match) => {
    const mc = match?.matched_contact ?? match?.matchedContact;
    if (!mc || typeof mc !== "object") return false;
    const name = mc.full_name ?? mc.fullName;
    return Boolean(name || mc.email || mc.phone);
  };

  const showMatchedLeadDetailPanel = (match) =>
    hasMatchedContactFields(match) || Boolean(getMatchedLead(match));

  /**
   * Identity for the matched CRM profile. If the API sent `matched_lead` but no identity, do not fall back to the
   * sidebar lead (that would show the wrong person).
   */
  const getMatchPartyContact = (match) => {
    const mc = match?.matched_contact ?? match?.matchedContact;
    if (mc && typeof mc === "object") {
      const full_name = mc.full_name ?? mc.fullName ?? null;
      const email = mc.email ?? null;
      const phone = mc.phone ?? null;
      if (full_name || email || phone) {
        return { name: full_name || null, email: email || null, phone: phone || null };
      }
    }
    if (getMatchedLead(match)) {
      const title = match?.title && String(match.title).trim() ? String(match.title).trim() : null;
      return { name: title || null, email: null, phone: null };
    }
    return {
      name: leadDisplayName,
      email: leadEmail,
      phone: leadPhone,
    };
  };

  const formatProfileBudget = (raw) => {
    if (raw == null || raw === "") return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return `$${raw.toLocaleString("en-US")}`;
    const s = String(raw).trim();
    if (!s) return null;
    return s.startsWith("$") ? s : `$${s}`;
  };

  /** Table: show only CRM budget string from matched lead (no listing/list price fallback). */
  const getMatchBudgetDisplay = (match) => {
    const ml = getMatchedLead(match);
    const rawBudget = ml?.property_budget;
    if (rawBudget == null || String(rawBudget).trim() === "") return "—";
    const s = String(rawBudget).trim();
    if (/^\d[\d,]*$/.test(s)) {
      const n = parseInt(s.replace(/,/g, ""), 10);
      if (Number.isFinite(n) && n > 0) return formatPriceLabel(n);
    }
    const fb = formatProfileBudget(rawBudget);
    return fb || readable(s) || "—";
  };

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          {inquiredMode ? (
            <div className="space-y-3">
              {inquiredPropertySnapshot ? (
                <InquiredPropertyOverview property={inquiredPropertySnapshot} />
              ) : (
                <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-3 text-xs text-text-muted">
                  This lead inquired about a specific listing. Seller details load below when available.
                </div>
              )}
              <div className="rounded-xl border border-border/60 bg-white p-3">
                <div className="text-sm font-semibold text-text-heading">Linked seller lead</div>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  Seller CRM profile and details for this listing inquiry.
                </p>
                {inquiredSellerLeadQuery?.isLoading ? (
                  <div className="mt-3 rounded-md border border-border bg-white px-3 py-2 text-xs text-text-muted">
                    Loading seller lead details...
                  </div>
                ) : inquiredSellerLeadQuery?.isError ? (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Could not load the linked seller lead details.
                  </div>
                ) : inquiredSellerLeadDetail && inquiredSellerConversation ? (
                  <div className="mt-4 space-y-5 rounded-lg border border-border/60 bg-white px-4 py-4">
                    <LeadsProfileTab
                      selectedConversation={inquiredSellerConversation}
                      lead={inquiredSellerLeadDetail}
                      patchLeadPending={false}
                      embedded
                    />
                    <LeadsDetailsTab
                      selectedConversation={inquiredSellerConversation}
                      lead={inquiredSellerLeadDetail}
                      messageMeta={{}}
                      getConversationMeta={getConversationMeta}
                      conversationMeta={inquiredSellerConversationMeta}
                      formatMetaEntries={formatMetaEntries}
                      onOpenMeta={() => {}}
                      onCancelCalendlyAppointment={undefined}
                      cancelCalendlyPending={false}
                      inquiredPropertyAddress={inquiredPropertyDisplayAddress(inquiredPropertySnapshot)}
                      embedded
                    />
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-border bg-white px-3 py-2 text-xs text-text-muted">
                    Seller lead details are not available for this inquiry.
                  </div>
                )}
              </div>
            </div>
          ) : propertyMatchesQuery?.isLoading ? (
            <div className="text-xs text-text-muted">{matchesCopy.loading}</div>
          ) : propertyMatchesQuery?.isError ? (
            <div className="text-xs text-red-600">{matchesCopy.error}</div>
          ) : propertyMatches.length === 0 ? (
            <div className="text-xs text-text-muted">
              {propertyMatchesQuery?.data?.empty_state?.reason || matchesCopy.empty}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/60 bg-white shadow-sm">
                <table className="min-w-[720px] w-full border-collapse text-left text-[11px] text-text-body">
                  <thead>
                    <tr className="border-b border-border/70 bg-background-light/30">
                      <th className="whitespace-nowrap px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Party
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Location
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Property
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Budget
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Match
                      </th>
                      <th className="min-w-[120px] max-w-[200px] px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:px-3">
                        Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMatches.map((match, idx) => {
                      const globalIdx = pageStart + idx;
                      const rowId = matchRowId(match, globalIdx);
                      const isOpen = selectedMatch && matchRowId(selectedMatch.match, selectedMatch.idx) === rowId;
                      const summaryInline = getMatchSummaryInline(match, idx);
                      const headline = String(match?.match_headline ?? match?.matchHeadline ?? "").trim();
                      const party = getMatchPartyContact(match);
                      const showSelectedLeadChips = !showMatchedLeadDetailPanel(match);
                      const loc = getMatchLocation(match);
                      const typ = getMatchType(match);
                      const budgetLabel = getMatchBudgetDisplay(match);
                      const score = getMatchScore(match);
                      const onRowActivate = () => toggleMatch(match, globalIdx);
                      return (
                        <tr
                          key={rowId}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          onClick={onRowActivate}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowActivate();
                            }
                          }}
                          className={`cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-inset ${
                            isOpen ? "bg-primary/[0.07]" : ""
                          }`}
                        >
                          <td className="align-top px-2.5 py-1.5 sm:px-3">
                            <div className="text-[11px] font-semibold text-text-heading">
                              {party.name
                                ? readable(party.name)
                                : getMatchedLead(match)
                                  ? "Contact not on file"
                                  : "—"}
                            </div>
                            <div className="mt-0.5 max-w-[260px] space-y-0.5 text-[10px]">
                              <div className="truncate text-text-heading" title={party.email || ""}>
                                {party.email || (getMatchedLead(match) ? "—" : "No email")}
                              </div>
                              {party.phone ? (
                                <div className="truncate text-text-muted" title={party.phone}>
                                  {party.phone}
                                </div>
                              ) : getMatchedLead(match) ? (
                                <div className="text-text-muted">—</div>
                              ) : null}
                            </div>
                            {showSelectedLeadChips ? (
                              <div className="mt-1 flex max-w-[240px] flex-wrap items-center gap-0.5 text-[9px] text-text-muted">
                                <span className="mr-0.5 text-[8px] uppercase tracking-wide text-text-muted/90">This lead</span>
                                {listMeta.isMatched === true ? (
                                  <span className="inline-flex items-center gap-0.5 rounded border bg-green-50 text-green-700 border-green-200/80 px-1 py-px">
                                    <CheckCircle2 size={9} />
                                    Matched
                                  </span>
                                ) : listMeta.isMatched === false ? (
                                  <span className="inline-flex items-center gap-0.5 rounded border bg-red-50 text-red-700 border-red-200/80 px-1 py-px">
                                    <XCircle size={9} />
                                    Mismatched
                                  </span>
                                ) : null}
                                {resolveDisplayLeadGrade(listMeta.leadGrade, listMeta.leadScore) ? (
                                  (() => {
                                    const displayLeadGrade = resolveDisplayLeadGrade(
                                      listMeta.leadGrade,
                                      listMeta.leadScore,
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-0.5 rounded border px-1 py-px ${leadGradeChipClasses(displayLeadGrade)}`}
                                      >
                                        <LeadGradeIcon grade={displayLeadGrade} size={9} />
                                        {displayLeadGradeLabel(displayLeadGrade)}
                                      </span>
                                    );
                                  })()
                                ) : null}
                                {listMeta.qualified ? (
                                  <span className="inline-flex items-center gap-0.5 rounded border bg-primary/10 text-primary border-primary/20 px-1 py-px">
                                    <BadgeCheck size={9} />
                                    Qualified
                                  </span>
                                ) : null}
                                {listMeta.intent ? (
                                  <span className={`rounded border px-1 py-px ${leadIntentChipClasses(listMeta.intent)}`}>
                                    {String(listMeta.intent).charAt(0).toUpperCase() + String(listMeta.intent).slice(1)}
                                  </span>
                                ) : null}
                                {listMeta.leadScore !== null && listMeta.leadScore !== undefined ? (
                                  (() => {
                                    const g = resolveDisplayLeadGrade(listMeta.leadGrade, listMeta.leadScore);
                                    const scoreCls = g ? leadGradeChipClasses(g) : leadScoreFallbackChipClasses(listMeta.leadScore);
                                    return (
                                      <span className={`inline-flex items-center gap-0.5 rounded border px-1 py-px ${scoreCls}`}>
                                        {g ? <LeadGradeIcon grade={g} size={8} className="shrink-0 opacity-90" /> : null}
                                        Score {listMeta.leadScore}
                                      </span>
                                    );
                                  })()
                                ) : null}
                                {listMeta.location ? (
                                  <span className="max-w-[100px] truncate rounded border border-border/60 bg-background-light/50 px-1 py-px">
                                    {listMeta.location}
                                  </span>
                                ) : null}
                                {listMeta.timeline ? (
                                  <span className="rounded border border-border/60 bg-background-light/50 px-1 py-px">
                                    Timeline: {listMeta.timeline}
                                  </span>
                                ) : null}
                                {listMeta.budget ? (
                                  <span className="rounded border border-border/60 bg-background-light/50 px-1 py-px">
                                    Budget: {listMeta.budget}
                                  </span>
                                ) : null}
                                {listMeta.channel ? (
                                  <span className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-background-light/50 px-1 py-px">
                                    <MessageCircle size={8} />
                                    {listMeta.channel}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                          <td className="align-middle whitespace-nowrap px-2.5 py-1.5 text-[11px] text-text-heading sm:px-3">
                            {loc ? readable(loc) : "—"}
                          </td>
                          <td className="align-middle px-2.5 py-1.5 text-[11px] text-text-heading sm:px-3">
                            {typ ? readable(typ.replace(/_/g, " ")) : "—"}
                          </td>
                          <td className="align-middle whitespace-nowrap px-2.5 py-1.5 text-[11px] tabular-nums text-text-heading sm:px-3">
                            {budgetLabel}
                          </td>
                          <td className="align-middle px-2.5 py-1.5 sm:px-3">
                            {score !== null && score !== undefined ? (
                              <span
                                className="inline-flex items-center rounded-full border border-green-200/90 bg-green-50 px-2 py-px text-[9px] font-semibold tabular-nums text-green-800"
                                title={`Match score ${score}`}
                              >
                                {score}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="align-middle px-2.5 py-1.5 sm:px-3">
                            <div
                              className="max-w-[200px] truncate text-[10px] font-medium leading-snug text-text-heading"
                              title={headline || summaryInline}
                            >
                              {headline || summaryInline || "—"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-white px-3 py-2 text-[10px] text-text-muted">
                <div>
                  Showing {propertyMatches.length ? pageStart + 1 : 0}-{Math.min(pageEnd, propertyMatches.length)} of{" "}
                  {propertyMatches.length}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="rounded border border-border/70 px-2 py-1 text-text-heading disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-1 text-text-heading">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded border border-border/70 px-2 py-1 text-text-heading disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {selectedMatch && typeof document !== "undefined"
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center overflow-y-auto bg-black/40 p-2 sm:p-4"
                      role="presentation"
                      onClick={() => setSelectedMatch(null)}
                    >
                      <div
                        className="my-auto flex max-h-[min(92dvh,92vh)] min-h-0 w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-xl shadow-black/5 ring-1 ring-black/[0.03] sm:w-full"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="match-detail-heading"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/70 px-3 py-2.5 sm:px-4 sm:py-3">
                          <div className="min-w-0 pr-2">
                            <h3 id="match-detail-heading" className="text-sm font-semibold leading-tight text-text-heading sm:text-base">
                              {getListingHeading(selectedMatch.match, selectedMatch.idx)}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-text-muted sm:text-xs">Match details</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMatch(null)}
                            className="shrink-0 rounded-lg border border-border p-1.5 text-text-muted transition hover:bg-background-light/70"
                            aria-label="Close"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
                          {showMatchedLeadDetailPanel(selectedMatch.match) ? (
                            <div className="rounded-xl border border-border/50 bg-background-light/25 p-2.5 sm:p-3">
                              <div className="text-[11px] font-semibold text-text-heading sm:text-xs">
                                {matchPartySectionLabel(selectedMatch.match?.source)}
                              </div>
                              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                <ModalKeyValue
                                  label="Name"
                                  value={
                                    getMatchPartyContact(selectedMatch.match).name ||
                                    (getMatchedLead(selectedMatch.match) ? "Contact not on file" : null)
                                  }
                                />
                                <ModalKeyValue label="Phone" value={getMatchPartyContact(selectedMatch.match).phone} />
                                <ModalKeyValue
                                  label="Email"
                                  value={getMatchPartyContact(selectedMatch.match).email}
                                  className="min-w-0 sm:col-span-3"
                                  valueClassName="whitespace-nowrap overflow-x-auto [scrollbar-width:thin]"
                                />
                                {(() => {
                                  const ml = getMatchedLead(selectedMatch.match);
                                  if (!ml) return null;
                                  return (
                                    <>
                                      <ModalKeyValue label="Preferred contact" value={ml.preferred_contact_method} />
                                      <ModalKeyValue label="Best time to contact" value={ml.best_time_to_contact} />
                                      <ModalKeyValue label="Intent" value={ml.intent} />
                                      <ModalKeyValue label="Profile location" value={ml.property_location} />
                                      <ModalKeyValue label="Profile budget" value={formatProfileBudget(ml.property_budget)} />
                                      <ModalKeyValue label="Timeline" value={ml.property_timeline} />
                                      <ModalKeyValue label="Property type" value={ml.property_type} />
                                      <ModalKeyValue label="Bedrooms" value={ml.bedrooms} />
                                      <ModalKeyValue label="Bathrooms" value={ml.bathrooms} />
                                      <ModalKeyValue label="Mortgage status" value={ml.mortgage_status} />
                                      <ModalKeyValue label="Realtor status" value={ml.realtor_status} />
                                      <ModalKeyValue label="Motivation" value={ml.motivation_reason} />
                                      <ModalKeyValue label="Viewing readiness" value={ml.viewing_readiness} />
                                      <ModalKeyValue label="Living situation" value={ml.living_situation} />
                                      <ModalKeyValue label="Urgency readiness" value={ml.urgency_readiness} />
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="mt-2 rounded-md border border-dashed border-border/60 bg-background-light/50 px-2 py-1.5 text-[10px] leading-snug text-text-muted">
                                <span className="font-semibold text-text-heading">Selected in sidebar: </span>
                                {leadDisplayName ? readable(leadDisplayName) : "—"}
                                {leadEmail ? <span className="break-all"> · {leadEmail}</span> : null}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border/50 bg-background-light/20 p-2.5 sm:p-3">
                              <div className="text-[11px] font-semibold text-text-heading sm:text-xs">Lead open in workspace</div>
                              <p className="mt-0.5 text-[10px] text-text-muted">
                                Qualification and intent for the lead you selected in the list.
                              </p>
                              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                <ModalKeyValue label="Name" value={leadDisplayName} />
                                <ModalKeyValue label="Phone" value={leadPhone} />
                                <ModalKeyValue
                                  label="Email"
                                  value={leadEmail}
                                  className="min-w-0 sm:col-span-3"
                                  valueClassName="whitespace-nowrap overflow-x-auto [scrollbar-width:thin]"
                                />
                                <ModalKeyValue label="Preferred contact" value={contact.preferred_contact_method} />
                                <ModalKeyValue label="Best time to contact" value={contact.best_time_to_contact} />
                                <ModalKeyValue label="Intent" value={lead?.intent || selectedConversation?.intent} />
                                <ModalKeyValue label="Lead type" value={lead?.lead_type} />
                                <ModalKeyValue label="Grade" value={lead?.grade || selectedConversation?.lead_grade} />
                                <ModalKeyValue label="Score" value={lead?.score ?? selectedConversation?.lead_score} />
                                <ModalKeyValue label="Location" value={property.location || selectedConversation?.location || selectedConversation?.city} />
                                <ModalKeyValue label="Budget" value={budgetDisplay} />
                                <ModalKeyValue label="Timeline" value={property.timeline} />
                                <ModalKeyValue label="Property type" value={property.property_type} />
                                <ModalKeyValue label="Bedrooms" value={property.bedrooms} />
                                <ModalKeyValue label="Bathrooms" value={property.bathrooms} />
                                <ModalKeyValue label="Mortgage status" value={qualification.mortgage_status} />
                                <ModalKeyValue label="Realtor status" value={qualification.realtor_status} />
                                <ModalKeyValue label="Appointment status" value={lead?.appointment_status} />
                              </div>
                            </div>
                          )}

                          {getMatchReasons(selectedMatch.match).length ? (
                            <div>
                              <div className="mb-0.5 text-[11px] font-semibold text-text-heading sm:text-xs">Reasons for matching</div>
                              <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-snug text-text-body sm:text-xs">
                                {getMatchReasons(selectedMatch.match).map((reason, ridx) => (
                                  <li key={`pm-reason-${ridx}`}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          <div>
                            <div className="mb-0.5 text-[11px] font-semibold text-text-heading sm:text-xs">Suggestion</div>
                            <p className="text-[11px] leading-snug text-text-body sm:text-xs">
                              {offerSuggestionText(selectedMatch.match, selectedMatch.idx)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border/50 bg-background-light/15 px-2.5 py-2.5 sm:px-3">
                            <div className="text-[9px] uppercase tracking-wide text-text-muted">Suggested first message</div>
                            <p className="mt-1 max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-[11px] leading-snug text-text-body sm:text-xs">
                              {propertyMatchesPayload?.next_steps?.primary_action?.suggested_first_message ||
                                "Hi — this property seems to match your criteria well. I can share full details and help you move forward with an offer. Would you like to review it together today?"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>,
                    document.body,
                  )
                : null}

            </>
          )}
        </>
      ) : (
        <div className="text-sm text-text-muted">{matchesCopy.chooseLead}</div>
      )}

    </div>
  );
}
