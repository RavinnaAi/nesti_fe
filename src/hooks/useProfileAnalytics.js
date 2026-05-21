import { useEffect, useCallback } from 'react';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export function useProfileAnalytics(profileSlug) {
  const sessionId = generateSessionId();
  const visitorId = generateVisitorId();

  const trackEvent = useCallback(
    async (eventType, eventData = {}) => {
      if (!profileSlug) return;

      try {
        await trackAnalyticsEvent({
          slug: profileSlug,
          event_type: eventType,
          event_data: eventData,
          session_id: sessionId,
          visitor_id: visitorId,
          ...eventData,
        });
      } catch (error) {
        console.error(`Failed to track ${eventType}:`, error);
      }
    },
    [profileSlug, sessionId, visitorId]
  );

  const trackProfileView = useCallback(() => {
    return trackEvent('profile_view');
  }, [trackEvent]);

  const trackListingClick = useCallback((listingId) => {
    return trackEvent('listing_click', { listing_id: listingId });
  }, [trackEvent]);

  const trackListingView = useCallback((listingId) => {
    return trackEvent('listing_view', { listing_id: listingId });
  }, [trackEvent]);

  const trackServiceClick = useCallback((serviceId) => {
    return trackEvent('service_click', { service_id: serviceId });
  }, [trackEvent]);

  const trackCTAClick = useCallback((ctaType) => {
    return trackEvent('cta_click', { cta_type: ctaType });
  }, [trackEvent]);

  const trackChatbotOpen = useCallback((ctaType = null) => {
    return trackEvent('chatbot_open', { cta_type: ctaType });
  }, [trackEvent]);

  const trackSocialClick = useCallback((platform) => {
    return trackEvent('social_click', { event_data: { platform } });
  }, [trackEvent]);

  const trackPartnerClick = useCallback((partnerId) => {
    return trackEvent('partner_click', { event_data: { partner_id: partnerId } });
  }, [trackEvent]);

  return {
    trackEvent,
    trackProfileView,
    trackListingClick,
    trackListingView,
    trackServiceClick,
    trackCTAClick,
    trackChatbotOpen,
    trackSocialClick,
    trackPartnerClick,
  };
}

export function usePageViewTracking(profileSlug) {
  const { trackProfileView } = useProfileAnalytics(profileSlug);

  useEffect(() => {
    if (!profileSlug) return;

    const startTime = Date.now();
    trackProfileView();

    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      trackAnalyticsEvent({
        slug: profileSlug,
        event_type: 'profile_view',
        session_id: generateSessionId(),
        visitor_id: generateVisitorId(),
        duration_seconds: duration,
      }).catch(() => {});
    };
  }, [profileSlug, trackProfileView]);
}
