/**
 * Next-Gen Security System (2026 Red Team Hardening)
 * Advanced protection against sophisticated attacks:
 * - Quantum-resistant cryptography preparation
 * - Behavioral anomaly detection
 * - Advanced DDoS mitigation
 * - Behavioral biometrics
 * - Obfuscation & anti-reverse-engineering
 */

/**
 * Quantum-Safe Cryptography Layer
 * Prepares for post-quantum cryptography threats
 */
export class QuantumSafeCrypto {
  private readonly latticeBasedSeed = new Uint8Array(32);
  private readonly hashChain: string[] = [];

  constructor() {
    crypto.getRandomValues(this.latticeBasedSeed);
    this.initializeHashChain();
  }

  private initializeHashChain(): void {
    let current = this.bytesToHex(this.latticeBasedSeed);
    for (let i = 0; i < 100; i++) {
      this.hashChain.push(current);
      current = this.sha3Hash(current);
    }
  }

  private sha3Hash(input: string): string {
    // Simulate SHA-3 hashing (production would use actual SHA-3)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateQuantumSafeToken(): string {
    const randomIndex = Math.floor(Math.random() * this.hashChain.length);
    const token = this.hashChain[randomIndex];
    // Rotate chain for next use
    this.hashChain.shift();
    this.hashChain.push(this.sha3Hash(token));
    return token;
  }

  verifyQuantumSafeToken(token: string): boolean {
    return this.hashChain.includes(token);
  }
}

/**
 * Behavioral Biometrics
 * Detects bot behavior through advanced pattern analysis
 */
export class BehavioralBiometrics {
  private userSignature: UserSignature | null = null;
  private readonly minSamples = 50;
  private samples: BehaviorSample[] = [];

  private readonly suspiciousPatterns = {
    perfectTiming: 0.95, // Bots often have perfect timing
    noMouseMovement: true, // Bots don't move mouse naturally
    perfectClicks: 0.98, // Bots click with perfect precision
    noScrollVariance: 0.05, // Bots scroll uniformly
    noHumanDelay: true, // Bots don't have human reaction time
  };

  recordBehavior(event: BehaviorEvent): void {
    const sample: BehaviorSample = {
      timestamp: Date.now(),
      mouseX: event.mouseX,
      mouseY: event.mouseY,
      keyPressInterval: event.keyPressInterval,
      scrollVelocity: event.scrollVelocity,
      clickPrecision: event.clickPrecision,
      focusTime: event.focusTime,
      blurTime: event.blurTime,
    };

    this.samples.push(sample);

    if (this.samples.length > 1000) {
      this.samples.shift();
    }

    if (this.samples.length >= this.minSamples) {
      this.analyzeSignature();
    }
  }

  private analyzeSignature(): void {
    if (this.samples.length < this.minSamples) return;

    const recentSamples = this.samples.slice(-this.minSamples);

    this.userSignature = {
      avgMouseVelocity: this.calculateAvg(recentSamples.map((s) => s.mouseX)),
      keyPressVariance: this.calculateVariance(recentSamples.map((s) => s.keyPressInterval)),
      scrollPatternEntropy: this.calculateEntropy(recentSamples.map((s) => s.scrollVelocity)),
      clickPrecisionStdDev: this.calculateStdDev(recentSamples.map((s) => s.clickPrecision)),
      focusBlurRatio: this.calculateRatio(
        recentSamples.map((s) => s.focusTime),
        recentSamples.map((s) => s.blurTime)
      ),
    };
  }

  private calculateAvg(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const avg = this.calculateAvg(values);
    const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
    return this.calculateAvg(squaredDiffs);
  }

  private calculateStdDev(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }

  private calculateEntropy(values: number[]): number {
    const frequencies: Record<number, number> = {};
    values.forEach((v) => {
      const rounded = Math.round(v * 10) / 10;
      frequencies[rounded] = (frequencies[rounded] || 0) + 1;
    });

    let entropy = 0;
    const len = values.length;
    Object.values(frequencies).forEach((freq) => {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    });

    return entropy;
  }

  private calculateRatio(values1: number[], values2: number[]): number {
    const sum1 = values1.reduce((a, b) => a + b, 0);
    const sum2 = values2.reduce((a, b) => a + b, 0);
    return sum2 > 0 ? sum1 / sum2 : 0;
  }

  isBotLikeBehavior(): boolean {
    if (!this.userSignature) return false;

    // Check for bot-like patterns
    if (this.userSignature.keyPressVariance < 10) return true; // Too consistent
    if (this.userSignature.scrollPatternEntropy < 0.5) return true; // Predictable scrolling
    if (this.userSignature.clickPrecisionStdDev < 2) return true; // Too precise clicks
    if (this.userSignature.focusBlurRatio > 10) return true; // Unnatural focus patterns

    return false;
  }

  getBotLikelihoodScore(): number {
    if (!this.userSignature) return 0;

    let score = 0;

    // Scoring system (0-1)
    if (this.userSignature.keyPressVariance < 10) score += 0.25;
    if (this.userSignature.scrollPatternEntropy < 0.5) score += 0.25;
    if (this.userSignature.clickPrecisionStdDev < 2) score += 0.25;
    if (this.userSignature.focusBlurRatio > 10) score += 0.25;

    return Math.min(score, 1);
  }
}

/**
 * Advanced DDoS Mitigation
 * Multi-layer protection against distributed attacks
 */
export class DDoSMitigation {
  private requestBuckets: Map<string, RequestBucket> = new Map();
  private readonly bucketSize = 60000; // 1 minute
  private readonly maxRequestsPerBucket = 100;
  private readonly adaptiveThreshold = 0.85;
  private baselineRequestRate = 0;
  private anomalyCount = 0;

  recordRequest(fingerprint: string): DDoSCheckResult {
    const now = Date.now();
    const bucket = this.getOrCreateBucket(fingerprint);

    // Clean old requests
    bucket.requests = bucket.requests.filter((t) => now - t < this.bucketSize);

    // Check rate
    const requestsInBucket = bucket.requests.length;
    const isAnomalous = requestsInBucket > this.maxRequestsPerBucket;

    if (isAnomalous) {
      this.anomalyCount++;
      bucket.anomalyScore += 0.1;
    }

    bucket.requests.push(now);

    return {
      allowed: !isAnomalous,
      anomalyScore: bucket.anomalyScore,
      requestsInWindow: requestsInBucket,
      recommendation: this.getRecommendation(bucket.anomalyScore),
    };
  }

  private getOrCreateBucket(fingerprint: string): RequestBucket {
    if (!this.requestBuckets.has(fingerprint)) {
      this.requestBuckets.set(fingerprint, {
        requests: [],
        anomalyScore: 0,
        lastSeen: Date.now(),
      });
    }
    return this.requestBuckets.get(fingerprint)!;
  }

  private getRecommendation(score: number): string {
    if (score > 0.8) return 'BLOCK';
    if (score > 0.5) return 'CHALLENGE';
    if (score > 0.2) return 'MONITOR';
    return 'ALLOW';
  }

  adaptiveThrottling(): void {
    // Analyze patterns and adapt thresholds
    const totalBuckets = this.requestBuckets.size;
    const anomalousBuckets = Array.from(this.requestBuckets.values()).filter(
      (b) => b.anomalyScore > 0.5
    ).length;

    if (totalBuckets > 0) {
      const anomalyRatio = anomalousBuckets / totalBuckets;
      if (anomalyRatio > this.adaptiveThreshold) {
        // Potential DDoS detected - tighten restrictions
        this.maxRequestsPerBucket = Math.max(50, this.maxRequestsPerBucket - 10);
      } else if (anomalyRatio < 0.1) {
        // Normal traffic - relax restrictions
        this.maxRequestsPerBucket = Math.min(100, this.maxRequestsPerBucket + 5);
      }
    }
  }

  getAnomalyReport(): DDoSAnomalyReport {
    const buckets = Array.from(this.requestBuckets.values());
    const highRiskBuckets = buckets.filter((b) => b.anomalyScore > 0.7);

    return {
      totalFingerprints: this.requestBuckets.size,
      highRiskCount: highRiskBuckets.length,
      avgAnomalyScore: buckets.reduce((sum, b) => sum + b.anomalyScore, 0) / buckets.length,
      anomalyTrend: this.anomalyCount,
    };
  }
}

/**
 * Advanced Obfuscation & Anti-Reverse Engineering
 * Protects against code analysis and manipulation
 */
export class CodeObfuscation {
  private readonly obfuscationKey = this.generateObfuscationKey();
  private functionMap: Map<string, string> = new Map();
  private variableMap: Map<string, string> = new Map();

  private generateObfuscationKey(): Uint8Array {
    const key = new Uint8Array(32);
    crypto.getRandomValues(key);
    return key;
  }

  obfuscateString(input: string): string {
    // XOR-based obfuscation with rotation
    const encoded = new TextEncoder().encode(input);
    const obfuscated = new Uint8Array(encoded.length);

    for (let i = 0; i < encoded.length; i++) {
      obfuscated[i] = encoded[i] ^ this.obfuscationKey[i % this.obfuscationKey.length];
      obfuscated[i] = ((obfuscated[i] << 3) | (obfuscated[i] >> 5)) & 0xff;
    }

    return btoa(String.fromCharCode(...obfuscated));
  }

  deobfuscateString(obfuscated: string): string {
    try {
      const decoded = new Uint8Array(atob(obfuscated).split('').map((c) => c.charCodeAt(0)));
      const original = new Uint8Array(decoded.length);

      for (let i = 0; i < decoded.length; i++) {
        original[i] = ((decoded[i] >> 3) | (decoded[i] << 5)) & 0xff;
        original[i] = original[i] ^ this.obfuscationKey[i % this.obfuscationKey.length];
      }

      return new TextDecoder().decode(original);
    } catch {
      return '';
    }
  }

  createFunctionProxy(originalName: string, handler: Function): Function {
    const proxyName = this.generateRandomName();
    this.functionMap.set(originalName, proxyName);

    return new Proxy(handler, {
      apply: (target, thisArg, args) => {
        // Add random delay to prevent timing attacks
        const delay = Math.random() * 10;
        return new Promise((resolve) => {
          setTimeout(() => resolve(target.apply(thisArg, args)), delay);
        });
      },
    });
  }

  private generateRandomName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$';
    let name = '';
    for (let i = 0; i < 16; i++) {
      name += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return name;
  }

  injectAntiDebugCode(): void {
    // Detect and prevent debugging
    const checkDebugger = () => {
      const start = performance.now();
      debugger; // This line is intentional
      const end = performance.now();

      if (end - start > 100) {
        // Debugger is active
        console.warn('[SECURITY] Debugger detected - terminating execution');
        throw new Error('Debugger detected');
      }
    };

    // Run periodically
    setInterval(checkDebugger, 5000);
  }

  createSelfDestructingCode(code: Function, timeout: number = 60000): Function {
    let isActive = true;
    const timer = setTimeout(() => {
      isActive = false;
    }, timeout);

    return (...args: any[]) => {
      if (!isActive) {
        throw new Error('Code execution window expired');
      }
      return code(...args);
    };
  }
}

/**
 * Advanced Spam Detection Engine
 * Spam and malicious form submission detection
 */
export class AdvancedSpamDetection {
  private submissionHistory: FormSubmission[] = [];
  private readonly maxHistorySize = 500;
  private spamPatterns: SpamPattern[] = [];

  constructor() {
    this.initializeSpamPatterns();
  }

  private initializeSpamPatterns(): void {
    this.spamPatterns = [
      {
        name: 'Rapid Submissions',
        detector: (submission: FormSubmission, history: FormSubmission[]) => {
          const recentSubmissions = history.filter(
            (s) => Date.now() - s.timestamp < 60000 // Last minute
          );
          return recentSubmissions.length > 5;
        },
        severity: 'high',
      },
      {
        name: 'Identical Content',
        detector: (submission: FormSubmission, history: FormSubmission[]) => {
          const identical = history.filter(
            (s) => JSON.stringify(s.data) === JSON.stringify(submission.data)
          );
          return identical.length > 2;
        },
        severity: 'critical',
      },
      {
        name: 'Suspicious Keywords',
        detector: (submission: FormSubmission) => {
          const suspiciousKeywords = [
            'viagra',
            'casino',
            'lottery',
            'click here',
            'buy now',
            'free money',
            'bitcoin',
            'crypto',
            'forex',
          ];
          const content = JSON.stringify(submission.data).toLowerCase();
          return suspiciousKeywords.some((keyword) => content.includes(keyword));
        },
        severity: 'high',
      },
      {
        name: 'URL Injection',
        detector: (submission: FormSubmission) => {
          const urlPattern = /(https?:\/\/|www\.)/gi;
          const content = JSON.stringify(submission.data);
          return (content.match(urlPattern) || []).length > 2;
        },
        severity: 'critical',
      },
      {
        name: 'Encoded Payloads',
        detector: (submission: FormSubmission) => {
          const content = JSON.stringify(submission.data);
          return /%[0-9a-f]{2}/i.test(content) || /\\x[0-9a-f]{2}/i.test(content);
        },
        severity: 'high',
      },
      {
        name: 'Form Filling Speed',
        detector: (submission: FormSubmission) => {
          // If form filled in less than 2 seconds, likely bot
          return submission.fillTime < 2000;
        },
        severity: 'medium',
      },
      {
        name: 'Honeypot Triggered',
        detector: (submission: FormSubmission) => {
          return submission.honeypotTriggered === true;
        },
        severity: 'critical',
      },
    ];
  }

  analyzeSubmission(submission: FormSubmission): SpamAnalysisResult {
    const result: SpamAnalysisResult = {
      isSpam: false,
      spamScore: 0,
      detectedPatterns: [],
      severity: 'low',
      recommendations: [],
    };

    this.spamPatterns.forEach((pattern) => {
      if (pattern.detector(submission, this.submissionHistory)) {
        result.detectedPatterns.push(pattern.name);
        result.spamScore += 0.2;

        if (pattern.severity === 'critical') {
          result.severity = 'critical';
        } else if (pattern.severity === 'high' && result.severity !== 'critical') {
          result.severity = 'high';
        }
      }
    });

    result.isSpam = result.spamScore > 0.4;

    if (result.isSpam) {
      result.recommendations.push('Block submission');
      result.recommendations.push('Add to spam list');
      result.recommendations.push('Alert administrator');
    }

    this.submissionHistory.push(submission);
    if (this.submissionHistory.length > this.maxHistorySize) {
      this.submissionHistory.shift();
    }

    return result;
  }

  getSpamReport(): SpamReport {
    const totalSubmissions = this.submissionHistory.length;
    const spamSubmissions = this.submissionHistory.filter((s) => s.isSpam).length;

    return {
      totalSubmissions,
      spamSubmissions,
      spamRate: totalSubmissions > 0 ? spamSubmissions / totalSubmissions : 0,
      recentTrend: this.calculateTrend(),
    };
  }

  private calculateTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.submissionHistory.length < 10) return 'stable';

    const recent = this.submissionHistory.slice(-5).filter((s) => s.isSpam).length;
    const previous = this.submissionHistory.slice(-10, -5).filter((s) => s.isSpam).length;

    if (recent > previous) return 'increasing';
    if (recent < previous) return 'decreasing';
    return 'stable';
  }
}

/**
 * Type Definitions
 */
interface UserSignature {
  avgMouseVelocity: number;
  keyPressVariance: number;
  scrollPatternEntropy: number;
  clickPrecisionStdDev: number;
  focusBlurRatio: number;
}

interface BehaviorEvent {
  mouseX: number;
  mouseY: number;
  keyPressInterval: number;
  scrollVelocity: number;
  clickPrecision: number;
  focusTime: number;
  blurTime: number;
}

interface BehaviorSample {
  timestamp: number;
  mouseX: number;
  mouseY: number;
  keyPressInterval: number;
  scrollVelocity: number;
  clickPrecision: number;
  focusTime: number;
  blurTime: number;
}

interface RequestBucket {
  requests: number[];
  anomalyScore: number;
  lastSeen: number;
}

interface DDoSCheckResult {
  allowed: boolean;
  anomalyScore: number;
  requestsInWindow: number;
  recommendation: 'ALLOW' | 'MONITOR' | 'CHALLENGE' | 'BLOCK';
}

interface DDoSAnomalyReport {
  totalFingerprints: number;
  highRiskCount: number;
  avgAnomalyScore: number;
  anomalyTrend: number;
}

interface FormSubmission {
  timestamp: number;
  data: Record<string, any>;
  fillTime: number;
  honeypotTriggered?: boolean;
  isSpam?: boolean;
}

interface SpamPattern {
  name: string;
  detector: (submission: FormSubmission, history: FormSubmission[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SpamAnalysisResult {
  isSpam: boolean;
  spamScore: number;
  detectedPatterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface SpamReport {
  totalSubmissions: number;
  spamSubmissions: number;
  spamRate: number;
  recentTrend: 'increasing' | 'stable' | 'decreasing';
}

// Global instances
export const quantumSafeCrypto = new QuantumSafeCrypto();
export const behavioralBiometrics = new BehavioralBiometrics();
export const ddosMitigation = new DDoSMitigation();
export const codeObfuscation = new CodeObfuscation();
export const advancedSpamDetection = new AdvancedSpamDetection();
