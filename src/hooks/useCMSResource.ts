import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseCrudService } from '@/integrations';

interface UseCMSResourceReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  notFound: boolean;
  refetch: () => void;
}

export function useCMSResource<T>(
  collectionId: string,
  id: string | undefined
): UseCMSResourceReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const refetchCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      setNotFound(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const result = await BaseCrudService.getById<T>(collectionId, id);

      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (!result) {
        setNotFound(true);
        setData(null);
        console.log(`[useCMSResource] Not found: ${collectionId}/${id}`);
      } else {
        setData(result);
        setNotFound(false);
      }
    } catch (err) {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useCMSResource] Error:', {
        collectionId,
        id,
        error: error.message,
      });
      setError(error);
      setData(null);
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [collectionId, id]);

  const refetch = useCallback(() => {
    refetchCountRef.current += 1;
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, notFound, refetch };
}
