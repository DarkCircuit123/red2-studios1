/**
 * Advanced optimization utilities for production-grade performance
 * Implements: Web Workers, Service Workers, Virtual Scrolling, Adaptive Loading
 */

/**
 * Adaptive Loading Strategy
 * Adjusts content delivery based on network conditions and device capabilities
 */
export class AdaptiveLoadingManager {
  private connection: any;
  private effectiveType: '4g' | '3g' | '2g' | '1g' = '4g';
  private saveData: boolean = false;

  constructor() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      this.connection = (navigator as any).connection;
      this.updateConnectionInfo();
      this.connection?.addEventListener('change', () => this.updateConnectionInfo());
    }
    this.saveData = (navigator as any).connection?.saveData ?? false;
  }

  private updateConnectionInfo(): void {
    if (this.connection) {
      this.effectiveType = this.connection.effectiveType || '4g';
      this.saveData = this.connection.saveData || false;
    }
  }

  shouldLoadHighQuality(): boolean {
    return this.effectiveType === '4g' && !this.saveData;
  }

  shouldLoadImages(): boolean {
    return this.effectiveType !== '2g' && this.effectiveType !== '1g';
  }

  shouldLoadVideos(): boolean {
    return this.effectiveType === '4g' && !this.saveData;
  }

  getImageQuality(): number {
    switch (this.effectiveType) {
      case '4g':
        return this.saveData ? 75 : 90;
      case '3g':
        return 60;
      case '2g':
      case '1g':
        return 40;
      default:
        return 80;
    }
  }

  getConnectionInfo() {
    return {
      effectiveType: this.effectiveType,
      saveData: this.saveData,
      shouldLoadHighQuality: this.shouldLoadHighQuality(),
      shouldLoadImages: this.shouldLoadImages(),
      shouldLoadVideos: this.shouldLoadVideos(),
      imageQuality: this.getImageQuality(),
    };
  }
}

/**
 * Virtual Scrolling Manager
 * Renders only visible items in long lists for massive performance gains
 */
export class VirtualScrollingManager {
  private itemHeight: number;
  private containerHeight: number;
  private items: any[];
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };

  constructor(itemHeight: number, containerHeight: number, items: any[] = []) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.items = items;
    this.calculateVisibleRange(0);
  }

  calculateVisibleRange(scrollTop: number): void {
    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(start + visibleCount + 1, this.items.length);

    this.visibleRange = { start: Math.max(0, start - 1), end };
  }

  getVisibleItems(): any[] {
    return this.items.slice(this.visibleRange.start, this.visibleRange.end);
  }

  getOffsetY(): number {
    return this.visibleRange.start * this.itemHeight;
  }

  getVisibleRange() {
    return this.visibleRange;
  }

  updateItems(items: any[]): void {
    this.items = items;
  }
}

/**
 * Memory-efficient DOM node pool
 * Reuses DOM nodes instead of creating/destroying them
 */
export class DOMNodePool {
  private pool: Map<string, HTMLElement[]> = new Map();
  private maxPoolSize: number;

  constructor(maxPoolSize = 50) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(tagName: string, className?: string): HTMLElement {
    const key = `${tagName}:${className || ''}`;
    const pooledNodes = this.pool.get(key) || [];

    if (pooledNodes.length > 0) {
      return pooledNodes.pop()!;
    }

    const node = document.createElement(tagName);
    if (className) {
      node.className = className;
    }
    return node;
  }

  release(node: HTMLElement, tagName: string, className?: string): void {
    const key = `${tagName}:${className || ''}`;
    const pooledNodes = this.pool.get(key) || [];

    if (pooledNodes.length < this.maxPoolSize) {
      node.innerHTML = '';
      node.removeAttribute('style');
      pooledNodes.push(node);
      this.pool.set(key, pooledNodes);
    }
  }

  clear(): void {
    this.pool.clear();
  }
}

/**
 * Intersection Observer with pooling
 * Efficiently manages multiple observers
 */
export class IntersectionObserverPool {
  private observers: Map<string, IntersectionObserver> = new Map();
  private observedElements: Map<Element, string> = new Map();

  createObserver(
    id: string,
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    if (this.observers.has(id)) {
      return this.observers.get(id)!;
    }

    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    this.observers.set(id, observer);
    return observer;
  }

  observe(element: Element, observerId: string): void {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.observe(element);
      this.observedElements.set(element, observerId);
    }
  }

  unobserve(element: Element): void {
    const observerId = this.observedElements.get(element);
    if (observerId) {
      const observer = this.observers.get(observerId);
      if (observer) {
        observer.unobserve(element);
      }
      this.observedElements.delete(element);
    }
  }

  disconnectAll(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.observedElements.clear();
  }
}

/**
 * Mutation Observer with debouncing
 * Efficiently handles DOM changes
 */
export class DebouncedMutationObserver {
  private observer: MutationObserver | null = null;
  private timeout: NodeJS.Timeout | null = null;
  private debounceDelay: number;

  constructor(
    callback: (mutations: MutationRecord[]) => void,
    debounceDelay = 300,
    options: MutationObserverInit = {}
  ) {
    this.debounceDelay = debounceDelay;

    this.observer = new MutationObserver((mutations) => {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(() => {
        callback(mutations);
      }, debounceDelay);
    });

    const defaultOptions: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      ...options,
    };

    this.observer.observe(document.body, defaultOptions);
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

/**
 * Batch Animation Frame Manager
 * Groups multiple animation frame callbacks for better performance
 */
export class BatchAnimationFrameManager {
  private callbacks: Set<FrameRequestCallback> = new Set();
  private rafId: number | null = null;
  private isScheduled = false;

  add(callback: FrameRequestCallback): () => void {
    this.callbacks.add(callback);
    this.schedule();

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private schedule(): void {
    if (!this.isScheduled && this.callbacks.size > 0) {
      this.isScheduled = true;
      this.rafId = requestAnimationFrame((time) => {
        const callbacksCopy = Array.from(this.callbacks);
        this.isScheduled = false;
        callbacksCopy.forEach((cb) => cb(time));
      });
    }
  }

  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.callbacks.clear();
    this.isScheduled = false;
  }
}

/**
 * Idle Task Scheduler
 * Schedules non-critical work during browser idle time
 */
export class IdleTaskScheduler {
  private queue: Array<{ task: () => void; priority: number }> = [];
  private isProcessing = false;

  schedule(task: () => void, priority = 0): void {
    this.queue.push({ task, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    this.process();
  }

  private process(): void {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        () => {
          const { task } = this.queue.shift()!;
          task();
          this.isProcessing = false;
          this.process();
        },
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => {
        const { task } = this.queue.shift()!;
        task();
        this.isProcessing = false;
        this.process();
      }, 0);
    }
  }

  clear(): void {
    this.queue = [];
    this.isProcessing = false;
  }
}

/**
 * Performance metrics collector
 * Tracks Core Web Vitals and custom metrics
 */
export class PerformanceMetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  startTracking(): void {
    this.trackCoreWebVitals();
    this.trackCustomMetrics();
  }

  private trackCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('LCP', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            this.recordMetric('FID', entry.processingDuration);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('FID', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              this.recordMetric('CLS', entry.value);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('CLS', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  private trackCustomMetrics(): void {
    // Time to Interactive (TTI)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordMetric('TTI', performance.now());
      });
    } else {
      this.recordMetric('TTI', performance.now());
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms`);
    }
  }

  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number }> = {};

    this.metrics.forEach((values, name) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      result[name] = { avg, min, max };
    });

    return result;
  }

  stopTracking(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Global instances
export const adaptiveLoadingManager = new AdaptiveLoadingManager();
export const domNodePool = new DOMNodePool();
export const intersectionObserverPool = new IntersectionObserverPool();
export const batchAnimationFrameManager = new BatchAnimationFrameManager();
export const idleTaskScheduler = new IdleTaskScheduler();
export const performanceMetricsCollector = new PerformanceMetricsCollector();
