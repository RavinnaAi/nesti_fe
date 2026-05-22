'use client';

import dynamic from 'next/dynamic';

const ChatWidget = dynamic(() => import('@/components/chatbot/ChatWidget'), {
  ssr: false,
  loading: () => null,
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

export default function PublicInquiryChatWidget({ profile, isOpen, onClose, inquiryType = 'contact', propertyContext = null }) {
  if (!isOpen) return null;

  // If the professional hasn't configured (or has deleted) their embed URL,
  // don't show the chatbot at all.
  const embedToken = profile?.embed_token;
  if (!embedToken) return null;

  const widgetRole =
    profile?.professional_type === 'mortgage_broker' ? 'mortgage-broker' : (profile?.professional_type || 'agent');

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
    <ChatWidget
      embedToken={embedToken}
      widgetRole={widgetRole}
      defaultOpen={true}
      allowLauncher={false}
      hostDisplayName={profile?.professional_name}
      hostAvatarUrl={profile?.profile_photo_url}
      initialGreeting={getGreeting(profile, propertyContext)}
      prefillLeadDraft={prefillLeadDraft}
      prefillIntent={propertyContext ? 'buy' : null}
      freshSessionOnMount={true}
      onClose={onClose}
    />
  );
}
