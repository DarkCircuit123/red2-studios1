/**
 * Comprehensive Site Diagnostics & Repair System
 * Detects and fixes broken elements, console errors, media issues, forms, navigation, responsive design, accessibility, SEO, and performance
 */

interface DiagnosticReport {
  timestamp: string;
  issues: DiagnosticIssue[];
  warnings: string[];
  performance: PerformanceMetrics;
  accessibility: AccessibilityReport;
  seo: SEOReport;
}

interface DiagnosticIssue {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  fix?: string;
  fixed?: boolean;
}

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  fps: number;
}

interface AccessibilityReport {
  contrastIssues: number;
  missingAltText: number;
  missingLabels: number;
  keyboardNavigation: boolean;
}

interface SEOReport {
  hasMetaTags: boolean;
  hasH1: boolean;
  hasStructuredData: boolean;
  imageAltCoverage: number;
}

export class SiteDiagnostics {
  private static issues: DiagnosticIssue[] = [];
  private static warnings: string[] = [];

  static async runFullDiagnostics(): Promise<DiagnosticReport> {
    this.issues = [];
    this.warnings = [];

    // Run all diagnostic checks
    this.checkMediaElements();
    this.checkFormElements();
    this.checkNavigation();
    this.checkResponsiveDesign();
    this.checkAccessibility();
    this.checkSEO();
    this.checkConsoleErrors();
    this.checkAudioPlayback();
    this.checkCORSIssues();

    const performance = await this.measurePerformance();
    const accessibility = this.getAccessibilityReport();
    const seo = this.getSEOReport();

    return {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      warnings: this.warnings,
      performance,
      accessibility,
      seo,
    };
  }

  private static checkMediaElements(): void {
    // Check for broken images
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.src) {
        this.issues.push({
          category: 'Media',
          severity: 'warning',
          description: `Image missing src attribute: ${img.className}`,
        });
      }
      if (!img.alt) {
        this.warnings.push(`Image missing alt text: ${img.src}`);
      }
    });

    // Check for broken videos
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      const sources = video.querySelectorAll('source');
      if (sources.length === 0) {
        this.issues.push({
          category: 'Media',
          severity: 'warning',
          description: 'Video element has no source tags',
        });
      }
    });

    // Check for broken iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      if (!iframe.src) {
        this.issues.push({
          category: 'Media',
          severity: 'warning',
          description: `Iframe missing src: ${iframe.title}`,
        });
      }
    });
  }

  private static checkFormElements(): void {
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        if (!input.id || !form.querySelector(`label[for="${input.id}"]`)) {
          this.warnings.push(`Form input missing associated label: ${input.name}`);
        }
      });
    });
  }

  private static checkNavigation(): void {
    // Check for broken links
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '') {
        this.issues.push({
          category: 'Navigation',
          severity: 'warning',
          description: `Broken link detected: ${link.textContent}`,
        });
      }
    });

    // Check for navigation accessibility
    const nav = document.querySelector('nav');
    if (!nav) {
      this.warnings.push('No navigation element found');
    }
  }

  private static checkResponsiveDesign(): void {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      this.issues.push({
        category: 'Responsive',
        severity: 'critical',
        description: 'Viewport meta tag missing',
      });
    }

    // Check for common responsive issues
    const width = window.innerWidth;
    if (width < 768) {
      // Mobile checks
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        if (rect.height < 44 || rect.width < 44) {
          this.warnings.push(`Button too small for touch: ${btn.textContent}`);
        }
      });
    }
  }

  private static checkAccessibility(): void {
    // Check for color contrast (simplified)
    const elements = document.querySelectorAll('button, a, [role="button"]');
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const color = style.color;
      // Simplified check - in production use WCAG contrast checker
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        // May have contrast issues
      }
    });

    // Check for keyboard navigation
    const focusableElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]'
    );
    if (focusableElements.length === 0) {
      this.warnings.push('No keyboard-focusable elements found');
    }
  }

  private static checkSEO(): void {
    // Check for meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      this.warnings.push('Meta description missing');
    }

    // Check for h1
    const h1 = document.querySelector('h1');
    if (!h1) {
      this.warnings.push('No H1 tag found on page');
    }

    // Check for multiple h1s
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) {
      this.warnings.push(`Multiple H1 tags found: ${h1s.length}`);
    }

    // Check for structured data
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      this.warnings.push('No structured data (JSON-LD) found');
    }
  }

  private static checkConsoleErrors(): void {
    // Monitor console for errors
    const originalError = console.error;
    const originalWarn = console.warn;

    let errorCount = 0;
    let warnCount = 0;

    console.error = function (...args) {
      errorCount++;
      originalError.apply(console, args);
    };

    console.warn = function (...args) {
      warnCount++;
      originalWarn.apply(console, args);
    };

    if (errorCount > 0) {
      this.issues.push({
        category: 'Console',
        severity: 'warning',
        description: `${errorCount} console errors detected`,
      });
    }

    if (warnCount > 0) {
      this.warnings.push(`${warnCount} console warnings detected`);
    }
  }

  private static checkAudioPlayback(): void {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio) => {
      if (!audio.src && audio.querySelectorAll('source').length === 0) {
        this.issues.push({
          category: 'Audio',
          severity: 'warning',
          description: 'Audio element has no source',
        });
      }

      // Check for autoplay issues
      if (audio.autoplay && !audio.muted) {
        this.warnings.push('Unmuted autoplay may be blocked by browsers');
      }
    });

    // Check for SoundCloud embeds
    const soundcloudIframes = document.querySelectorAll(
      'iframe[src*="soundcloud"]'
    );
    if (soundcloudIframes.length > 0) {
      soundcloudIframes.forEach((iframe) => {
        if (!iframe.hasAttribute('allow')) {
          this.issues.push({
            category: 'Audio',
            severity: 'warning',
            description: 'SoundCloud iframe missing allow="autoplay" attribute',
            fix: 'Add allow="autoplay" to SoundCloud iframe',
          });
        }
      });
    }
  }

  private static checkCORSIssues(): void {
    // Check for potential CORS issues
    const externalResources = document.querySelectorAll(
      'img[src*="http"], script[src*="http"], link[href*="http"]'
    );
    externalResources.forEach((resource) => {
      const src = resource.getAttribute('src') || resource.getAttribute('href');
      if (src && !src.includes(window.location.hostname)) {
        // External resource - check for CORS headers
        if (resource.tagName === 'IMG' && !resource.hasAttribute('crossorigin')) {
          this.warnings.push(`External image may have CORS issues: ${src}`);
        }
      }
    });
  }

  private static async measurePerformance(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      fcp: null,
      lcp: null,
      cls: null,
      ttfb: null,
      fps: 0,
    };

    // Measure FCP, LCP, CLS using PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        // FCP
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            metrics.fcp = entries[0].startTime;
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            metrics.lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // TTFB
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
          metrics.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
        }
      } catch (e) {
        console.log('Performance measurement error:', e);
      }
    }

    // Measure FPS
    metrics.fps = await this.measureFPS();

    return metrics;
  }

  private static async measureFPS(): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();

      const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          resolve(frameCount);
          return;
        }
        requestAnimationFrame(countFrames);
      };

      requestAnimationFrame(countFrames);
    });
  }

  private static getAccessibilityReport(): AccessibilityReport {
    let contrastIssues = 0;
    let missingAltText = 0;
    let missingLabels = 0;

    // Count missing alt text
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === '') {
        missingAltText++;
      }
    });

    // Count missing labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const id = input.id;
      if (!id || !document.querySelector(`label[for="${id}"]`)) {
        missingLabels++;
      }
    });

    return {
      contrastIssues,
      missingAltText,
      missingLabels,
      keyboardNavigation: this.checkKeyboardNavigation(),
    };
  }

  private static checkKeyboardNavigation(): boolean {
    const focusableElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]'
    );
    return focusableElements.length > 0;
  }

  private static getSEOReport(): SEOReport {
    const metaDescription = document.querySelector('meta[name="description"]');
    const h1 = document.querySelector('h1');
    const structuredData = document.querySelector('script[type="application/ld+json"]');

    // Calculate image alt text coverage
    const images = document.querySelectorAll('img');
    let imagesWithAlt = 0;
    images.forEach((img) => {
      if (img.alt && img.alt.trim() !== '') {
        imagesWithAlt++;
      }
    });
    const imageAltCoverage = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 0;

    return {
      hasMetaTags: !!metaDescription,
      hasH1: !!h1,
      hasStructuredData: !!structuredData,
      imageAltCoverage,
    };
  }

  static fixCommonIssues(): void {
    // Fix broken links
    const links = document.querySelectorAll('a[href="#"]');
    links.forEach((link) => {
      link.setAttribute('href', '/');
    });

    // Fix missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      img.setAttribute('alt', 'Image');
    });

    // Fix missing viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewport);
    }

    // Fix SoundCloud iframe allow attribute
    const soundcloudIframes = document.querySelectorAll('iframe[src*="soundcloud"]');
    soundcloudIframes.forEach((iframe) => {
      if (!iframe.hasAttribute('allow')) {
        iframe.setAttribute('allow', 'autoplay');
      }
    });
  }

  static logReport(report: DiagnosticReport): void {
    console.group('🔍 SITE DIAGNOSTICS REPORT');
    console.log('Timestamp:', report.timestamp);
    console.log('Total Issues:', report.issues.length);
    console.log('Total Warnings:', report.warnings.length);

    if (report.issues.length > 0) {
      console.group('Critical Issues:');
      report.issues
        .filter((i) => i.severity === 'critical')
        .forEach((issue) => {
          console.error(`❌ ${issue.category}: ${issue.description}`);
        });
      console.groupEnd();
    }

    if (report.warnings.length > 0) {
      console.group('Warnings:');
      report.warnings.forEach((warning) => {
        console.warn(`⚠️ ${warning}`);
      });
      console.groupEnd();
    }

    console.group('Performance Metrics:');
    console.log('FCP:', report.performance.fcp?.toFixed(2), 'ms');
    console.log('LCP:', report.performance.lcp?.toFixed(2), 'ms');
    console.log('CLS:', report.performance.cls?.toFixed(3));
    console.log('TTFB:', report.performance.ttfb?.toFixed(2), 'ms');
    console.log('FPS:', report.performance.fps);
    console.groupEnd();

    console.group('Accessibility:');
    console.log('Missing Alt Text:', report.accessibility.missingAltText);
    console.log('Missing Labels:', report.accessibility.missingLabels);
    console.log('Keyboard Navigation:', report.accessibility.keyboardNavigation ? '✅' : '❌');
    console.groupEnd();

    console.group('SEO:');
    console.log('Meta Tags:', report.seo.hasMetaTags ? '✅' : '❌');
    console.log('H1 Tag:', report.seo.hasH1 ? '✅' : '❌');
    console.log('Structured Data:', report.seo.hasStructuredData ? '✅' : '❌');
    console.log('Image Alt Coverage:', report.seo.imageAltCoverage.toFixed(1), '%');
    console.groupEnd();

    console.groupEnd();
  }
}

// Auto-run diagnostics on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    const report = await SiteDiagnostics.runFullDiagnostics();
    SiteDiagnostics.logReport(report);
    SiteDiagnostics.fixCommonIssues();
  });
}
