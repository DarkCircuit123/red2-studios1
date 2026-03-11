import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CinematicPreloaderProps {
  onComplete: () => void;
  isLoading: boolean;
}

export default function CinematicPreloader({ onComplete, isLoading }: CinematicPreloaderProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    if (!isLoading && showPreloader) {
      // Start fade out after 5 seconds
      const timer = setTimeout(() => {
        setShowPreloader(false);
        onComplete();
      }, 5000);
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

  // Play sound effects
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

    // Film projector startup sound (500ms delay, 800ms duration)
    playSound(150, 0.8, 500, 'sine');
    playSound(120, 0.8, 500, 'sine');

    // Camera shutter sound (1500ms delay)
    playSound(400, 0.1, 1500, 'square');
    playSound(350, 0.1, 1510, 'square');

    // Deep cinematic bass impact (2500ms delay)
    playSound(60, 0.3, 2500, 'sine');
    playSound(80, 0.25, 2510, 'sine');

    // Atmospheric ambience (continuous low frequency)
    playSound(40, 5, 0, 'sine');

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
      transition={{ duration: 0.8, delay: 4.2 }}
      onAnimationComplete={() => {
        setShowPreloader(false);
        onComplete();
      }}
    >
      {/* Film Grain Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise' seed='2'/%3E%3CfeColorMatrix in='noise' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' fill='rgba(255,255,255,0.03)' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />

      {/* Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 4,
              delay: 0.5 + Math.random() * 2,
              repeat: 0,
            }}
          />
        ))}
      </div>

      {/* Projector Light Beam */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '2px',
          height: '200%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))',
          filter: 'blur(8px)',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
      />

      {/* Lens Flare Effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, delay: 2.4, ease: 'easeInOut' }}
      />

      {/* White Flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.4, delay: 1.4, ease: 'easeInOut' }}
      />

      {/* Logo Container */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ perspective: 1000 }}
      >
        {/* Red2 Studios Logo */}
        <motion.div
          className="relative"
          initial={{
            opacity: 0,
            z: -100,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            z: 0,
            scale: 1,
          }}
          transition={{
            duration: 1.2,
            delay: 1.8,
            ease: 'easeOut',
          }}
        >
          {/* Triangle */}
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <motion.polygon
              points="100,20 180,160 20,160"
              fill="none"
              stroke="#DC143C"
              strokeWidth="12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            />
          </motion.svg>

          {/* Highlight Sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              width: '100%',
              height: '100%',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, delay: 2.2, ease: 'easeInOut' }}
          />

          {/* Text Container */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.2 }}
          >
            <div className="text-5xl font-bold tracking-wider">
              <span className="text-white">RED</span>
              <span className="text-red-600">2</span>
            </div>
            <div className="text-xl tracking-[0.3em] text-white mt-2">STUDIOS</div>
          </motion.div>
        </motion.div>

        {/* Red Light Streak */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '400px',
            height: '8px',
            background: 'linear-gradient(90deg, transparent, #DC143C, transparent)',
            filter: 'blur(4px)',
          }}
          initial={{ opacity: 0, x: '-200%' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: 3.0, ease: 'easeInOut' }}
        />

        {/* Film Credit Typography */}
        <motion.div
          className="absolute bottom-1/3 text-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.6 }}
        >
          <div className="text-lg tracking-widest text-white font-light">
            A RED2 STUDIOS PRODUCTION
          </div>
        </motion.div>

        {/* Camera Vibration Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: 0, y: 0 }}
          animate={{
            x: [0, -2, 2, -2, 2, 0],
            y: [0, -2, 2, -2, 2, 0],
          }}
          transition={{
            duration: 0.2,
            delay: 2.4,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Fade to Black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 4.2 }}
      />
    </motion.div>
  );
}
