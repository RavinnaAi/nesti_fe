"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, User, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { fetchProfessionalById } from "@/lib/professionalsClient";
import { createOrGetProChatThread } from "@/lib/proChatClient";
import PersonalCard from "@/components/profile/PersonalCard";
import BusinessCard from "@/components/profile/BusinessCard";

function humanizeToken(value) {
  return String(value || "")
    .trim()
    .replace(/_/g, " ");
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  const text = String(value).trim();
  if (!text) return [];
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function displayName(professional) {
  const full = String(professional?.full_name || "").trim();
  if (full) return full;
  const joined = [professional?.first_name, professional?.last_name].filter(Boolean).join(" ").trim();
  return joined || "Professional";
}

function SectionHeader({ icon: Icon, title, right = null }) {
  return (
    <header className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {Icon ? <Icon size={14} strokeWidth={2.5} /> : null}
      </div>
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{title}</h2>
      <div className="flex-1 border-t border-slate-100" />
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

export default function ProfessionalDetailPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { token, user: authUser } = useAppSelector((state) => state.auth);
  const params = useParams();
  const id = String(params?.id || "").trim();
  const myUserId = String(authUser?.id || authUser?._id || "").trim();

  const query = useQuery({
    queryKey: ["professional-detail", token, id],
    enabled: Boolean(token && id),
    queryFn: () => fetchProfessionalById({ token, id }),
  });

  if (!isAuthenticated) return null;

  const pro = query.data?.professional || null;
  const name = displayName(pro);
  const roleBadgeText = humanizeToken(pro?.professional_type || pro?.role || "").toUpperCase();
  const hasCover = Boolean(pro?.cover_image);
  const isSelf = Boolean(myUserId && String(pro?.id || "") === String(myUserId));

  const startChat = async () => {
    try {
      if (!token || !pro?.id) return;
      const resp = await createOrGetProChatThread({
        token,
        other_user_id: String(pro.id),
      });
      const threadId = resp?.thread?.id;
      if (threadId) {
        router.push(`/messages/${encodeURIComponent(threadId)}`);
      } else {
        throw new Error("Thread not created");
      }
    } catch (e) {
      toast.error(e?.message || "Could not start chat");
    }
  };

  const personalInfo = {
    fullName: name,
    email: pro?.email || "",
    phone: pro?.phone || "",
    website: pro?.website || "",
    calendlyUrl: pro?.calendly_link || "",
    location: pro?.location || "",
    role: humanizeToken(pro?.professional_type || pro?.role || ""),
    profileImage: pro?.profile_image || "",
    coverImage: pro?.cover_image || "",
  };

  const businessInfo = {
    professionalType: humanizeToken(pro?.professional_type || pro?.role || ""),
    companyName: pro?.company_name || "",
    website: pro?.website || "",
    phone: pro?.phone || "",
    email: pro?.email || "",
    experience: pro?.experience || "",
    licenseNumber: pro?.license_number || "",
    socialMedia: pro?.social_media || "",
    transactionVolume: pro?.transaction_volume || "",
    avgSalePrice: pro?.avg_sale_price || "",
    responseTime: pro?.response_time || "",
    availability: pro?.availability || "",
    supportLevel: pro?.support_level || "",
    negotiationStyle: pro?.negotiation_style || "",
    salesApproach: pro?.sales_approach || "",
    energyStyle: pro?.energy_style || "",
    personalityTag: pro?.personality_tag || "",
    awards: pro?.awards || "",
    bio: pro?.bio || "",
    targetNeighborhoods: pro?.target_neighborhoods || "",
    specializations: toArray(pro?.specializations).map(humanizeToken),
    communicationChannels: toArray(pro?.communication_channels).map(humanizeToken),
    preferredClients: toArray(pro?.preferred_clients).map(humanizeToken),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="w-full space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        {query.isLoading ? (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-text-muted">Loading professional profile...</p>
          </section>
        ) : query.isError ? (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-red-600">{query.error?.message || "Failed to load profile."}</p>
          </section>
        ) : !pro ? (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-text-muted">Professional not found.</p>
          </section>
        ) : (
          <>
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
                      src={personalInfo.coverImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark/95 to-emerald-700/90" aria-hidden />
                )}
              </div>

              <div className="relative flex items-end gap-4 px-5 pb-5 sm:gap-5 sm:px-7 sm:pb-6">
                <div className="relative z-[1] -mt-8 shrink-0 sm:-mt-10">
                  <div className="relative flex h-[5rem] w-[5rem] items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-slate-50 text-xl font-bold text-primary-dark shadow-md sm:h-[6rem] sm:w-[6rem] sm:rounded-2xl">
                    {personalInfo.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={personalInfo.profileImage}
                        alt={name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <span className="select-none">{name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                    Active
                  </span>
                </div>

                <div className="min-w-0 flex-1 pb-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base font-semibold tracking-tight text-text-heading sm:text-lg">{name}</h1>
                    {roleBadgeText ? (
                      <span className="rounded-full border border-border/80 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-heading">
                        {roleBadgeText}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm text-text-muted/90">{businessInfo.bio || "No bio added yet."}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="flex flex-col gap-4"
            >
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.05] sm:p-6">
                <SectionHeader
                  icon={User}
                  title="Contact & role"
                  right={
                    !isSelf ? (
                      <button
                        type="button"
                        onClick={startChat}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1.5 text-[11px] font-semibold text-primary-dark shadow-sm transition hover:border-primary/35 hover:bg-primary/[0.12] active:scale-[0.99]"
                      >
                        <MessageSquare size={14} />
                        Chat
                      </button>
                    ) : null
                  }
                />
                <PersonalCard
                  displayFullName={name}
                  personalInfo={personalInfo}
                  businessInfo={businessInfo}
                  compact
                  professionalLineLayout
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.05] sm:p-6">
                <SectionHeader icon={Briefcase} title="Business & expertise" />
                <BusinessCard businessInfo={businessInfo} />
              </section>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
