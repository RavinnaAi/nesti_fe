import HeroSection from "@/components/sections/HeroSection";
import AIAssistantsSection from "@/components/sections/AIAssistantsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CEOFeaturesSection from "@/components/sections/CEOFeaturesSection";
import OnboardingSection from "@/components/sections/OnboardingSection";
import { PageCta } from "@/components/public-pages/shared/PublicPageShared";

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-primary/[0.08] to-white">
      <HeroSection />
      <AIAssistantsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CEOFeaturesSection />
      <OnboardingSection />
      <PageCta
        compact
        transparentSection
        compactHeading="Stop Burning Hours on Admin Work. Start Your Free Trial Today."
      />
    </div>
  );
}
