const PRIMARY_API_BASE = '/api';
const FALLBACK_API_BASE = 'http://localhost:3000/SocialMediaAnalyticsDashboard/api';
const TOKEN_KEY = 'social_dashboard_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  async function fetchJson(base) {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (_parseError) {
      data = {};
    }

    return { response, data };
  }

  function unwrap(payload, statusCode) {
    if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
      const first = payload.errors[0] || {};
      throw new Error(first.detail || first.title || `Request failed (${statusCode})`);
    }

    if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
      return payload.data;
    }

    return payload;
  }

  try {
    const primary = await fetchJson(PRIMARY_API_BASE);
    if (primary.response.ok) {
      return unwrap(primary.data, primary.response.status);
    }

    // Proxy had a meltdown? Cool, we retry via the root router backend.
    if (primary.response.status >= 500) {
      const fallback = await fetchJson(FALLBACK_API_BASE);
      if (fallback.response.ok) {
        return unwrap(fallback.data, fallback.response.status);
      }
      throw new Error(fallback.data?.errors?.[0]?.detail || `Request failed (${fallback.response.status})`);
    }

    throw new Error(primary.data?.errors?.[0]?.detail || `Request failed (${primary.response.status})`);
  } catch (_networkError) {
    try {
      const fallback = await fetchJson(FALLBACK_API_BASE);
      if (fallback.response.ok) {
        return unwrap(fallback.data, fallback.response.status);
      }
      throw new Error(fallback.data?.errors?.[0]?.detail || `Request failed (${fallback.response.status})`);
    } catch (_fallbackError) {
      throw new Error('Backend is unreachable. Start Serve Project 5 Full Stack and try again.');
    }
  }
}

export async function registerUser(payload) {
  return request('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailToken(token) {
  return request('/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function enableMfa() {
  return request('/v1/auth/mfa/enable', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function verifyMfaCode(code) {
  return request('/v1/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getCurrentUser() {
  return request('/v1/auth/me');
}

export async function getAuthBootstrapStatus() {
  return request('/v1/auth/bootstrap-status', {
    headers: {},
  });
}

export async function getOverview() {
  return request('/v1/analytics/overview');
}

export async function getPlatformAnalytics(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/v1/analytics/platforms${query ? `?${query}` : ''}`);
}

export async function getPeriodComparison() {
  return request('/v1/analytics/compare');
}

export async function getSentimentAnalytics() {
  return request('/v1/analytics/sentiment');
}

export async function listTeams() {
  return request('/v1/teams');
}

export async function createTeam(payload) {
  return request('/v1/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listSocialAccounts() {
  return request('/v1/social-accounts');
}

export async function createSocialAccount(payload) {
  return request('/v1/social-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initOAuthConnect(payload) {
  return request('/v1/oauth/connect/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function completeOAuthConnect(payload) {
  return request('/v1/oauth/connect/callback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function syncSocialAccount(accountId) {
  return request('/v1/social-accounts/sync', {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  });
}

export async function refreshSocialAccountToken(accountId) {
  return request('/v1/social-accounts/token-refresh', {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  });
}

export async function listDrafts() {
  return request('/v1/content/drafts');
}

export async function createDraft(payload) {
  return request('/v1/content/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function scheduleDraft(payload) {
  return request('/v1/content/scheduled', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listScheduledPosts() {
  return request('/v1/content/scheduled');
}

export async function bulkSchedule(payload) {
  return request('/v1/content/bulk-schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listCompetitors() {
  return request('/v1/competitors');
}

export async function createCompetitor(payload) {
  return request('/v1/competitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function syncCompetitor(competitorId) {
  return request('/v1/competitors/sync', {
    method: 'POST',
    body: JSON.stringify({ competitorId }),
  });
}

export async function getTrendingHashtags() {
  return request('/v1/hashtags/trending');
}

export async function listNotifications() {
  return request('/v1/notifications');
}

export async function listReports() {
  return request('/v1/reports');
}

export async function requestReport(payload) {
  return request('/v1/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function exportReport(payload) {
  return request('/v1/reports/export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function evaluateAlerts() {
  return request('/v1/alerts/evaluate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
