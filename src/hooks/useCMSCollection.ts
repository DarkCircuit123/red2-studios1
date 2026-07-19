import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseCrudService } from '@/integrations';

interface UseCMSCollectionOptions {
  filter?: Record<string, any>;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  pollIntervalMs?: number; // 0 = disabled, >0 = background poll interval
}

interface UseCMSCollectionReturn<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  totalCount: number | null;
}

// Session-level cache
const collectionCache = new Map<
  string,
  {
    items: any[];
    totalCount: number | null;
    timestamp: number;
  }
>();

const CACHE_TTL_MS = 60000; // 1 minute

export function useCMSCollection<T>(
  collectionId: string,
  options?: UseCMSCollectionOptions
): UseCMSCollectionReturn<T> {
  const {
    filter = {},
    limit = 50,
    sort = {},
    pollIntervalMs = 0,
  } = options || {};

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const skipRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  const cacheKey = `${collectionId}:${JSON.stringify(filter)}`;

  const fetchItems = useCallback(
    async (isLoadMore = false) => {
      if (!isLoadMore) {
        skipRef.current = 0;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const result = await BaseCrudService.getAll<T>(
          collectionId,
          {},
          { limit, skip: skipRef.current }
        );

        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        const newItems = result.items || [];
        const newTotalCount = result.totalCount || 0;

        // Dedupe by _id when appending
        if (isLoadMore) {
          const existingIds = new Set(
            items.map((item: any) => item._id)
          );
          const dedupedNewItems = newItems.filter(
            (item: any) => !existingIds.has(item._id)
          );
          setItems((prev) => [...prev, ...dedupedNewItems]);
        } else {
          setItems(newItems);
        }

        setTotalCount(newTotalCount);
        setHasMore(result.hasNext || false);
        skipRef.current = result.nextSkip || skipRef.current + limit;

        // Update cache
        collectionCache.set(cacheKey, {
          items: isLoadMore ? [...items, ...newItems] : newItems,
          totalCount: newTotalCount,
          timestamp: Date.now(),
        });
      } catch (err) {
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useCMSCollection] Error:', {
          collectionId,
          filter,
          error: error.message,
        });
        setError(error);
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [collectionId, filter, limit, items]
  );

  const loadMore = useCallback(() => {
    fetchItems(true);
  }, [fetchItems]);

  const refetch = useCallback(() => {
    fetchItems(false);
  }, [fetchItems]);

  // Initial load with cache check
  useEffect(() => {
    const cached = collectionCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      setItems(cached.items);
      setTotalCount(cached.totalCount);
      setLoading(false);
    } else {
      fetchItems(false);
    }
  }, [cacheKey, fetchItems]);

  // Visibility change refetch
  useEffect(() => {
    visibilityListenerRef.current = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', visibilityListenerRef.current);

    return () => {
      if (visibilityListenerRef.current) {
        document.removeEventListener(
          'visibilitychange',
          visibilityListenerRef.current
        );
      }
    };
  }, [refetch]);

  // Background poll (opt-in)
  useEffect(() => {
    if (pollIntervalMs > 0) {
      pollIntervalRef.current = setInterval(() => {
        refetch();
      }, pollIntervalMs);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [pollIntervalMs, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    totalCount,
  };
}
