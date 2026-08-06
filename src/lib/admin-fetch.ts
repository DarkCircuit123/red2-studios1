/**
 * Admin Fetch Utility
 * 
 * Handles cross-site iframe cookie blocking by:
 * 1. Sending credentials (cookies) with every request
 * 2. Falling back to x-admin-session header when cookies are blocked
 * 3. Storing token in sessionStorage with in-memory mirror for blocked iframes
 * 
 * Use this for ALL admin/media endpoints. Public endpoints use bare fetch.
 */

/**
 * Get the admin token from sessionStorage or memory
 */
function getAdminToken(): string | null {
  try {
    // Try sessionStorage first
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('admin_session_token');
      if (token) return token;
    }
  } catch (e) {
    // sessionStorage may be blocked in some iframes
  }
  
  // Fall back to in-memory token (for storage-blocked iframes)
  return (window as any).__adminToken || null;
}

/**
 * Store the admin token in sessionStorage and memory
 */
function setAdminToken(token: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('admin_session_token', token);
    }
  } catch (e) {
    // sessionStorage may be blocked
  }
  
  // Always store in memory as fallback
  (window as any).__adminToken = token;
}

/**
 * Clear the admin token
 */
function clearAdminToken(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('admin_session_token');
    }
  } catch (e) {
    // sessionStorage may be blocked
  }
  
  delete (window as any).__adminToken;
}

/**
 * Fetch wrapper for admin endpoints
 * Automatically includes credentials and x-admin-session header
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();
  
  const headers = new Headers(options.headers || {});
  
  // Always include x-admin-session header as fallback
  if (token) {
    headers.set('x-admin-session', token);
  }
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Send cookies
    headers,
  });
  
  // If we get a 401, clear the token
  if (response.status === 401) {
    clearAdminToken();
  }
  
  return response;
}

/**
 * Apply admin auth to XMLHttpRequest (for progress-reporting uploads)
 */
export function applyAdminAuthToXhr(xhr: XMLHttpRequest): void {
  const token = getAdminToken();
  
  if (token) {
    xhr.setRequestHeader('x-admin-session', token);
  }
  
  // Note: credentials: 'include' is set on the fetch level, not XHR
  // XHR always sends cookies by default (withCredentials = true)
}

/**
 * Store token from login response
 */
export function storeAdminToken(token: string): void {
  setAdminToken(token);
}

/**
 * Clear token on logout
 */
export function clearAdminSession(): void {
  clearAdminToken();
}
