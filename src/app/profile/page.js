"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, CreditCard, Briefcase, BarChart3 } from "lucide-react";
import { useAppSelector } from "@/store";
import { motion } from "framer-motion";
import PersonalCard from "@/components/profile/PersonalCard";
import BusinessCard from "@/components/profile/BusinessCard";
import SidebarTabs from "@/components/ui/SidebarTabs";
import { usePublicProfile } from "@/hooks/useAuthApi";
import StatusCard from "@/components/profile/StatusCard";
import SubscriptionCard from "@/components/profile/SubscriptionCard";

const tabs = [
  { id: "personal", label: "Profile Overview", icon: User },
  { id: "business", label: "Profile Details", icon: Briefcase },
  { id: "status", label: "Profile Status", icon: BarChart3 },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const normalizedEmail = emailParam?.toLowerCase().trim() || "";
  const publicProfileQuery = usePublicProfile(normalizedEmail || undefined);

  const { personalInfo, businessInfo } = useAppSelector(
    (state) => state.profile
  );
  const selectedPlan = useAppSelector((state) => state.selectedPlan.plan);
  const pricingPlans = useAppSelector((state) => state.pricing.plans);
  const [activeTab, setActiveTab] = useState("personal");
  const [stickyTop, setStickyTop] = useState("0");

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = typeof window !== "undefined" && window.scrollY > 0;
      setStickyTop(isScrolled ? "15%" : "0");
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const apiProfile = publicProfileQuery.data;
  const apiUser =
    apiProfile?.user || apiProfile?.data?.user || apiProfile?.data || null;
  const apiProfessional =
    apiProfile?.professionalProfile ||
    apiProfile?.professional_profile ||
    apiProfile?.professional ||
    null;

  const resolvedPersonal = useMemo(() => {
    if (personalInfo && Object.keys(personalInfo).length > 0)
      return personalInfo;
    if (!apiUser && !apiProfessional) return null;
    return {
      fullName:
        apiUser?.name ||
        apiProfessional?.full_name ||
        [apiUser?.firstName, apiUser?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "",
      email: apiUser?.email || apiProfessional?.email || "",
      phone: apiProfessional?.phone || apiUser?.phone || "",
      website: apiProfessional?.website || "",
      location: apiProfessional?.location || "",
      role: apiUser?.role || apiProfessional?.professional_type || "",
      profileImage: apiProfessional?.img_url || apiUser?.img_url || "",
      coverImage: apiProfessional?.cover_image || apiUser?.cover_image || "",
    };
  }, [personalInfo, apiUser, apiProfessional]);

  const resolvedBusiness = useMemo(() => {
    if (businessInfo && Object.keys(businessInfo).length > 0)
      return businessInfo;
    if (!apiProfessional && !apiUser) return null;
    return {
      professionalType:
        apiProfessional?.professional_type ||
        apiUser?.role ||
        apiUser?.title ||
        "",
      companyName: apiProfessional?.company_name || "",
      website: apiProfessional?.website || "",
      phone: apiProfessional?.phone || apiUser?.phone || "",
      email: apiProfessional?.email || apiUser?.email || "",
      experience: apiProfessional?.experience || "",
      licenseNumber: apiProfessional?.license_number || "",
      socialMedia: apiProfessional?.social_media || "",
      transactionVolume: apiProfessional?.transaction_volume || "",
      avgSalePrice: apiProfessional?.avg_sale_price || "",
      responseTime: apiProfessional?.response_time || "",
      availability: apiProfessional?.availability || "",
      supportLevel: apiProfessional?.support_level || "",
      negotiationStyle: apiProfessional?.negotiation_style || "",
      salesApproach: apiProfessional?.sales_approach || "",
      energyStyle: apiProfessional?.energy_style || "",
      personalityTag: apiProfessional?.personality_tag || "",
      transactionsThisYear: apiProfessional?.transactions_this_year || "",
      careerTransactions: apiProfessional?.career_transactions || "",
      clientRating: apiProfessional?.client_rating || "",
      awards: apiProfessional?.awards || "",
      testimonial: apiProfessional?.testimonial || apiUser?.bio || "",
      targetNeighborhoods: apiProfessional?.target_neighborhoods || "",
      fullName:
        apiProfessional?.full_name ||
        apiUser?.name ||
        [apiUser?.firstName, apiUser?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "",
      location: apiProfessional?.location || "",
      specializations: apiProfessional?.specializations || [],
      communicationChannels: apiProfessional?.communication_channels || [],
      preferredClients: apiProfessional?.preferred_clients || [],
    };
  }, [businessInfo, apiProfessional, apiUser]);

  const displayFullName = useMemo(() => {
    const source = resolvedPersonal || {};
    const fromPersonal =
      source.fullName ||
      [source.firstName, source.lastName].filter(Boolean).join(" ").trim();
    return (
      fromPersonal ||
      resolvedBusiness?.fullName ||
      resolvedBusiness?.professionalType ||
      ""
    );
  }, [resolvedPersonal, resolvedBusiness]);

  const activePlan = useMemo(() => {
    if (selectedPlan) return selectedPlan;
    if (pricingPlans?.length) {
      return pricingPlans.find((p) => p.popular) || pricingPlans[0];
    }
    return null;
  }, [selectedPlan, pricingPlans]);

  const rating = Number(resolvedBusiness?.clientRating) || 0;
  const listings = Number(resolvedBusiness?.careerTransactions) || 0;
  const sold = Number(resolvedBusiness?.transactionsThisYear) || 0;
  const ratingPercent = Math.min(100, (rating / 5) * 100 || 0);
  const soldPercent = listings > 0 ? Math.min(100, (sold / listings) * 100) : 0;

  const renderContent = () => {
    if (normalizedEmail && publicProfileQuery.isLoading) {
      return <div className="text-sm text-text-muted">Loading profile...</div>;
    }
    if (!resolvedPersonal && !resolvedBusiness) {
      return (
        <div className="text-sm text-text-muted">
          Provide an email query parameter to view a public profile.
        </div>
      );
    }

    switch (activeTab) {
      case "personal":
        return (
          <PersonalCard
            displayFullName={displayFullName}
            personalInfo={resolvedPersonal || {}}
            businessInfo={resolvedBusiness || {}}
          />
        );
      case "business":
        return <BusinessCard businessInfo={resolvedBusiness || {}} />;
      case "status":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatusCard
                title="Client Rating"
                value={`${rating.toFixed(1) || "0.0"}`}
                percent={ratingPercent}
                accent="#10b981"
              />
              <StatusCard
                title="Properties Sold"
                value={sold || 0}
                percent={soldPercent}
                accent="#3b82f6"
                subtitle={
                  listings
                    ? `${sold} of ${listings} listings`
                    : "No listings yet"
                }
              />
            </div>
          </div>
        );
      case "subscription":
        return <SubscriptionCard activePlan={activePlan} />;
      default:
        return null;
    }
  };

  const activeMeta = tabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeMeta?.icon;

  const heroStyle = resolvedPersonal?.coverImage
    ? {
      backgroundImage: `url(${resolvedPersonal.coverImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
    : {};


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative overflow-hidden rounded-3xl ${resolvedPersonal?.coverImage ? "text-white" : "bg-primary-dark/20 text-white"
            } p-6 md:p-8 shadow-lg shadow-primary/10 `}
          style={heroStyle}
        >
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">

              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-md shadow-border/20 border border-border/20 overflow-hidden flex items-center justify-center text-xl font-bold text-primary-dark">
                  {resolvedPersonal?.profileImage ||
                    apiProfile?.professionalProfile?.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        resolvedPersonal?.profileImage ||
                        apiProfile?.professionalProfile?.profile_image
                      }
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (displayFullName || "N").slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 px-2 py-1 rounded-full bg-white shadow-sm text-[11px] font-semibold text-primary border border-primary/10">
                  Active
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl text-white/80 font-bold">
                  {displayFullName || "Your Profile"}
                </h1>
                <p className="text-white/80 text-sm">
                  A quick view of your personal, business, and subscription
                  details.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {resolvedBusiness?.professionalType ? (
                <span className="px-3 py-1 bg-primary text-white rounded-full text-primary text-xs font-semibold border border-primary/20">
                  {resolvedBusiness?.professionalType?.toUpperCase()}
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 relative">
            <SidebarTabs
              tabs={tabs}
              activeId={activeTab}
              onChange={setActiveTab}
              stickyTop={stickyTop}
              activeClassName="bg-primary-dark text-white"
              inactiveClassName="text-text-heading hover:bg-primary/5"
              activeIconClassName="bg-white/20 text-white"
              inactiveIconClassName="bg-background-light"
            />
          </div>

          <div className="lg:col-span-9">
            <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {ActiveIcon ? <ActiveIcon size={18} /> : null}
                </div>
                <div>
                  <div className="text-xl font-bold text-text-heading">
                    {activeMeta?.label || "Profile"}
                  </div>
                  <div className="text-sm text-text-body">
                    View and manage your profile information
                  </div>
                </div>
              </div>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {renderContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-text-muted">Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
