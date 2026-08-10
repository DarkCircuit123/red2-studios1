import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { respectReducedMotion } from '@/lib/performance-enhancements';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

// Check if splash has already been shown in this session
const hasSplashBeenShown = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('splashScreenShown') === 'true';
};

// Mark splash as shown in session
const markSplashAsShown = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('splashScreenShown', 'true');
  }
};

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(() => !hasSplashBeenShown());
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const prefersReducedMotion = useMemo(() => respectReducedMotion(), []);

  // Load active logo from Splashpage CMS
  useEffect(() => {
    const loadActiveLogo = async () => {
      try {
        const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });
        
        if (result?.items && result.items.length > 0) {
          const activeLogo = result.items.find((item) => item.isActive);
          if (activeLogo?.logoImage) {
            setLogoImage(activeLogo.logoImage);
          }
        }
      } catch (err) {
        console.error('[SplashScreen] CMS query error:', err);
      } finally {
        setIsLoadingLogo(false);
      }
    };

    loadActiveLogo();
  }, []);

  // Handle splash animation and completion
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Hold splash for 1.5-2 seconds, then fade out
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1700); // 1.7 seconds - middle of the 1.5-2 second range

    // Complete splash after fade out animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      markSplashAsShown();
      onComplete?.();
    }, 2200); // 1.7s + 0.5s fade duration
    
    // CRITICAL: Fallback timeout to prevent infinite loading
    // If splash doesn't complete within 4 seconds, force completion
    const fallbackTimer = setTimeout(() => {
      setIsVisible(false);
      markSplashAsShown();
      onComplete?.();
    }, 4000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
      clearTimeout(fallbackTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) {
    return null;
  }

  // Don't render if logo is still loading
  if (isLoadingLogo) {
    return null;
  }

  // If no logo image available, skip splash entirely
  if (!logoImage) {
    markSplashAsShown();
    onComplete?.();
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ 
        duration: 0.5,
        ease: 'easeInOut'
      }}
      style={{ pointerEvents: isFadingOut ? 'none' : 'auto' }}
    >
      {/* Logo container with premium fade-in animation */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.8,
          ease: 'easeOut',
          delay: prefersReducedMotion ? 0 : 0.3
        }}
      >
        <Image
          src={logoImage}
          alt=""
          className="w-48 h-auto sm:w-56 md:w-72 lg:w-80"
          width={320}
          priority
        />
      </motion.div>
    </motion.div>
  );
}
