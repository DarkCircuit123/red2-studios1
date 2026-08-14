import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import type { Splashpage } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

export default function LogoSplash() {
  const [visible, setVisible] = useState(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);

  // Load active logo from Splashpage CMS via API
  useEffect(() => {
    const loadActiveLogo = async () => {
      try {
        // CRITICAL: Use fetch to call API endpoint, not direct BaseCrudService
        // BaseCrudService is server-side only and causes WDE0053 when called from client
        const response = await fetch('/api/cms/get-splashpage', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          console.warn('[LogoSplash] API returned status:', response.status);
          setIsLoadingLogo(false);
          return;
        }
        
        const result = await response.json();
        console.log('[LogoSplash] API result:', result);
        
        if (!result.items || result.items.length === 0) {
          // No items in collection
          console.log('[LogoSplash] No items in collection');
          setIsLoadingLogo(false);
          return;
        }
        
        console.log('[LogoSplash] Found items:', result.items);
        
        // First try to find an active logo
        const activeLogo = result.items.find((item: Splashpage) => item.isActive);
        if (activeLogo?.logoImage) {
          // Diagnostic: Active logo found with image
          const convertedUrl = convertWixImageToHttps(activeLogo.logoImage);
          console.log('[LogoSplash] Using active logo:', convertedUrl);
          setLogoImage(convertedUrl);
          setIsLoadingLogo(false);
          return;
        }
        
        // Fallback: use first logo with an image if no active one found
        const firstLogoWithImage = result.items.find((item: Splashpage) => item.logoImage);
        if (firstLogoWithImage?.logoImage) {
          // Diagnostic: Using first available logo
          const convertedUrl = convertWixImageToHttps(firstLogoWithImage.logoImage);
          console.log('[LogoSplash] Using first available logo:', convertedUrl);
          setLogoImage(convertedUrl);
          setIsLoadingLogo(false);
          return;
        }
        
        console.log('[LogoSplash] No items with logoImage found');
      } catch (err) {
        // Diagnostic: Log error but don't display to user
        console.error('[LogoSplash] API fetch error:', err);
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
    
    // CRITICAL: Fallback timeout to prevent infinite loading
    // If logo splash doesn't complete within 4 seconds, force it to hide
    const fallbackTimer = setTimeout(() => {
      setVisible(false);
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
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
