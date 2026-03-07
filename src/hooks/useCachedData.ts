/**
 * React hook for cached data fetching with automatic invalidation
 * Integrates with CachedRequestService for optimal performance
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { cachedRequestService } from '@/lib/request-cache';
import { useIsMounted } from '@/hooks/useAdvancedOptimization';

interface UseCachedDataOptions {
  ttl?: number;
  deduplicate?: boolean;
  invalidateOn?: string[];
  immediate?: boolean;
}

interface UseCachedDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook for fetching and caching data
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useIsMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!isMounted()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await cachedRequestService.execute(key, fetcher, {
        ttl: options.ttl,
        deduplicate: options.deduplicate,
        invalidateOn: options.invalidateOn,
      });

      if (isMounted()) {
        setData(result);
      }
    } catch (err) {
      if (isMounted()) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [key, fetcher, isMounted, options.ttl, options.deduplicate, options.invalidateOn]);

  const refetch = useCallback(async () => {
    cachedRequestService.invalidate(key);
    await fetchData();
  }, [key, fetchData]);

  const invalidate = useCallback(() => {
    cachedRequestService.invalidate(key);
  }, [key]);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }

    // Listen for invalidation
    const unsubscribe = cachedRequestService.onInvalidate(key, () => {
      if (isMounted()) {
        fetchData();
      }
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key, fetchData, isMounted, options.immediate]);

  return { data, isLoading, error, refetch, invalidate };
}

/**
 * Hook for paginated cached data
 */
export function useCachedPaginatedData<T>(
  baseKey: string,
  fetcher: (skip: number, limit: number) => Promise<{ items: T[]; hasNext: boolean; totalCount: number }>,
  limit = 20,
  options: UseCachedDataOptions = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const isMounted = useIsMounted();

  const fetchPage = useCallback(
    async (page: number) => {
      if (!isMounted()) return;

      setIsLoading(true);
      setError(null);

      try {
        const key = `${baseKey}:page:${page}`;
        const result = await cachedRequestService.execute(
          key,
          () => fetcher(page * limit, limit),
          {
            ttl: options.ttl,
            deduplicate: options.deduplicate,
            invalidateOn: options.invalidateOn,
          }
        );

        if (isMounted()) {
          setItems(result.items);
          setHasNext(result.hasNext);
          setTotalCount(result.totalCount);
          setCurrentPage(page);
        }
      } catch (err) {
        if (isMounted()) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
      }
    },
    [baseKey, fetcher, limit, isMounted, options.ttl, options.deduplicate, options.invalidateOn]
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      fetchPage(currentPage + 1);
    }
  }, [hasNext, currentPage, fetchPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      fetchPage(currentPage - 1);
    }
  }, [currentPage, fetchPage]);

  const goToPage = useCallback((page: number) => {
    fetchPage(page);
  }, [fetchPage]);

  const refetch = useCallback(() => {
    cachedRequestService.invalidate(`${baseKey}:page:${currentPage}`);
    fetchPage(currentPage);
  }, [baseKey, currentPage, fetchPage]);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchPage(0);
    }
  }, [fetchPage, options.immediate]);

  return {
    items,
    isLoading,
    error,
    hasNext,
    totalCount,
    currentPage,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  };
}

/**
 * Hook for dependent cached data
 */
export function useDependentCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: string[],
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const result = useCachedData(key, fetcher, options);

  useEffect(() => {
    // Register dependencies for automatic invalidation
    cachedRequestService.registerDependency(key, dependencies);
  }, [key, dependencies]);

  return result;
}
