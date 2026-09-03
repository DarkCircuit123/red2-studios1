import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { respectReducedMotion } from '@/lib/performance-enhancements';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

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

// Force black background on document
const forceBlackBackground = (): void => {
  if (typeof document === 'undefined') return;
  
  // Force html and body to black
  document.documentElement.style.backgroundColor = '#000000';
  document.documentElement.style.display = 'block';
  document.documentElement.style.visibility = 'visible';
  document.documentElement.style.opacity = '1';
  
  document.body.style.backgroundColor = '#000000';
  document.body.style.display = 'block';
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  
  const root = document.getElementById('root');
  if (root) {
    root.style.backgroundColor = '#000000';
    root.style.display = 'block';
    root.style.visibility = 'visible';
    root.style.opacity = '1';
  }
};

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(() => !hasSplashBeenShown());
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const [showWithoutLogo, setShowWithoutLogo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const prefersReducedMotion = useMemo(() => respectReducedMotion(), []);

  // Force black background on mount
  useEffect(() => {
    forceBlackBackground();
  }, []);

  // Load active logo from Splashpage CMS via API
  useEffect(() => {
    const loadActiveLogo = async () => {
      try {
        console.log('[SplashScreen] Starting logo load...');
        setDebugInfo('Fetching logo from API...');
        
        const response = await fetch('/api/cms/get-splashpage', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        console.log('[SplashScreen] API response status:', response.status);
        
        if (!response.ok) {
          console.warn('[SplashScreen] API response not ok:', response.status);
          setDebugInfo(`API error: ${response.status}`);
          setIsLoadingLogo(false);
          setShowWithoutLogo(true);
          return;
        }
        
        const result = await response.json();
        console.log('[SplashScreen] API result:', result);
        console.log('[SplashScreen] Full result object:', JSON.stringify(result, null, 2));
        setDebugInfo(`API returned ${result?.items?.length || 0} items`);
        
        if (result?.items && result.items.length > 0) {
          console.log('[SplashScreen] Items found:', result.items);
          const firstLogoWithImage = result.items.find((item: any) => item.logoImage);
          
          if (firstLogoWithImage?.logoImage) {
            console.log('[SplashScreen] Found logo image:', firstLogoWithImage.logoImage);
            console.log('[SplashScreen] Logo image type:', typeof firstLogoWithImage.logoImage);
            setDebugInfo(`Found logo: ${String(firstLogoWithImage.logoImage).substring(0, 50)}...`);
            
            const convertedUrl = convertWixImageToHttps(firstLogoWithImage.logoImage);
            console.log('[SplashScreen] Converted URL:', convertedUrl);
            console.log('[SplashScreen] Converted URL type:', typeof convertedUrl);
            setDebugInfo(`Converted URL: ${convertedUrl?.substring(0, 50)}...`);
            
            if (convertedUrl) {
              console.log('[SplashScreen] Setting logo image:', convertedUrl);
              setLogoImage(convertedUrl);
              setIsLoadingLogo(false);
              setDebugInfo('Logo loaded successfully');
              return;
            } else {
              console.warn('[SplashScreen] URL conversion failed - convertedUrl is null/undefined');
              setDebugInfo('URL conversion failed');
            }
          } else {
            console.warn('[SplashScreen] No item with logoImage found');
            console.log('[SplashScreen] Items:', result.items);
            setDebugInfo('No logoImage in items');
          }
        } else {
          console.warn('[SplashScreen] No items in result');
          setDebugInfo('No items returned from API');
        }
        
        // No logo found, show splash without logo
        console.warn('[SplashScreen] No logo image found in CMS');
        setShowWithoutLogo(true);
        setIsLoadingLogo(false);
      } catch (err) {
        console.error('[SplashScreen] Error loading logo:', err);
        console.error('[SplashScreen] Error stack:', err instanceof Error ? err.stack : 'No stack');
        setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setShowWithoutLogo(true);
        setIsLoadingLogo(false);
      }
    };

    loadActiveLogo();
  }, []);

  // Handle splash animation and completion
  useEffect(() => {
    if (!isVisible) {
      return;
    }

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

  if (!isVisible) {
    return null;
  }

  // Show black splash screen while loading
  if (isLoadingLogo && !showWithoutLogo) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ 
          backgroundColor: '#000000 !important',
          display: 'flex !important',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0
        }}
      >
        {/* Debug info - remove in production */}
        {debugInfo && (
          <div className="text-white text-xs text-center px-4 max-w-xs">
            <p>{debugInfo}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ 
        duration: 0.5,
        ease: 'easeInOut'
      }}
      style={{ 
        pointerEvents: isFadingOut ? 'none' : 'auto',
        backgroundColor: '#000000 !important',
        display: 'flex !important',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      {/* Logo container with premium fade-in animation */}
      {logoImage && (
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
          <img
            src={logoImage}
            alt="Logo"
            className="w-48 h-auto sm:w-56 md:w-72 lg:w-80 max-w-full"
            loading="eager"
            onError={(e) => {
              console.error('[SplashScreen] Image failed to load:', logoImage);
              console.error('[SplashScreen] Image element:', e.currentTarget);
              console.error('[SplashScreen] Image src:', e.currentTarget.src);
              e.currentTarget.style.display = 'none';
              setDebugInfo('Image failed to load');
            }}
            onLoad={() => {
              console.log('[SplashScreen] Image loaded successfully');
              console.log('[SplashScreen] Image dimensions:', {
                width: (event?.target as HTMLImageElement)?.width,
                height: (event?.target as HTMLImageElement)?.height
              });
              setDebugInfo('Image loaded');
            }}
          />
        </motion.div>
      )}
      
      {/* Show debug info if no logo */}
      {!logoImage && debugInfo && (
        <div className="text-white text-xs text-center px-4 max-w-xs">
          <p>{debugInfo}</p>
        </div>
      )}
    </motion.div>
  );
}
