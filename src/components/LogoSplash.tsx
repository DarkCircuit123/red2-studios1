import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

export default function LogoSplash() {
  const [visible, setVisible] = useState(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);

  // Load active logo from Splashpage CMS
  useEffect(() => {
    const loadActiveLogo = async () => {
      try {
        // Diagnostic: CMS query initiated
        const result = await BaseCrudService.getAll<Splashpage>('splashpage');
        
        if (!result.items || result.items.length === 0) {
          // No items in collection
          setIsLoadingLogo(false);
          return;
        }
        
        const activeLogo = result.items.find((item) => item.isActive);
        
        if (activeLogo?.logoImage) {
          // Diagnostic: Active logo found with image
          setLogoImage(activeLogo.logoImage);
        }
      } catch (err) {
        // Diagnostic: Log error but don't display to user
        console.error('[LogoSplash] CMS query error:', err);
      } finally {
        setIsLoadingLogo(false);
      }
    };

    loadActiveLogo();
  }, []);

  useEffect(() => {
    // Don't start timer until logo is loaded
    if (isLoadingLogo) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [isLoadingLogo]);

  // Don't render if no logo is available
  if (!logoImage) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.img
            src={logoImage}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              width: '220px',
              height: 'auto',
            }}
            alt=""
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
