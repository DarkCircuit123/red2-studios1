export function suppressRouterErrors() {
  // Error suppression disabled - fetch interception removed to prevent blocking legitimate requests
}

export function suppressRouterPromiseRejections() {
  // Promise rejection suppression disabled - let errors propagate normally
}

export function initializeErrorSuppression() {
  if (typeof window !== 'undefined') {
    console.log('[Error Suppression] Initialized - minimal error handling active');
  }
}

export function getErrorStats() {
  return {
    routerErrorCount: 0,
    lastRouterErrorTime: new Date(),
    threshold: 3,
  };
}

export function resetErrorCounters() {
  // No-op
}
