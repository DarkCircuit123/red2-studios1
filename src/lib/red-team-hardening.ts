/**
 * Red Team Hardening - Advanced Security Layer
 * Implements: Behavioral analysis, anomaly detection, advanced threat prevention
 * Designed to defeat sophisticated red team attacks
 */

/**
 * Behavioral Anomaly Detection
 * Tracks user behavior patterns and flags suspicious activity
 */
export class BehavioralAnalyzer {
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private readonly suspiciousThreshold = 0.7;

  private getOrCreateProfile(userId: string): UserBehaviorProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        clickPatterns: [],
        navigationPatterns: [],
        timingPatterns: [],
        deviceFingerprints: [],
        geoLocations: [],
        suspicionScore: 0,
        lastActivity: Date.now(),
        activities: [],
      });
    }
    return this.userProfiles.get(userId)!;
  }

  trackActivity(userId: string, activity: UserActivity): void {
    const profile = this.getOrCreateProfile(userId);
    profile.activities.push(activity);
    profile.lastActivity = Date.now();

    // Keep only last 100 activities
    if (profile.activities.length > 100) {
      profile.activities.shift();
    }

    // Analyze for anomalies
    this.analyzeAnomalies(userId, profile);
  }

  private analyzeAnomalies(userId: string, profile: UserBehaviorProfile): void {
    let suspicionScore = 0;

    // Check for rapid-fire requests (bot behavior)
    if (profile.activities.length >= 2) {
      const lastTwo = profile.activities.slice(-2);
      const timeDiff = lastTwo[1].timestamp - lastTwo[0].timestamp;
      if (timeDiff < 100) {
        suspicionScore += 0.3; // Likely automated
      }
    }

    // Check for unusual navigation patterns
    if (profile.activities.length >= 5) {
      const recentActivities = profile.activities.slice(-5);
      const uniquePaths = new Set(recentActivities.map((a) => a.path));
      if (uniquePaths.size === 5) {
        suspicionScore += 0.2; // Scanning behavior
      }
    }

    // Check for suspicious user agents
    const userAgent = navigator.userAgent;
    if (this.isSuspiciousUserAgent(userAgent)) {
      suspicionScore += 0.25;
    }

    // Check for headless browser indicators
    if (this.isHeadlessBrowser()) {
      suspicionScore += 0.4;
    }

    // Check for automation tools
    if (this.hasAutomationTools()) {
      suspicionScore += 0.35;
    }

    profile.suspicionScore = Math.min(suspicionScore, 1);

    if (profile.suspicionScore > this.suspiciousThreshold) {
      this.triggerSecurityAlert(userId, profile);
    }
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java(?!script)/i,
      /headless/i,
    ];
    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  private isHeadlessBrowser(): boolean {
    return (
      !window.chrome ||
      navigator.webdriver ||
      navigator.plugins.length === 0 ||
      (navigator as any).phantomjs !== undefined
    );
  }

  private hasAutomationTools(): boolean {
    return (
      (window as any).__nightmare !== undefined ||
      (window as any).__protractor !== undefined ||
      (window as any).callPhantom !== undefined ||
      (window as any)._phantom !== undefined
    );
  }

  private triggerSecurityAlert(userId: string, profile: UserBehaviorProfile): void {
    console.warn(`[SECURITY] Suspicious activity detected for user: ${userId}`, {
      suspicionScore: profile.suspicionScore,
      recentActivities: profile.activities.slice(-5),
    });

    // Send alert to monitoring service
    this.reportToSecurityMonitoring(userId, profile);
  }

  private reportToSecurityMonitoring(userId: string, profile: UserBehaviorProfile): void {
    // This would be sent to a backend security monitoring service
    const alert = {
      userId,
      timestamp: Date.now(),
      suspicionScore: profile.suspicionScore,
      activities: profile.activities.slice(-10),
      userAgent: navigator.userAgent,
    };

    // Log for analysis
    console.error('[SECURITY ALERT]', alert);
  }

  getSuspicionScore(userId: string): number {
    return this.getOrCreateProfile(userId).suspicionScore;
  }

  isSuspicious(userId: string): boolean {
    return this.getSuspicionScore(userId) > this.suspiciousThreshold;
  }
}

/**
 * DOM Integrity Monitor
 * Detects unauthorized DOM modifications
 */
export class DOMIntegrityMonitor {
  private originalDOM: Map<string, string> = new Map();
  private mutationObserver: MutationObserver | null = null;
  private criticalElements: Set<Element> = new Set();

  initialize(): void {
    if (typeof document === 'undefined') return;

    // Store original state of critical elements
    this.storeCriticalElements();

    // Set up mutation observer only
    this.setupMutationObserver();
  }

  private storeCriticalElements(): void {
    const selectors = [
      'script[src]',
      'link[rel="stylesheet"]',
      'meta[http-equiv]',
      '[data-security-critical]',
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        const key = `${element.tagName}:${element.getAttribute('src') || element.getAttribute('href') || element.id}`;
        this.originalDOM.set(key, element.outerHTML);
        this.criticalElements.add(element);
      });
    });
  }

  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.isCriticalElement(element)) {
                console.warn('[SECURITY] Unauthorized DOM modification detected', element);
                this.reportDOMTampering(element);
              }
            }
          });
        }

        if (mutation.type === 'attributes') {
          const element = mutation.target as Element;
          if (this.criticalElements.has(element)) {
            console.warn('[SECURITY] Critical element attribute modified', element);
            this.reportDOMTampering(element);
          }
        }
      });
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'integrity', 'crossorigin'],
    });
  }

  private isCriticalElement(element: Element): boolean {
    return (
      element.tagName === 'SCRIPT' ||
      element.tagName === 'LINK' ||
      element.tagName === 'META' ||
      element.hasAttribute('data-security-critical')
    );
  }

  private reportDOMTampering(element: Element): void {
    const report = {
      timestamp: Date.now(),
      element: element.tagName,
      attributes: Array.from(element.attributes).map((attr) => ({
        name: attr.name,
        value: attr.value,
      })),
      userAgent: navigator.userAgent,
    };

    console.error('[DOM TAMPERING ALERT]', report);
  }

  verifyIntegrity(): void {
    this.criticalElements.forEach((element) => {
      const key = `${element.tagName}:${element.getAttribute('src') || element.getAttribute('href') || element.id}`;
      const original = this.originalDOM.get(key);

      if (original && element.outerHTML !== original) {
        console.warn('[SECURITY] DOM integrity violation detected', { key, element });
        this.reportDOMTampering(element);
      }
    });
  }

  destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

/**
 * Network Request Validator
 * Validates all network requests for suspicious patterns
 */
export class NetworkValidator {
  private requestLog: NetworkRequest[] = [];
  private readonly maxRequestsPerSecond = 50;
  private readonly suspiciousPatterns = [
    /admin/i,
    /api\/internal/i,
    /\.env/i,
    /config\.js/i,
    /backup/i,
    /\.git/i,
    /\.sql/i,
  ];

  interceptRequest(url: string, method: string = 'GET'): boolean {
    const now = Date.now();

    // Log request
    this.requestLog.push({ url, method, timestamp: now });

    // Clean old requests (older than 1 second)
    this.requestLog = this.requestLog.filter((req) => now - req.timestamp < 1000);

    // Check rate limiting
    if (this.requestLog.length > this.maxRequestsPerSecond) {
      console.warn('[SECURITY] Rate limit exceeded', {
        requestsPerSecond: this.requestLog.length,
      });
      return false;
    }

    // Check for suspicious patterns
    if (this.isSuspiciousUrl(url)) {
      console.warn('[SECURITY] Suspicious URL pattern detected', { url });
      return false;
    }

    // Check for path traversal attempts
    if (this.hasPathTraversal(url)) {
      console.warn('[SECURITY] Path traversal attempt detected', { url });
      return false;
    }

    return true;
  }

  private isSuspiciousUrl(url: string): boolean {
    return this.suspiciousPatterns.some((pattern) => pattern.test(url));
  }

  private hasPathTraversal(url: string): boolean {
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.%2f/i,
      /%2e%2e/i,
      /\.\.%5c/i,
      /\.\.\\/, // Windows path traversal
    ];
    return pathTraversalPatterns.some((pattern) => pattern.test(url));
  }

  getRequestLog(): NetworkRequest[] {
    return [...this.requestLog];
  }
}

/**
 * Cryptographic Integrity Verification
 * Verifies integrity of critical resources using hashing
 */
export class CryptoIntegrityVerifier {
  private resourceHashes: Map<string, string> = new Map();

  async registerResource(url: string, expectedHash: string): Promise<void> {
    this.resourceHashes.set(url, expectedHash);
  }

  async verifyResource(url: string, content: string): Promise<boolean> {
    const expectedHash = this.resourceHashes.get(url);
    if (!expectedHash) return true; // No hash registered

    const actualHash = await this.computeHash(content);
    const isValid = actualHash === expectedHash;

    if (!isValid) {
      console.warn('[SECURITY] Resource integrity check failed', { url, expectedHash, actualHash });
    }

    return isValid;
  }

  private async computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Session Hijacking Prevention
 * Detects and prevents session hijacking attempts
 */
export class SessionHijackingPrevention {
  private sessionFingerprint: string | null = null;
  private readonly fingerprintKey = '__session_fp';

  generateFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth,
    ];

    const fingerprint = components.join('|');
    this.sessionFingerprint = this.hashFingerprint(fingerprint);
    this.storeFingerprint();
    return this.sessionFingerprint;
  }

  validateSession(): boolean {
    const storedFingerprint = this.getStoredFingerprint();
    const currentFingerprint = this.generateFingerprint();

    if (!storedFingerprint) {
      return true; // First time
    }

    const isValid = storedFingerprint === currentFingerprint;

    if (!isValid) {
      console.warn('[SECURITY] Session fingerprint mismatch - possible hijacking attempt');
      this.reportSessionAnomaly();
    }

    return isValid;
  }

  private hashFingerprint(fingerprint: string): string {
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private storeFingerprint(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.fingerprintKey, this.sessionFingerprint || '');
    }
  }

  private getStoredFingerprint(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(this.fingerprintKey);
    }
    return null;
  }

  private reportSessionAnomaly(): void {
    const report = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    console.error('[SESSION HIJACKING ALERT]', report);
  }
}

/**
 * Subresource Integrity (SRI) Enforcer
 * Ensures external resources haven't been tampered with
 */
export class SRIEnforcer {
  private sriHashes: Map<string, string> = new Map();

  registerSRI(url: string, hash: string): void {
    this.sriHashes.set(url, hash);
  }

  validateScriptTag(script: HTMLScriptElement): boolean {
    const src = script.src;
    const integrity = script.integrity;

    if (!src || !integrity) return true;

    const expectedHash = this.sriHashes.get(src);
    if (!expectedHash) return true;

    const isValid = integrity.includes(expectedHash);

    if (!isValid) {
      console.warn('[SECURITY] SRI validation failed', { src, integrity });
      script.remove();
    }

    return isValid;
  }

  validateAllScripts(): void {
    document.querySelectorAll('script[src]').forEach((script) => {
      this.validateScriptTag(script as HTMLScriptElement);
    });
  }
}

/**
 * Timing Attack Prevention
 * Prevents timing-based attacks on sensitive operations
 */
export class TimingAttackPrevention {
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  static addRandomDelay(minMs: number = 10, maxMs: number = 50): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Type definitions
 */
interface UserBehaviorProfile {
  clickPatterns: ClickPattern[];
  navigationPatterns: NavigationPattern[];
  timingPatterns: TimingPattern[];
  deviceFingerprints: string[];
  geoLocations: GeoLocation[];
  suspicionScore: number;
  lastActivity: number;
  activities: UserActivity[];
}

interface UserActivity {
  path: string;
  timestamp: number;
  action: string;
  metadata?: Record<string, any>;
}

interface ClickPattern {
  x: number;
  y: number;
  timestamp: number;
}

interface NavigationPattern {
  from: string;
  to: string;
  timestamp: number;
}

interface TimingPattern {
  action: string;
  duration: number;
  timestamp: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface NetworkRequest {
  url: string;
  method: string;
  timestamp: number;
}

// Global instances
export const behavioralAnalyzer = new BehavioralAnalyzer();
export const domIntegrityMonitor = new DOMIntegrityMonitor();
export const networkValidator = new NetworkValidator();
export const cryptoIntegrityVerifier = new CryptoIntegrityVerifier();
export const sessionHijackingPrevention = new SessionHijackingPrevention();
export const sriEnforcer = new SRIEnforcer();
