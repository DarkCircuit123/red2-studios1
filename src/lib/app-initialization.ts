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
      if (AudioContextClass) {
        console.log('[App Init] Audio context available');
      } else {
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
    console.log('[App Init] Initialization complete', status);

    return status;
  } catch (error) {
    status.errors.push(`Initialization failed: ${error}`);
    console.error('[App Init] Initialization error:', error);
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
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('[App Init] Unhandled promise rejection:', event.reason);
      // Don't prevent default - let it continue
    });

    // Handle script errors
    window.addEventListener('error', (event) => {
      console.warn('[App Init] Script error:', event.error);
      // Don't prevent default
    });

    console.log('[App Init] Error handlers initialized');
  } catch (e) {
    console.warn('[App Init] Failed to initialize error handlers:', e);
  }
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
  try {
    if (typeof PerformanceObserver !== 'undefined') {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.debug('[App Init] Performance entry:', entry.name, entry.duration);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
      console.log('[App Init] Performance monitoring initialized');
    }
  } catch (e) {
    console.warn('[App Init] Failed to initialize performance monitoring:', e);
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
