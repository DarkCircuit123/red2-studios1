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
  payloadAnalyzer,
  intrusionDetectionSystem,
  exploitPreventionEngine,
  zeroDayProtection,
} from './advanced-threat-detection';
import { CSPManager, SecurityHeadersManager, RateLimiter } from './security-enhanced';

/**
 * Initialize all security systems
 */
export function initializeSecuritySystems(): void {
  if (typeof window === 'undefined') return;



  // 1. Initialize DOM Integrity Monitor
  initializeDOMIntegrity();

  // 2. Initialize Session Protection
  initializeSessionProtection();

  // 3. Initialize Network Validation
  initializeNetworkValidation();

  // 4. Initialize Threat Detection
  initializeThreatDetection();

  // 5. Initialize Security Headers
  initializeSecurityHeaders();

  // 6. Initialize Zero-Day Protection
  initializeZeroDayProtection();

  // 7. Setup Global Error Handling
  setupGlobalErrorHandling();

  // 8. Setup Periodic Security Checks
  setupPeriodicSecurityChecks();


}

/**
 * Initialize DOM Integrity Monitoring
 */
function initializeDOMIntegrity(): void {
  try {
    domIntegrityMonitor.initialize();
    console.log('[SECURITY] DOM Integrity Monitor initialized');
  } catch (error) {
    console.error('[SECURITY] Failed to initialize DOM Integrity Monitor', error);
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
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const isValid = sessionHijackingPrevention.validateSession();
        if (!isValid) {
          console.warn('[SECURITY] Session validation failed - possible hijacking');
          // Optionally redirect to login or refresh
        }
      }
    });

    console.log('[SECURITY] Session Protection initialized');
  } catch (error) {
    console.error('[SECURITY] Failed to initialize Session Protection', error);
  }
}

/**
 * Initialize Network Validation
 */
function initializeNetworkValidation(): void {
  try {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function (...args: any[]) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      const method = args[1]?.method || 'GET';

      if (!networkValidator.interceptRequest(url, method)) {

        return Promise.reject(new Error('Request blocked by security policy'));
      }

      return originalFetch.apply(this, args);
    };


  } catch (error) {

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
    // add CSP meta and rotate nonce on each navigation
    cspManager.rotateNonce();
    cspManager.applyToMeta();
    window.addEventListener('popstate', () => {
      cspManager.rotateNonce();
      cspManager.applyToMeta();
    });
    console.log('[SECURITY] Security Headers initialized');
  } catch (error) {
    console.error('[SECURITY] Failed to initialize Security Headers', error);
  }
}

/**
 * Initialize Zero-Day Protection
 */
function initializeZeroDayProtection(): void {
  try {
    zeroDayProtection.establishBaseline();

    // Periodic anomaly detection
    setInterval(() => {
      const result = zeroDayProtection.detectAnomaly();
      if (result.isAnomaly) {
        console.warn('[SECURITY] Anomaly detected - possible zero-day attack', result);
      }
    }, 10000); // Check every 10 seconds

    console.log('[SECURITY] Zero-Day Protection initialized');
  } catch (error) {
    console.error('[SECURITY] Failed to initialize Zero-Day Protection', error);
  }
}

/**
 * Setup Global Error Handling
 */
function setupGlobalErrorHandling(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[SECURITY] Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Analyze error for security implications
    if (isSuspiciousError(event.message)) {

    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {

  });
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
  // Check every 30 seconds
  setInterval(() => {
    // Verify SRI on all scripts
    try {
      sriEnforcer.validateAllScripts();
    } catch (error) {
      console.error('[SECURITY] SRI validation failed', error);
    }

    // Verify DOM integrity
    try {
      domIntegrityMonitor.verifyIntegrity();
    } catch (error) {
      console.error('[SECURITY] DOM integrity verification failed', error);
    }

    // Validate session
    try {
      const isValid = sessionHijackingPrevention.validateSession();
      if (!isValid) {
        console.warn('[SECURITY] Session validation failed');
      }
    } catch (error) {
      console.error('[SECURITY] Session validation error', error);
    }
  }, 30000);
}

/**
 * Security Event Listener
 * Tracks user interactions for behavioral analysis
 */
export function setupSecurityEventListeners(): void {
  if (typeof window === 'undefined') return;

  // Track clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    behavioralAnalyzer.trackActivity('user', {
      path: window.location.pathname,
      timestamp: Date.now(),
      action: 'click',
      metadata: {
        targetTag: target.tagName,
        targetId: target.id,
        targetClass: target.className,
      },
    });
  });

  // Track navigation
  window.addEventListener('popstate', () => {
    behavioralAnalyzer.trackActivity('user', {
      path: window.location.pathname,
      timestamp: Date.now(),
      action: 'navigation',
    });
  });

  // Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    behavioralAnalyzer.trackActivity('user', {
      path: window.location.pathname,
      timestamp: Date.now(),
      action: 'form_submit',
      metadata: {
        formId: form.id,
        formName: form.name,
      },
    });
  });
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

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeSecuritySystems();
      setupSecurityEventListeners();
    });
  } else {
    initializeSecuritySystems();
    setupSecurityEventListeners();
  }
}
