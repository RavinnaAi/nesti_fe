'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

const ChatWidget = dynamic(() => import('@/components/chatbot/ChatWidget'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse text-sm text-slate-400">Loading chat…</div>
    </div>
  ),
});

function getGreeting(profile, propertyContext) {
  const type = profile?.professional_type;
  const name = profile?.professional_name || 'this professional';

  if (propertyContext) {
    const loc = propertyContext.address || propertyContext.location || 'the listed property';
    const price = propertyContext.expected_price ? ` listed at ${propertyContext.expected_price}` : '';
    return `Hi! You're interested in the property at ${loc}${price}. To connect you with ${name}, I'll need a few quick details. What's your name?`;
  }

  if (type === 'agent') return `Hi! Welcome to ${name}'s real estate services. Are you looking to buy, sell, or invest?`;
  if (type === 'mortgage_broker') return `Hi! Welcome. I'm here to help you secure the best financing. What can I help you with today?`;
  if (type === 'lawyer') return `Hi! I'm here to ensure your real estate transaction is smooth and legally sound. How can I assist you?`;
  return `Hi! Thanks for reaching out to ${name}. How can I help you today?`;
}

function getTitle(profile, propertyContext) {
  if (propertyContext) {
    const loc = propertyContext.address || propertyContext.location || null;
    return loc ? `Inquiry — ${loc}` : 'Property Inquiry';
  }
  if (profile?.professional_type === 'agent') return 'Real Estate Inquiry';
  if (profile?.professional_type === 'mortgage_broker') return 'Mortgage Inquiry';
  if (profile?.professional_type === 'lawyer') return 'Legal Services Inquiry';
  return 'Professional Inquiry';
}

export default function PublicInquiryChatWidget({ profile, isOpen, onClose, inquiryType = 'contact', propertyContext = null }) {
  useEffect(() => {
    if (!isOpen || !profile?.slug) return;
    trackAnalyticsEvent({
      slug: profile.slug,
      event_type: 'chatbot_open',
      cta_type: inquiryType,
      session_id: generateSessionId(),
      visitor_id: generateVisitorId(),
    }).catch(() => {});
  }, [isOpen, profile?.slug, inquiryType]);

  if (!isOpen) return null;

  // Use the professional's own embed token from the public profile response.
  // Falls back to a generic public-inquiry token which still creates leads via the chat API.
  const embedToken = profile?.embed_token || 'public-inquiry';
  const widgetRole =
    profile?.professional_type === 'mortgage_broker' ? 'mortgage-broker' : (profile?.professional_type || 'agent');

  // Build prefill draft from seller property so buyer lead is created with the right context
  const prefillLeadDraft = propertyContext ? {
    location: propertyContext.location || propertyContext.address || '',
    address: propertyContext.address || propertyContext.location || '',
    property_type: propertyContext.property_type || '',
    beds: propertyContext.bedrooms ? String(propertyContext.bedrooms) : '',
    baths: propertyContext.bathrooms ? String(propertyContext.bathrooms) : '',
    budget: propertyContext.expected_price || '',
    timeline: propertyContext.timeline || '',
  } : null;

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col" style={{ width: 'min(420px, calc(100vw - 24px))', height: 'min(660px, calc(100vh - 120px))' }}>
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatWidget
            embedToken={embedToken}
            widgetRole={widgetRole}
            defaultOpen={true}
            allowLauncher={false}
            title={getTitle(profile, propertyContext)}
            subtitle={`Connect with ${profile?.professional_name || 'this professional'}`}
            inlineMode={true}
            initialGreeting={getGreeting(profile, propertyContext)}
            hostAvatarUrl={profile?.profile_photo_url}
            hostDisplayName={profile?.professional_name}
            fillHeight={true}
            prefillLeadDraft={prefillLeadDraft}
            prefillIntent={propertyContext ? 'buy' : null}
            freshSessionOnMount={true}
          />
        </div>
      </div>
    </div>
  );
}

