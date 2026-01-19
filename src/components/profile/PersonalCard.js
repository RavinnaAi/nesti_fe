"use client";

import {
  User,
  Mail,
  Phone,
  Globe2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { InfoCard, InfoGrid } from "./ProfileInfoCard";

export default function PersonalCard({
  displayFullName,
  personalInfo,
  businessInfo,
}) {
  return (
    <InfoCard title="Personal Information" icon={User} delay={0.05}>
      <InfoGrid
        items={[
          {
            label: "Full Name",
            value: displayFullName,
            icon: User,
          },
          { label: "Email", value: personalInfo?.email, icon: Mail },
          { label: "Phone", value: personalInfo?.phone, icon: Phone },
          {
            label: "Website",
            value: businessInfo?.website || personalInfo?.website,
            icon: Globe2,
          },
          {
            label: "Location",
            value: businessInfo?.location || personalInfo?.location,
            icon: MapPin,
          },
          {
            label: "Role",
            value: personalInfo?.role || personalInfo?.professionalType,
            icon: Briefcase,
          },
        ]}
      />
    </InfoCard>
  );
}
