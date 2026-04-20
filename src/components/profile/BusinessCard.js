"use client";

import { Briefcase, BadgeCheck, Layers, CreditCard, MessageSquare, MapPin, Award } from "lucide-react";
import { InfoCard, InfoGrid } from "./ProfileInfoCard";

const hasAny = (...vals) => vals.some((v) => v !== undefined && v !== null && v !== "");

function ChipRow({ label, items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-md border border-primary/15 bg-primary/[0.06] px-2 py-0.5 text-[11px] font-medium text-primary/80"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BusinessCard({ businessInfo }) {
  const b = businessInfo || {};

  const hasChips =
    b.specializations?.length || b.communicationChannels?.length || b.preferredClients?.length;

  return (
    <InfoCard delay={0.1}>
      <InfoGrid
        className="lg:grid-cols-4"
        items={[
          { label: "Professional Type", value: b.professionalType, icon: Briefcase },
          { label: "License Number",    value: b.licenseNumber,    icon: BadgeCheck },
          { label: "Experience",        value: b.experience,       icon: Layers },
          { label: "Avg Sale Price",    value: b.avgSalePrice,     icon: CreditCard },
          { label: "Response Time",     value: b.responseTime,     icon: MessageSquare },
          { label: "Availability",      value: b.availability,     icon: MapPin },
          ...(hasAny(b.companyName) ? [{ label: "Company Name", value: b.companyName, icon: Briefcase }] : []),
          ...(hasAny(b.awards)      ? [{ label: "Awards",       value: b.awards,      icon: Award }]     : []),
        ]}
      />

      {hasChips ? (
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <ChipRow label="Specializations" items={b.specializations || []} />
          <ChipRow label="Communication"   items={b.communicationChannels || []} />
          <ChipRow label="Preferred"       items={b.preferredClients || []} />
        </div>
      ) : null}
    </InfoCard>
  );
}
