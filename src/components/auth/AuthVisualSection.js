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
    <div className="relative hidden min-h-full overflow-hidden md:block md:w-[52%]">
      <Image
        src="/images/img.PNG"
        alt=""
        fill
        priority
        sizes="52vw"
        className="object-cover object-[62%_center] brightness-[0.88] contrast-[1.04]"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/45 via-slate-950/22 to-slate-950/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-[21rem] space-y-3 rounded-3xl border border-white/45 bg-slate-950/28 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] ring-1 ring-white/25 backdrop-blur-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90">
            <Sparkles size={12} className="text-primary-light" />
            {isSignup ? "Start with a 3-day trial" : "Welcome back"}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-white/95 drop-shadow-md sm:text-xl">
              Your client workspace, organized beautifully.
            </h2>

            <p className="text-xs leading-5 text-white/80 drop-shadow-sm sm:text-[13px]">
              Capture leads, manage conversations, and follow-ups from one
              professional dashboard.
            </p>
          </div>

          <ul className="space-y-2 border-t border-white/20 pt-4">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 text-xs font-medium text-white drop-shadow-sm sm:text-[13px]"
              >
                <CheckCircle2 size={14} className="shrink-0 text-primary-light" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
