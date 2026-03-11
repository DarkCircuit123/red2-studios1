import { useState, useEffect } from 'react';

export function usePreloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    // Check if page is already loaded
    if (document.readyState === 'complete') {
      setIsLoading(false);
    }

    const handleLoad = () => {
      setIsLoading(false);
    };

    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return {
    isLoading,
    showPreloader,
    handlePreloaderComplete,
  };
}
