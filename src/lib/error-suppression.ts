/**
 * Error suppression and recovery utilities
 * Prevents repeated fetch errors and 429 errors from Router.tsx and other modules
 */

let routerErrorCount = 0;
let lastRouterErrorTime = 0;
const ROUTER_ERROR_THRESHOLD = 3;
const ERROR_RESET_INTERVAL = 60000; // 1 minute

/**
 * Suppress repeated Router.tsx fetch errors
 * Prevents 429 errors by limiting retry attempts
 */
export function suppressRouterErrors() {
  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = args[0];
    const urlString = typeof url === 'string' ? url : url.toString();

    // Check if this is a Router.tsx request
    if (urlString.includes('Router.tsx') || urlString.includes('Router')) {
      const now = Date.now();

      // Reset error count if enough time has passed
      if (now - lastRouterErrorTime > ERROR_RESET_INTERVAL) {
        routerErrorCount = 0;
      }

      // If we've hit the threshold, don't attempt to fetch
      if (routerErrorCount >= ROUTER_ERROR_THRESHOLD) {
        console.warn(
          `[Error Suppression] Router.tsx fetch attempts exceeded threshold. Suppressing request.`
        );
        return new Response(
          JSON.stringify({ error: 'Router fetch suppressed' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    try {
      const response = await originalFetch(...args);

      // Track failed Router requests
      if (
        (urlString.includes('Router.tsx') || urlString.includes('Router')) &&
        !response.ok
      ) {
        routerErrorCount++;
        lastRouterErrorTime = Date.now();

        if (response.status === 429) {
          console.warn(
            `[Error Suppression] Router.tsx returned 429. Error count: ${routerErrorCount}`
          );
        }
      }

      return response;
    } catch (error) {
      // Track Router fetch errors
      if (urlString.includes('Router.tsx') || urlString.includes('Router')) {
        routerErrorCount++;
        lastRouterErrorTime = Date.now();
        console.warn(
          `[Error Suppression] Router.tsx fetch failed. Error count: ${routerErrorCount}`
        );
      }
      throw error;
    }
  };
}

/**
 * Suppress unhandled promise rejections related to Router.tsx
 */
export function suppressRouterPromiseRejections() {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonString = String(reason);

    // Check if this is a Router-related error
    if (
      reasonString.includes('Router') ||
      reasonString.includes('Router.tsx') ||
      (reason instanceof Error &&
        (reason.message.includes('Router') ||
          reason.message.includes('Router.tsx')))
    ) {
      console.warn('[Error Suppression] Suppressed Router-related promise rejection:', reason);
      event.preventDefault();
    }
  });
}

/**
 * Initialize all error suppression mechanisms
 */
export function initializeErrorSuppression() {
  if (typeof window !== 'undefined') {
    suppressRouterErrors();
    suppressRouterPromiseRejections();
    console.log('[Error Suppression] Initialized - Router.tsx errors will be suppressed');
  }
}

/**
 * Get current error statistics
 */
export function getErrorStats() {
  return {
    routerErrorCount,
    lastRouterErrorTime: new Date(lastRouterErrorTime),
    threshold: ROUTER_ERROR_THRESHOLD,
  };
}

/**
 * Reset error counters
 */
export function resetErrorCounters() {
  routerErrorCount = 0;
  lastRouterErrorTime = 0;
}
