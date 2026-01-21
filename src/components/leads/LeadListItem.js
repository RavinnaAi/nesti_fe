import { Flame, BadgeCheck, MessageCircle } from "lucide-react";

const getLeadMeta = (conversation) => {
  const leadScore = conversation?.lead_score ?? conversation?.leadScore ?? conversation?.score ?? null;
  const leadGrade = conversation?.lead_grade ?? conversation?.leadGrade ?? null;
  const intent = conversation?.intent ?? conversation?.lead_intent ?? conversation?.intent_label ?? null;
  const channel = conversation?.channel ?? conversation?.source ?? null;
  const qualified = conversation?.is_qualified ?? conversation?.isQualified ?? null;
  return { leadScore, leadGrade, intent, channel, qualified };
};

export default function LeadListItem({ conversation, active, onSelect }) {
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

  const { leadScore, leadGrade, intent, channel, qualified } = getLeadMeta(conversation);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-white hover:border-primary/40 hover:bg-background-light/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text-heading">{name}</div>
          <div className="text-xs text-text-muted mt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {leadGrade ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-100 px-2 py-0.5">
              <Flame size={12} />
              {String(leadGrade).toUpperCase()}
            </span>
          ) : null}
          {qualified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
              <BadgeCheck size={12} />
              Qualified
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
        {intent ? <span className="px-2 py-0.5 rounded-full bg-background-light">{intent}</span> : null}
        {leadScore !== null && leadScore !== undefined ? (
          <span className="px-2 py-0.5 rounded-full bg-background-light">Score {leadScore}</span>
        ) : null}
        {channel ? (
          <span className="px-2 py-0.5 rounded-full bg-background-light">
            <MessageCircle size={10} className="inline-block mr-1" />
            {channel}
          </span>
        ) : null}
      </div>
    </button>
  );
}
