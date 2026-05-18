"use client";

import {
  User,
  Mail,
  Phone,
  Globe2,
  MapPin,
  Briefcase,
  Calendar,
} from "lucide-react";
import { InfoCard, InfoGrid } from "./ProfileInfoCard";

export default function PersonalCard({
  displayFullName,
  personalInfo,
  businessInfo,
  compact = false,
  professionalLineLayout = false,
}) {
  const defaultItems = [
    { label: "Full Name", value: displayFullName, icon: User, colSpan: 2 },
    { label: "Email", value: personalInfo?.email, icon: Mail, colSpan: 2 },
    { label: "Phone", value: personalInfo?.phone, icon: Phone },
    { label: "Role", value: personalInfo?.role || personalInfo?.professionalType, icon: Briefcase },
    {
      label: "Location",
      value: businessInfo?.location || personalInfo?.location,
      icon: MapPin,
      colSpan: 2,
    },
    {
      label: "Website",
      value: businessInfo?.website || personalInfo?.website,
      icon: Globe2,
      colSpan: 2,
    },
    {
      label: "Calendly",
      value: personalInfo?.calendlyUrl || businessInfo?.calendlyLink,
      icon: Calendar,
      colSpan: 2,
    },
  ];

  const professionalItems = [
    { label: "Full Name", value: displayFullName, icon: User },
    { label: "Email", value: personalInfo?.email, icon: Mail, colSpan: 2 },
    { label: "Phone", value: personalInfo?.phone, icon: Phone },
    { label: "Role", value: personalInfo?.role || personalInfo?.professionalType, icon: Briefcase },
    {
      label: "Location",
      value: businessInfo?.location || personalInfo?.location,
      icon: MapPin,
    },
    {
      label: "Website",
      value: businessInfo?.website || personalInfo?.website,
      icon: Globe2,
      colSpan: 2,
    },
    {
      label: "Calendly",
      value: personalInfo?.calendlyUrl || businessInfo?.calendlyLink,
      icon: Calendar,
      colSpan: 3,
    },
  ];

  return (
    <InfoCard delay={0.05}>
      <InfoGrid
        compact={compact}
        columns={professionalLineLayout ? 3 : 2}
        items={professionalLineLayout ? professionalItems : defaultItems}
      />
    </InfoCard>
  );
}
