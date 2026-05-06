"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import SubmitButton from "@/components/auth/SubmitButton";
import { useIcpProfileQuery, useSaveIcpProfile } from "@/hooks/useProfileApi";

const AGENT_OPTIONS = {
  client_types: [
    "first_time_buyers",
    "luxury_buyers",
    "investors",
    "sellers",
    "downsizers",
  ],
  property_types: [
    { value: "detached", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi_family", label: "Multi Family" },
    { value: "land", label: "Land" },
  ],
  timeline_preference: ["immediate", "3_6_months", "long_term"],
};

const MORTGAGE_OPTIONS = {
  loan_types: [
    "first_time_buyers",
    "investment_properties",
    "refinances",
    "self_employed_borrowers",
  ],
  credit_range_preference: ["750_plus", "700_749", "650_699", "600_649", "under_600"],
  income_preference: ["200k_plus", "150k_200k", "100k_150k", "70k_100k", "under_70k"],
};

const LAWYER_OPTIONS = {
  transaction_types: ["home_purchases", "home_sales", "refinances", "title_transfers"],
};

function toArray(value) {
  if (Array.isArray(value)) return value.filter((v) => String(v || "").trim() !== "");
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    // Support legacy payloads saved as JSON string arrays.
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => String(v || "").trim() !== "");
        }
      } catch {
        // fall through to comma parsing
      }
    }
    // Support legacy comma-separated strings.
    return raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function parseAreaInput(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function pickIdealClientProfile(data) {
  return (
    data?.ideal_client_profile ||
    data?.icp_profile ||
    data?.profile ||
    data?.data?.ideal_client_profile ||
    data?.data?.icp_profile ||
    data?.data?.profile ||
    null
  );
}

function normalizeRole(input) {
  const role = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (role === "mortgagebroker") return "mortgage_broker";
  return role;
}

function formatLabel(token) {
  return String(token || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getOptionValue(option) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option) {
  if (typeof option === "string") return formatLabel(option);
  return option.label || formatLabel(option.value);
}

function ChipGroup({ label, options, values, onToggle }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const optionValue = getOptionValue(option);
          const selected = values.includes(optionValue);
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onToggle(optionValue)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                selected
                  ? "border-primary bg-primary/10 text-primary-dark"
                  : "border-border bg-white text-text-body hover:border-primary/40"
              }`}
            >
              {getOptionLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function IcpIntegrationCard() {
  const { user } = useAppSelector((state) => state.auth);
  const role = normalizeRole(user?.role);
  const saveIcp = useSaveIcpProfile();
  const icpQuery = useIcpProfileQuery();
  const [form, setForm] = useState({
    client_types: [],
    property_types: [],
    timeline_preference: [],
    service_areas_text: "",
    price_range_min: "",
    price_range_max: "",
    loan_types: [],
    credit_range_preference: [],
    income_preference: [],
    loan_size_range_min: "",
    loan_size_range_max: "",
    transaction_types: [],
    preferred_property_values_min: "",
    preferred_property_values_max: "",
  });

  useEffect(() => {
    const icp = pickIdealClientProfile(icpQuery.data);
    if (!icp) return;
    setForm((prev) => ({
      ...prev,
      client_types: toArray(icp.client_types),
      property_types: toArray(icp.property_types),
      timeline_preference: toArray(icp.timeline_preference),
      service_areas_text: toArray(icp.service_areas).join(", "),
      price_range_min: icp.price_range?.min ?? "",
      price_range_max: icp.price_range?.max ?? "",
      loan_types: toArray(icp.loan_types),
      credit_range_preference: toArray(icp.credit_range_preference),
      income_preference: toArray(icp.income_preference),
      loan_size_range_min: icp.loan_size_range?.min ?? "",
      loan_size_range_max: icp.loan_size_range?.max ?? "",
      transaction_types: toArray(icp.transaction_types),
      preferred_property_values_min: icp.preferred_property_values?.min ?? "",
      preferred_property_values_max: icp.preferred_property_values?.max ?? "",
    }));
  }, [icpQuery.data]);

  const unsupportedRole = !["agent", "mortgage_broker", "lawyer"].includes(role);

  const toggleArrayValue = (key, value) => {
    setForm((prev) => {
      const current = toArray(prev[key]);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const payload = useMemo(() => {
    if (role === "agent") {
      return {
        client_types: toArray(form.client_types),
        price_range: {
          min: form.price_range_min === "" ? null : Number(form.price_range_min),
          max: form.price_range_max === "" ? null : Number(form.price_range_max),
        },
        property_types: toArray(form.property_types),
        service_areas: parseAreaInput(form.service_areas_text),
        timeline_preference: toArray(form.timeline_preference),
      };
    }
    if (role === "mortgage_broker") {
      return {
        loan_types: toArray(form.loan_types),
        credit_range_preference: toArray(form.credit_range_preference),
        income_preference: toArray(form.income_preference),
        loan_size_range: {
          min: form.loan_size_range_min === "" ? null : Number(form.loan_size_range_min),
          max: form.loan_size_range_max === "" ? null : Number(form.loan_size_range_max),
        },
      };
    }
    if (role === "lawyer") {
      return {
        transaction_types: toArray(form.transaction_types),
        preferred_property_values: {
          min:
            form.preferred_property_values_min === ""
              ? null
              : Number(form.preferred_property_values_min),
          max:
            form.preferred_property_values_max === ""
              ? null
              : Number(form.preferred_property_values_max),
        },
        service_areas: parseAreaInput(form.service_areas_text),
      };
    }
    return {};
  }, [form, role]);

  const handleSave = async () => {
    if (unsupportedRole) return;
    await saveIcp.mutateAsync(payload);
    await icpQuery.refetch();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-heading">Ideal Client Profile (ICP)</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Define your ideal clients so lead scoring and matching aligns with your business goals.
        </p>
      </div>

      {icpQuery.isLoading ? (
        <div className="text-xs text-text-muted">Loading ICP settings...</div>
      ) : null}
      {icpQuery.isError ? (
        <div className="text-xs text-red-600">
          {icpQuery.error?.message || "Failed to load ICP settings."}
        </div>
      ) : null}

      {unsupportedRole ? (
        <div className="text-xs text-text-muted">
          ICP integration is not configured for this professional role yet.
        </div>
      ) : null}

      {!unsupportedRole && role === "agent" ? (
        <div className="space-y-4">
          <ChipGroup
            label="Client Types"
            options={AGENT_OPTIONS.client_types}
            values={toArray(form.client_types)}
            onToggle={(value) => toggleArrayValue("client_types", value)}
          />
          <ChipGroup
            label="Property Types"
            options={AGENT_OPTIONS.property_types}
            values={toArray(form.property_types)}
            onToggle={(value) => toggleArrayValue("property_types", value)}
          />
          <ChipGroup
            label="Timeline Preference"
            options={AGENT_OPTIONS.timeline_preference}
            values={toArray(form.timeline_preference)}
            onToggle={(value) => toggleArrayValue("timeline_preference", value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">
              Min Price
              <input
                type="number"
                min="0"
                value={form.price_range_min}
                onChange={(e) => setForm((prev) => ({ ...prev, price_range_min: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs text-text-muted">
              Max Price
              <input
                type="number"
                min="0"
                value={form.price_range_max}
                onChange={(e) => setForm((prev) => ({ ...prev, price_range_max: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="text-xs text-text-muted block">
            Service Areas (comma separated)
            <input
              type="text"
              value={form.service_areas_text}
              onChange={(e) => setForm((prev) => ({ ...prev, service_areas_text: e.target.value }))}
              placeholder="Downtown, Gulberg, DHA"
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      ) : null}

      {!unsupportedRole && role === "mortgage_broker" ? (
        <div className="space-y-4">
          <ChipGroup
            label="Loan Types"
            options={MORTGAGE_OPTIONS.loan_types}
            values={toArray(form.loan_types)}
            onToggle={(value) => toggleArrayValue("loan_types", value)}
          />
          <ChipGroup
            label="Credit Range Preference"
            options={MORTGAGE_OPTIONS.credit_range_preference}
            values={toArray(form.credit_range_preference)}
            onToggle={(value) => toggleArrayValue("credit_range_preference", value)}
          />
          <ChipGroup
            label="Income Preference"
            options={MORTGAGE_OPTIONS.income_preference}
            values={toArray(form.income_preference)}
            onToggle={(value) => toggleArrayValue("income_preference", value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">
              Min Loan Size
              <input
                type="number"
                min="0"
                value={form.loan_size_range_min}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, loan_size_range_min: e.target.value }))
                }
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs text-text-muted">
              Max Loan Size
              <input
                type="number"
                min="0"
                value={form.loan_size_range_max}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, loan_size_range_max: e.target.value }))
                }
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      ) : null}

      {!unsupportedRole && role === "lawyer" ? (
        <div className="space-y-4">
          <ChipGroup
            label="Transaction Types"
            options={LAWYER_OPTIONS.transaction_types}
            values={toArray(form.transaction_types)}
            onToggle={(value) => toggleArrayValue("transaction_types", value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">
              Min Property Value
              <input
                type="number"
                min="0"
                value={form.preferred_property_values_min}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    preferred_property_values_min: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs text-text-muted">
              Max Property Value
              <input
                type="number"
                min="0"
                value={form.preferred_property_values_max}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    preferred_property_values_max: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="text-xs text-text-muted block">
            Service Areas (comma separated)
            <input
              type="text"
              value={form.service_areas_text}
              onChange={(e) => setForm((prev) => ({ ...prev, service_areas_text: e.target.value }))}
              placeholder="Downtown, Gulberg, DHA"
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      ) : null}

      {!unsupportedRole ? (
        <div className="flex justify-end">
          <SubmitButton
            type="button"
            loading={saveIcp.isPending}
            onClick={handleSave}
            className="!w-auto px-4 py-2 !h-auto rounded-md bg-primary text-white text-xs font-semibold"
          >
            Save ICP
          </SubmitButton>
        </div>
      ) : null}
    </div>
  );
}
