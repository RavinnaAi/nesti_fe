"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Flame,
  Star,
  Clock3,
  Search,
  Filter,
  User as UserIcon,
  ArrowRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const coverImage = useAppSelector((state) => state.profile.personalInfo?.coverImage);
  const { isAuthenticated, profile } = useAuthGuard();
  const activeUser = profile?.user || profile?.data || user;
  const [leadType, setLeadType] = useState("buyers");
  const [leadStatus, setLeadStatus] = useState("active");

  const stats = useMemo(
    () => [
      {
        label: "Total Leads",
        value: 0,
        icon: Users,
        accent: "bg-primary/10 text-primary",
      },
      {
        label: "Hot Leads",
        value: 0,
        icon: Flame,
        accent: "bg-green-100 text-green-600",
      },
      {
        label: "Avg Score",
        value: "0.0",
        icon: Star,
        accent: "bg-amber-100 text-amber-600",
      },
      {
        label: "Urgent (0-3m)",
        value: 0,
        icon: Clock3,
        accent: "bg-orange-100 text-orange-600",
      },
    ],
    []
  );

  if (!isAuthenticated) {
    return null;
  }

  const heroStyle = coverImage
    ? {
      backgroundImage: `
  linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
  url(${coverImage})
`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',

    }
    : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`relative flex items-center gap-4 overflow-hidden rounded-3xl ${coverImage ? "text-white" : "bg-gradient-to-br from-primary/60 via-primary-dark/30 to-primary/20 text-white"
            } shadow-xl p-6 md:p-8`}
          style={heroStyle}
        >
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-md shadow-border/20 border border-border/20 overflow-hidden flex items-center justify-center text-xl font-bold text-primary-dark">
              {profile?.user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile?.user?.profileImage}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile?.personalInfo?.firstName || "N").slice(0, 1).toUpperCase()
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center text-text-heading gap-2 rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={14} />
                Secure workspace
              </div>
              <h1 className="text-3xl text-white/80 font-bold">
                Welcome back
                {activeUser?.firstName ? `, ${activeUser.firstName}` : "!"}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                Track your pipeline, nurture hot leads, and close faster.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, accent }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="rounded-2xl border border-border bg-white shadow-lg shadow-primary/10 p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-2xl font-bold text-text-heading mt-1">
                  {value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}
              >
                <Icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-white shadow-sm border border-border/60 overflow-hidden">
            {["buyers", "sellers"].map((type) => (
              <button
                key={type}
                onClick={() => setLeadType(type)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${leadType === type
                  ? "bg-primary-dark text-white"
                  : "text-text-heading hover:bg-background-light"
                  }`}
              >
                {type === "buyers" ? "Buyer Leads" : "Seller Leads"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg bg-white shadow-sm border border-border/60 overflow-hidden">
            {["active", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setLeadStatus(status)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${leadStatus === status
                  ? "bg-primary-dark text-white"
                  : "text-text-heading hover:bg-background-light"
                  }`}
              >
                {status === "active" ? "Active" : "Closed"}
              </button>
            ))}
          </div>
        </div>

        {/* Lead panels */}
        <div className="bg-white rounded-2xl border border-border shadow-lg shadow-primary/10 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search by name, email, phone, or city..."
                className="w-full h-11 rounded-xl border border-border/60 bg-background-light/50 pl-10 pr-3 text-sm focus:ring-0 focus:ring-none focus:outline-none"
              />
            </div>
            <button className="h-11 px-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background-light/60 text-sm font-semibold text-text-heading hover:border-primary transition">
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border shadow-inner bg-background-light/60 h-56 flex flex-col items-center justify-center text-center px-4">
              <UserIcon className="text-text-muted/70" size={40} />
              <p className="mt-3 text-base font-semibold text-text-heading">
                No Leads Found
              </p>
              <p className="text-sm text-text-muted">
                Try adjusting your search or filters
              </p>
            </div>
            <div className="rounded-2xl border border-border shadow-inner bg-background-light/60 h-56 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={22} />
              </div>
              <p className="mt-3 text-base font-semibold text-text-heading">
                Select a Lead
              </p>
              <p className="text-sm text-text-muted mb-3">
                Click on any lead to view detailed information and take action
              </p>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                View details <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
