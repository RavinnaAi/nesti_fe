'use client';

import { useState } from 'react';
import PublicHero from '../PublicHero';
import PublicExpertiseBand from '../PublicExpertiseBand';
import PublicServices from '../PublicServices';
import PublicRoleDetailSection from '../PublicRoleDetailSection';
import PublicHappyClientsSlider from '../PublicHappyClientsSlider';
import AgentListingsSection from './AgentListingsSection';
import AgentPropertiesSection from './AgentPropertiesSection';
import AgentAboutSection from './AgentAboutSection';
import PublicCTA from '../PublicCTA';
import PublicChatBubble from '../PublicChatBubble';
import PublicGuidanceSection from '../PublicGuidanceSection';
import PublicInquiryChatWidget from '../PublicInquiryChatWidget';
import PublicLeadCaptureModal from '../PublicLeadCaptureModal';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export default function AgentLandingPage({ profile }) {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [prefillInquiryProperty, setPrefillInquiryProperty] = useState(null);

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

  const openDirectInquiryModal = (property = null) => {
    setPrefillInquiryProperty(property || null);
    setLeadModalOpen(true);
  };

  return (
    <div>
      <PublicHero
        profile={profile}
        onCTAClick={handleCTAClick}
        onDirectLeadClick={() => openDirectInquiryModal(null)}
      />
      <PublicExpertiseBand profile={profile} onCTAClick={handleCTAClick} />
      <PublicRoleDetailSection profile={profile} />

      {profile.about && (
        <AgentAboutSection about={profile.about} profile={profile} />
      )}

      <AgentPropertiesSection
        profile={profile}
        onPropertyInquiry={(property) => openDirectInquiryModal(property)}
      />

      <PublicHappyClientsSlider testimonials={profile.testimonials} profile={profile} />

      <PublicServices
        services={profile.services}
        professionalType="agent"
        onServiceClick={handleServiceClick}
      />

      {profile.featured_listings && profile.featured_listings.length > 0 && (
        <AgentListingsSection
          title="Featured Listings"
          listings={profile.featured_listings}
          type="featured"
          profileSlug={profile.slug}
        />
      )}

      {profile.top_listings && profile.top_listings.length > 0 && (
        <AgentListingsSection
          title="Top Listings"
          listings={profile.top_listings}
          type="top"
          profileSlug={profile.slug}
        />
      )}

      {profile.sold_listings && profile.sold_listings.length > 0 && (
        <AgentListingsSection
          title="Recently Sold"
          listings={profile.sold_listings}
          type="sold"
          profileSlug={profile.slug}
        />
      )}

      <PublicGuidanceSection profile={profile} />

      <PublicCTA
        profile={profile}
        onDirectLeadClick={() => openDirectInquiryModal(null)}
      />

      <PublicLeadCaptureModal
        open={leadModalOpen}
        onClose={() => {
          setLeadModalOpen(false);
          setPrefillInquiryProperty(null);
        }}
        profile={profile}
        prefillProperty={prefillInquiryProperty}
      />

      <PublicInquiryChatWidget
        profile={profile}
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        inquiryType="contact"
      />

      <PublicChatBubble
        profile={profile}
        hideWhenOpen={chatbotOpen}
      />
    </div>
  );
}


