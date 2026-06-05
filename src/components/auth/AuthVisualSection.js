import Image from "next/image";
import { CheckCircle2, Sparkles } from "lucide-react";

const FEATURES = [
  "Secure billing",
  "AI-assisted workflows",
  "Built for professionals",
];

export default function AuthVisualSection({ variant = "signup" }) {
  const isSignup = variant === "signup";

  return (
    <div className="relative hidden overflow-hidden md:block md:w-[52%]">
      <Image
        src="/images/signup.jpg"
        alt=""
        fill
        priority
        sizes="52vw"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-slate-950/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 lg:p-10">
        <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/35 bg-white/18 p-5 shadow-xl shadow-black/10 ring-1 ring-white/20 backdrop-blur-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <Sparkles size={12} className="text-primary-light" />
            {isSignup ? "Start with a 3-day trial" : "Welcome back"}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-[1.35rem]">
              Your client workspace, organized beautifully.
            </h2>

            <p className="text-xs leading-4 text-white/90 drop-shadow-sm sm:text-[13px] sm:leading-5">
              Capture leads, manage conversations, and follow-ups from one
              professional dashboard.
            </p>
          </div>

          <ul className="space-y-2 border-t border-white/25 pt-4">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-xs text-white/95 sm:text-[13px]"
              >
                <CheckCircle2 size={13} className="shrink-0 text-primary-light" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
