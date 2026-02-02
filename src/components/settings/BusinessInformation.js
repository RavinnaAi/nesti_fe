"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

export default function BusinessInformation() {
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
    responseTime: "",
    availability: "",
    supportLevel: "",
    negotiationStyle: "",
    salesApproach: "",
    energyStyle: "",
    personalityTag: "",
    // transactionsThisYear: "",
    // careerTransactions: "",
    // clientRating: "",
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
  const [showModal, setShowModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const hydrateFromStore = useCallback(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, val) => {
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  useEffect(() => {
    hydrateFromStore();
  }, [hydrateFromStore]);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const { transactionsThisYear, careerTransactions, clientRating, ...rest } = form;
      const payload = {
        ...rest,
        specializations,
        communicationChannels,
        preferredClients,
      };
      await saveBusinessInfo.mutateAsync(payload);
      dispatch(setBusinessInfo(payload));
      setShowModal(false);
    } catch (err) {
      console.error("Business info update error:", err);
      // toast handled in hook
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Basics",
      description: "What should we know about your professional basics?",
      Component: BasicsStep,
    },
    {
      title: "Experience",
      description: "Tell us about your experience and activity levels.",
      Component: ExperienceStep,
    },
    {
      title: "Style & Metrics",
      description: "How do you operate and perform?",
      Component: StyleMetricsStep,
    },
    {
      title: "Specializations",
      description: "What do you specialize in?",
      Component: PreferencesStep,
      props: { mode: "specializations" },
    },
    {
      title: "Communication",
      description: "How should clients reach you?",
      Component: PreferencesStep,
      props: { mode: "communication" },
    },
    {
      title: "Ideal Clients",
      description: "Who are your ideal clients?",
      Component: PreferencesStep,
      props: { mode: "clients" },
    },
    {
      title: "Story",
      description: "Share a testimonial or quick win.",
      Component: PreferencesStep,
      props: { mode: "testimonial" },
    },
  ];

  const StepComponent = steps[activeStep]?.Component;
  const stepProps = steps[activeStep]?.props || {};

  const handleNext = () => {
    const { transactionsThisYear, careerTransactions, clientRating, ...rest } = form;
    const payload = {
      ...rest,
      specializations,
      communicationChannels,
      preferredClients,
    };
    dispatch(setBusinessInfo(payload));
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setActiveStep(0);
    hydrateFromStore();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm flex w-max items-center justify-center">
        {/* <div>
          <div className="text-lg font-semibold text-text-heading">
            Business Information
          </div>
          <div className="text-sm text-text-muted">
            Keep your professional details up to date.
          </div>
        </div> */}
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-95 transition"
        >
          Add / Edit Information
        </button>
      </div>

      <AnimatePresence>
        {showModal ? (
          <motion.div
            key="biz-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-5xl h-[70vh] flex flex-col rounded-md bg-white shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary-light/20">
                <div>
                  <div className="text-xs uppercase tracking-wide text-text-muted">
                    Step {activeStep + 1} of {steps.length}
                  </div>
                  <div className="text-lg font-semibold text-text-heading">
                    {steps[activeStep].title}
                  </div>
                  <div className="text-sm text-text-muted">
                    {steps[activeStep].description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-md hover:bg-primary-dark transition text-text-heading hover:text-white"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`step-${activeStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {StepComponent ? (
                      <StepComponent
                        form={form}
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                        handleChange={handleChange}
                        handleSelectChange={handleSelectChange}
                        specializations={specializations}
                        communicationChannels={communicationChannels}
                        preferredClients={preferredClients}
                        toggleFromList={toggleFromList}
                        setSpecializations={setSpecializations}
                        setCommunicationChannels={setCommunicationChannels}
                        setPreferredClients={setPreferredClients}
                        specializationsList={specializationsList}
                        communicationList={communicationList}
                        preferredClientsList={preferredClientsList}
                        {...stepProps}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-primary-light/20">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="h-2 w-2 rounded-md bg-primary" />
                  Progress autosaves after each step.
                </div>
                <div className="flex gap-3">
                  {activeStep > 0 && (
                    // <button
                    //   type="button"
                    //   onClick={handleBack}
                    //   className="px-4 py-2 rounded-lg border border-primary text-sm font-semibold text-text-heading hover:border-primary hover:brightness-95 shadow-sm transition"
                    // >
                    //   Back
                    // </button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleBack}
                      className={`h-auto w-auto px-5 py-2 hover:bg-gradient-to-r hover:text-white hover:from-primary hover:to-primary-dark !bg-transparent rounded-md border border-primary-dark flex flex-col justify-center items-center cursor-pointer text-primary-dark font-semibold hover:shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 `}
                    >
                      Back
                    </motion.button>
                  )}
                  {activeStep < steps.length - 1 ? (
                    // <button
                    //   type="button"
                    //   onClick={handleNext}
                    //   className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-95 transition"
                    // >
                    //   Next
                    // </button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleNext}
                      className={`h-auto w-auto !py-2 px-5 bg-gradient-to-r from-primary to-primary-dark rounded-md flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 `}
                    >
                      Next
                    </motion.button>
                  ) : (
                    <SubmitButton
                      loading={loading}
                      onClick={handleSubmit}
                      type="button"
                      className="!w-auto px-6 py-2 rounded-md bg-primary !h-auto text-white text-sm font-semibold shadow-sm hover:brightness-95 transition"
                    >
                      Save changes
                    </SubmitButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
