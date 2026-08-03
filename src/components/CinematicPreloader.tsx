import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useCinematicSound } from '@/hooks/useCinematicSound';

interface CinematicPreloaderProps {
  onComplete: () => void;
  isLoading: boolean;
}

export default function CinematicPreloader({ onComplete, isLoading }: CinematicPreloaderProps) {
  const [showPreloader, setShowPreloader] = useState(true);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const { playIntro } = useCinematicSound();
  const logoImage = 'https://static.wixstatic.com/media/e9d727_55a39beb1ff1437b905b31783daeb341~mv2.png';

  useEffect(() => {
    if (!isLoading && showPreloader) {
      // Start fade out after 4.5 seconds
      const timer = setTimeout(() => {
        setShowPreloader(false);
        onComplete();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showPreloader, onComplete]);

  // Play cinematic sound on preloader mount - triggered by user interaction
  useEffect(() => {
    if (!showPreloader || soundPlayed) return;

    const handlePlaySound = async () => {
      try {
        // Play the intro sound immediately
        await playIntro();
        setSoundPlayed(true);
        // Remove listeners after first play
        document.removeEventListener('click', handlePlaySound);
        document.removeEventListener('touchstart', handlePlaySound);
      } catch (e) {
        console.warn('Sound playback error:', e);
      }
    };

    // Add listeners for user interaction to trigger sound
    document.addEventListener('click', handlePlaySound, { once: true });
    // Use passive listener for touchstart since preventDefault is not needed
    document.addEventListener('touchstart', handlePlaySound, { once: true, passive: true });

    return () => {
      document.removeEventListener('click', handlePlaySound);
      document.removeEventListener('touchstart', handlePlaySound);
    };
  }, [showPreloader, soundPlayed, playIntro]);

  if (!showPreloader) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 3.7 }}
      onAnimationComplete={() => {
        setShowPreloader(false);
        onComplete();
      }}
    >
      {/* Atmospheric Dust Particles - Smoother */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              background: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight - 150],
              x: [0, Math.random() * 50 - 25],
              opacity: [0, Math.random() * 0.4 + 0.1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 1.5,
              delay: 0.2 + Math.random() * 1.8,
              repeat: 0,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Multi-Layer Cinematic Light Beams */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: `${1 + i * 0.5}px`,
            height: '200%',
            background: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,${0.15 + i * 0.05}), rgba(255,255,255,0))`,
            filter: `blur(${8 + i * 4}px)`,
            opacity: 0.6 - i * 0.15,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0.6 - i * 0.15, 0] }}
          transition={{ duration: 1.4 + i * 0.3, delay: 0.3 + i * 0.2, ease: 'easeInOut' }}
        />
      ))}

      {/* Primary Lens Flare - Enhanced */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 85%)',
          filter: 'blur(80px)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.9, 0.3, 0] }}
        transition={{ duration: 1.2, delay: 1.5, ease: 'easeInOut' }}
      />

      {/* Secondary Lens Flare - Accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(220,20,60,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 1, delay: 2.0, ease: 'easeInOut' }}
      />

      {/* Soft Cinematic Flash - Smoother */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6, delay: 1.4, ease: 'easeInOut' }}
      />

      {/* Logo Container - Main Focus */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ perspective: 1200 }}
      >
        {/* Logo with Smooth Fly-In Effect */}
        <motion.div
          className="relative"
          initial={{
            opacity: 0,
            scale: 0.6,
            y: 80,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 1.6,
            delay: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing
          }}
        >
          {/* Logo Image - Seamless Background Blend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
            }}
          >
            <Image
              src={logoImage}
              alt="RED² Studios Logo"
              className="w-64 h-auto md:w-80"
              width={320}
            />
          </motion.div>

          {/* Smooth Highlight Sweep Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              width: '100%',
              height: '100%',
              filter: 'blur(8px)',
            }}
            initial={{ x: '-150%' }}
            animate={{ x: '150%' }}
            transition={{ duration: 1.2, delay: 1.8, ease: 'easeInOut' }}
          />

          {/* Glow Around Logo - Cinematic Aura */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 80%)',
              filter: 'blur(30px)',
              width: '120%',
              height: '120%',
              left: '-10%',
              top: '-10%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 1.8, delay: 1.2, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Cinematic Light Streak - Horizontal */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '800px',
            height: '8px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 75%, transparent 100%)',
            filter: 'blur(4px)',
          }}
          initial={{ opacity: 0, x: '-400%' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: 2.1, ease: 'easeInOut' }}
        />

        {/* Secondary Light Streak - Accent Color */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '600px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, rgba(220,20,60,0.5), transparent)',
            filter: 'blur(3px)',
          }}
          initial={{ opacity: 0, x: '400%' }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.8, delay: 2.3, ease: 'easeInOut' }}
        />

        {/* Fade Out Vignette - Smooth */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 2.2, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Final Fade to Black - Smooth */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 3.7 }}
      />
    </motion.div>
  );
}
