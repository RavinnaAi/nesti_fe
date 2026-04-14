"use client";

import LeadActionSection from "@/components/leads/LeadActionSection";

export default function LeadsNurtureTab({
  nurtureForm,
  setNurtureForm,
  nurtureMutation,
  selectedLeadId,
  actionConversationId,
  nurtureLogs,
}) {
  return (
    <LeadActionSection
      title="Nurture email"
      subtitle="Send a nurture message and log it for this conversation."
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          type="email"
          value={nurtureForm.to_email}
          onChange={(event) => setNurtureForm((prev) => ({ ...prev, to_email: event.target.value }))}
          placeholder="Recipient email"
          className="h-9 rounded-md border border-border px-2 text-xs col-span-2"
        />
        <input
          type="text"
          value={nurtureForm.subject}
          onChange={(event) => setNurtureForm((prev) => ({ ...prev, subject: event.target.value }))}
          placeholder="Subject"
          className="h-9 rounded-md border border-border px-2 text-xs col-span-2"
        />
        <textarea
          rows={4}
          value={nurtureForm.body}
          onChange={(event) => setNurtureForm((prev) => ({ ...prev, body: event.target.value }))}
          placeholder="Message body"
          className="rounded-md border border-border px-2 py-2 text-xs w-full col-span-2"
        />
        <input
          type="text"
          value={nurtureForm.template_key}
          onChange={(event) =>
            setNurtureForm((prev) => ({ ...prev, template_key: event.target.value }))
          }
          placeholder="Template key (optional)"
          className="h-9 rounded-md border border-border px-2 text-xs col-span-2"
        />
      </div>
      <button
        type="button"
        onClick={() => nurtureMutation.mutate()}
        disabled={!selectedLeadId || !actionConversationId || nurtureMutation.isLoading}
        className="w-full h-9 rounded-md bg-primary text-white text-xs font-semibold disabled:opacity-50"
      >
        {nurtureMutation.isLoading ? "Sending..." : "Send nurture"}
      </button>
      <div className="text-xs text-text-muted">
        {nurtureLogs.length ? `Logs: ${nurtureLogs.length}` : "No nurture logs yet."}
      </div>
    </LeadActionSection>
  );
}
