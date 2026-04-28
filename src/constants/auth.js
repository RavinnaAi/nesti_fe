import { Home, FileText, DollarSign } from "lucide-react";

export const roles = [
  { value: "agent", label: "Agent", icon: Home },
  { value: "lawyer", label: "Lawyer", icon: FileText },
  { value: "mortgage_broker", label: "Mortgage Broker", icon: DollarSign },
];

/** Workspace roles that must complete personal + business profile before using gated APIs */
export const PROFESSIONAL_ROLE_VALUES = roles.map((r) => r.value);
