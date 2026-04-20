"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Briefcase } from "lucide-react";
import { useAppSelector } from "@/store";
import { motion } from "framer-motion";
import PersonalCard from "@/components/profile/PersonalCard";
import BusinessCard from "@/components/profile/BusinessCard";
import { usePublicProfile } from "@/hooks/useAuthApi";
import { ProfilePageContentSkeleton } from "@/components/ui/ContentSkeletons";

function SectionHeader({ icon: Icon, title }) {
  return (
    <header className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {Icon ? <Icon size={14} strokeWidth={2.5} /> : null}
      </div>
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{title}</h2>
      <div className="flex-1 border-t border-slate-100" />
    </header>
  );
}

function ProfilePageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const normalizedEmail = emailParam?.toLowerCase().trim() || "";
  const publicProfileQuery = usePublicProfile(normalizedEmail || undefined);

  const { personalInfo, businessInfo } = useAppSelector((state) => state.profile);

  useEffect(() => {
    setIsMounted(true);
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
    const calendlyFromApi = String(apiProfessional?.calendly_link || "").trim();
    if (personalInfo && Object.keys(personalInfo).length > 0) {
      return { ...personalInfo, calendlyUrl: personalInfo.calendlyUrl || calendlyFromApi };
    }
    if (!apiUser && !apiProfessional) return null;
    return {
      fullName:
        apiUser?.name ||
        apiProfessional?.full_name ||
        [apiUser?.firstName, apiUser?.lastName].filter(Boolean).join(" ").trim() ||
        "",
      email: apiUser?.email || apiProfessional?.email || "",
      phone: apiProfessional?.phone || apiUser?.phone || "",
      website: apiProfessional?.website || "",
      calendlyUrl: calendlyFromApi,
      location: apiProfessional?.location || "",
      role: apiUser?.role || apiProfessional?.professional_type || "",
      profileImage: apiProfessional?.img_url || apiUser?.img_url || "",
      coverImage: apiProfessional?.cover_image || apiUser?.cover_image || "",
    };
  }, [personalInfo, apiUser, apiProfessional]);

  const resolvedBusiness = useMemo(() => {
    const calendlyFromApi = String(apiProfessional?.calendly_link || "").trim();
    if (businessInfo && Object.keys(businessInfo).length > 0) {
      return { ...businessInfo, calendlyLink: businessInfo.calendlyLink || calendlyFromApi };
    }
    if (!apiProfessional && !apiUser) return null;
    return {
      professionalType:
        apiProfessional?.professional_type || apiUser?.role || apiUser?.title || "",
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
      bio: apiProfessional?.bio || apiProfessional?.testimonial || apiUser?.bio || "",
      targetNeighborhoods: apiProfessional?.target_neighborhoods || "",
      fullName:
        apiProfessional?.full_name ||
        apiUser?.name ||
        [apiUser?.firstName, apiUser?.lastName].filter(Boolean).join(" ").trim() ||
        "",
      location: apiProfessional?.location || "",
      specializations: apiProfessional?.specializations || [],
      communicationChannels: apiProfessional?.communication_channels || [],
      preferredClients: apiProfessional?.preferred_clients || [],
      calendlyLink: calendlyFromApi,
    };
  }, [businessInfo, apiProfessional, apiUser]);

  const bio = resolvedBusiness?.bio || resolvedBusiness?.testimonial || "";

  const displayFullName = useMemo(() => {
    const source = resolvedPersonal || {};
    const fromPersonal =
      source.fullName ||
      [source.firstName, source.lastName].filter(Boolean).join(" ").trim();
    return fromPersonal || resolvedBusiness?.fullName || resolvedBusiness?.professionalType || "";
  }, [resolvedPersonal, resolvedBusiness]);

  const heroStyle = resolvedPersonal?.coverImage
    ? { backgroundImage: `url(${resolvedPersonal.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6">
        <ProfilePageContentSkeleton />
        <p className="mt-4 text-center text-xs font-medium text-primary">Loading…</p>
      </div>
    );
  }

  if (normalizedEmail && publicProfileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6">
        <ProfilePageContentSkeleton />
        <p className="mt-4 text-center text-xs font-medium text-primary">Loading profile…</p>
      </div>
    );
  }

  if (!resolvedPersonal && !resolvedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-text-muted">
            Provide an <span className="font-medium text-text-heading">email</span> query parameter to view a public
            profile, or sign in to see your own profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border shadow-xl ${
            resolvedPersonal?.coverImage
              ? "border-white/10 text-white ring-1 ring-white/10 shadow-black/20"
              : "border-primary/20 text-white ring-1 ring-white/15 shadow-primary/25"
          }`}
          style={heroStyle}
        >
          {!resolvedPersonal?.coverImage ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark/95 to-emerald-700/90" aria-hidden />
          ) : null}
          {resolvedPersonal?.coverImage ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" aria-hidden />
          ) : null}

          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white/20 bg-white text-xl font-bold text-primary-dark shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]">
                  {resolvedPersonal?.profileImage || apiProfile?.professionalProfile?.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedPersonal?.profileImage || apiProfile?.professionalProfile?.profile_image}
                      alt={displayFullName || "Profile photo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (displayFullName || "N").slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                  Active
                </span>
              </div>

              {/* Name + role + bio */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {displayFullName || "Your Profile"}
                  </h1>
                  {resolvedBusiness?.professionalType ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      {resolvedBusiness.professionalType}
                    </span>
                  ) : null}
                </div>

                {/* Bio right under the name in hero */}
                {bio ? (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
                    {bio}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-white/50 italic">No bio added yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Sections ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="flex flex-col gap-4"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.05] sm:p-6">
            <SectionHeader icon={User} title="Contact & role" />
            <PersonalCard
              displayFullName={displayFullName}
              personalInfo={resolvedPersonal || {}}
              businessInfo={resolvedBusiness || {}}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.05] sm:p-6">
            <SectionHeader icon={Briefcase} title="Business & expertise" />
            <BusinessCard businessInfo={resolvedBusiness || {}} />
          </section>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6">
          <ProfilePageContentSkeleton />
          <p className="mt-4 text-center text-xs font-medium text-primary">Loading…</p>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
