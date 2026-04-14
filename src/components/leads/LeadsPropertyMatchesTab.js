"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, CheckCircle2, Flame, MessageCircle, X, XCircle } from "lucide-react";

export default function LeadsPropertyMatchesTab({
  selectedConversation,
  lead = null,
  propertyMatches = [],
  propertyMatchesQuery,
  propertyMatchesPayload = null,
}) {
  const [selectedMatch, setSelectedMatch] = useState(null); // { match, idx }

  const selectedLeadKey = String(selectedConversation?.id || selectedConversation?.lead_match_id || "");
  useEffect(() => {
    setSelectedMatch(null);
  }, [selectedLeadKey]);

  useEffect(() => {
    if (!selectedMatch) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedMatch(null);
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
    if (!item) return `Property match ${idx + 1}`;
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
    return `Property match ${idx + 1}`;
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

  return (
    <div className="rounded-md border border-border bg-white shadow-sm p-5 space-y-4">
      {selectedConversation ? (
        <>
          {propertyMatchesQuery?.isLoading ? (
            <div className="text-xs text-text-muted">Loading property matches...</div>
          ) : propertyMatchesQuery?.isError ? (
            <div className="text-xs text-red-600">Failed to load property matches.</div>
          ) : propertyMatches.length === 0 ? (
            <div className="text-xs text-text-muted">
              {propertyMatchesQuery?.data?.empty_state?.reason || "No property matches found for this lead."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {propertyMatches.slice(0, 8).map((match, idx) => {
                  const rowId = matchRowId(match, idx);
                  const isOpen = selectedMatch && matchRowId(selectedMatch.match, selectedMatch.idx) === rowId;
                  const summaryInline = getMatchSummaryInline(match, idx);
                  const headline = String(match?.match_headline ?? match?.matchHeadline ?? "").trim();
                  const party = getMatchPartyContact(match);
                  const showSelectedLeadChips = !showMatchedLeadDetailPanel(match);
                  return (
                    <button
                      key={rowId}
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggleMatch(match, idx)}
                      className={`rounded-md border bg-background-light/50 px-3 py-2.5 text-left transition hover:border-primary/40 ${
                        isOpen ? "border-primary/50 ring-2 ring-primary/25" : "border-border/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 pointer-events-none">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-wide text-text-muted">
                            {matchPartySectionLabel(match?.source)}
                          </div>
                          <div className="text-xs font-semibold text-text-heading leading-tight mt-0.5">
                            {party.name
                              ? readable(party.name)
                              : getMatchedLead(match)
                                ? "Contact not on file"
                                : "—"}
                          </div>
                          <div className="text-[11px] text-primary-dark mt-1 break-all">
                            {party.email || (getMatchedLead(match) ? "—" : "No email")}
                          </div>
                          {party.phone ? (
                            <div className="text-[11px] text-text-muted mt-0.5">{party.phone}</div>
                          ) : getMatchedLead(match) ? (
                            <div className="text-[11px] text-text-muted mt-0.5">—</div>
                          ) : null}
                        </div>
                        {getMatchScore(match) !== null && getMatchScore(match) !== undefined ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-700 shrink-0">
                            Match {getMatchScore(match)}
                          </span>
                        ) : null}
                      </div>

                      {showSelectedLeadChips ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-text-muted pointer-events-none">
                        <span className="w-full text-[9px] uppercase tracking-wide text-text-muted/80 mb-0.5">This lead</span>
                        {listMeta.isMatched === true ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5">
                            <CheckCircle2 size={10} />
                            Matched
                          </span>
                        ) : listMeta.isMatched === false ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5">
                            <XCircle size={10} />
                            Mismatched
                          </span>
                        ) : null}
                        {listMeta.leadGrade ? (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 ${
                              String(listMeta.leadGrade).toLowerCase() === "hot"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : String(listMeta.leadGrade).toLowerCase() === "warm"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            <Flame size={10} />
                            {String(listMeta.leadGrade).toUpperCase()}
                          </span>
                        ) : null}
                        {listMeta.qualified ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5">
                            <BadgeCheck size={10} />
                            Qualified
                          </span>
                        ) : null}
                        {listMeta.intent ? (
                          <span className="px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50">
                            {String(listMeta.intent).charAt(0).toUpperCase() + String(listMeta.intent).slice(1)}
                          </span>
                        ) : null}
                        {listMeta.leadScore !== null && listMeta.leadScore !== undefined ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-md ${
                              Number(listMeta.leadScore) >= 70
                                ? "bg-green-50 border border-green-200 text-green-700"
                                : Number(listMeta.leadScore) >= 40
                                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                                  : "bg-red-50 border border-red-200 text-red-700"
                            }`}
                          >
                            Score {listMeta.leadScore}
                          </span>
                        ) : null}
                        {listMeta.location ? (
                          <span className="px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50 max-w-[140px] truncate">
                            {listMeta.location}
                          </span>
                        ) : null}
                        {listMeta.timeline ? (
                          <span className="px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50">
                            Timeline: {listMeta.timeline}
                          </span>
                        ) : null}
                        {listMeta.budget ? (
                          <span className="px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50">
                            Budget: {listMeta.budget}
                          </span>
                        ) : null}
                        {listMeta.channel ? (
                          <span className="px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50 inline-flex items-center gap-0.5">
                            <MessageCircle size={9} />
                            {listMeta.channel}
                          </span>
                        ) : null}
                      </div>
                      ) : null}

                      <div className="mt-2 border-t border-border/40 pt-1.5 pointer-events-none">
                        <p className="text-[11px] font-medium leading-snug text-text-heading line-clamp-2">{summaryInline}</p>
                        {headline && headline.toLowerCase() !== String(summaryInline).toLowerCase() ? (
                          <p className="mt-1 text-[10px] leading-snug text-text-muted">{headline}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedMatch && typeof document !== "undefined"
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center overflow-y-auto bg-black/45 p-2 sm:p-4"
                      role="presentation"
                      onClick={() => setSelectedMatch(null)}
                    >
                      <div
                        className="my-auto flex max-h-[min(92dvh,92vh)] min-h-0 w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl sm:w-full"
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
                            <p className="mt-0.5 text-[11px] text-text-muted sm:text-xs">Match details & next steps</p>
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

                        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-2.5 sm:space-y-3 sm:px-4 sm:py-3">
                          {showMatchedLeadDetailPanel(selectedMatch.match) ? (
                            <div className="rounded-lg border border-border/60 bg-background-light/30 p-2.5 sm:p-3">
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
                            <div className="rounded-lg border border-border/60 bg-background-light/20 p-2.5 sm:p-3">
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

                          <div className="space-y-1.5 rounded-lg border border-border/60 bg-background-light/40 p-2.5 sm:p-3">
                            <div className="text-[11px] font-semibold text-text-heading sm:text-xs">Professional & next steps</div>
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              <ModalKeyValue label="Professional" value={propertyMatchesPayload?.user_name || "—"} />
                              <ModalKeyValue label="Primary channel" value={propertyMatchesPayload?.next_steps?.primary_action?.channel || "—"} />
                              <ModalKeyValue label="Primary next step" value={propertyMatchesPayload?.next_steps?.primary_action?.title || "—"} />
                              <ModalKeyValue
                                label="Secondary steps"
                                value={
                                  Array.isArray(propertyMatchesPayload?.next_steps?.secondary_actions) &&
                                  propertyMatchesPayload.next_steps.secondary_actions.length
                                    ? propertyMatchesPayload.next_steps.secondary_actions.map((s) => s?.title).filter(Boolean).join(", ")
                                    : "—"
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-0.5 text-[11px] font-semibold text-text-heading sm:text-xs">Suggestion</div>
                            <p className="text-[11px] leading-snug text-text-body sm:text-xs">
                              {offerSuggestionText(selectedMatch.match, selectedMatch.idx)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border/60 bg-white px-2.5 py-2 sm:px-3">
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
        <div className="text-sm text-text-muted">Choose a lead to view property matches.</div>
      )}
    </div>
  );
}
