/**
 * Image Quality Monitor
 * Tracks perceptual quality metrics and performance
 */

export interface ImageQualityMetrics {
  format: string;
  quality: number;
  width: number;
  height: number;
  estimatedSize: number;
  loadTime: number;
  dpr: number;
  connectionSpeed: string;
  timestamp: number;
}

export interface QualityReport {
  averageQuality: number;
  averageLoadTime: number;
  totalImagesLoaded: number;
  formatDistribution: Record<string, number>;
  networkDistribution: Record<string, number>;
  averageFileSizeReduction: number;
}

class ImageQualityMonitor {
  private metrics: ImageQualityMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Record image load metrics
   */
  recordMetric(metric: ImageQualityMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get quality report
   */
  getReport(): QualityReport {
    if (this.metrics.length === 0) {
      return {
        averageQuality: 0,
        averageLoadTime: 0,
        totalImagesLoaded: 0,
        formatDistribution: {},
        networkDistribution: {},
        averageFileSizeReduction: 0,
      };
    }

    const totalQuality = this.metrics.reduce((sum, m) => sum + m.quality, 0);
    const totalLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);

    const formatDistribution: Record<string, number> = {};
    const networkDistribution: Record<string, number> = {};

    this.metrics.forEach((m) => {
      formatDistribution[m.format] = (formatDistribution[m.format] || 0) + 1;
      networkDistribution[m.connectionSpeed] = (networkDistribution[m.connectionSpeed] || 0) + 1;
    });

    // Calculate average file size reduction (compared to full quality JPEG)
    const avgFileSizeReduction = this.calculateFileSizeReduction();

    return {
      averageQuality: Math.round(totalQuality / this.metrics.length),
      averageLoadTime: Math.round(totalLoadTime / this.metrics.length),
      totalImagesLoaded: this.metrics.length,
      formatDistribution,
      networkDistribution,
      averageFileSizeReduction: avgFileSizeReduction,
    };
  }

  /**
   * Calculate average file size reduction percentage
   */
  private calculateFileSizeReduction(): number {
    if (this.metrics.length === 0) return 0;

    // Estimate full quality JPEG size (quality 95)
    const fullQualityEstimate = this.metrics.reduce((sum, m) => {
      const fullSize = (m.estimatedSize / m.quality) * 95;
      return sum + fullSize;
    }, 0);

    const actualSize = this.metrics.reduce((sum, m) => sum + m.estimatedSize, 0);

    return Math.round(((fullQualityEstimate - actualSize) / fullQualityEstimate) * 100);
  }

  /**
   * Get metrics for specific format
   */
  getMetricsForFormat(format: string): ImageQualityMetrics[] {
    return this.metrics.filter((m) => m.format === format);
  }

  /**
   * Get metrics for specific network speed
   */
  getMetricsForNetwork(speed: string): ImageQualityMetrics[] {
    return this.metrics.filter((m) => m.connectionSpeed === speed);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        report: this.getReport(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Get perceptual quality score (0-100)
   * Based on format efficiency and quality settings
   */
  getPerceptualQualityScore(): number {
    if (this.metrics.length === 0) return 0;

    let totalScore = 0;

    this.metrics.forEach((m) => {
      // Format efficiency (AVIF > WebP > JPEG)
      let formatScore = 0;
      switch (m.format) {
        case 'avif':
          formatScore = 100;
          break;
        case 'webp':
          formatScore = 85;
          break;
        case 'jpeg':
          formatScore = 70;
          break;
        default:
          formatScore = 50;
      }

      // Quality score (higher quality = higher score)
      const qualityScore = m.quality;

      // DPI score (higher DPI = higher score due to perceptual benefits)
      const dpiScore = Math.min(m.dpr * 50, 100);

      // Combined score (weighted average)
      const score = formatScore * 0.4 + qualityScore * 0.4 + dpiScore * 0.2;
      totalScore += score;
    });

    return Math.round(totalScore / this.metrics.length);
  }
}

// Singleton instance
let monitorInstance: ImageQualityMonitor | null = null;

/**
 * Get or create monitor instance
 */
export function getImageQualityMonitor(): ImageQualityMonitor {
  if (!monitorInstance) {
    monitorInstance = new ImageQualityMonitor();
  }
  return monitorInstance;
}

/**
 * Reset monitor instance
 */
export function resetImageQualityMonitor(): void {
  if (monitorInstance) {
    monitorInstance.clear();
  }
}
