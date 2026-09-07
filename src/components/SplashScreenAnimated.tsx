import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';
import { Image } from '@/components/ui/image';

interface SplashScreenAnimatedProps {
  onComplete?: () => void;
}

export default function SplashScreenAnimated({ onComplete }: SplashScreenAnimatedProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [splashData, setSplashData] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  // Check if splash screen has already been shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashScreenShown');
    if (!splashShown) {
      setShouldShow(true);
      sessionStorage.setItem('splashScreenShown', 'true');
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    const fetchSplashData = async () => {
      try {
        const result = await BaseCrudService.getAll<Splashpage>('splashpage');
        const activeSplash = result.items?.find(item => item.isActive);
        if (activeSplash) {
          setSplashData(activeSplash);
        }
      } catch (error) {
        console.error('Error fetching splash data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSplashData();
  }, [shouldShow]);

  useEffect(() => {
    if (isLoading || !shouldShow) return;

    // Logo visible for 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 600); // Wait for fade-out animation
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, shouldShow, onComplete]);

  // If splash should not show, splash has already been shown, or no data, don't show
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
          {/* Background gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black opacity-100" />

          {/* Content container - Logo only */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative z-10 flex items-center justify-center"
          >
            {/* Logo image with subtle animation */}
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
