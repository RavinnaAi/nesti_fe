import HeroSection from "@/components/sections/HeroSection";
import AIAssistantsSection from "@/components/sections/AIAssistantsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CEOFeaturesSection from "@/components/sections/CEOFeaturesSection";
import OnboardingSection from "@/components/sections/OnboardingSection";
import CTASection from "@/components/sections/CTASection";

export default function Home() {
  return (
    <div className="relative">
      <HeroSection />
      <AIAssistantsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CEOFeaturesSection />
      <OnboardingSection />
      <CTASection />
    </div>
  );
}
