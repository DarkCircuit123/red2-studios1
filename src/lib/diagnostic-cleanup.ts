/**
 * Diagnostic and Cleanup Utilities
 * Identifies and fixes common issues:
 * - Console errors and warnings
 * - Dead code references
 * - Missing error handlers
 * - Performance bottlenecks
 */

export class DiagnosticCleanup {
  private static instance: DiagnosticCleanup;
  private errors: Array<{ type: string; message: string; timestamp: number }> = [];
  private warnings: Array<{ type: string; message: string; timestamp: number }> = [];

  private constructor() {
    this.setupErrorHandlers();
  }

  static getInstance(): DiagnosticCleanup {
    if (!DiagnosticCleanup.instance) {
      DiagnosticCleanup.instance = new DiagnosticCleanup();
    }
    return DiagnosticCleanup.instance;
  }

  private setupErrorHandlers() {
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.logError('UncaughtError', event.message);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('UnhandledPromiseRejection', event.reason?.message || String(event.reason));
    });

    // Override console methods to track issues
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      this.logWarning('ConsoleWarn', args.join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.logError('ConsoleError', args.join(' '));
      originalError.apply(console, args);
    };
  }

  private logError(type: string, message: string) {
    this.errors.push({
      type,
      message,
      timestamp: Date.now(),
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }

  private logWarning(type: string, message: string) {
    this.warnings.push({
      type,
      message,
      timestamp: Date.now(),
    });

    // Keep only last 50 warnings
    if (this.warnings.length > 50) {
      this.warnings.shift();
    }
  }

  getErrors() {
    return this.errors;
  }

  getWarnings() {
    return this.warnings;
  }

  getReport() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      timestamp: Date.now(),
    };
  }

  clearErrors() {
    this.errors = [];
  }

  clearWarnings() {
    this.warnings = [];
  }

  // Check for common issues
  checkCommonIssues() {
    const issues: string[] = [];

    // Check for missing required elements
    if (!document.querySelector('header')) {
      issues.push('Missing header element');
    }

    if (!document.querySelector('footer')) {
      issues.push('Missing footer element');
    }

    // Check for broken images
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.src || img.src === '') {
        issues.push(`Image missing src: ${img.alt || 'unknown'}`);
      }
    });

    // Check for broken links
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '') {
        issues.push(`Broken link: ${link.textContent}`);
      }
    });

    return issues;
  }

  // Performance diagnostics
  getPerformanceMetrics() {
    if (!window.performance) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    };
  }
}

// Initialize on import
export const diagnosticCleanup = DiagnosticCleanup.getInstance();
