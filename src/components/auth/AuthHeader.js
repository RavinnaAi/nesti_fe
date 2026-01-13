import Link from "next/link";
import { Bot } from "lucide-react";

export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="text-left space-y-2">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-heading tracking-tight">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-text-body">{subtitle}</p>
    </div>
  );
}
