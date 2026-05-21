'use client';

import { useState } from 'react';
import PublicHero from '../PublicHero';
import PublicExpertiseBand from '../PublicExpertiseBand';
import PublicServices from '../PublicServices';
import PublicHappyClientsSlider from '../PublicHappyClientsSlider';
import LawyerPracticeAreasSection from './LawyerPracticeAreasSection';
import LawyerCredentialsSection from './LawyerCredentialsSection';
import LawyerAboutSection from './LawyerAboutSection';
import PublicCTA from '../PublicCTA';
import PublicProfessionalsSlider from '../PublicProfessionalsSlider';
import PublicChatBubble from '../PublicChatBubble';
import PublicGuidanceSection from '../PublicGuidanceSection';
import PublicInquiryChatWidget from '../PublicInquiryChatWidget';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export default function LawyerLandingPage({ profile }) {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const handleCTAClick = async (ctaType) => {
    try {
      await trackAnalyticsEvent({
        slug: profile.slug,
        event_type: 'cta_click',
        cta_type: ctaType,
        session_id: generateSessionId(),
        visitor_id: generateVisitorId(),
      });
    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }

    setChatbotOpen(true);
  };

  const handleServiceClick = async (service) => {
    try {
      await trackAnalyticsEvent({
        slug: profile.slug,
        event_type: 'service_click',
        service_id: service._id,
        session_id: generateSessionId(),
        visitor_id: generateVisitorId(),
      });
    } catch (error) {
      console.error('Failed to track service click:', error);
    }

    setChatbotOpen(true);
  };

  return (
    <div>
      <PublicHero profile={profile} onCTAClick={handleCTAClick} />
      <PublicExpertiseBand profile={profile} onCTAClick={handleCTAClick} />

      {profile.about && (
        <LawyerAboutSection about={profile.about} profile={profile} />
      )}

      <PublicHappyClientsSlider testimonials={profile.testimonials} profile={profile} />

      {profile.practice_areas && profile.practice_areas.length > 0 && (
        <LawyerPracticeAreasSection
          practiceAreas={profile.practice_areas}
          onAreaClick={handleCTAClick}
        />
      )}

      <PublicServices
        services={profile.services}
        professionalType="lawyer"
        onServiceClick={handleServiceClick}
      />

      {profile.credentials && profile.credentials.length > 0 && (
        <LawyerCredentialsSection credentials={profile.credentials} />
      )}

      <PublicProfessionalsSlider currentSlug={profile.slug} />

      <PublicGuidanceSection profile={profile} />

      <PublicCTA
        profile={profile}
        onCTAClick={handleCTAClick}
        chatbotOpen={chatbotOpen}
        onChatbotClose={() => setChatbotOpen(false)}
      />

      <PublicInquiryChatWidget
        profile={profile}
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        inquiryType="contact"
      />

      <PublicChatBubble profile={profile} hideWhenOpen={chatbotOpen} />
    </div>
  );
}


