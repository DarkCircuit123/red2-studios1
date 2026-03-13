import { useState, useCallback } from 'react';

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
 * Hook to fetch stories from the API
 */
export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setStories(prev => [...prev, ...data.items]);
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
      console.error('Error fetching story by URL:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    fetchStoryBySlug,
    fetchStoryBySourceURL
  };
}
