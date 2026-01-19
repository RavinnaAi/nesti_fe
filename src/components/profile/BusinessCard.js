"use client";

import {
  Briefcase,
  BadgeCheck,
  Layers,
  CreditCard,
  MessageSquare,
  MapPin,
  Star,
  BarChart2,
  Award,
} from "lucide-react";
import { InfoCard, InfoGrid, ChipList } from "./ProfileInfoCard";

export default function BusinessCard({ businessInfo }) {
  return (
    <InfoCard title="Business Information" icon={Briefcase} delay={0.1}>
      <InfoGrid
        items={[
          {
            label: "Professional Type",
            value: businessInfo?.professionalType,
            icon: Briefcase,
          },
          {
            label: "License Number",
            value: businessInfo?.licenseNumber,
            icon: BadgeCheck,
          },
          {
            label: "Experience",
            value: businessInfo?.experience,
            icon: Layers,
          },
          {
            label: "Avg Sale Price",
            value: businessInfo?.avgSalePrice,
            icon: CreditCard,
          },
          {
            label: "Response Time",
            value: businessInfo?.responseTime,
            icon: MessageSquare,
          },
          {
            label: "Availability",
            value: businessInfo?.availability,
            icon: MapPin,
          },
        ]}
      />

      <InfoGrid
        items={[
          {
            label: "Client Rating",
            value: businessInfo?.clientRating,
            icon: Star,
          },
          {
            label: "Transactions This Year",
            value: businessInfo?.transactionsThisYear,
            icon: BarChart2,
          },
          {
            label: "Total Career Transactions",
            value: businessInfo?.careerTransactions,
            icon: Layers,
          },
          {
            label: "Awards",
            value: businessInfo?.awards,
            icon: Award,
          },
        ]}
      />

      <ChipList
        label="Specializations"
        items={businessInfo?.specializations || []}
      />
      <ChipList
        label="Communication Channels"
        items={businessInfo?.communicationChannels || []}
      />
      <ChipList
        label="Preferred Clients"
        items={businessInfo?.preferredClients || []}
      />
      {businessInfo?.testimonial ? (
        <div className="mt-4 rounded-xl border border-border/70 bg-background-light/50 p-4 shadow-sm shadow-primary/10">
          <p className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-2">
            Testimonial
          </p>
          <p className="text-sm text-text-heading leading-relaxed">
            {businessInfo.testimonial}
          </p>
        </div>
      ) : null}
    </InfoCard>
  );
}
