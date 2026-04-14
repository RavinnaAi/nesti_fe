import { Flame, BadgeCheck, MessageCircle, CheckCircle2, XCircle } from "lucide-react";

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

export default function LeadListItem({ conversation, active, onSelect }) {
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

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left rounded-md border px-4 py-3 transition ${active
        ? "border-primary bg-primary/5 shadow-sm"
        : isMatched === false
          ? "border-red-200 bg-red-50/50 hover:border-red-300"
          : "border-border bg-white hover:border-primary/40 hover:bg-background-light/40"
        }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold text-text-heading leading-tight">{name}</div>
          <div className="text-xs text-primary-dark mt-1 break-all">
            {conversation?.email || last_message_content?.contact?.email || "No email"}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {conversation?.phone || last_message_content?.contact?.phone || ""}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isMatched === true ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
              <CheckCircle2 size={12} />
              Matched
            </span>
          ) : isMatched === false ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
              <XCircle size={12} />
              Mismatched
            </span>
          ) : null}
          {leadGrade ? (
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${String(leadGrade).toLowerCase() === "hot"
              ? "bg-red-50 text-red-700 border border-red-200"
              : String(leadGrade).toLowerCase() === "warm"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
              <Flame size={12} />
              {String(leadGrade).toUpperCase()}
            </span>
          ) : null}
          {qualified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
              <BadgeCheck size={12} />
              Qualified
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
        {intent ? <span className="px-2 py-0.5 rounded-md border border-border/60 bg-background-light/50">{intent?.charAt(0).toUpperCase() + intent?.slice(1)}</span> : null}
        {leadScore !== null && leadScore !== undefined ? (
          <span
            className={`px-2 py-0.5 rounded-md ${Number(leadScore) >= 70
              ? "bg-green-50 border border-green-200 text-green-700"
              : Number(leadScore) >= 40
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-red-50 border border-red-200 text-red-700"
              }`}
          >
            Score {leadScore}
          </span>
        ) : null}
        {location ? <span className="px-2 py-0.5 rounded-md border border-border/60 bg-background-light/50">{location}</span> : null}
        {timeline ? <span className="px-2 py-0.5 rounded-md border border-border/60 bg-background-light/50">Timeline: {timeline}</span> : null}
        {budget ? <span className="px-2 py-0.5 rounded-md border border-border/60 bg-background-light/50">Budget: {budget}</span> : null}
        {channel ? (
          <span className="px-2 py-0.5 rounded-md border border-border/60 bg-background-light/50">
            <MessageCircle size={10} className="inline-block mr-1" />
            {channel}
          </span>
        ) : null}
      </div>
      {updatedAtLabel ? (
        <div className="mt-2 text-[11px] text-text-muted">Updated: {updatedAtLabel}</div>
      ) : null}
    </button>
  );
}
