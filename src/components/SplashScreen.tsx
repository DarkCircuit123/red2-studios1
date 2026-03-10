import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';

// Static sound effect utility
const playStaticSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const bufferSize = audioContext.sampleRate * 0.5;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  source.start(audioContext.currentTime);
};

interface SplashScreenProps {
  onComplete: () => void;
}

function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const logoImage = 'https://static.wixstatic.com/media/e9d727_55a39beb1ff1437b905b31783daeb341~mv2.png';

  useEffect(() => {
    const loadSplashContent = async () => {
      try {
        // Try to load video from services
        const services = await BaseCrudService.getAll('services', {}, { limit: 1 });
        if (services.items && services.items.length > 0) {
          const service = services.items[0] as any;
          if (service.fullDescription && service.fullDescription.includes('http')) {
            const urlMatch = service.fullDescription.match(/(https?:\/\/[^\s]+\.mp4)/);
            if (urlMatch) {
              setVideoUrl(urlMatch[1]);
            }
          }
        }
      } catch {
        // Error handled silently
      }
    };

    loadSplashContent();
  }, []);

  useEffect(() => {
    const glitchTimer = setTimeout(() => {
      setGlitchActive(true);
      playStaticSound();
    }, 2000);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(glitchTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 3 }}
    >
      {videoUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-black" />

      <motion.div
        className="relative z-10"
        initial={{ 
          scale: 0.3, 
          opacity: 0,
          y: 100
        }}
        animate={{ 
          scale: 1, 
          opacity: glitchActive ? 0 : 1,
          y: 0,
          x: glitchActive ? [0, -8, 8, -8, 8, 0] : 0
        }}
        transition={{
          scale: {
            duration: 1.2,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.2
          },
          opacity: {
            duration: 0.3,
            delay: glitchActive ? 0 : 2
          },
          x: glitchActive ? {
            duration: 0.4,
            repeat: 0
          } : { duration: 0 }
        }}
      >
        <Image
          src={logoImage}
          alt="RED² Logo"
          className="w-56 h-auto md:w-80"
          width={320}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: glitchActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export default React.memo(SplashScreen);
