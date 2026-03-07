/**
 * Advanced Threat Detection System
 * Implements: Intrusion detection, payload analysis, exploit prevention
 */

/**
 * Payload Analyzer - Detects malicious payloads in user input
 */
export class PayloadAnalyzer {
  private readonly sqlInjectionPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bor\b.*=.*)/i,
    /(\bdrop\b.*\btable\b)/i,
    /(\binsert\b.*\binto\b)/i,
    /(\bupdate\b.*\bset\b)/i,
    /(\bdelete\b.*\bfrom\b)/i,
    /(\bexec\b.*\()/i,
    /(\bexecute\b.*\()/i,
    /(\bscript\b.*\btag\b)/i,
    /(\bjavascript\b.*:)/i,
  ];

  private readonly xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /<svg[^>]*onload[^>]*>/gi,
  ];

  private readonly commandInjectionPatterns = [
    /[;&|`$()]/,
    /\$\{.*\}/,
    /\$\(.*\)/,
    /`.*`/,
  ];

  private readonly ldapInjectionPatterns = [
    /[*()\\]/,
    /\x00/,
  ];

  analyzePayload(input: string, context: 'html' | 'sql' | 'command' | 'ldap' = 'html'): PayloadAnalysisResult {
    const result: PayloadAnalysisResult = {
      isMalicious: false,
      threats: [],
      riskScore: 0,
      recommendations: [],
    };

    switch (context) {
      case 'sql':
        this.analyzeSQLInjection(input, result);
        break;
      case 'html':
        this.analyzeXSS(input, result);
        break;
      case 'command':
        this.analyzeCommandInjection(input, result);
        break;
      case 'ldap':
        this.analyzeLDAPInjection(input, result);
        break;
    }

    return result;
  }

  private analyzeSQLInjection(input: string, result: PayloadAnalysisResult): void {
    this.sqlInjectionPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        result.threats.push('SQL Injection');
        result.riskScore += 0.3;
      }
    });

    // Check for encoded payloads
    if (this.hasEncodedPayload(input)) {
      result.threats.push('Encoded SQL Injection');
      result.riskScore += 0.2;
    }

    result.isMalicious = result.riskScore > 0.5;
    if (result.isMalicious) {
      result.recommendations.push('Use parameterized queries');
      result.recommendations.push('Implement input validation');
    }
  }

  private analyzeXSS(input: string, result: PayloadAnalysisResult): void {
    this.xssPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        result.threats.push('XSS Attack');
        result.riskScore += 0.25;
      }
    });

    // Check for event handlers
    if (/on\w+\s*=/i.test(input)) {
      result.threats.push('Event Handler Injection');
      result.riskScore += 0.25;
    }

    result.isMalicious = result.riskScore > 0.5;
    if (result.isMalicious) {
      result.recommendations.push('Sanitize HTML output');
      result.recommendations.push('Use Content Security Policy');
    }
  }

  private analyzeCommandInjection(input: string, result: PayloadAnalysisResult): void {
    this.commandInjectionPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        result.threats.push('Command Injection');
        result.riskScore += 0.3;
      }
    });

    result.isMalicious = result.riskScore > 0.5;
    if (result.isMalicious) {
      result.recommendations.push('Avoid shell execution');
      result.recommendations.push('Use allowlists for commands');
    }
  }

  private analyzeLDAPInjection(input: string, result: PayloadAnalysisResult): void {
    this.ldapInjectionPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        result.threats.push('LDAP Injection');
        result.riskScore += 0.3;
      }
    });

    result.isMalicious = result.riskScore > 0.5;
    if (result.isMalicious) {
      result.recommendations.push('Escape LDAP special characters');
      result.recommendations.push('Use LDAP libraries with built-in escaping');
    }
  }

  private hasEncodedPayload(input: string): boolean {
    // Check for URL encoding
    if (/%27|%22|%3C|%3E|%2F/.test(input)) {
      return true;
    }

    // Check for hex encoding
    if (/\\x[0-9a-f]{2}/i.test(input)) {
      return true;
    }

    // Check for unicode encoding
    if (/\\u[0-9a-f]{4}/i.test(input)) {
      return true;
    }

    return false;
  }
}

/**
 * Intrusion Detection System (IDS)
 * Monitors for suspicious patterns and attack signatures
 */
export class IntrusionDetectionSystem {
  private attackSignatures: AttackSignature[] = [];
  private detectionLog: DetectionEvent[] = [];
  private readonly maxLogSize = 1000;

  registerSignature(signature: AttackSignature): void {
    this.attackSignatures.push(signature);
  }

  analyzeTraffic(request: TrafficAnalysis): DetectionResult {
    const result: DetectionResult = {
      detected: false,
      matchedSignatures: [],
      severity: 'low',
      timestamp: Date.now(),
    };

    this.attackSignatures.forEach((signature) => {
      if (this.matchesSignature(request, signature)) {
        result.matchedSignatures.push(signature.name);
        result.detected = true;

        // Update severity
        if (signature.severity === 'critical' || signature.severity === 'high') {
          result.severity = signature.severity;
        }
      }
    });

    if (result.detected) {
      this.logDetection(result);
      this.triggerAlert(result);
    }

    return result;
  }

  private matchesSignature(request: TrafficAnalysis, signature: AttackSignature): boolean {
    // Check URL pattern
    if (signature.urlPattern && !signature.urlPattern.test(request.url)) {
      return false;
    }

    // Check method
    if (signature.method && signature.method !== request.method) {
      return false;
    }

    // Check payload pattern
    if (signature.payloadPattern) {
      const payload = JSON.stringify(request.body || {});
      if (!signature.payloadPattern.test(payload)) {
        return false;
      }
    }

    // Check headers
    if (signature.headerPatterns) {
      for (const [header, pattern] of Object.entries(signature.headerPatterns)) {
        const headerValue = request.headers[header] || '';
        if (!pattern.test(headerValue)) {
          return false;
        }
      }
    }

    return true;
  }

  private logDetection(result: DetectionResult): void {
    const event: DetectionEvent = {
      ...result,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.detectionLog.push(event);

    // Keep log size manageable
    if (this.detectionLog.length > this.maxLogSize) {
      this.detectionLog.shift();
    }
  }

  private triggerAlert(result: DetectionResult): void {
    console.error('[IDS ALERT]', {
      severity: result.severity,
      matchedSignatures: result.matchedSignatures,
      timestamp: result.timestamp,
    });
  }

  getDetectionLog(): DetectionEvent[] {
    return [...this.detectionLog];
  }
}

/**
 * Exploit Prevention Engine
 * Detects and prevents known exploits
 */
export class ExploitPreventionEngine {
  private exploitPatterns: ExploitPattern[] = [];

  registerExploit(pattern: ExploitPattern): void {
    this.exploitPatterns.push(pattern);
  }

  checkForExploits(context: ExploitContext): ExploitCheckResult {
    const result: ExploitCheckResult = {
      exploitsDetected: [],
      isBlocked: false,
      recommendations: [],
    };

    this.exploitPatterns.forEach((pattern) => {
      if (this.matchesExploit(context, pattern)) {
        result.exploitsDetected.push(pattern.name);
        if (pattern.shouldBlock) {
          result.isBlocked = true;
        }
        result.recommendations.push(...pattern.mitigations);
      }
    });

    if (result.isBlocked) {
      console.warn('[EXPLOIT PREVENTION] Exploit blocked', result);
    }

    return result;
  }

  private matchesExploit(context: ExploitContext, pattern: ExploitPattern): boolean {
    // Check DOM-based exploits
    if (pattern.type === 'dom' && context.domContent) {
      return pattern.detector(context.domContent);
    }

    // Check network-based exploits
    if (pattern.type === 'network' && context.networkData) {
      return pattern.detector(context.networkData);
    }

    // Check behavior-based exploits
    if (pattern.type === 'behavior' && context.behaviorData) {
      return pattern.detector(context.behaviorData);
    }

    return false;
  }
}

/**
 * Zero-Day Protection
 * Heuristic-based detection for unknown exploits
 */
export class ZeroDayProtection {
  private baselineMetrics: BaselineMetrics | null = null;
  private readonly deviationThreshold = 2.5; // Standard deviations

  establishBaseline(): void {
    this.baselineMetrics = {
      avgRequestSize: 0,
      avgResponseTime: 0,
      avgMemoryUsage: 0,
      avgCPUUsage: 0,
      timestamp: Date.now(),
    };
  }

  detectAnomaly(): AnomalyDetectionResult {
    if (!this.baselineMetrics) {
      return { isAnomaly: false, score: 0, metrics: {} };
    }

    const currentMetrics = this.getCurrentMetrics();
    const deviations = this.calculateDeviations(currentMetrics);

    const isAnomaly = Object.values(deviations).some((dev) => Math.abs(dev) > this.deviationThreshold);

    return {
      isAnomaly,
      score: Math.max(...Object.values(deviations).map(Math.abs)),
      metrics: deviations,
    };
  }

  private getCurrentMetrics(): CurrentMetrics {
    const performance = window.performance;
    const memory = (performance as any).memory;

    return {
      requestSize: this.estimateRequestSize(),
      responseTime: performance.now(),
      memoryUsage: memory?.usedJSHeapSize || 0,
      cpuUsage: this.estimateCPUUsage(),
    };
  }

  private calculateDeviations(current: CurrentMetrics): Record<string, number> {
    if (!this.baselineMetrics) {
      return {};
    }

    return {
      requestSize: (current.requestSize - this.baselineMetrics.avgRequestSize) / this.baselineMetrics.avgRequestSize,
      responseTime: (current.responseTime - this.baselineMetrics.avgResponseTime) / this.baselineMetrics.avgResponseTime,
      memoryUsage: (current.memoryUsage - this.baselineMetrics.avgMemoryUsage) / this.baselineMetrics.avgMemoryUsage,
      cpuUsage: (current.cpuUsage - this.baselineMetrics.avgCPUUsage) / this.baselineMetrics.avgCPUUsage,
    };
  }

  private estimateRequestSize(): number {
    // Rough estimate based on visible content
    return document.documentElement.innerHTML.length;
  }

  private estimateCPUUsage(): number {
    // Rough estimate based on performance metrics
    const perf = window.performance;
    if (perf.getEntriesByType) {
      const entries = perf.getEntriesByType('measure');
      return entries.length > 0 ? entries[entries.length - 1].duration : 0;
    }
    return 0;
  }
}

/**
 * Type definitions
 */
interface PayloadAnalysisResult {
  isMalicious: boolean;
  threats: string[];
  riskScore: number;
  recommendations: string[];
}

interface AttackSignature {
  name: string;
  urlPattern?: RegExp;
  method?: string;
  payloadPattern?: RegExp;
  headerPatterns?: Record<string, RegExp>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface TrafficAnalysis {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

interface DetectionResult {
  detected: boolean;
  matchedSignatures: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

interface DetectionEvent extends DetectionResult {
  userAgent: string;
  url: string;
}

interface ExploitPattern {
  name: string;
  type: 'dom' | 'network' | 'behavior';
  detector: (context: any) => boolean;
  shouldBlock: boolean;
  mitigations: string[];
}

interface ExploitContext {
  domContent?: string;
  networkData?: any;
  behaviorData?: any;
}

interface ExploitCheckResult {
  exploitsDetected: string[];
  isBlocked: boolean;
  recommendations: string[];
}

interface BaselineMetrics {
  avgRequestSize: number;
  avgResponseTime: number;
  avgMemoryUsage: number;
  avgCPUUsage: number;
  timestamp: number;
}

interface CurrentMetrics {
  requestSize: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  metrics: Record<string, number>;
}

// Global instances
export const payloadAnalyzer = new PayloadAnalyzer();
export const intrusionDetectionSystem = new IntrusionDetectionSystem();
export const exploitPreventionEngine = new ExploitPreventionEngine();
export const zeroDayProtection = new ZeroDayProtection();
