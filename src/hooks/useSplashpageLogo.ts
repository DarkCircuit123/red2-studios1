import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

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
      const result = await BaseCrudService.getAll<Splashpage>('splashpage');
      const activeLogo = result.items.find((item) => item.isActive);
      setLogo(activeLogo || null);
    } catch (err) {
      console.error('Error loading splash page logo:', err);
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
