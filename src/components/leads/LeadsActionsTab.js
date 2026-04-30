"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Scale, Users } from "lucide-react";
import LeadActionSection from "@/components/leads/LeadActionSection";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { fetchProfessionals } from "@/lib/professionalsClient";

/** Same role ids + labels as `DashboardProfessionalsTabs` (Agents / Lawyers / Mortgage Brokers). */
const PROFESSIONAL_ROLE_OPTIONS = [
  { value: "agent", label: "Agents", icon: Users },
  { value: "lawyer", label: "Lawyers", icon: Scale },
  { value: "mortgage_broker", label: "Mortgage Brokers", icon: DollarSign },
];

const REFERRAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

function displayProfessionalName(row) {
  const full = String(row?.full_name || "").trim();
  if (full) return full;
  const joined = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return joined || "Unnamed professional";
}

function initialsForProfessional(row) {
  const name = displayProfessionalName(row);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";
}

/** Maps stored target_vertical (new + legacy) to a short label. */
function formatReferralVerticalLabel(v) {
  const raw = String(v || "").trim().toLowerCase();
  const map = {
    agent: "Agents",
    realtor: "Realtor",
    lawyer: "Lawyers",
    mortgage_broker: "Mortgage brokers",
    mortgage: "Mortgage broker",
  };
  if (map[raw]) return map[raw];
  return raw ? raw.replace(/_/g, " ") : "Referral";
}

export default function LeadsActionsTab({
  token,
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
  const role = referralForm?.professional_role ?? "";

  const professionalsQuery = useQuery({
    queryKey: ["referral-professionals", token, role],
    enabled: Boolean(token && role),
    queryFn: () =>
      fetchProfessionals({
        token,
        role,
        page: 1,
        limit: 100,
      }),
    staleTime: 60_000,
  });

  const professionals = useMemo(() => {
    const raw = professionalsQuery.data?.items;
    return Array.isArray(raw) ? raw : [];
  }, [professionalsQuery.data?.items]);
  const selectedProfessionalId = String(referralForm?.target_user_id || "").trim();
  const selectedProfessional = useMemo(
    () => professionals.find((row) => String(row?.id || "") === selectedProfessionalId) || null,
    [professionals, selectedProfessionalId]
  );

  const canSubmitReferral =
    Boolean(selectedLeadId && actionConversationId && String(referralForm?.target_user_id || "").trim()) &&
    !createReferralMutation.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LeadActionSection title="Referrals" subtitle="Connect this lead to another professional.">
        <div className="space-y-3">
          <SelectDropdown
            placeholder="Professional type"
            value={role}
            onChange={(value) =>
              setReferralForm((prev) => ({
                ...prev,
                professional_role: value,
                target_user_id: "",
              }))
            }
            options={PROFESSIONAL_ROLE_OPTIONS}
            size="small"
          />

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Refer to (one)
            </p>
            <div className="rounded-md border border-border bg-background-light/40">
              {!role ? (
                <div className="px-2 py-2 text-[11px] leading-snug text-text-muted">
                  Select a professional type above to load colleagues you can refer to.
                </div>
              ) : professionalsQuery.isLoading ? (
                <div className="px-2 py-2 text-[11px] text-text-muted">Loading professionals…</div>
              ) : professionalsQuery.isError ? (
                <div className="px-2 py-2 text-[11px] text-red-600">
                  {professionalsQuery.error?.message || "Could not load professionals."}
                </div>
              ) : professionals.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-text-muted">
                  No professionals found for this type yet.
                </div>
              ) : selectedProfessional ? (
                <div className="flex items-center gap-1.5 px-1.5 py-1">
                  <input
                    type="radio"
                    name="referral-target-professional"
                    checked
                    onChange={() => {}}
                    aria-label={`Refer lead to ${displayProfessionalName(selectedProfessional)}`}
                    title="Selected recipient"
                    className="h-3.5 w-3.5 shrink-0 cursor-default accent-primary"
                  />
                  <Link
                    href={`/professionals/${encodeURIComponent(String(selectedProfessional.id || ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded py-0.5 text-left text-text-heading outline-none ring-offset-1 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    {selectedProfessional.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs from profile
                      <img
                        src={selectedProfessional.profile_image}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/12">
                        {initialsForProfessional(selectedProfessional)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight underline-offset-2 hover:underline">
                      {displayProfessionalName(selectedProfessional)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReferralForm((prev) => ({ ...prev, target_user_id: "" }))}
                    className="shrink-0 rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-heading"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <ul className="max-h-44 divide-y divide-border/60 overflow-y-auto">
                  {professionals.map((row) => {
                    const id = String(row?.id || "");
                    const labelName = displayProfessionalName(row);
                    const selected = Boolean(id && String(referralForm?.target_user_id || "") === id);
                    return (
                      <li key={id || labelName}>
                        <div className="flex items-center gap-1.5 px-1.5 py-1">
                          <input
                            type="radio"
                            name="referral-target-professional"
                            checked={selected}
                            onChange={() =>
                              setReferralForm((prev) => ({ ...prev, target_user_id: id }))
                            }
                            aria-label={`Refer lead to ${labelName}`}
                            title="Choose recipient"
                            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary"
                          />
                          <Link
                            href={`/professionals/${encodeURIComponent(id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 flex-1 items-center gap-1.5 rounded py-0.5 text-left text-text-heading outline-none ring-offset-1 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            {row.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs from profile
                              <img
                                src={row.profile_image}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                              />
                            ) : (
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/[0.10] text-[10px] font-bold text-primary-dark ring-1 ring-primary/12">
                                {initialsForProfessional(row)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight underline-offset-2 hover:underline">
                              {labelName}
                            </span>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <textarea
            value={referralForm.notes || ""}
            onChange={(event) => setReferralForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full resize-y rounded-md border border-border bg-white px-2 py-1 text-[11px] placeholder:text-text-muted"
          />

          <button
            type="button"
            onClick={() => createReferralMutation.mutate()}
            disabled={!canSubmitReferral}
            className="w-full h-9 rounded-md bg-primary text-white text-xs font-semibold disabled:opacity-50"
          >
            {createReferralMutation.isPending ? "Saving..." : "Send referral"}
          </button>
        </div>

        <div className="mt-4 space-y-2 text-xs">
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
                <div className="font-semibold text-text-heading">
                  {formatReferralVerticalLabel(referral?.target_vertical)}
                </div>
                <div className="text-text-muted">Status: {referral?.status || "—"}</div>
              </button>
            ))
          )}
        </div>
        {activeReferralId ? (
          <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
            <SelectDropdown
              placeholder="Update status"
              value={referralUpdate.status || ""}
              onChange={(value) => setReferralUpdate((prev) => ({ ...prev, status: value }))}
              options={REFERRAL_STATUS_OPTIONS}
              size="small"
            />
            <textarea
              value={referralUpdate.notes}
              onChange={(event) =>
                setReferralUpdate((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Update notes"
              rows={2}
              className="w-full resize-y rounded-md border border-border px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => updateReferralMutation.mutate()}
              disabled={updateReferralMutation.isPending}
              className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
            >
              {updateReferralMutation.isPending ? "Updating..." : "Update referral"}
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
          disabled={!selectedLeadId || !actionConversationId || mortgageMutation.isPending}
          className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
        >
          {mortgageMutation.isPending ? "Running..." : "Run mortgage"}
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
            disabled={!selectedLeadId || !actionConversationId || closingMutation.isPending}
            className="w-full h-9 rounded-md border border-primary text-primary text-xs font-semibold disabled:opacity-50"
          >
            {closingMutation.isPending ? "Running..." : "Run closing cost"}
          </button>
          <div className="text-xs text-text-muted">
            {closingRuns.length ? `Runs: ${closingRuns.length}` : "No closing runs yet."}
          </div>
        </div>
      </LeadActionSection>
    </div>
  );
}
