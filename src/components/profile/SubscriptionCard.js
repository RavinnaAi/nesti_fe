"use client";

import { CreditCard } from "lucide-react";
import Link from "next/link";
import { InfoCard } from "@/components/profile/ProfileInfoCard";

export default function SubscriptionCard({ activePlan }) {
  return (
    <InfoCard title="Subscription" icon={CreditCard} delay={0.05}>
      {activePlan ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-md border border-border px-4 py-3 bg-primary-dark/20">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-text-heading">
              {activePlan?.name || "Plan"}
            </div>
            <div className="text-sm text-text-muted">
              {activePlan?.description || "Active subscription"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {activePlan?.price || "$0"}{" "}
              <span className="text-sm text-text-heading ">
                {activePlan?.period || ""}
              </span>
            </div>
            {activePlan?.popular ? (
              <span className="inline-block bg-primary text-white mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-md text-primary">
                Popular
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start">
          <p className="text-sm text-text-muted">
            No subscription bought yet. Choose a plan from settings to get
            started.
          </p>
          <Link
            href="/sign-up"
            className="inline-block mt-1 px-4 py-2 rounded-md bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition"
          >
            Get started
          </Link>
        </div>
      )}
    </InfoCard>
  );
}
