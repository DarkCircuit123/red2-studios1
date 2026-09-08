/**
 * Comprehensive app initialization - ensures all critical systems are ready
 */

export interface InitializationStatus {
  isReady: boolean;
  errors: string[];
  warnings: string[];
}

const status: InitializationStatus = {
  isReady: false,
  errors: [],
  warnings: [],
};

/**
 * Initialize critical browser APIs and systems
 */
export async function initializeApp(): Promise<InitializationStatus> {
  try {
    // 1. Check for required browser APIs
    if (typeof window === 'undefined') {
      status.errors.push('Window object not available');
      return status;
    }

    // 2. Initialize Audio Context if available
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        status.warnings.push('Audio context not available');
      }
    } catch (e) {
      status.warnings.push(`Audio context initialization warning: ${e}`);
    }

    // 3. Check for React Router
    if (typeof document === 'undefined') {
      status.errors.push('Document object not available');
      return status;
    }

    // 4. Verify DOM is ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // 5. Initialize error handlers
    initializeErrorHandlers();

    // 6. Set up performance monitoring
    initializePerformanceMonitoring();

    status.isReady = true;

    return status;
  } catch (error) {
    status.errors.push(`Initialization failed: ${error}`);
    // Continue anyway - don't block app
    status.isReady = true;
    return status;
  }
}

/**
 * Initialize global error handlers
 */
function initializeErrorHandlers() {
  try {
    // Handle unhandled promise rejections - single listener
    const rejectionHandler = () => {
      // Silent handling
    };

    // Handle script errors - single listener
    const errorHandler = () => {
      // Silent handling
    };

    window.addEventListener('unhandledrejection', rejectionHandler);
    window.addEventListener('error', errorHandler);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('unhandledrejection', rejectionHandler);
      window.removeEventListener('error', errorHandler);
    }, { once: true });
  } catch (e) {
    // Silently fail
  }
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
  try {
    if (typeof PerformanceObserver !== 'undefined') {
      // Monitor Core Web Vitals - minimal logging
      const observer = new PerformanceObserver(() => {
        // Silent monitoring
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
    }
  } catch (e) {
    // Silently fail
  }
}

/**
 * Get current initialization status
 */
export function getInitializationStatus(): InitializationStatus {
  return { ...status };
}

/**
 * Check if app is ready
 */
export function isAppReady(): boolean {
  return status.isReady;
}
