/**
 * Debug Logger Utility
 * Provides consistent, development-only logging across the application
 * Automatically disabled in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log debug message (development only)
 */
export const debugLog = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

/**
 * Log error message (development only)
 */
export const debugError = (message: string, error?: any): void => {
  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, error);
  }
};

/**
 * Log warning message (development only)
 */
export const debugWarn = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, data);
  }
};

/**
 * Log info message (development only)
 */
export const debugInfo = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.info(`[INFO] ${message}`, data);
  }
};

/**
 * Log performance metric (development only)
 */
export const debugPerf = (label: string, duration: number): void => {
  if (isDevelopment) {
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
  }
};

/**
 * Group related logs (development only)
 */
export const debugGroup = (label: string, callback: () => void): void => {
  if (isDevelopment) {
    console.group(`[GROUP] ${label}`);
    try {
      callback();
    } finally {
      console.groupEnd();
    }
  } else {
    callback();
  }
};

/**
 * Assert condition and log if false (development only)
 */
export const debugAssert = (condition: boolean, message: string): void => {
  if (isDevelopment && !condition) {
    console.error(`[ASSERT] ${message}`);
  }
};

/**
 * Trace function calls (development only)
 */
export const debugTrace = (functionName: string): void => {
  if (isDevelopment) {
    console.trace(`[TRACE] ${functionName}`);
  }
};

/**
 * Time a function execution (development only)
 */
export const debugTime = (label: string): (() => void) => {
  if (isDevelopment) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`[TIME] ${label}: ${duration.toFixed(2)}ms`);
    };
  }
  return () => {};
};

/**
 * Create a scoped logger for a module
 */
export const createModuleLogger = (moduleName: string) => {
  return {
    log: (message: string, data?: any) => debugLog(`[${moduleName}] ${message}`, data),
    error: (message: string, error?: any) => debugError(`[${moduleName}] ${message}`, error),
    warn: (message: string, data?: any) => debugWarn(`[${moduleName}] ${message}`, data),
    info: (message: string, data?: any) => debugInfo(`[${moduleName}] ${message}`, data),
    perf: (label: string, duration: number) => debugPerf(`${moduleName}:${label}`, duration),
  };
};
