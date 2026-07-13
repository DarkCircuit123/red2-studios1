import { useState, useCallback, useMemo } from 'react';

interface Story {
  _id: string;
  title: string;
  slug: string;
  sourceURL: string;
  sourceName: string;
  publicationDate: string;
  featuredImage: string;
  excerpt: string;
  fullSummary: string;
}

interface StoriesResult {
  items: Story[];
  totalCount: number;
  hasNext: boolean;
  currentPage: number;
  pageSize: number;
  nextSkip: number | null;
}

/**
 * Hook to fetch stories from the API with optimized memoization
 */
export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch function with stable reference
  const fetchStories = useCallback(async (limit: number = 12, skip: number = 0): Promise<StoriesResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stories?limit=${limit}&skip=${skip}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data: StoriesResult = await response.json();
      
      if (skip === 0) {
        setStories(data.items);
      } else {
        // Deduplicate stories on merge
        setStories(prev => {
          const seen = new Set(prev.map(s => s._id));
          const newItems = data.items.filter(item => !seen.has(item._id));
          return [...prev, ...newItems];
        });
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized fetch by slug
  const fetchStoryBySlug = useCallback(async (slug: string): Promise<Story | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stories/${slug}`);
      if (!response.ok) {
        throw new Error('Story not found');
      }

      const data: Story = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized fetch by source URL
  const fetchStoryBySourceURL = useCallback(async (sourceURL: string): Promise<Story | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stories/by-url?url=${encodeURIComponent(sourceURL)}`);
      if (!response.ok) {
        return null; // Story not found, but not an error
      }

      const data: Story = await response.json();
      return data;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching story by URL:', err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    stories,
    isLoading,
    error,
    fetchStories,
    fetchStoryBySlug,
    fetchStoryBySourceURL
  }), [stories, isLoading, error, fetchStories, fetchStoryBySlug, fetchStoryBySourceURL]);
}
