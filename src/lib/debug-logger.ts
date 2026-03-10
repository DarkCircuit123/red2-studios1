const isDevelopment = import.meta.env.DEV;

interface LogContext {
  module?: string;
  timestamp?: boolean;
}

class DebugLogger {
  private isDev = isDevelopment;

  debug(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.log(`${prefix} ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.warn(`${prefix} ${message}`, data || '');
    }
  }

  error(message: string, error?: any, context?: LogContext) {
    const prefix = context?.module ? `[${context.module}]` : '';
    console.error(`${prefix} ${message}`, error || '');
  }

  info(message: string, data?: any, context?: LogContext) {
    if (this.isDev) {
      const prefix = context?.module ? `[${context.module}]` : '';
      console.info(`${prefix} ${message}`, data || '');
    }
  }

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
