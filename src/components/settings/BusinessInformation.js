"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Briefcase,
  Clock,
  BarChart3,
  Target,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SubmitButton from "@/components/auth/SubmitButton";
import { useAppDispatch, useAppSelector } from "@/store";
import { useSaveBusinessInfo } from "@/hooks/useProfileApi";
import { setBusinessInfo } from "@/store/profileSlice";
import BasicsStep from "@/components/settings/businessSteps/BasicsStep";
import ExperienceStep from "@/components/settings/businessSteps/ExperienceStep";
import StyleMetricsStep from "@/components/settings/businessSteps/StyleMetricsStep";
import PreferencesStep from "@/components/settings/businessSteps/PreferencesStep";

const specializationsList = [
  "Residential",
  "Commercial",
  "Luxury Homes",
  "Investment Properties",
  "First-Time Buyers",
  "Vacation Homes",
  "Condos",
  "Townhouses",
  "Detached Homes",
  "Multifamily",
  "New Construction",
  "Foreclosures",
];

const communicationList = [
  "Text Message",
  "Email",
  "Phone Calls",
  "WhatsApp",
  "Video Calls",
];

const preferredClientsList = [
  "First-Time Buyers",
  "Investors",
  "Luxury Clients",
  "Down-Sizers",
  "Relocators",
  "Pre-Approved Only",
  "Cash Buyers",
  "Quick Closers",
];

const SUB_TABS = [
  { id: "basics", label: "Basics", icon: Briefcase },
  { id: "experience", label: "Experience", icon: Clock },
  { id: "style", label: "Style & Metrics", icon: BarChart3 },
  {
    id: "audience",
    label: "Audience & expertise",
    icon: Target,
  },
  { id: "story", label: "Story", icon: BookOpen },
];

export default function BusinessInformation({ onSaveSuccess } = {}) {
  const dispatch = useAppDispatch();
  const storedBusiness = useAppSelector((state) => state.profile.businessInfo);
  const [focusedField, setFocusedField] = useState("");
  const [form, setForm] = useState({
    professionalType: "",
    companyName: "",
    website: "",
    phone: "",
    email: "",
    experience: "",
    licenseNumber: "",
    socialMedia: "",
    transactionVolume: "",
    avgSalePrice: "",
    avgHomePrice: "",
    commissionRatePercent: "",
    responseTime: "",
    availability: "",
    supportLevel: "",
    negotiationStyle: "",
    salesApproach: "",
    energyStyle: "",
    personalityTag: "",
    awards: "",
    testimonial: "",
    targetNeighborhoods: "",
    fullName: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [communicationChannels, setCommunicationChannels] = useState([]);
  const [preferredClients, setPreferredClients] = useState([]);
  const saveBusinessInfo = useSaveBusinessInfo();
  const [activeSubTab, setActiveSubTab] = useState("basics");
  const formRef = useRef(form);
  formRef.current = form;
  const websiteLocationSaveTimerRef = useRef(null);
  const hasUserEditedRef = useRef(false);

  const hydrateFromStore = useCallback(() => {
    if (storedBusiness) {
      setForm((prev) => ({ ...prev, ...storedBusiness }));
      if (Array.isArray(storedBusiness.specializations))
        setSpecializations(storedBusiness.specializations);
      if (Array.isArray(storedBusiness.communicationChannels))
        setCommunicationChannels(storedBusiness.communicationChannels);
      if (Array.isArray(storedBusiness.preferredClients))
        setPreferredClients(storedBusiness.preferredClients);
    } else {
      setForm((prev) => ({ ...prev }));
      setSpecializations([]);
      setCommunicationChannels([]);
      setPreferredClients([]);
    }
  }, [storedBusiness]);

  const toggleFromList = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const scheduleWebsiteLocationAutosave = useCallback(() => {
    if (websiteLocationSaveTimerRef.current) {
      clearTimeout(websiteLocationSaveTimerRef.current);
    }
    websiteLocationSaveTimerRef.current = setTimeout(async () => {
      websiteLocationSaveTimerRef.current = null;
      const { website, location, companyName } = formRef.current;
      try {
        await saveBusinessInfo.mutateAsync({
          company_name: String(companyName || "").trim(),
          website: website || "",
          location: location || "",
          silent: true,
        });
      } catch {
        /* toast via hook */
      }
    }, 650);
  }, [saveBusinessInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    hasUserEditedRef.current = true;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "website" || name === "location" || name === "companyName") {
      scheduleWebsiteLocationAutosave();
    }
  };

  const handleSelectChange = (name, val) => {
    hasUserEditedRef.current = true;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  useEffect(() => {
    if (hasUserEditedRef.current) return;
    hydrateFromStore();
  }, [hydrateFromStore]);

  useEffect(() => {
    return () => {
      if (websiteLocationSaveTimerRef.current) {
        clearTimeout(websiteLocationSaveTimerRef.current);
      }
    };
  }, []);

  /** Experience, Style & metrics, Audience & expertise, Story — does not touch basics fields. */
  const buildRestPayload = () => ({
    company_name: String(form.companyName || "").trim(),
    website: form.website || "",
    location: form.location || "",
    target_neighborhoods: form.targetNeighborhoods || "",
    experience: form.experience || "",
    license_number: form.licenseNumber || "",
    social_media: form.socialMedia || "",
    transaction_volume: form.transactionVolume || "",
    avg_sale_price: form.avgSalePrice || "",
    avg_home_price: form.avgHomePrice ? Number(form.avgHomePrice) : null,
    commission_rate_percent: form.commissionRatePercent ? Number(form.commissionRatePercent) : null,
    response_time: form.responseTime || "",
    availability: form.availability || "",
    support_level: form.supportLevel || "",
    negotiation_style: form.negotiationStyle || "",
    sales_approach: form.salesApproach || "",
    energy_style: form.energyStyle || "",
    personality_tag: form.personalityTag || "",
    awards: form.awards || "",
    specializations,
    communication_channels: communicationChannels,
    preferred_clients: preferredClients,
    bio: form.testimonial || "",
  });

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      await saveBusinessInfo.mutateAsync(buildRestPayload());
      dispatch(
        setBusinessInfo({
          ...form,
          specializations,
          communicationChannels,
          preferredClients,
        })
      );
      hasUserEditedRef.current = false;
      await onSaveSuccess?.();
    } catch {
      /* error surfaced via toast in useSaveBusinessInfo hook */
    } finally {
      setLoading(false);
    }
  };

  const sharedProps = {
    form,
    focusedField,
    setFocusedField,
    handleChange,
    handleSelectChange,
    specializations,
    communicationChannels,
    preferredClients,
    toggleFromList,
    setSpecializations,
    setCommunicationChannels,
    setPreferredClients,
    specializationsList,
    communicationList,
    preferredClientsList,
  };

  const currentIdx = SUB_TABS.findIndex((t) => t.id === activeSubTab);

  const goNext = () => {
    dispatch(
      setBusinessInfo({
        ...form,
        specializations,
        communicationChannels,
        preferredClients,
      })
    );
    hasUserEditedRef.current = false;
    const nextIdx = Math.min(currentIdx + 1, SUB_TABS.length - 1);
    setActiveSubTab(SUB_TABS[nextIdx].id);
  };

  const goBack = () => {
    const prevIdx = Math.max(currentIdx - 1, 0);
    setActiveSubTab(SUB_TABS[prevIdx].id);
  };

  const renderSubContent = () => {
    switch (activeSubTab) {
      case "basics":
        return (
          <div className="w-full min-w-0">
            <BasicsStep {...sharedProps} />
          </div>
        );
      case "experience":
        return (
          <div className="w-full min-w-0">
            <ExperienceStep {...sharedProps} />
          </div>
        );
      case "style":
        return (
          <div className="w-full min-w-0">
            <StyleMetricsStep {...sharedProps} />
          </div>
        );
      case "audience":
        return (
          <div className="w-full min-w-0">
            <PreferencesStep {...sharedProps} mode="audience" />
          </div>
        );
      case "story":
        return (
          <div className="w-full min-w-0">
            <PreferencesStep {...sharedProps} mode="testimonial" />
          </div>
        );
      default:
        return (
          <div className="w-full min-w-0">
            <BasicsStep {...sharedProps} />
          </div>
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4" style={{ width: "100%" }}>
      {/* ── Header + step badge ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-text-heading">Business Information</h2>
          <p className="mt-0.5 text-xs text-text-muted">Keep your professional details up to date.</p>
        </div>
        <span className="inline-flex items-center self-start rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary-dark">
          Step {currentIdx + 1} / {SUB_TABS.length}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="grid w-full min-w-0 grid-cols-5 gap-0.5" style={{ width: "100%" }}>
        {SUB_TABS.map((tab, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className="group w-full"
              aria-label={tab.label}
            >
              <div
                className={`h-1 rounded-full transition-all ${
                  isCurrent
                    ? "bg-primary"
                    : isPast
                    ? "bg-primary/40"
                    : "bg-border"
                } group-hover:bg-primary/60`}
              />
            </button>
          );
        })}
      </div>

      {/* ── Sub-tabs row ── */}
      <div className="flex w-full min-w-0 flex-wrap gap-1.5">
        {SUB_TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          const isPast = idx < currentIdx;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : isPast
                  ? "bg-primary/10 text-primary-dark"
                  : "bg-background-light text-text-muted hover:text-text-heading hover:bg-primary/5"
              }`}
            >
              {isPast && !isActive ? (
                <CheckCircle2 size={11} className="shrink-0" />
              ) : (
                <Icon size={11} className="shrink-0" />
              )}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content area (fixed min-height for consistency) ── */}
      <div className="min-h-[280px] w-full min-w-0 max-w-none" style={{ width: "100%" }}>
        <div className="block w-full min-w-0 max-w-none" style={{ width: "100%" }}>
          {renderSubContent()}
        </div>
      </div>

      {/* ── Footer navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <div>
          {currentIdx > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-text-heading transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {currentIdx < SUB_TABS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              Next
              <ChevronRight size={14} />
            </button>
          ) : (
            <SubmitButton
              loading={loading}
              onClick={handleSubmit}
              type="button"
              className="!h-auto !w-auto rounded-md bg-primary px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              Save changes
            </SubmitButton>
          )}
        </div>
      </div>
    </div>
  );
}
