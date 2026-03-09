import { useEffect, useCallback } from 'react';
import { getImageQualityMonitor, ImageQualityMetrics, QualityReport } from '@/lib/image-quality-monitor';
import { detectDeviceCapabilities, estimateFileSize } from '@/lib/adaptive-image-loading';

/**
 * Hook to monitor and track image quality metrics
 */
export function useImageQualityMonitor() {
  const monitor = getImageQualityMonitor();

  /**
   * Record an image load with metrics
   */
  const recordImageLoad = useCallback(
    (
      format: string,
      quality: number,
      width: number,
      height: number,
      loadTime: number
    ) => {
      const capabilities = detectDeviceCapabilities();
      const estimatedSize = estimateFileSize(width, height, format as any, quality);

      const metric: ImageQualityMetrics = {
        format,
        quality,
        width,
        height,
        estimatedSize,
        loadTime,
        dpr: capabilities.dpr,
        connectionSpeed: capabilities.connectionSpeed,
        timestamp: Date.now(),
      };

      monitor.recordMetric(metric);
    },
    [monitor]
  );

  /**
   * Get current quality report
   */
  const getReport = useCallback((): QualityReport => {
    return monitor.getReport();
  }, [monitor]);

  /**
   * Get perceptual quality score
   */
  const getQualityScore = useCallback((): number => {
    return monitor.getPerceptualQualityScore();
  }, [monitor]);

  /**
   * Export metrics
   */
  const exportMetrics = useCallback((): string => {
    return monitor.export();
  }, [monitor]);

  /**
   * Clear metrics
   */
  const clearMetrics = useCallback((): void => {
    monitor.clear();
  }, [monitor]);

  return {
    recordImageLoad,
    getReport,
    getQualityScore,
    exportMetrics,
    clearMetrics,
  };
}
