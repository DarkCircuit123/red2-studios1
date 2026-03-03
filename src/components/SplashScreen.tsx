import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Total animation duration: 3.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 3 }}
    >
      {/* Background video loop - optional, can be added later */}
      <div className="absolute inset-0 bg-white" />

      {/* Animated logo container */}
      <motion.div
        className="relative z-10"
        initial={{ 
          scale: 0.3, 
          opacity: 0,
          y: 100
        }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 1.2,
          ease: [0.34, 1.56, 0.64, 1], // Custom easing for cinematic feel
          delay: 0.2
        }}
      >
        <Image
          src="https://static.wixstatic.com/media/e9d727_3270fd9b8a104831bb70e110e6e8f618~mv2.jpeg"
          alt="RED2 Logo"
          className="w-48 h-auto md:w-64 drop-shadow-2xl"
          width={256}
        />
      </motion.div>

      {/* Fade out animation */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 2.5 }}
      />
    </motion.div>
  );
}
