import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState('https://static.wixstatic.com/media/e9d727_3270fd9b8a104831bb70e110e6e8f618~mv2.jpeg');

  useEffect(() => {
    const loadSplashContent = async () => {
      try {
        const watermarkSettings = await BaseCrudService.getAll('watermarksettings', {}, { limit: 1 });
        if (watermarkSettings.items && watermarkSettings.items.length > 0) {
          const settings = watermarkSettings.items[0] as any;
          if (settings.watermarkImage) {
            setLogoImage(settings.watermarkImage);
          }
        }

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
      } catch (error) {
        console.error('Error loading splash content:', error);
      }
    };

    loadSplashContent();
  }, []);

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
      {/* Background video loop - optional */}
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
          src={logoImage}
          alt="RED² Logo"
          className="w-48 h-auto md:w-64"
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
