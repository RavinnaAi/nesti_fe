import { BadgeCheck, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  LeadGradeIcon,
  displayLeadGradeLabel,
  leadGradeChipClasses,
  leadIntentChipClasses,
  leadScoreFallbackChipClasses,
  resolveDisplayLeadGrade,
} from "@/lib/leadGradeUi";

const getLeadMeta = (conversation) => {
  // console.log("conversation ", conversation)
  const leadScore = conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score ?? null;
  const leadGrade = conversation?.lead_grade ?? conversation?.leadGrade ?? null;
  const intent = conversation?.intent ?? conversation?.lead_intent ?? conversation?.intent_label ?? null;
  const channel = conversation?.channel ?? conversation?.source ?? null;
  const qualified = conversation?.is_qualified ?? conversation?.isQualified ?? null;
  const last_message_content = conversation?.last_message_meta ?? conversation?.last_message_meta?.contact ?? null;


  // Check for matched status in multiple possible fields
  let isMatched = conversation?.is_matched ?? conversation?.matched ?? null;
  if (isMatched === null) {
    const matchStatus = conversation?.match_status;
    if (matchStatus === "matched" || matchStatus === true) {
      isMatched = true;
    } else {
      isMatched = conversation?.meta?.is_matched ??
        conversation?.meta?.matched ??
        conversation?.metadata?.is_matched ??
        conversation?.metadata?.matched ??
        null;
    }
  }

  const signals =
    conversation?.signals ||
    conversation?.meta?.signals ||
    conversation?.metadata?.signals ||
    {};
  const timeline = conversation?.timeline || signals?.timeline || null;
  const budget = conversation?.budget || signals?.budget || null;
  const location =
    conversation?.location ||
    conversation?.city ||
    signals?.location ||
    null;

  return { leadScore, leadGrade, intent, channel, qualified, isMatched, last_message_content, timeline, budget, location };
};

const formatUpdatedTime = (conversation) => {
  const value =
    conversation?.updated_at ||
    conversation?.updatedAt ||
    conversation?.created_at ||
    conversation?.createdAt ||
    null;
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

export default function LeadListItem({ conversation, active, onSelect, propertyMatchCount }) {
  // console.log('conversation ', conversation);
  const id = conversation?.id || conversation?.conversation_id || conversation?.conversationId;
  const visitorId = conversation?.visitor_id || conversation?.visitorId || conversation?.visitor || "";
  const name =
    conversation?.name ||
    conversation?.visitor_name ||
    conversation?.visitorName ||
    (visitorId ? `Visitor ${String(visitorId).slice(0, 6)}` : "Unknown visitor");
  const subtitle =
    conversation?.email ||
    conversation?.visitor_email ||
    conversation?.visitorEmail ||
    conversation?.phone ||
    conversation?.visitor_phone ||
    conversation?.visitorPhone ||
    conversation?.location ||
    conversation?.city ||
    "No contact info";

  const { leadScore, leadGrade, intent, channel, qualified, isMatched, last_message_content, timeline, budget, location } =
    getLeadMeta(conversation);
  const updatedAtLabel = formatUpdatedTime(conversation);
  const displayGrade = resolveDisplayLeadGrade(leadGrade, leadScore);
  const scoreChipClasses = displayGrade
    ? leadGradeChipClasses(displayGrade)
    : leadScoreFallbackChipClasses(leadScore);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left rounded-md border px-3 py-2.5 transition ${active
        ? "border-primary/70 bg-primary/[0.04] shadow-sm"
        : isMatched === false
          ? "border-red-200/90 bg-red-50/40 hover:border-red-300"
          : "border-border/90 bg-white hover:border-primary/35 hover:bg-background-light/35"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className="max-w-full truncate text-[14px] sm:text-[15px] font-semibold text-text-heading leading-tight"
            title={name}
          >
            {name}
          </div>
          <div
            className="text-[11px] text-primary-dark mt-0.5 truncate"
            title={conversation?.email || last_message_content?.contact?.email || "No email"}
          >
            {conversation?.email || last_message_content?.contact?.email || "No email"}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {conversation?.phone || last_message_content?.contact?.phone || ""}
          </div>
          {location ? (
            <span
              className="mt-1 block w-full min-w-0 truncate text-[10px] px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50 text-text-muted"
              title={String(location)}
            >
              {location}
            </span>
          ) : null}
        </div>
        <div className="shrink-0 self-start flex items-center gap-1.5 text-[11px]">
          {isMatched === true ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5">
              <CheckCircle2 size={11} />
              Matched
            </span>
          ) : isMatched === false ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5">
              <XCircle size={11} />
              Mismatched
            </span>
          ) : null}
          {displayGrade ? (
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${leadGradeChipClasses(displayGrade)}`}>
              <LeadGradeIcon grade={displayGrade} size={11} />
              {displayLeadGradeLabel(displayGrade)}
            </span>
          ) : null}
          {qualified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5">
              <BadgeCheck size={11} />
              Qualified
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain text-[10px] text-text-muted [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {intent ? (
          <span className={`shrink-0 px-1.5 py-0.5 rounded-md ${leadIntentChipClasses(intent)}`}>
            {intent?.charAt(0).toUpperCase() + intent?.slice(1)}
          </span>
        ) : null}
        {leadScore !== null && leadScore !== undefined ? (
          <span className={`shrink-0 px-1.5 py-0.5 rounded-md ${scoreChipClasses}`}>
            {displayGrade ? (
              <span className="inline-flex items-center gap-1">
                <LeadGradeIcon grade={displayGrade} size={9} className="shrink-0 opacity-90" />
                Score {leadScore}
              </span>
            ) : (
              <>Score {leadScore}</>
            )}
          </span>
        ) : null}
        {timeline ? (
          <span className="shrink-0 max-w-[9rem] truncate px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50" title={String(timeline)}>
            Timeline: {timeline}
          </span>
        ) : null}
        {budget ? (
          <span className="shrink-0 max-w-[9rem] truncate px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50" title={String(budget)}>
            Budget: {budget}
          </span>
        ) : null}
        {channel ? (
          <span className="shrink-0 max-w-[8rem] truncate px-1.5 py-0.5 rounded-md border border-border/60 bg-background-light/50" title={String(channel)}>
            <MessageCircle size={9} className="inline-block mr-1" />
            {channel}
          </span>
        ) : null}
        {typeof propertyMatchCount === "number" ? (
          <span className="shrink-0 px-1.5 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary">
            Matches: {propertyMatchCount}
          </span>
        ) : null}
      </div>
      {updatedAtLabel ? (
        <div className="mt-1.5 text-[10px] text-text-muted">Updated: {updatedAtLabel}</div>
      ) : null}
    </button>
  );
}
