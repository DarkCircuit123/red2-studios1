import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { respectReducedMotion } from '@/lib/performance-enhancements';

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
  const prefersReducedMotion = useMemo(() => respectReducedMotion(), []);
  
  // RED² Studios logo - existing asset from the site
  const logoImage = 'https://static.wixstatic.com/media/e9d727_55a39beb1ff1437b905b31783daeb341~mv2.png';

  // Handle splash animation and completion
  useEffect(() => {
    if (!isVisible) return;

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

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

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
      {/* Logo container with subtle fade-in */}
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
          alt="RED² Studios Logo"
          className="w-48 h-auto sm:w-56 md:w-72 lg:w-80"
          width={320}
          priority
        />
      </motion.div>
    </motion.div>
  );
}
