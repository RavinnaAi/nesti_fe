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

export function trackAnalyticsEvent(eventData) {
  const sessionId = generateSessionId();
  const visitorId = generateVisitorId();
  
  return {
    ...eventData,
    session_id: sessionId,
    visitor_id: visitorId,
  };
}
