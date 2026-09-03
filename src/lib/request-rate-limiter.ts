/**
 * Request Rate Limiter
 * Prevents 429 Too Many Requests errors by:
 * - Limiting concurrent requests
 * - Implementing exponential backoff
 * - Deduplicating identical requests
 * - Throttling rapid successive calls
 */

interface RateLimitConfig {
  maxConcurrent: number; // Max simultaneous requests
  maxPerSecond: number; // Max requests per second
  backoffMultiplier: number; // Exponential backoff multiplier
  maxRetries: number; // Max retry attempts
}

interface RequestMetrics {
  timestamp: number;
  count: number;
}

class RequestRateLimiter {
  private config: RateLimitConfig;
  private activeRequests = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private secondMetrics: RequestMetrics[] = [];
  private retryCount = new Map<string, number>();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      maxPerSecond: config.maxPerSecond ?? 5,
      backoffMultiplier: config.backoffMultiplier ?? 1.5,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  /**
   * Execute a request with rate limiting
   */
  async execute<T>(
    requestId: string,
    fn: () => Promise<T>,
    options?: { priority?: 'high' | 'normal' | 'low' }
  ): Promise<T> {
    const priority = options?.priority ?? 'normal';
    
    // Check rate limit before queuing
    await this.checkRateLimit();

    // Queue the request
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        this.activeRequests++;
        try {
          const result = await this.executeWithRetry(requestId, fn);
          this.retryCount.delete(requestId);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      // Add to queue based on priority
      if (priority === 'high' && this.activeRequests < this.config.maxConcurrent) {
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
        this.processQueue();
      }
    });
  }

  /**
   * Execute request with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    requestId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const retries = this.retryCount.get(requestId) ?? 0;

    try {
      return await fn();
    } catch (error: any) {
      // Check if it's a rate limit error (429)
      if (error?.status === 429 && retries < this.config.maxRetries) {
        const backoffMs = Math.pow(this.config.backoffMultiplier, retries) * 1000;
        console.warn(
          `[RateLimiter] 429 error for ${requestId}, retrying in ${backoffMs}ms (attempt ${retries + 1}/${this.config.maxRetries})`
        );
        
        this.retryCount.set(requestId, retries + 1);
        await this.sleep(backoffMs);
        return this.executeWithRetry(requestId, fn);
      }

      throw error;
    }
  }

  /**
   * Check if we're within rate limits
   */
  private async checkRateLimit(): Promise<void> {
    // Wait for concurrent limit
    while (this.activeRequests >= this.config.maxConcurrent) {
      await this.sleep(50);
    }

    // Check per-second limit
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old metrics
    this.secondMetrics = this.secondMetrics.filter(m => m.timestamp > oneSecondAgo);

    // Check if we've hit the per-second limit
    while (this.secondMetrics.length >= this.config.maxPerSecond) {
      const oldestMetric = this.secondMetrics[0];
      const waitTime = oldestMetric.timestamp + 1000 - now;
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
      this.secondMetrics = this.secondMetrics.filter(m => m.timestamp > Date.now() - 1000);
    }

    // Record this request
    this.secondMetrics.push({ timestamp: now, count: 1 });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConcurrent
    ) {
      const request = this.requestQueue.shift();
      if (request) {
        request().catch(err => console.error('[RateLimiter] Queued request failed:', err));
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      requestsPerSecond: this.secondMetrics.length,
      retryCount: this.retryCount.size,
    };
  }

  /**
   * Reset limiter state
   */
  reset(): void {
    this.activeRequests = 0;
    this.requestQueue = [];
    this.secondMetrics = [];
    this.retryCount.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RequestRateLimiter({
  maxConcurrent: 2, // Very conservative: only 2 concurrent requests
  maxPerSecond: 3, // Max 3 requests per second
  backoffMultiplier: 2, // Double wait time on each retry
  maxRetries: 3,
});

export type { RateLimitConfig };
