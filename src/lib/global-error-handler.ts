/**
 * Global Error Handler
 * Catches unhandled errors and module loading failures globally
 */

interface ErrorEvent {
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  error: Error;
}

interface UnhandledRejectionEvent {
  reason: any;
  promise: Promise<any>;
}

const errorLog: Array<{ timestamp: Date; error: any }> = [];
const MAX_ERROR_LOG_SIZE = 50;

/**
 * Initialize global error handlers
 */
export function initializeGlobalErrorHandlers() {
  // Handle uncaught errors
  window.addEventListener('error', (event: ErrorEvent) => {
    handleError('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: UnhandledRejectionEvent) => {
    handleError('Unhandled Promise Rejection', event.reason);
  });

  // Log errors for debugging
  console.log('[GlobalErrorHandler] Initialized');
}

/**
 * Central error handling function
 */
function handleError(type: string, error: any, context?: Record<string, any>) {
  const errorInfo = {
    timestamp: new Date(),
    type,
    message: error?.message || String(error),
    stack: error?.stack,
    context,
  };

  // Add to error log
  errorLog.push({ timestamp: new Date(), error: errorInfo });
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  // Log to console
  console.error(`[GlobalErrorHandler] ${type}:`, errorInfo);

  // Check if it's a module loading error
  if (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('dynamically imported') ||
    error?.message?.includes('chunk')
  ) {
    console.warn('[GlobalErrorHandler] Detected module loading error - consider page reload');
  }
}

/**
 * Get error log for debugging
 */
export function getErrorLog() {
  return [...errorLog];
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

/**
 * Export error log as JSON
 */
export function exportErrorLog() {
  return JSON.stringify(errorLog, null, 2);
}
