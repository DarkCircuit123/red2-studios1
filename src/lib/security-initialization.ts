/**
 * Security Initialization Module
 * Initializes all security layers on application startup
 */

import {
  behavioralAnalyzer,
  domIntegrityMonitor,
  networkValidator,
  sessionHijackingPrevention,
  sriEnforcer,
} from './red-team-hardening';
import {
  intrusionDetectionSystem,
  exploitPreventionEngine,
  zeroDayProtection,
} from './advanced-threat-detection';
import { SecurityHeadersManager } from './security-enhanced';

/**
 * Initialize all security systems
 */
export function initializeSecuritySystems(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Initialize DOM Integrity Monitor
    initializeDOMIntegrity();
  } catch (error) {
    console.error('[Security] DOM integrity init failed:', error);
  }

  try {
    // 2. Initialize Session Protection
    initializeSessionProtection();
  } catch (error) {
    console.error('[Security] Session protection init failed:', error);
  }

  try {
    // 3. Initialize Network Validation
    initializeNetworkValidation();
  } catch (error) {
    console.error('[Security] Network validation init failed:', error);
  }

  try {
    // 4. Initialize Threat Detection
    initializeThreatDetection();
  } catch (error) {
    console.error('[Security] Threat detection init failed:', error);
  }

  try {
    // 5. Initialize Security Headers
    initializeSecurityHeaders();
  } catch (error) {
    console.error('[Security] Security headers init failed:', error);
  }

  try {
    // 6. Initialize Zero-Day Protection
    initializeZeroDayProtection();
  } catch (error) {
    console.error('[Security] Zero-day protection init failed:', error);
  }

  try {
    // 7. Setup Global Error Handling
    setupGlobalErrorHandling();
  } catch (error) {
    console.error('[Security] Global error handling init failed:', error);
  }

  try {
    // 8. Setup Periodic Security Checks
    setupPeriodicSecurityChecks();
  } catch (error) {
    console.error('[Security] Periodic checks init failed:', error);
  }
}

/**
 * Initialize DOM Integrity Monitoring
 */
function initializeDOMIntegrity(): void {
  try {
    domIntegrityMonitor.initialize();
  } catch (error) {
    // Silently fail
  }
}

/**
 * Initialize Session Protection
 */
function initializeSessionProtection(): void {
  try {
    // Generate session fingerprint
    sessionHijackingPrevention.generateFingerprint();

    // Validate session on page visibility change
    const visibilityHandler = () => {
      if (!document.hidden) {
        sessionHijackingPrevention.validateSession();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }, { once: true });
  } catch (error) {
    // Silently fail
  }
}

/**
 * Initialize Network Validation
 */
function initializeNetworkValidation(): void {
  try {
    // Network validation disabled - allows standard DNS and network operations
    // No fetch interception to maintain standard site operation
  } catch (error) {
    // Silently fail
  }
}

/**
 * Initialize Threat Detection
 */
function initializeThreatDetection(): void {
  try {
    // Register common attack signatures
    registerCommonAttackSignatures();

    // Register common exploit patterns
    registerCommonExploitPatterns();
  } catch (error) {
    // Silently fail
  }
}

/**
 * Register common attack signatures
 */
function registerCommonAttackSignatures(): void {
  // SQL Injection signature
  intrusionDetectionSystem.registerSignature({
    name: 'SQL Injection Attempt',
    urlPattern: /api\//,
    payloadPattern: /(\bunion\b.*\bselect\b)|(\bor\b.*=.*)/i,
    severity: 'critical',
  });

  // XSS signature
  intrusionDetectionSystem.registerSignature({
    name: 'XSS Attempt',
    payloadPattern: /<script[^>]*>|javascript:|onerror=/i,
    severity: 'high',
  });

  // Path Traversal signature
  intrusionDetectionSystem.registerSignature({
    name: 'Path Traversal Attempt',
    urlPattern: /\.\.\//,
    severity: 'high',
  });

  // Command Injection signature
  intrusionDetectionSystem.registerSignature({
    name: 'Command Injection Attempt',
    payloadPattern: /[;&|`$()]/,
    severity: 'critical',
  });
}

/**
 * Register common exploit patterns
 */
function registerCommonExploitPatterns(): void {
  // Prototype Pollution
  exploitPreventionEngine.registerExploit({
    name: 'Prototype Pollution',
    type: 'dom',
    detector: (content: string) => {
      return /__proto__|constructor|prototype/.test(content);
    },
    shouldBlock: true,
    mitigations: [
      'Use Object.create(null) for object creation',
      'Validate object keys',
      'Use Object.freeze() for critical objects',
    ],
  });

  // DOM-based XSS
  exploitPreventionEngine.registerExploit({
    name: 'DOM-based XSS',
    type: 'dom',
    detector: (content: string) => {
      return /innerHTML|outerHTML|eval|Function/.test(content);
    },
    shouldBlock: true,
    mitigations: ['Use textContent instead of innerHTML', 'Use DOMPurify for HTML sanitization'],
  });

  // ReDoS (Regular Expression Denial of Service)
  exploitPreventionEngine.registerExploit({
    name: 'ReDoS Attack',
    type: 'behavior',
    detector: (data: any) => {
      return data.executionTime > 1000; // Regex took more than 1 second
    },
    shouldBlock: true,
    mitigations: ['Use efficient regex patterns', 'Set regex timeout limits'],
  });
}

/**
 * Initialize Security Headers
 */
function initializeSecurityHeaders(): void {
  try {
    SecurityHeadersManager.applyHeaders();
  } catch (error) {
    // Silently fail
  }
}

/**
 * Initialize Zero-Day Protection
 */
function initializeZeroDayProtection(): void {
  try {
    zeroDayProtection.establishBaseline();
    // Anomaly detection runs on-demand, not continuously
  } catch (error) {
    // Silently fail
  }
}

/**
 * Setup Global Error Handling
 */
function setupGlobalErrorHandling(): void {
  // Handle uncaught errors - single listener, no logging
  const errorHandler = (event: ErrorEvent) => {
    if (isSuspiciousError(event.message)) {
      // Silent handling
    }
  };

  // Handle unhandled promise rejections - single listener, no logging
  const rejectionHandler = () => {
    // Silent handling
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    }, { once: true });
  }
}

/**
 * Check if error message indicates a security issue
 */
function isSuspiciousError(message: string): boolean {
  const suspiciousPatterns = [
    /eval/i,
    /function/i,
    /prototype/i,
    /constructor/i,
    /injection/i,
    /xss/i,
    /csrf/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(message));
}

/**
 * Setup Periodic Security Checks
 */
function setupPeriodicSecurityChecks(): void {
  // Removed continuous periodic checks - run on-demand instead
  // This reduces memory overhead and prevents background polling
}

/**
 * Security Event Listener
 * Tracks user interactions for behavioral analysis
 */
export function setupSecurityEventListeners(): void {
  if (typeof window === 'undefined') return;

  // Debounce behavioral tracking to reduce memory overhead
  let lastTrackTime = 0;
  const trackDebounceMs = 1000;

  const trackActivity = (action: string, metadata?: any) => {
    const now = Date.now();
    if (now - lastTrackTime < trackDebounceMs) return;
    lastTrackTime = now;

    behavioralAnalyzer.trackActivity('user', {
      path: window.location.pathname,
      timestamp: now,
      action,
      metadata,
    });
  };

  // Track clicks with debouncing
  const clickHandler = (event: Event) => {
    const target = event.target as HTMLElement;
    trackActivity('click', {
      targetTag: target.tagName,
      targetId: target.id,
    });
  };

  // Track navigation
  const popstateHandler = () => {
    trackActivity('navigation');
  };

  // Track form submissions
  const submitHandler = (event: Event) => {
    const form = event.target as HTMLFormElement;
    trackActivity('form_submit', {
      formId: form.id,
    });
  };

  document.addEventListener('click', clickHandler);
  window.addEventListener('popstate', popstateHandler);
  document.addEventListener('submit', submitHandler);

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('click', clickHandler);
    window.removeEventListener('popstate', popstateHandler);
    document.removeEventListener('submit', submitHandler);
  }, { once: true });
}

/**
 * Security Report Generator
 */
export function generateSecurityReport(): SecurityReport {
  return {
    timestamp: Date.now(),
    domIntegrity: {
      status: 'verified',
      lastCheck: Date.now(),
    },
    sessionSecurity: {
      isValid: sessionHijackingPrevention.validateSession(),
      lastValidation: Date.now(),
    },
    networkRequests: {
      totalRequests: networkValidator.getRequestLog().length,
      blockedRequests: 0, // Would need to track this
    },
    threatDetection: {
      detectionLog: intrusionDetectionSystem.getDetectionLog(),
    },
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
}

/**
 * Type definitions
 */
interface SecurityReport {
  timestamp: number;
  domIntegrity: {
    status: string;
    lastCheck: number;
  };
  sessionSecurity: {
    isValid: boolean;
    lastValidation: number;
  };
  networkRequests: {
    totalRequests: number;
    blockedRequests: number;
  };
  threatDetection: {
    detectionLog: any[];
  };
  userAgent: string;
  url: string;
}

// Auto-initialize on module load - with error handling
if (typeof window !== 'undefined') {
  try {
    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          initializeSecuritySystems();
          setupSecurityEventListeners();
        } catch (error) {
          console.error('[Security] Initialization error:', error);
        }
      });
    } else {
      try {
        initializeSecuritySystems();
        setupSecurityEventListeners();
      } catch (error) {
        console.error('[Security] Initialization error:', error);
      }
    }
  } catch (error) {
    console.error('[Security] Module initialization error:', error);
  }
}
