import React, { useState, useEffect } from 'react';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import type { Splashpage } from '@/entities';

interface SplashpageLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function SplashpageLogo({
  className = '',
  width = 200,
  height = 100,
}: SplashpageLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadActiveLogo();
  }, []);

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
        console.warn('[SplashpageLogo] API returned status:', response.status);
        setError(true);
        return;
      }
      
      const result = await response.json();
      
      if (!result.items || result.items.length === 0) {
        setError(true);
        return;
      }
      
      const activeLogo = result.items.find((item: Splashpage) => item.isActive);
      
      if (activeLogo && activeLogo.logoImage) {
        // Convert Wix image URL to HTTPS for CSP compliance
        const convertedUrl = convertWixImageToHttps(activeLogo.logoImage);
        if (convertedUrl) {
          setLogoUrl(convertedUrl);
          setAltText(activeLogo.altText || '');
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('[SplashpageLogo] API fetch error:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse bg-gray-200 w-full h-full rounded-lg" />
      </div>
    );
  }

  if (error || !logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={altText}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
}
