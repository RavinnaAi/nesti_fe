'use client';

import { useState } from 'react';
import PublicHero from '../PublicHero';
import PublicExpertiseBand from '../PublicExpertiseBand';
import PublicServices from '../PublicServices';
import PublicRoleDetailSection from '../PublicRoleDetailSection';
import PublicHappyClientsSlider from '../PublicHappyClientsSlider';
import BrokerProgramsSection from './BrokerProgramsSection';
import BrokerAboutSection from './BrokerAboutSection';
import PublicCTA from '../PublicCTA';
import PublicChatBubble from '../PublicChatBubble';
import PublicGuidanceSection from '../PublicGuidanceSection';
import PublicInquiryChatWidget from '../PublicInquiryChatWidget';
import PublicLeadCaptureModal from '../PublicLeadCaptureModal';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export default function BrokerLandingPage({ profile }) {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

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
      <PublicHero
        profile={profile}
        onCTAClick={handleCTAClick}
        onDirectLeadClick={() => setLeadModalOpen(true)}
      />
      <PublicExpertiseBand profile={profile} onCTAClick={handleCTAClick} />
      <PublicRoleDetailSection profile={profile} />

      {profile.about && (
        <BrokerAboutSection about={profile.about} profile={profile} />
      )}

      <PublicHappyClientsSlider testimonials={profile.testimonials} profile={profile} />

      <PublicServices
        services={profile.services}
        professionalType="mortgage_broker"
        onServiceClick={handleServiceClick}
      />

      {profile.mortgage_programs && profile.mortgage_programs.length > 0 && (
        <BrokerProgramsSection
          programs={profile.mortgage_programs}
          onProgramClick={handleCTAClick}
        />
      )}

      <PublicGuidanceSection profile={profile} />

      <PublicCTA
        profile={profile}
        onDirectLeadClick={() => setLeadModalOpen(true)}
      />

      <PublicLeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        profile={profile}
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


