"use client";

import { DollarSign, Scale, Users } from "lucide-react";
import LeadActionSection from "@/components/leads/LeadActionSection";
import SelectDropdown from "@/components/ui/SelectDropdown";

export default function LeadsActionsTab({
  referralForm,
  setReferralForm,
  createReferralMutation,
  selectedLeadId,
  actionConversationId,
  conversationReferrals,
  activeReferralId,
  setActiveReferralId,
  referralUpdate,
  setReferralUpdate,
  updateReferralMutation,
  mortgageForm,
  setMortgageForm,
  mortgageMutation,
  mortgageRuns,
  closingForm,
  setClosingForm,
  closingMutation,
  closingRuns,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LeadActionSection title="Referrals" subtitle="Connect this lead to another professional.">
        <div className="grid grid-cols-2 gap-2">
          <SelectDropdown
            placeholder="Select vertical"
            value={referralForm.target_vertical}
            onChange={(value) => setReferralForm((prev) => ({ ...prev, target_vertical: value }))}
            options={[
              { value: "realtor", label: "Realtor", icon: Users },
              { value: "mortgage", label: "Mortgage Broker", icon: DollarSign },
              { value: "lawyer", label: "Real Estate Lawyer", icon: Scale },
            ]}
            size="small"
          />
          <input
            type="text"
            value={referralForm.target_user_id}
            onChange={(event) =>
              setReferralForm((prev) => ({ ...prev, target_user_id: event.target.value }))
            }
            placeholder="Target user id"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
          <input
            type="text"
            value={referralForm.status}
            onChange={(event) => setReferralForm((prev) => ({ ...prev, status: event.target.value }))}
            placeholder="Status"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
          <input
            type="text"
            value={referralForm.notes}
            onChange={(event) => setReferralForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => createReferralMutation.mutate()}
          disabled={!selectedLeadId || !actionConversationId || createReferralMutation.isLoading}
          className="w-full h-9 rounded-md bg-primary text-white text-xs font-semibold disabled:opacity-50"
        >
          {createReferralMutation.isLoading ? "Saving..." : "Create referral"}
        </button>
        <div className="space-y-2 text-xs">
          {conversationReferrals.length === 0 ? (
            <div className="text-text-muted">No referrals yet.</div>
          ) : (
            conversationReferrals.map((referral) => (
              <button
                key={referral?.id}
                type="button"
                onClick={() => setActiveReferralId(String(referral?.id))}
                className={`w-full text-left rounded-md border px-3 py-2 ${
                  String(referral?.id) === String(activeReferralId)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="font-semibold text-text-heading">{referral?.target_vertical || "Referral"}</div>
                <div className="text-text-muted">Status: {referral?.status || "—"}</div>
              </button>
            ))
          )}
        </div>
        {activeReferralId ? (
          <div className="space-y-2">
            <input
              type="text"
              value={referralUpdate.status}
              onChange={(event) =>
                setReferralUpdate((prev) => ({ ...prev, status: event.target.value }))
              }
              placeholder="Update status"
              className="h-9 rounded-md border border-border px-2 text-xs w-full"
            />
            <input
              type="text"
              value={referralUpdate.notes}
              onChange={(event) =>
                setReferralUpdate((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Update notes"
              className="h-9 rounded-md border border-border px-2 text-xs w-full"
            />
            <button
              type="button"
              onClick={() => updateReferralMutation.mutate()}
              disabled={updateReferralMutation.isLoading}
              className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
            >
              {updateReferralMutation.isLoading ? "Updating..." : "Update referral"}
            </button>
          </div>
        ) : null}
      </LeadActionSection>

      <LeadActionSection title="Mortgage calculator" subtitle="Log a mortgage estimate.">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={mortgageForm.price}
            onChange={(event) => setMortgageForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
          <input
            type="number"
            value={mortgageForm.down_payment}
            onChange={(event) =>
              setMortgageForm((prev) => ({ ...prev, down_payment: event.target.value }))
            }
            placeholder="Down payment"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
          <input
            type="number"
            value={mortgageForm.annual_rate}
            onChange={(event) =>
              setMortgageForm((prev) => ({ ...prev, annual_rate: event.target.value }))
            }
            placeholder="Annual rate %"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
          <input
            type="number"
            value={mortgageForm.amort_years}
            onChange={(event) =>
              setMortgageForm((prev) => ({ ...prev, amort_years: event.target.value }))
            }
            placeholder="Amort years"
            className="h-9 rounded-md border border-border px-2 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => mortgageMutation.mutate()}
          disabled={!selectedLeadId || !actionConversationId || mortgageMutation.isLoading}
          className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
        >
          {mortgageMutation.isLoading ? "Running..." : "Run mortgage"}
        </button>
        <div className="text-xs text-text-muted">
          {mortgageRuns.length ? `Runs: ${mortgageRuns.length}` : "No mortgage runs yet."}
        </div>
      </LeadActionSection>

      <LeadActionSection title="Closing cost" subtitle="Log a closing cost estimate.">
        <div className="space-y-2">
          <input
            type="number"
            value={closingForm.price}
            onChange={(event) => setClosingForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price"
            className="h-9 rounded-md border border-border px-2 text-xs w-full"
          />
          <button
            type="button"
            onClick={() => closingMutation.mutate()}
            disabled={!selectedLeadId || !actionConversationId || closingMutation.isLoading}
            className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
          >
            {closingMutation.isLoading ? "Running..." : "Run closing cost"}
          </button>
          <div className="text-xs text-text-muted">
            {closingRuns.length ? `Runs: ${closingRuns.length}` : "No closing runs yet."}
          </div>
        </div>
      </LeadActionSection>
    </div>
  );
}
