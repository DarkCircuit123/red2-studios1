/**
 * Debug Logger Utility
 * Provides conditional logging based on environment
 * Reduces console pollution in production
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
  module?: string;
  timestamp?: boolean;
}

class DebugLogger {
  private isDev = isDevelopment;

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.log(`${prefix} ${message}`, data || '');
    }
  }

  /**
   * Log warnings (always logged, but can be suppressed)
   */
  warn(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.warn(`${prefix} ${message}`, data || '');
    }
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: any, context?: LogContext) {
    const prefix = context?.module ? `[${context.module}]` : '';
    console.error(`${prefix} ${message}`, error || '');
  }

  /**
   * Log info messages (only in development)
   */
  info(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.info(`${prefix} ${message}`, data || '');
    }
  }

  /**
   * Performance timing (only in development)
   */
  time(label: string) {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * Group logs (only in development)
   */
  group(label: string) {
    if (this.isDev) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDev) {
      console.groupEnd();
    }
  }
}

export const logger = new DebugLogger();
