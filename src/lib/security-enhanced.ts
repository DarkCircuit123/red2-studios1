/**
 * Enhanced security utilities for production applications
 * Implements: XSS prevention, CSRF protection, CSP, rate limiting
 */

/**
 * Content Security Policy (CSP) helper
 */
export class CSPManager {
  private directives: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultPolicy();
  }

  private initializeDefaultPolicy(): void {
    // Default secure policy
    this.directives.set('default-src', ["'self'"]);
    this.directives.set('script-src', ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net']);
    this.directives.set('style-src', ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']);
    this.directives.set('img-src', ["'self'", 'data:', 'https:']);
    this.directives.set('font-src', ["'self'", 'https://fonts.gstatic.com']);
    this.directives.set('connect-src', ["'self'", 'https:']);
    this.directives.set('frame-ancestors', ["'none'"]);
    this.directives.set('base-uri', ["'self'"]);
    this.directives.set('form-action', ["'self'"]);
  }

  addDirective(directive: string, sources: string[]): void {
    this.directives.set(directive, sources);
  }

  getPolicy(): string {
    const policy: string[] = [];
    this.directives.forEach((sources, directive) => {
      policy.push(`${directive} ${sources.join(' ')}`);
    });
    return policy.join('; ');
  }

  applyToMeta(): void {
    if (typeof document === 'undefined') return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.getPolicy();
    document.head.appendChild(meta);
  }
}

/**
 * XSS Prevention utilities
 */
export class XSSPrevention {
  /**
   * Sanitize HTML string
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Validate URL to prevent javascript: protocol
   */
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string, maxLength = 1000): string {
    return input
      .substring(0, maxLength)
      .replace(/[<>]/g, '')
      .trim();
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private token: string | null = null;
  private readonly tokenKey = 'csrf-token';

  constructor() {
    this.initializeToken();
  }

  private initializeToken(): void {
    // Get token from meta tag or generate new one
    const metaTag = document.querySelector(`meta[name="${this.tokenKey}"]`);
    if (metaTag) {
      this.token = metaTag.getAttribute('content');
    } else {
      this.token = this.generateToken();
      this.storeToken();
    }
  }

  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private storeToken(): void {
    if (typeof document === 'undefined') return;

    const meta = document.createElement('meta');
    meta.name = this.tokenKey;
    meta.content = this.token || '';
    document.head.appendChild(meta);
  }

  getToken(): string {
    return this.token || '';
  }

  validateToken(token: string): boolean {
    return token === this.token;
  }

  addToHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken(),
    };
  }
}

/**
 * Rate Limiting
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 10, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  resetAll(): void {
    this.attempts.clear();
  }
}

/**
 * Secure Storage
 */
export class SecureStorage {
  private readonly prefix = 'secure_';
  private encryptionKey: CryptoKey | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.crypto) return;

    // Generate or retrieve encryption key
    const keyData = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    this.encryptionKey = keyData;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.encryptionKey) {
      localStorage.setItem(this.prefix + key, value);
      return;
    }

    try {
      const encoded = new TextEncoder().encode(value);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encoded
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      const encoded64 = btoa(String.fromCharCode(...combined));
      localStorage.setItem(this.prefix + key, encoded64);
    } catch (error) {
      console.error('Encryption failed:', error);
      localStorage.setItem(this.prefix + key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    const stored = localStorage.getItem(this.prefix + key);
    if (!stored) return null;

    if (!this.encryptionKey) {
      return stored;
    }

    try {
      const combined = new Uint8Array(atob(stored).split('').map((c) => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return stored;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Input Validation
 */
export class InputValidator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static isValidCreditCard(cc: string): boolean {
    const sanitized = cc.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static sanitizeJSON(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed);
    } catch {
      return '';
    }
  }
}

/**
 * Security Headers Manager
 */
export class SecurityHeadersManager {
  static applyHeaders(): void {
    if (typeof document === 'undefined') return;

    // X-Content-Type-Options
    const xContentType = document.createElement('meta');
    xContentType.httpEquiv = 'X-UA-Compatible';
    xContentType.content = 'ie=edge';
    document.head.appendChild(xContentType);

    // Referrer-Policy
    const referrer = document.createElement('meta');
    referrer.name = 'referrer';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);

    // Permissions-Policy
    const permissions = document.createElement('meta');
    permissions.httpEquiv = 'Permissions-Policy';
    permissions.content = 'geolocation=(), microphone=(), camera=()';
    document.head.appendChild(permissions);
  }
}

// Global instances
export const cspManager = new CSPManager();
export const csrfProtection = new CSRFProtection();
export const rateLimiter = new RateLimiter();
export const secureStorage = new SecureStorage();
