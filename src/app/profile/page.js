"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Briefcase } from "lucide-react";
import { useAppSelector } from "@/store";
import { motion } from "framer-motion";
import PersonalCard from "@/components/profile/PersonalCard";
import BusinessCard from "@/components/profile/BusinessCard";
import { useProfileQuery, usePublicProfile } from "@/hooks/useAuthApi";
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
  const token = useAppSelector((state) => state.auth.token);
  const publicProfileQuery = usePublicProfile(normalizedEmail || undefined);
  const ownProfileQuery = useProfileQuery();

  const { personalInfo, businessInfo } = useAppSelector((state) => state.profile);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const apiProfile = normalizedEmail ? publicProfileQuery.data : ownProfileQuery.data;
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

  const roleBadgeText = useMemo(() => {
    const raw = String(
      resolvedBusiness?.professionalType || resolvedPersonal?.role || ""
    ).trim();
    if (!raw) return "";
    return raw.replace(/_/g, " ").toUpperCase();
  }, [resolvedBusiness?.professionalType, resolvedPersonal?.role]);

  const hasCover = Boolean(resolvedPersonal?.coverImage);
  const profilePhotoUrl =
    resolvedPersonal?.profileImage || apiProfile?.professionalProfile?.profile_image || "";

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

  if (!normalizedEmail && token && ownProfileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6">
        <ProfilePageContentSkeleton />
        <p className="mt-4 text-center text-xs font-medium text-primary">Loading your profile…</p>
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
        {/* ── Hero — same two-part card as Dashboard / Personal information ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm"
        >
          <div className="relative aspect-[16/5] w-full min-h-[10rem] sm:min-h-[11rem] md:min-h-[12rem]">
            {hasCover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedPersonal?.coverImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  aria-hidden
                />
              </>
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark/95 to-emerald-700/90"
                aria-hidden
              />
            )}
            {!hasCover ? (
              <>
                <div
                  className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-20 left-1/4 h-36 w-36 rounded-full bg-emerald-400/25 blur-3xl motion-safe:animate-[pulse_6s_ease-in-out_infinite_1s]"
                  aria-hidden
                />
              </>
            ) : null}
          </div>

          <div className="relative flex items-end gap-4 px-5 pb-5 sm:gap-5 sm:px-7 sm:pb-6">
            <div className="relative z-[1] -mt-8 shrink-0 sm:-mt-10">
              <div className="relative flex h-[5rem] w-[5rem] items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-slate-50 text-xl font-bold text-primary-dark shadow-md sm:h-[6rem] sm:w-[6rem] sm:rounded-2xl">
                {profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoUrl}
                    alt={displayFullName || "Profile photo"}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <span className="select-none">{(displayFullName || "N").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                Active
              </span>
            </div>

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-text-heading sm:text-lg">
                  {displayFullName || "Your Profile"}
                </h1>
                {roleBadgeText ? (
                  <span className="rounded-full border border-border/80 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-heading">
                    {roleBadgeText}
                  </span>
                ) : null}
              </div>
              {bio ? (
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">{bio}</p>
              ) : (
                <p className="mt-1.5 text-sm text-text-muted/80 italic">No bio added yet.</p>
              )}
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
              compact
              professionalLineLayout
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
