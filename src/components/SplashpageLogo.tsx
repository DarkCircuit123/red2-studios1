import React, { useState, useEffect } from 'react';
import { Image as ImageComponent } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

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
  const [logo, setLogo] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadActiveLogo();
  }, []);

  const loadActiveLogo = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<Splashpage>('splashpage');
      const activeLogo = result.items.find((item) => item.isActive);
      
      if (activeLogo && activeLogo.logoImage) {
        setLogo(activeLogo);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading splash page logo:', err);
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

  if (error || !logo || !logo.logoImage) {
    return null;
  }

  return (
    <ImageComponent
      src={logo.logoImage}
      alt={logo.altText || 'Splash page logo'}
      width={width}
      height={height}
      className={`object-contain ${className}`}
    />
  );
}
