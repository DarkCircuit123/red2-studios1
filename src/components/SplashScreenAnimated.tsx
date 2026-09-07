import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Splashpage } from '@/entities';
import { Image } from '@/components/ui/image';

interface SplashScreenAnimatedProps {
  onComplete?: () => void;
}

interface SplashApiResponse {
  items?: Array<Pick<Splashpage, 'logoName' | 'logoImage' | 'altText'>>;
}

export default function SplashScreenAnimated({ onComplete }: SplashScreenAnimatedProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [splashData, setSplashData] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  // Check if splash screen has already been shown in this browser session.
  // Keep sessionStorage access client-only so SSR/build evaluation stays safe.
  useEffect(() => {
    try {
      const splashShown = sessionStorage.getItem('splashScreenShown');
      if (!splashShown) {
        setShouldShow(true);
        sessionStorage.setItem('splashScreenShown', 'true');
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      // If storage is unavailable, fail open and let the splash load normally.
      console.warn('[Splash] sessionStorage unavailable:', error);
      setShouldShow(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    const fetchSplashData = async () => {
      try {
        // BaseCrudService is server-side only. The browser must use the
        // hardened API endpoint instead of importing the Wix server SDK.
        const response = await fetch('/api/cms/get-splashpage', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`Splash API returned HTTP ${response.status}`);
        }

        const result = (await response.json()) as SplashApiResponse;
        const activeSplash = result.items?.find(
          (item) => Boolean(item.logoImage)
        );

        if (activeSplash) {
          setSplashData(activeSplash as Splashpage);
        }
      } catch (error) {
        console.error('[Splash] Error fetching splash data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSplashData();
  }, [shouldShow]);

  useEffect(() => {
    if (isLoading || !shouldShow) return;

    // Logo visible for 3 seconds.
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 600); // Wait for fade-out animation.
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, shouldShow, onComplete]);

  // If splash should not show, splash has already been shown, or no data, don't show.
  if (!shouldShow || !splashData?.isActive || !splashData?.logoImage) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black opacity-100" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative z-10 flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="flex items-center justify-center"
            >
              <Image
                src={splashData.logoImage}
                alt={splashData.altText || splashData.logoName || 'Logo'}
                width={200}
                height={200}
                className="h-auto w-auto max-w-xs object-contain"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
