/**
 * Master Hacker Defense System (2026 Edition)
 * Advanced multi-layer protection against sophisticated attacks
 * Thinking like a red team / master hacker to prevent attacks
 */

/**
 * CLEARTYPE / UNCODE Detection & Prevention
 * Detects obfuscated payloads and cleartype attacks
 */
export class CleartypeUncodePrevention {
  private readonly unicodeBypassPatterns = [
    /\\u[0-9a-f]{4}/gi,
    /\\x[0-9a-f]{2}/gi,
    /&#x[0-9a-f]+;/gi,
    /&#[0-9]+;/gi,
    /\\[0-7]{1,3}/g,
  ];

  private readonly obfuscationIndicators = [
    { pattern: /eval\s*\(/i, name: 'eval() usage' },
    { pattern: /Function\s*\(/i, name: 'Function constructor' },
    { pattern: /setTimeout\s*\(\s*["\'].*["\']/i, name: 'setTimeout string execution' },
    { pattern: /setInterval\s*\(\s*["\'].*["\']/i, name: 'setInterval string execution' },
    { pattern: /document\.write\s*\(/i, name: 'document.write' },
    { pattern: /innerHTML\s*=/i, name: 'innerHTML assignment' },
    { pattern: /outerHTML\s*=/i, name: 'outerHTML assignment' },
    { pattern: /insertAdjacentHTML/i, name: 'insertAdjacentHTML' },
  ];

  detectCleartypeAttack(input: string): CleartypeDetectionResult {
    const result: CleartypeDetectionResult = {
      isCleartype: false,
      detectedPatterns: [],
      riskScore: 0,
      decodedPayloads: [],
    };

    // Check for unicode/hex encoding
    this.unicodeBypassPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        result.detectedPatterns.push('Unicode/Hex encoding detected');
        result.riskScore += 0.2;
        
        // Try to decode and analyze
        const decoded = this.attemptDecode(input);
        if (decoded !== input) {
          result.decodedPayloads.push(decoded);
          result.riskScore += 0.3;
        }
      }
    });

    // Check for obfuscation indicators
    this.obfuscationIndicators.forEach((indicator) => {
      if (indicator.pattern.test(input)) {
        result.detectedPatterns.push(indicator.name);
        result.riskScore += 0.25;
      }
    });

    // Check for multiple encoding layers (sign of sophisticated attack)
    const encodingLayers = this.countEncodingLayers(input);
    if (encodingLayers > 2) {
      result.detectedPatterns.push(`Multiple encoding layers (${encodingLayers})`);
      result.riskScore += 0.3;
    }

    result.isCleartype = result.riskScore > 0.4;
    return result;
  }

  private attemptDecode(input: string): string {
    let decoded = input;

    // Decode unicode escapes
    decoded = decoded.replace(/\\u([0-9a-f]{4})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Decode hex escapes
    decoded = decoded.replace(/\\x([0-9a-f]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Decode HTML entities
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    decoded = decoded.replace(/&#([0-9]+);/gi, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    return decoded;
  }

  private countEncodingLayers(input: string): number {
    let layers = 0;
    let current = input;

    for (let i = 0; i < 5; i++) {
      const decoded = this.attemptDecode(current);
      if (decoded === current) break;
      layers++;
      current = decoded;
    }

    return layers;
  }
}

/**
 * Advanced Contact Form Spam Prevention
 * Multi-factor spam detection with machine learning-like scoring
 */
export class AdvancedContactSpamPrevention {
  private readonly spamSignatures = [
    // Viagra/Casino/Lottery spam
    { pattern: /viagra|cialis|phentermine/i, score: 0.9, name: 'Pharmaceutical spam' },
    { pattern: /casino|poker|blackjack|roulette/i, score: 0.85, name: 'Gambling spam' },
    { pattern: /lottery|jackpot|prize|winner/i, score: 0.8, name: 'Lottery spam' },
    
    // Financial scams
    { pattern: /bitcoin|ethereum|crypto|forex|trading|investment/i, score: 0.75, name: 'Crypto/Financial spam' },
    { pattern: /nigerian prince|inheritance|wire transfer/i, score: 0.95, name: 'Nigerian prince scam' },
    
    // Adult/Inappropriate content
    { pattern: /xxx|porn|adult|nude|sex|dating/i, score: 0.8, name: 'Adult content spam' },
    
    // Malware/Phishing
    { pattern: /click here|verify account|confirm identity|update payment/i, score: 0.85, name: 'Phishing attempt' },
    { pattern: /download|install|update|plugin|extension/i, score: 0.6, name: 'Malware distribution' },
    
    // SEO spam / Link injection
    { pattern: /\[url=|backlink|seo|rank|google|pagerank/i, score: 0.7, name: 'SEO spam' },
    
    // Suspicious URLs
    { pattern: /bit\.ly|tinyurl|short\.link|goo\.gl/i, score: 0.6, name: 'URL shortener spam' },
  ];

  private readonly suspiciousPatterns = [
    { pattern: /^[A-Z\s]+$/, score: 0.3, name: 'All caps text' },
    { pattern: /!!!|\\?\\?\\?|\.{4,}/g, score: 0.4, name: 'Excessive punctuation' },
    { pattern: /[a-z0-9]{50,}/i, score: 0.5, name: 'Gibberish/random characters' },
    { pattern: /\d{10,}/g, score: 0.3, name: 'Long number sequences' },
  ];

  analyzeContactForm(formData: Record<string, any>): SpamPreventionResult {
    const result: SpamPreventionResult = {
      isSpam: false,
      spamScore: 0,
      detectedThreats: [],
      recommendations: [],
      riskLevel: 'low',
    };

    const content = JSON.stringify(formData).toLowerCase();

    // Check spam signatures
    this.spamSignatures.forEach((sig) => {
      if (sig.pattern.test(content)) {
        result.detectedThreats.push(sig.name);
        result.spamScore += sig.score;
      }
    });

    // Check suspicious patterns
    this.suspiciousPatterns.forEach((pattern) => {
      if (pattern.pattern.test(content)) {
        result.detectedThreats.push(pattern.name);
        result.spamScore += pattern.score;
      }
    });

    // Normalize score to 0-1
    result.spamScore = Math.min(result.spamScore / 10, 1);

    // Determine risk level
    if (result.spamScore > 0.7) {
      result.riskLevel = 'critical';
      result.isSpam = true;
      result.recommendations.push('Block immediately');
      result.recommendations.push('Report to spam database');
    } else if (result.spamScore > 0.5) {
      result.riskLevel = 'high';
      result.isSpam = true;
      result.recommendations.push('Require CAPTCHA verification');
      result.recommendations.push('Flag for manual review');
    } else if (result.spamScore > 0.3) {
      result.riskLevel = 'medium';
      result.recommendations.push('Monitor for patterns');
    }

    return result;
  }
}

/**
 * Distributed Attack Detection & Mitigation
 * Advanced DDoS/botnet detection with fingerprinting
 */
export class DistributedAttackDetection {
  private readonly fingerprints = new Map<string, FingerprintData>();
  private readonly suspiciousPatterns: SuspiciousPattern[] = [];
  private readonly attackThresholds = {
    requestsPerSecond: 50,
    uniqueUserAgents: 100,
    samePayloadCount: 10,
    geographicAnomalies: 5,
  };

  constructor() {
    this.initializeSuspiciousPatterns();
  }

  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      {
        name: 'Botnet User-Agent',
        detector: (ua: string) => /bot|crawler|spider|scraper|curl|wget|python|java(?!script)/i.test(ua),
        severity: 'high',
      },
      {
        name: 'Headless Browser',
        detector: (ua: string) => /headless|phantom|nightmare|puppeteer/i.test(ua),
        severity: 'high',
      },
      {
        name: 'Proxy/VPN Signature',
        detector: (ua: string) => /proxy|vpn|tor|anonymizer/i.test(ua),
        severity: 'medium',
      },
      {
        name: 'Fake Browser',
        detector: (ua: string) => {
          // Detect mismatched user agents
          const hasChrome = /chrome/i.test(ua);
          const hasFirefox = /firefox/i.test(ua);
          const hasSafari = /safari/i.test(ua);
          return (hasChrome && hasFirefox) || (hasChrome && hasSafari) || (hasFirefox && hasSafari);
        },
        severity: 'high',
      },
    ];
  }

  recordRequest(fingerprint: string, metadata: RequestMetadata): DistributedAttackResult {
    const result: DistributedAttackResult = {
      isAttack: false,
      attackType: null,
      confidence: 0,
      recommendations: [],
    };

    // Get or create fingerprint data
    let data = this.fingerprints.get(fingerprint);
    if (!data) {
      data = {
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        requestCount: 0,
        userAgents: new Set(),
        payloads: new Map(),
        geoLocations: new Set(),
        suspiciousFlags: 0,
      };
      this.fingerprints.set(fingerprint, data);
    }

    data.lastSeen = Date.now();
    data.requestCount++;
    data.userAgents.add(metadata.userAgent);
    data.geoLocations.add(metadata.geoLocation || 'unknown');

    // Track payload patterns
    const payloadHash = this.hashPayload(metadata.payload);
    data.payloads.set(payloadHash, (data.payloads.get(payloadHash) || 0) + 1);

    // Check for suspicious patterns
    this.suspiciousPatterns.forEach((pattern) => {
      if (pattern.detector(metadata.userAgent)) {
        data!.suspiciousFlags += pattern.severity === 'critical' ? 3 : pattern.severity === 'high' ? 2 : 1;
      }
    });

    // Analyze for distributed attack patterns
    if (data.requestCount > this.attackThresholds.requestsPerSecond) {
      result.isAttack = true;
      result.attackType = 'volumetric_ddos';
      result.confidence = Math.min(data.requestCount / (this.attackThresholds.requestsPerSecond * 2), 1);
      result.recommendations.push('Implement rate limiting');
      result.recommendations.push('Block IP address');
    }

    if (data.userAgents.size > this.attackThresholds.uniqueUserAgents) {
      result.isAttack = true;
      result.attackType = 'botnet_attack';
      result.confidence = Math.min(data.userAgents.size / (this.attackThresholds.uniqueUserAgents * 2), 1);
      result.recommendations.push('Implement CAPTCHA');
      result.recommendations.push('Enable WAF rules');
    }

    if (data.suspiciousFlags > 5) {
      result.isAttack = true;
      result.attackType = 'automated_attack';
      result.confidence = Math.min(data.suspiciousFlags / 10, 1);
      result.recommendations.push('Require JavaScript verification');
      result.recommendations.push('Implement device fingerprinting');
    }

    // Check for identical payload spam
    const maxPayloadCount = Math.max(...Array.from(data.payloads.values()));
    if (maxPayloadCount > this.attackThresholds.samePayloadCount) {
      result.isAttack = true;
      result.attackType = 'payload_spam';
      result.confidence = Math.min(maxPayloadCount / (this.attackThresholds.samePayloadCount * 2), 1);
      result.recommendations.push('Block identical submissions');
    }

    return result;
  }

  private hashPayload(payload: any): string {
    const str = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  getAttackReport(): AttackReport {
    const allData = Array.from(this.fingerprints.values());
    const suspiciousFingerprints = allData.filter((d) => d.suspiciousFlags > 3);

    return {
      totalFingerprints: this.fingerprints.size,
      suspiciousCount: suspiciousFingerprints.length,
      avgRequestsPerFingerprint: allData.reduce((sum, d) => sum + d.requestCount, 0) / allData.length,
      potentialBotnetSize: suspiciousFingerprints.length,
    };
  }
}

/**
 * Behavioral Analysis Engine
 * Detects anomalous behavior patterns
 */
export class BehavioralAnalysisEngine {
  private userProfiles = new Map<string, UserBehaviorProfile>();
  private readonly anomalyThreshold = 2.5; // Standard deviations

  recordUserBehavior(userId: string, behavior: UserBehavior): BehaviorAnalysisResult {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        behaviors: [],
        avgResponseTime: 0,
        avgMouseVelocity: 0,
        avgKeyPressInterval: 0,
        lastActivity: Date.now(),
      };
      this.userProfiles.set(userId, profile);
    }

    profile.behaviors.push(behavior);
    profile.lastActivity = Date.now();

    // Keep only recent behaviors
    if (profile.behaviors.length > 100) {
      profile.behaviors.shift();
    }

    // Calculate statistics
    const stats = this.calculateBehaviorStats(profile);

    // Detect anomalies
    const anomalies = this.detectAnomalies(behavior, stats);

    return {
      isAnomalous: anomalies.length > 0,
      anomalies,
      riskScore: anomalies.length * 0.2,
    };
  }

  private calculateBehaviorStats(profile: UserBehaviorProfile): BehaviorStats {
    const behaviors = profile.behaviors;
    if (behaviors.length === 0) {
      return { avgResponseTime: 0, stdDevResponseTime: 0, avgMouseVelocity: 0, stdDevMouseVelocity: 0 };
    }

    const responseTimes = behaviors.map((b) => b.responseTime);
    const mouseVelocities = behaviors.map((b) => b.mouseVelocity);

    return {
      avgResponseTime: this.calculateMean(responseTimes),
      stdDevResponseTime: this.calculateStdDev(responseTimes),
      avgMouseVelocity: this.calculateMean(mouseVelocities),
      stdDevMouseVelocity: this.calculateStdDev(mouseVelocities),
    };
  }

  private detectAnomalies(behavior: UserBehavior, stats: BehaviorStats): string[] {
    const anomalies: string[] = [];

    // Check response time anomaly
    if (stats.stdDevResponseTime > 0) {
      const zScore = Math.abs((behavior.responseTime - stats.avgResponseTime) / stats.stdDevResponseTime);
      if (zScore > this.anomalyThreshold) {
        anomalies.push(`Unusual response time (z-score: ${zScore.toFixed(2)})`);
      }
    }

    // Check mouse velocity anomaly
    if (stats.stdDevMouseVelocity > 0) {
      const zScore = Math.abs((behavior.mouseVelocity - stats.avgMouseVelocity) / stats.stdDevMouseVelocity);
      if (zScore > this.anomalyThreshold) {
        anomalies.push(`Unusual mouse velocity (z-score: ${zScore.toFixed(2)})`);
      }
    }

    return anomalies;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }
}

/**
 * Type Definitions
 */
interface CleartypeDetectionResult {
  isCleartype: boolean;
  detectedPatterns: string[];
  riskScore: number;
  decodedPayloads: string[];
}

interface SpamPreventionResult {
  isSpam: boolean;
  spamScore: number;
  detectedThreats: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface FingerprintData {
  firstSeen: number;
  lastSeen: number;
  requestCount: number;
  userAgents: Set<string>;
  payloads: Map<string, number>;
  geoLocations: Set<string>;
  suspiciousFlags: number;
}

interface RequestMetadata {
  userAgent: string;
  geoLocation?: string;
  payload: any;
}

interface DistributedAttackResult {
  isAttack: boolean;
  attackType: 'volumetric_ddos' | 'botnet_attack' | 'automated_attack' | 'payload_spam' | null;
  confidence: number;
  recommendations: string[];
}

interface SuspiciousPattern {
  name: string;
  detector: (ua: string) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AttackReport {
  totalFingerprints: number;
  suspiciousCount: number;
  avgRequestsPerFingerprint: number;
  potentialBotnetSize: number;
}

interface UserBehavior {
  responseTime: number;
  mouseVelocity: number;
  timestamp: number;
}

interface UserBehaviorProfile {
  behaviors: UserBehavior[];
  avgResponseTime: number;
  avgMouseVelocity: number;
  avgKeyPressInterval: number;
  lastActivity: number;
}

interface BehaviorStats {
  avgResponseTime: number;
  stdDevResponseTime: number;
  avgMouseVelocity: number;
  stdDevMouseVelocity: number;
}

interface BehaviorAnalysisResult {
  isAnomalous: boolean;
  anomalies: string[];
  riskScore: number;
}

// Global instances
export const cleartypeUncodePrevention = new CleartypeUncodePrevention();
export const advancedContactSpamPrevention = new AdvancedContactSpamPrevention();
export const distributedAttackDetection = new DistributedAttackDetection();
export const behavioralAnalysisEngine = new BehavioralAnalysisEngine();
