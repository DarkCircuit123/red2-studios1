/**
 * Admin Fetch Utility
 *
 * Admin authentication is cookie-based. The session cookie is httpOnly and
 * must never be copied into JavaScript storage or request headers.
 */

/**
 * Fetch an admin endpoint with the secure httpOnly session cookie.
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  return response;
}

/**
 * Apply cookie-based admin authentication to an XMLHttpRequest.
 * XHR does not inherit fetch credentials, so explicitly enable cookies.
 */
export function applyAdminAuthToXhr(xhr: XMLHttpRequest): void {
  xhr.withCredentials = true;
}

/**
 * Deprecated compatibility no-op. Admin tokens are no longer exposed to the
 * browser; authentication is carried by the secure httpOnly cookie.
 */
export function storeAdminToken(_token: string): void {
  // Intentionally empty: never persist admin session tokens in browser JS.
}

/**
 * Deprecated compatibility no-op. The server-side logout endpoint clears the
 * authoritative session cookie.
 */
export function clearAdminSession(): void {
  // Intentionally empty: the httpOnly cookie cannot be cleared by JavaScript.
}
