import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';
import { Image } from '@/components/ui/image';

interface SplashScreenAnimatedProps {
  onComplete?: () => void;
  duration?: number;
}

export default function SplashScreenAnimated({ onComplete, duration = 3500 }: SplashScreenAnimatedProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [splashData, setSplashData] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 600); // Wait for fade-out animation
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isLoading, duration, onComplete]);

  // If splash is not active or no data, don't show
  if (!splashData?.isActive || !splashData?.logoImage) {
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

          {/* Content container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            {/* Logo image with subtle animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="mb-8 flex items-center justify-center"
            >
              <Image
                src={splashData.logoImage}
                alt={splashData.altText || splashData.logoName || 'Logo'}
                width={200}
                height={200}
                className="h-auto w-auto max-w-xs object-contain"
              />
            </motion.div>

            {/* Logo name text with staggered animation */}
            {splashData.logoName && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                className="text-center"
              >
                <h1 className="font-heading text-4xl font-bold tracking-wider text-white md:text-5xl">
                  {splashData.logoName}
                </h1>
              </motion.div>
            )}

            {/* Subtle animated line accent */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 }}
              className="mt-6 h-1 w-16 origin-center bg-oxblood"
            />
          </motion.div>

          {/* Fade out indicator (subtle) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, ease: 'easeInOut', delay: duration / 1000 - 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest text-white opacity-30"
          >
            LOADING
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
