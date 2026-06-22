export function generateSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('nesti_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('nesti_session_id', sessionId);
  }
  
  return sessionId;
}

export function generateVisitorId() {
  if (typeof window === 'undefined') return null;
  
  let visitorId = localStorage.getItem('nesti_visitor_id');
  
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('nesti_visitor_id', visitorId);
  }
  
  return visitorId;
}

/** Preserve the first external referrer for the browser session (traffic attribution). */
export function getEntryReferrer() {
  if (typeof window === 'undefined') return '';
  const key = 'nesti_entry_referrer';
  const stored = sessionStorage.getItem(key);
  if (stored !== null) return stored;
  const referrer = document.referrer || '';
  sessionStorage.setItem(key, referrer);
  return referrer;
}

export function trackAnalyticsEvent(eventData) {
  const sessionId = generateSessionId();
  const visitorId = generateVisitorId();
  
  return {
    ...eventData,
    session_id: sessionId,
    visitor_id: visitorId,
  };
}
