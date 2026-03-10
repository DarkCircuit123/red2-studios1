let routerErrorCount = 0;
let lastRouterErrorTime = 0;
const ROUTER_ERROR_THRESHOLD = 3;
const ERROR_RESET_INTERVAL = 60000;

export function suppressRouterErrors() {
  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = args[0];
    const urlString = typeof url === 'string' ? url : url.toString();

    if (urlString.includes('Router.tsx') || urlString.includes('Router')) {
      const now = Date.now();

      if (now - lastRouterErrorTime > ERROR_RESET_INTERVAL) {
        routerErrorCount = 0;
      }

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

export function suppressRouterPromiseRejections() {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonString = String(reason);

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

export function initializeErrorSuppression() {
  if (typeof window !== 'undefined') {
    suppressRouterErrors();
    suppressRouterPromiseRejections();
    console.log('[Error Suppression] Initialized - Router.tsx errors will be suppressed');
  }
}

export function getErrorStats() {
  return {
    routerErrorCount,
    lastRouterErrorTime: new Date(lastRouterErrorTime),
    threshold: ROUTER_ERROR_THRESHOLD,
  };
}

export function resetErrorCounters() {
  routerErrorCount = 0;
  lastRouterErrorTime = 0;
}
