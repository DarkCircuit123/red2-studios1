import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import Interactive3DGallerySection from '@/components/sections/Interactive3DGallerySection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import RSSTickerSection from '@/components/sections/RSSTickerSection';
import SplashScreen from '@/components/SplashScreen';
import CinematicPreloader from '@/components/CinematicPreloader';
import { useEffectOnce } from '@/hooks/useAdvancedOptimization';
import { initializeSecuritySystems, setupSecurityEventListeners } from '@/lib/security-initialization';
import { usePreloader } from '@/hooks/usePreloader';
import {
  preloadCriticalResources,
  monitorCoreWebVitals,
  deferNonCriticalJS,
  respectReducedMotion,
} from '@/lib/performance-enhancements';

export default function HomePage() {
  const { isLoading, showPreloader, handlePreloaderComplete } = usePreloader();
  const [showSplash, setShowSplash] = useState(() => {
    // Splash screen is disabled - set to false to prevent it from showing
    return false;
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('splashScreenShown', 'true');
    }
  }, []);

  // Initialize security systems on component mount
  useEffect(() => {
    initializeSecuritySystems();
    setupSecurityEventListeners();
  }, []);

  // Initialize performance optimizations
  useEffect(() => {
    // Preload critical resources immediately
    preloadCriticalResources();

    // Monitor Core Web Vitals
    monitorCoreWebVitals((metric) => {
      if (metric.rating === 'poor') {
        console.warn(`[Performance] ${metric.name}: ${metric.value}ms - ${metric.rating}`);
      }
    });

    // Defer non-critical initialization
    deferNonCriticalJS(() => {
      // Non-critical tasks here
    });
  }, []);

  {/* ... keep existing code (scroll parameter handling removed - now handled in Header) ... */}

  return (
    <>
      {showPreloader && <CinematicPreloader isLoading={isLoading} onComplete={handlePreloaderComplete} />}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Interactive 3D Gallery */}
        <Interactive3DGallerySection />

        {/* RSS Ticker */}
        <RSSTickerSection />

        {/* Sponsored By */}
        <SponsorsSection />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}
