"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Globe2,
  Phone,
  MapPin,
  User,
  Mail,
  IdCard,
  Link2,
  BarChart2,
  Layers,
  Star,
  Award,
} from "lucide-react";
import FormField from "@/components/auth/FormField";
import SubmitButton from "@/components/auth/SubmitButton";
import { useAppSelector } from "@/store";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { useSaveBusinessInfo } from "@/hooks/useProfileApi";

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

export default function BusinessInformation() {
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
    responseTime: "",
    availability: "",
    supportLevel: "",
    negotiationStyle: "",
    salesApproach: "",
    energyStyle: "",
    personalityTag: "",
    transactionsThisYear: "",
    careerTransactions: "",
    clientRating: "",
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

  const toggleFromList = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, val) => {
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  useEffect(() => {
    if (storedBusiness) {
      setForm((prev) => ({ ...prev, ...storedBusiness }));
      if (Array.isArray(storedBusiness.specializations)) {
        setSpecializations(storedBusiness.specializations);
      }
      if (Array.isArray(storedBusiness.communicationChannels)) {
        setCommunicationChannels(storedBusiness.communicationChannels);
      }
      if (Array.isArray(storedBusiness.preferredClients)) {
        setPreferredClients(storedBusiness.preferredClients);
      }
    }
  }, [storedBusiness]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        specializations,
        communicationChannels,
        preferredClients,
      };
      await saveBusinessInfo.mutateAsync(payload);
    } catch (err) {
      console.error("Business info update error:", err);
      // toast handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectDropdown
          label="Professional Type"
          placeholder="Select type"
          required
          value={form.professionalType}
          disabled
          className="bg-gray-100 cursor-not-allowed"
          onChange={(val) => handleSelectChange("professionalType", val)}
          onFocus={() => setFocusedField("professionalType")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "agent", label: "Agent" },
            { value: "lawyer", label: "Lawyer" },
            { value: "broker", label: "Mortgage Broker" },
          ]}
        />
        <FormField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          onFocus={() => setFocusedField("fullName")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter full name"
          icon={User}
          focusedField={focusedField}
          required
        />
        {/*
        <FormField
          label="Company Name"
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          onFocus={() => setFocusedField("companyName")}
          onBlur={() => setFocusedField("")}
          placeholder="Enter company name"
          icon={Building2}
          focusedField={focusedField}
          required
        />
        */}
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField("")}
          placeholder="you@example.com"
          icon={Mail}
          disabled
          className="!bg-gray-100 !cursor-not-allowed"
          focusedField={focusedField}
          required
        />
        <FormField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onFocus={() => setFocusedField("phone")}
          onBlur={() => setFocusedField("")}
          placeholder="+1 555 000 0000"
          icon={Phone}
          focusedField={focusedField}
          required
        />
        <FormField
          label="Website"
          name="website"
          value={form.website}
          onChange={handleChange}
          onFocus={() => setFocusedField("website")}
          onBlur={() => setFocusedField("")}
          placeholder="https://example.com"
          icon={Globe2}
          focusedField={focusedField}
        />
        <FormField
          label="Location"
          name="location"
          value={form.location}
          onChange={handleChange}
          onFocus={() => setFocusedField("location")}
          onBlur={() => setFocusedField("")}
          placeholder="City/Neighborhoods You Serve"
          icon={MapPin}
          focusedField={focusedField}
          required
        />
        <SelectDropdown
          label="Years of Experience"
          placeholder="Select"
          value={form.experience}
          onChange={(val) => handleSelectChange("experience", val)}
          onFocus={() => setFocusedField("experience")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "0-2", label: "0-2 years" },
            { value: "3-5", label: "3-5 years" },
            { value: "6-10", label: "6-10 years" },
            { value: "10+", label: "10+ years" },
          ]}
        />
        <FormField
          label="License Number/Type"
          name="licenseNumber"
          value={form.licenseNumber}
          onChange={handleChange}
          onFocus={() => setFocusedField("licenseNumber")}
          onBlur={() => setFocusedField("")}
          placeholder="License Number"
          icon={IdCard}
          focusedField={focusedField}
          required
        />
        <FormField
          label="Social Media Links"
          name="socialMedia"
          value={form.socialMedia}
          onChange={handleChange}
          onFocus={() => setFocusedField("socialMedia")}
          onBlur={() => setFocusedField("")}
          placeholder="LinkedIn, Instagram, etc."
          icon={Link2}
          focusedField={focusedField}
        />
        <SelectDropdown
          label="Transaction Volume Per Year"
          placeholder="Select"
          value={form.transactionVolume}
          onChange={(val) => handleSelectChange("transactionVolume", val)}
          onFocus={() => setFocusedField("transactionVolume")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "1-10", label: "1-10 transactions" },
            { value: "11-25", label: "11-25 transactions" },
            { value: "26-50", label: "26-50 transactions" },
            { value: "50+", label: "50+ transactions" },
          ]}
        />
        <SelectDropdown
          label="Average Sale Price Range"
          placeholder="Select"
          value={form.avgSalePrice}
          onChange={(val) => handleSelectChange("avgSalePrice", val)}
          onFocus={() => setFocusedField("avgSalePrice")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "0-300k", label: "Under $300K" },
            { value: "300-600k", label: "$300K - $600K" },
            { value: "600k-1m", label: "$600K - $1M" },
            { value: "1m+", label: "$1M+" },
          ]}
        />
        <SelectDropdown
          label="Typical Response Time"
          placeholder="Select"
          value={form.responseTime}
          onChange={(val) => handleSelectChange("responseTime", val)}
          onFocus={() => setFocusedField("responseTime")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "1hour", label: "Within 1 hour" },
            { value: "sameday", label: "Same day" },
            { value: "24hours", label: "Within 24 hours" },
            { value: "48hours", label: "Within 48 hours" },
          ]}
        />
        <SelectDropdown
          label="Availability"
          placeholder="Select"
          value={form.availability}
          onChange={(val) => handleSelectChange("availability", val)}
          onFocus={() => setFocusedField("availability")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "business", label: "Business hours only" },
            { value: "extended", label: "Extended hours (evenings)" },
            { value: "weekends", label: "Weekends included" },
            { value: "247", label: "24/7 availability" },
          ]}
        />
        <SelectDropdown
          label="Client Support Level"
          placeholder="Select"
          value={form.supportLevel}
          onChange={(val) => handleSelectChange("supportLevel", val)}
          onFocus={() => setFocusedField("supportLevel")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "full", label: "Full support - Hand-holding" },
            { value: "moderate", label: "Moderate - Guided support" },
            { value: "minimal", label: "Minimal - Self-guided clients" },
          ]}
        />
        <SelectDropdown
          label="Negotiation Style"
          placeholder="Select"
          value={form.negotiationStyle}
          onChange={(val) => handleSelectChange("negotiationStyle", val)}
          onFocus={() => setFocusedField("negotiationStyle")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "aggressive", label: "Aggressive - Strong advocacy" },
            {
              value: "collaborative",
              label: "Collaborative - Win-win focused",
            },
            { value: "educator", label: "Educator - Guide through options" },
            { value: "analytical", label: "Analytical - Data-driven" },
          ]}
        />
        <SelectDropdown
          label="Sales Approach"
          placeholder="Select"
          value={form.salesApproach}
          onChange={(val) => handleSelectChange("salesApproach", val)}
          onFocus={() => setFocusedField("salesApproach")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "relationship", label: "Relationship-focused" },
            { value: "results", label: "Results-focused" },
            { value: "coaching", label: "Coaching/Educational" },
            { value: "consultative", label: "Consultative" },
          ]}
        />
        <SelectDropdown
          label="Energy Style"
          placeholder="Select"
          value={form.energyStyle}
          onChange={(val) => handleSelectChange("energyStyle", val)}
          onFocus={() => setFocusedField("energyStyle")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "high-energy", label: "High-energy & Enthusiastic" },
            { value: "calm", label: "Calm & Methodical" },
            { value: "structured", label: "Structured & Organized" },
            { value: "creative", label: "Creative & Flexible" },
          ]}
        />
        <SelectDropdown
          label="Personality Tag"
          placeholder="Select"
          value={form.personalityTag}
          onChange={(val) => handleSelectChange("personalityTag", val)}
          onFocus={() => setFocusedField("personalityTag")}
          onBlur={() => setFocusedField("")}
          options={[
            { value: "educator", label: "Educator" },
            { value: "negotiator", label: "Negotiator" },
            { value: "low-pressure", label: "Low-pressure" },
            {
              value: "relationship-builder",
              label: "Relationship Builder",
            },
          ]}
        />
        <FormField
          label="Transactions This Year"
          name="transactionsThisYear"
          value={form.transactionsThisYear}
          onChange={handleChange}
          onFocus={() => setFocusedField("transactionsThisYear")}
          onBlur={() => setFocusedField("")}
          placeholder="Number of transactions this year"
          icon={BarChart2}
          focusedField={focusedField}
        />
        <FormField
          label="Total Career Transactions"
          name="careerTransactions"
          value={form.careerTransactions}
          onChange={handleChange}
          onFocus={() => setFocusedField("careerTransactions")}
          onBlur={() => setFocusedField("")}
          placeholder="Total career transactions"
          icon={Layers}
          focusedField={focusedField}
        />
        <FormField
          label="Client Rating"
          name="clientRating"
          value={form.clientRating}
          onChange={handleChange}
          onFocus={() => setFocusedField("clientRating")}
          onBlur={() => setFocusedField("")}
          placeholder="e.g. 4.8 / 5"
          icon={Star}
          focusedField={focusedField}
        />
        <FormField
          label="Awards or Recognitions"
          name="awards"
          value={form.awards}
          onChange={handleChange}
          onFocus={() => setFocusedField("awards")}
          onBlur={() => setFocusedField("")}
          placeholder="Awards or recognitions"
          icon={Award}
          focusedField={focusedField}
        />
        <FormField
          label="Target Neighborhoods"
          name="targetNeighborhoods"
          value={form.targetNeighborhoods}
          onChange={handleChange}
          onFocus={() => setFocusedField("targetNeighborhoods")}
          onBlur={() => setFocusedField("")}
          placeholder="Areas where you want more leads"
          icon={MapPin}
          focusedField={focusedField}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-heading mb-3">
            Specializations
          </label>
          <div className="flex flex-wrap gap-2">
            {specializationsList.map((item) => (
              <label
                key={item}
                className="flex items-center w-max gap-3 text-sm font-medium text-text-heading border border-border rounded-2xl px-4 py-3 bg-white shadow-sm hover:border-primary/80 hover:shadow-md transition-all cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={specializations.includes(item)}
                  onChange={() => toggleFromList(item, setSpecializations)}
                  className="h-5 w-5 rounded-md border-2 border-border text-primary focus:ring-primary focus:ring-offset-0 focus:border-primary"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-heading mb-3">
              Preferred Communication Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {communicationList.map((item) => (
                <label
                  key={item}
                className="flex items-center w-max gap-3 text-sm font-medium text-text-heading border border-border rounded-2xl px-4 py-3 bg-white shadow-sm hover:border-primary/80 hover:shadow-md transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={communicationChannels.includes(item)}
                    onChange={() =>
                      toggleFromList(item, setCommunicationChannels)
                    }
                  className="h-5 w-5 rounded-md border-2 border-border text-primary focus:ring-primary focus:ring-offset-0 focus:border-primary"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-heading mb-3">
              Preferred Client Types
            </label>
            <div className="flex flex-wrap gap-2">
              {preferredClientsList.map((item) => (
                <label
                  key={item}
                className="flex items-center w-max gap-3 text-sm font-medium text-text-heading border border-border rounded-2xl px-4 py-3 bg-white shadow-sm hover:border-primary/80 hover:shadow-md transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={preferredClients.includes(item)}
                    onChange={() => toggleFromList(item, setPreferredClients)}
                  className="h-5 w-5 rounded-md border-2 border-border text-primary focus:ring-primary focus:ring-offset-0 focus:border-primary"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-text-heading mb-2">
          Testimonial or Success Story
        </label>
        <textarea
          name="testimonial"
          value={form.testimonial}
          onChange={handleChange}
          onFocus={() => setFocusedField("testimonial")}
          onBlur={() => setFocusedField("")}
          rows={4}
          className="w-full rounded-xl border-2 border-border bg-background-light/50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Client testimonial or success story"
        />
      </div>

      <div className="pt-2">
        <SubmitButton loading={loading}>Save changes</SubmitButton>
      </div>
    </form>
  );
}
