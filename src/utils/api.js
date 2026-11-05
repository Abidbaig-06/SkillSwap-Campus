// SkillSwap Campus — Resilient API Client Utility
// Safely handles JSON parsing, network errors, empty proxy responses, and backend unavailability

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof process !== 'undefined' && process.env?.VITE_API_URL) || '';

/**
 * Perform an HTTP request and safely parse the JSON response.
 * Tolerates empty responses (e.g. 502/503/504 Bad Gateway from proxies),
 * non-JSON error pages, and network failures with actionable human-readable messages.
 *
 * @param {string} path - API endpoint path (e.g. '/api/auth/login')
 * @param {RequestInit} [options] - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response body
 */
export async function apiRequest(path, options = {}) {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE}${path}`;

  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    console.warn(`[API Network Error] Unable to connect to ${url}:`, netErr.message);
    throw new Error('Unable to reach the campus server. Please verify your connection and ensure the backend is running.');
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (text && text.trim().length > 0) {
    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn(`[API Parse Warning] Expected JSON from ${url} but got:`, text.slice(0, 100));
      }
    }
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        errorMsg = 'Backend service is currently unavailable. Please verify the server is running and your MongoDB Atlas IP is whitelisted.';
      } else if (res.status === 401) {
        errorMsg = 'Invalid email or password.';
      } else if (res.status === 404) {
        errorMsg = 'Requested API endpoint was not found.';
      } else if (res.status === 409) {
        errorMsg = 'Account or resource conflict occurred.';
      } else {
        errorMsg = `Server returned an error (${res.status}).`;
      }
    }

    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
