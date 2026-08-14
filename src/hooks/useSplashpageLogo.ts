import { useState, useEffect } from 'react';
import type { Splashpage } from '@/entities';

interface UseSplashpageLogoReturn {
  logo: Splashpage | null;
  isLoading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

export function useSplashpageLogo(): UseSplashpageLogoReturn {
  const [logo, setLogo] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadActiveLogo = async () => {
    try {
      setIsLoading(true);
      setError(false);
      
      // CRITICAL: Use fetch to call API endpoint, not direct BaseCrudService
      // BaseCrudService is server-side only and causes WDE0053 when called from client
      const response = await fetch('/api/cms/get-splashpage', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.warn('[useSplashpageLogo] API returned status:', response.status);
        setError(true);
        setLogo(null);
        return;
      }
      
      const result = await response.json();
      
      if (!result.items || result.items.length === 0) {
        // No items in collection
        setLogo(null);
        return;
      }
      
      const activeLogo = result.items.find((item: Splashpage) => item.isActive);
      setLogo(activeLogo || null);
    } catch (err) {
      // Diagnostic: Log error but don't display to user
      console.error('[useSplashpageLogo] API fetch error:', err);
      setError(true);
      setLogo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveLogo();
  }, []);

  return {
    logo,
    isLoading,
    error,
    refetch: loadActiveLogo,
  };
}

