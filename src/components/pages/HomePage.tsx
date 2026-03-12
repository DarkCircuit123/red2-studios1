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
    // Only show splash screen on first visit in this session
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('splashScreenShown');
      return !splashShown;
    }
    return true;
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

  // Optimized scroll parameter handling with useEffectOnce
  useEffectOnce(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scrollTo = params.get('scroll');
      if (scrollTo) {
        const scrollToElement = () => {
          const element = document.querySelector(`#${scrollTo}`);
          if (element) {
            const headerHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
            window.scrollTo({
              top: elementPosition,
              behavior: respectReducedMotion() ? 'auto' : 'smooth'
            });
            // Clean up URL after successful scroll
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        // Optimized timing for dynamic content loading
        const timeouts = [
          setTimeout(scrollToElement, 50),
          setTimeout(scrollToElement, 150),
          setTimeout(scrollToElement, 400)
        ];

        return () => timeouts.forEach(t => clearTimeout(t));
      }
    }
  });

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
