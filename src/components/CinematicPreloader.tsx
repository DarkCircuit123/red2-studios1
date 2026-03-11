import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface CinematicPreloaderProps {
  onComplete: () => void;
  isLoading: boolean;
}

export default function CinematicPreloader({ onComplete, isLoading }: CinematicPreloaderProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showPreloader, setShowPreloader] = useState(true);
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

  useEffect(() => {
    // Initialize audio context for sound design
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Play cinematic sound effects
  useEffect(() => {
    if (!showPreloader) return;

    const playSound = (frequency: number, duration: number, delay: number, type: 'sine' | 'square' = 'sine') => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      }, delay);
    };

    // Cinematic whoosh sound (0.5s delay)
    playSound(200, 0.6, 500, 'sine');
    playSound(150, 0.6, 520, 'sine');

    // Deep bass impact (1.5s delay)
    playSound(80, 0.4, 1500, 'sine');
    playSound(60, 0.4, 1510, 'sine');

    // Atmospheric resonance (2s delay)
    playSound(100, 0.8, 2000, 'sine');

    // Fade out tone (3.5s delay)
    playSound(120, 0.8, 3500, 'sine');

  }, [showPreloader]);

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
      {/* Atmospheric Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight - 100],
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: 3.5,
              delay: 0.3 + Math.random() * 1.5,
              repeat: 0,
            }}
          />
        ))}
      </div>

      {/* Cinematic Light Beam - Projector Effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '1px',
          height: '150%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))',
          filter: 'blur(6px)',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease: 'easeInOut' }}
      />

      {/* Lens Flare - Cinematic Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)',
          filter: 'blur(50px)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.8, delay: 1.8, ease: 'easeInOut' }}
      />

      {/* Cinematic Flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.3, delay: 1.6, ease: 'easeInOut' }}
      />

      {/* Logo Container - Main Focus */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ perspective: 1200 }}
      >
        {/* Logo with Fly-In Effect */}
        <motion.div
          className="relative"
          initial={{
            opacity: 0,
            scale: 0.5,
            y: 100,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 1.4,
            delay: 0.8,
            ease: [0.34, 1.56, 0.64, 1], // Custom easing for cinematic feel
          }}
        >
          {/* Logo Image - Faithful to Original */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Image
              src={logoImage}
              alt="RED² Studios Logo"
              className="w-64 h-auto md:w-80 drop-shadow-2xl"
              width={320}
            />
          </motion.div>

          {/* Highlight Sweep Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              width: '100%',
              height: '100%',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.9, delay: 2.0, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Cinematic Light Streak - Accent */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '500px',
            height: '6px',
            background: 'linear-gradient(90deg, transparent, rgba(220,20,60,0.6), transparent)',
            filter: 'blur(3px)',
          }}
          initial={{ opacity: 0, x: '-300%' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: 2.3, ease: 'easeInOut' }}
        />

        {/* Fade Out Vignette */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2.5 }}
        />
      </motion.div>

      {/* Final Fade to Black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 3.7 }}
      />
    </motion.div>
  );
}
