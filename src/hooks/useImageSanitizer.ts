/**
 * Hook for sanitizing image URLs in components
 * Provides utilities for filtering and validating images
 */

import { useCallback } from 'react';
import {
  isBrokenUrl,
  sanitizeImageUrl,
  filterValidImages,
  sanitizeImageFields,
  generateSanitizationReport,
} from '@/lib/image-url-sanitizer';

export function useImageSanitizer() {
  const checkUrl = useCallback((url: string | null | undefined): boolean => {
    return !isBrokenUrl(url);
  }, []);

  const sanitizeUrl = useCallback((url: string | null | undefined): string | null => {
    return sanitizeImageUrl(url);
  }, []);

  const filterImages = useCallback(<T extends Record<string, any>>(
    items: T[],
    imageField: keyof T = 'imageUrl' as keyof T
  ): T[] => {
    return filterValidImages(items, imageField);
  }, []);

  const sanitizeFields = useCallback(<T extends Record<string, any>>(
    obj: T,
    imageFields: (keyof T)[]
  ): T => {
    return sanitizeImageFields(obj, imageFields);
  }, []);

  const getReport = useCallback((
    originalCount: number,
    sanitizedCount: number,
    brokenUrls: string[]
  ) => {
    return generateSanitizationReport(originalCount, sanitizedCount, brokenUrls);
  }, []);

  return {
    checkUrl,
    sanitizeUrl,
    filterImages,
    sanitizeFields,
    getReport,
  };
}
