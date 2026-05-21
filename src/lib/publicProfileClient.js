const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getPublicProfile(slug) {
  const res = await fetch(`${API_BASE_URL}/api/public/professionals/${slug}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch profile' }));
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return res.json();
}

export async function trackAnalyticsEvent({ slug, event_type, event_data = {}, session_id, visitor_id, cta_type, listing_id, service_id, duration_seconds }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/professionals/${slug}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type,
        event_data,
        session_id,
        visitor_id,
        cta_type,
        listing_id,
        service_id,
        duration_seconds,
      }),
    });

    if (!res.ok) {
      console.error('Failed to track analytics event');
    }

    return res.json();
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return null;
  }
}

export async function getOwnPublicProfile(token) {
  const res = await fetch(`${API_BASE_URL}/api/professional-dashboard/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch profile' }));
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return res.json();
}

export async function updatePublicProfile(token, data) {
  const res = await fetch(`${API_BASE_URL}/api/professional-dashboard/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(error.message || 'Failed to update profile');
  }

  return res.json();
}

export async function generatePublicProfileCopy(token) {
  const res = await fetch(`${API_BASE_URL}/api/professional-dashboard/profile/generate-copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to generate profile copy' }));
    throw new Error(error.message || 'Failed to generate profile copy');
  }

  return res.json();
}

export async function getProfileAnalytics(token, { period = 'daily', start_date, end_date } = {}) {
  const params = new URLSearchParams({ period });
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);

  const res = await fetch(`${API_BASE_URL}/api/professional-dashboard/analytics?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch analytics' }));
    throw new Error(error.message || 'Failed to fetch analytics');
  }

  return res.json();
}

export async function getSellerProperties(slug) {
  const res = await fetch(`${API_BASE_URL}/api/public/professionals/${slug}/properties`, {
    cache: 'no-store',
  });
  if (!res.ok) return { properties: [] };
  return res.json();
}

export async function getPublicProfessionalsList({ role, limit = 12, exclude } = {}) {
  const params = new URLSearchParams({ limit });
  if (role) params.append('role', role);
  if (exclude) params.append('exclude', exclude);

  const res = await fetch(`${API_BASE_URL}/api/public/professionals?${params}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch professionals' }));
    throw new Error(error.message || 'Failed to fetch professionals');
  }

  return res.json();
}

export async function getPublicProfessionalNetwork({ role, limit = 60, exclude } = {}) {
  const params = new URLSearchParams({ limit });
  if (role) params.append('role', role);
  if (exclude) params.append('exclude', exclude);

  const res = await fetch(`${API_BASE_URL}/api/public/professional-network?${params}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch professional network' }));
    throw new Error(error.message || 'Failed to fetch professional network');
  }

  return res.json();
}

export async function checkSlugAvailability(slug, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/public/slug/check`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to check slug' }));
    throw new Error(error.message || 'Failed to check slug');
  }

  return res.json();
}
