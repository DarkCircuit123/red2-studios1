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

export function initializeGlobalErrorHandlers() {
  window.addEventListener('error', (event: ErrorEvent) => {
    handleError('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event: UnhandledRejectionEvent) => {
    handleError('Unhandled Promise Rejection', event.reason);
  });

  console.log('Global error handler initialized');
}

function handleError(type: string, error: any, context?: Record<string, any>) {
  const errorInfo = {
    timestamp: new Date(),
    type,
    message: error?.message || String(error),
    stack: error?.stack,
    context,
  };

  errorLog.push({ timestamp: new Date(), error: errorInfo });
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  console.error(`${type}:`, errorInfo);

  if (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('dynamically imported') ||
    error?.message?.includes('chunk')
  ) {
    console.warn('Detected module loading error - consider page reload');
  }
}

export function getErrorLog() {
  return [...errorLog];
}

export function clearErrorLog() {
  errorLog.length = 0;
}

export function exportErrorLog() {
  return JSON.stringify(errorLog, null, 2);
}
